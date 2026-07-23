import {
  ApiError,
  createItem,
  createProject,
  deleteItem,
  dismissNotification,
  fetchItems,
  fetchNotifications,
  fetchProjects,
  fetchUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  reorderItems,
  subscribeMobilePush,
  unsubscribeMobilePush,
  updateItem,
  updateUser,
  uploadAvatar,
} from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
import { deleteLocalAvatar } from '@/lib/avatar-files';
import { offlineStore, type OfflineOperation } from '@/lib/offline-store';
import type { Item, User, UserUpdatePayload } from '@/types';

export interface SyncResult {
  synced: boolean;
  user: User | null;
}

let activeSync: Promise<SyncResult> | null = null;

function mergeUserUpdate(user: User, update: UserUpdatePayload | null): User {
  if (!update) return user;
  return {
    ...user,
    ...update,
    feature_flags:
      update.feature_flags === undefined || update.feature_flags === null
        ? user.feature_flags
        : { ...user.feature_flags, ...update.feature_flags },
  };
}

async function replay(operation: OfflineOperation): Promise<void> {
  switch (operation.type) {
    case 'project.create': {
      const project = await createProject(operation.payload);
      await offlineStore.acknowledgeOperation(operation.id, project);
      return;
    }
    case 'item.create': {
      const item = await createItem(operation.payload);
      await offlineStore.acknowledgeOperation(operation.id, item);
      return;
    }
    case 'item.update': {
      try {
        const item = await updateItem(operation.entityId, operation.payload);
        await offlineStore.acknowledgeOperation(operation.id, item);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
        const localItem = await offlineStore.getItem(operation.entityId);
        const item = await createItem(itemToInput(localItem));
        await offlineStore.acknowledgeOperation(operation.id, item);
      }
      return;
    }
    case 'item.delete': {
      try {
        await deleteItem(operation.entityId);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
      }
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'item.reorder': {
      await reorderItems(operation.payload);
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'user.update': {
      await updateUser(operation.payload);
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'avatar.upload': {
      const user = await uploadAvatar(operation.payload);
      await offlineStore.acknowledgeOperation(operation.id);
      const pendingAvatar = await offlineStore.getPendingAvatarUpload();
      await authStorage.setUser(
        pendingAvatar ? { ...user, avatar_url: pendingAvatar.payload.fileUri } : user,
      );
      if (pendingAvatar?.payload.fileUri !== operation.payload.fileUri) {
        deleteLocalAvatar(operation.payload.fileUri);
      }
      return;
    }
    case 'notification.read': {
      try {
        await markNotificationAsRead(operation.entityId);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
      }
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'notification.read-all': {
      await markAllNotificationsAsRead();
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'notification.dismiss': {
      try {
        await dismissNotification(operation.entityId);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
      }
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'push.subscribe': {
      await subscribeMobilePush(operation.payload);
      await offlineStore.acknowledgeOperation(operation.id);
      return;
    }
    case 'push.unsubscribe': {
      await unsubscribeMobilePush(operation.entityId);
      await offlineStore.acknowledgeOperation(operation.id);
    }
  }
}

function itemToInput(item: Item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    project_id: item.project_id,
    position: item.position,
    scheduled_date: item.scheduled_date,
    due_date: item.due_date,
    recurrence_rule: item.recurrence_rule,
    recurrence_strategy: item.recurrence_strategy,
    assignee_id: item.assignee_id,
    assignee_notes: item.assignee_notes,
  };
}

function syncErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Waiting for an internet connection.';
    if (error.status === 401) return 'Sign in again to resume syncing.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Sync could not be completed.';
}

function shouldRevert(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    ![401, 408, 425, 429].includes(error.status)
  );
}

function operationLabel(operation: OfflineOperation): string {
  switch (operation.type) {
    case 'item.create':
    case 'item.update':
    case 'item.delete':
    case 'item.reorder':
      return 'The task change';
    case 'project.create':
      return 'The project change';
    case 'user.update':
      return 'The profile change';
    case 'avatar.upload':
      return 'The profile photo change';
    case 'notification.read':
    case 'notification.read-all':
    case 'notification.dismiss':
      return 'The notification change';
    case 'push.subscribe':
    case 'push.unsubscribe':
      return 'The notification setting';
  }
}

async function revertRejectedOperation(
  operation: OfflineOperation,
  error: ApiError,
): Promise<boolean> {
  const rejected = await offlineStore.rejectOperation(
    operation.id,
    `${operationLabel(operation)} was restored. ${syncErrorMessage(error)}`,
  );
  if (!rejected) return false;

  if (rejected.type === 'user.update' && rejected.rollback) {
    const user = await authStorage.getUser();
    if (user) await authStorage.setUser(mergeUserUpdate(user, rejected.rollback));
  }

  if (rejected.type === 'avatar.upload') {
    const user = await authStorage.getUser();
    if (user) {
      await authStorage.setUser({ ...user, avatar_url: rejected.rollbackAvatarUrl });
    }
    deleteLocalAvatar(rejected.payload.fileUri);
  }

  return true;
}

async function runSync(): Promise<SyncResult> {
  const token = await authStorage.getToken();
  if (!token) return { synced: false, user: null };

  for (let replayed = 0; replayed < 500; replayed += 1) {
    const operation = await offlineStore.getNextOperation();
    if (!operation) break;
    try {
      await replay(operation);
    } catch (error) {
      if (shouldRevert(error)) await revertRejectedOperation(operation, error);
      throw error;
    }
    if (replayed === 499) throw new Error('Too many pending changes to sync in one pass.');
  }

  const [user, projects, mine, assigned, delegated, notifications] = await Promise.all([
    fetchUser(),
    fetchProjects(),
    fetchItems({ scope: 'all', include_completed: true }),
    fetchItems({ scope: 'all', assigned_to_me: true, include_completed: true }),
    fetchItems({ scope: 'all', delegated: true, include_completed: true }),
    fetchNotifications(),
  ]);
  const items = [
    ...new Map([...mine, ...assigned, ...delegated].map((item) => [item.id, item])).values(),
  ];
  const pendingUserUpdate = await offlineStore.getPendingUserUpdate();
  const pendingAvatar = await offlineStore.getPendingAvatarUpload();
  const nextProfile = mergeUserUpdate(user, pendingUserUpdate);
  const nextUser = pendingAvatar
    ? { ...nextProfile, avatar_url: pendingAvatar.payload.fileUri }
    : nextProfile;
  const syncedAt = new Date().toISOString();

  await Promise.all([
    authStorage.setUser(nextUser),
    offlineStore.mergeServerSnapshot({
      projects,
      items,
      notifications: notifications.data,
      syncedAt,
    }),
  ]);

  return { synced: true, user: nextUser };
}

export function syncOfflineData(): Promise<SyncResult> {
  if (activeSync) return activeSync;
  activeSync = runSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

export async function waitForSyncToSettle(): Promise<void> {
  await activeSync?.catch(() => undefined);
}
