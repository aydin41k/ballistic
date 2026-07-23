import AsyncStorage from '@react-native-async-storage/async-storage';

import { toDateKey } from '@/lib/date';
import type {
  ActivityLogItem,
  AvatarUploadPayload,
  CursorPaginatedResponse,
  Item,
  ItemInput,
  ItemScope,
  Notification,
  NotificationsResponse,
  Project,
  UserUpdatePayload,
} from '@/types';

const storageKey = 'ballistic_offline_state_v1';
const storageVersion = 1;

type ProjectCreateOperation = {
  id: string;
  type: 'project.create';
  entityId: string;
  payload: { id: string; name: string; color?: string | null };
  createdAt: string;
};

type ItemCreateOperation = {
  id: string;
  type: 'item.create';
  entityId: string;
  payload: ItemInput & { id: string };
  createdAt: string;
};

type ItemUpdateOperation = {
  id: string;
  type: 'item.update';
  entityId: string;
  payload: Partial<ItemInput>;
  rollback?: Item;
  createdAt: string;
};

type ItemDeleteOperation = {
  id: string;
  type: 'item.delete';
  entityId: string;
  rollback?: Item;
  createdAt: string;
};

type ItemReorderOperation = {
  id: string;
  type: 'item.reorder';
  entityId: 'journal';
  payload: { id: string; position: number }[];
  rollback?: { id: string; position: number }[];
  createdAt: string;
};

type UserUpdateOperation = {
  id: string;
  type: 'user.update';
  entityId: 'profile';
  payload: UserUpdatePayload;
  rollback?: UserUpdatePayload;
  createdAt: string;
};

type AvatarUploadOperation = {
  id: string;
  type: 'avatar.upload';
  entityId: 'profile-photo';
  payload: AvatarUploadPayload;
  rollbackAvatarUrl: string | null;
  createdAt: string;
};

type NotificationReadOperation = {
  id: string;
  type: 'notification.read';
  entityId: string;
  rollback?: Notification;
  createdAt: string;
};

type NotificationReadAllOperation = {
  id: string;
  type: 'notification.read-all';
  entityId: 'all';
  rollback?: Notification[];
  createdAt: string;
};

type NotificationDismissOperation = {
  id: string;
  type: 'notification.dismiss';
  entityId: string;
  rollback?: Notification;
  createdAt: string;
};

type PushSubscribeOperation = {
  id: string;
  type: 'push.subscribe';
  entityId: string;
  payload: {
    expo_push_token: string;
    platform: 'ios' | 'android';
    device_name: string;
  };
  createdAt: string;
};

type PushUnsubscribeOperation = {
  id: string;
  type: 'push.unsubscribe';
  entityId: string;
  createdAt: string;
};

export type OfflineOperation =
  | ProjectCreateOperation
  | ItemCreateOperation
  | ItemUpdateOperation
  | ItemDeleteOperation
  | ItemReorderOperation
  | UserUpdateOperation
  | AvatarUploadOperation
  | NotificationReadOperation
  | NotificationReadAllOperation
  | NotificationDismissOperation
  | PushSubscribeOperation
  | PushUnsubscribeOperation;

interface OfflineWorkspace {
  ownerId: string;
  projects: Project[];
  items: Item[];
  notifications: Notification[];
  operations: OfflineOperation[];
  lastSyncedAt: string | null;
  lastSyncError: string | null;
}

interface OfflineRoot {
  version: number;
  activeWorkspaceId: string | null;
  workspaces: Record<string, OfflineWorkspace>;
}

export interface OfflineStatus {
  pendingCount: number;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
}

export interface ServerSnapshot {
  projects: Project[];
  items: Item[];
  notifications: Notification[];
  syncedAt: string;
}

type Listener = () => void;

let cachedRoot: OfflineRoot | null = null;
let loadingRoot: Promise<OfflineRoot> | null = null;
let writeQueue: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function emptyRoot(): OfflineRoot {
  return { version: storageVersion, activeWorkspaceId: null, workspaces: {} };
}

function emptyWorkspace(ownerId: string): OfflineWorkspace {
  return {
    ownerId,
    projects: [],
    items: [],
    notifications: [],
    operations: [],
    lastSyncedAt: null,
    lastSyncError: null,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function normaliseProject(project: Project): Project {
  return {
    ...project,
    archived_at: project.archived_at ?? null,
    deleted_at: project.deleted_at ?? null,
  };
}

function normaliseItem(item: Item): Item {
  return {
    ...item,
    assignee_id: item.assignee_id ?? null,
    project_id: item.project_id ?? null,
    description: item.description ?? null,
    assignee_notes: item.assignee_notes ?? null,
    scheduled_date: item.scheduled_date ?? null,
    due_date: item.due_date ?? null,
    completed_at: item.completed_at ?? null,
    recurrence_rule: item.recurrence_rule ?? null,
    recurrence_parent_id: item.recurrence_parent_id ?? null,
    recurrence_strategy: item.recurrence_strategy ?? null,
    deleted_at: item.deleted_at ?? null,
  };
}

function normaliseRoot(value: unknown): OfflineRoot {
  if (!value || typeof value !== 'object') return emptyRoot();
  const candidate = value as Partial<OfflineRoot>;
  if (candidate.version !== storageVersion || !candidate.workspaces) return emptyRoot();

  const workspaces = Object.fromEntries(
    Object.entries(candidate.workspaces).map(([id, workspace]) => [
      id,
      {
        ...emptyWorkspace(id),
        ...workspace,
        ownerId: workspace.ownerId || id,
        projects: (workspace.projects ?? []).map(normaliseProject),
        items: (workspace.items ?? []).map(normaliseItem),
        notifications: workspace.notifications ?? [],
        operations: workspace.operations ?? [],
      },
    ]),
  );

  return {
    version: storageVersion,
    activeWorkspaceId:
      candidate.activeWorkspaceId && workspaces[candidate.activeWorkspaceId]
        ? candidate.activeWorkspaceId
        : null,
    workspaces,
  };
}

async function loadRoot(): Promise<OfflineRoot> {
  if (cachedRoot) return cachedRoot;
  if (!loadingRoot) {
    loadingRoot = AsyncStorage.getItem(storageKey)
      .then((raw) => normaliseRoot(raw ? JSON.parse(raw) : null))
      .catch(() => emptyRoot())
      .then((root) => {
        cachedRoot = root;
        return root;
      });
  }
  return loadingRoot;
}

async function readRoot(): Promise<OfflineRoot> {
  await writeQueue;
  return loadRoot();
}

async function mutateRoot<T>(mutator: (root: OfflineRoot) => T): Promise<T> {
  let result!: T;
  const write = writeQueue.then(async () => {
    const root = clone(await loadRoot());
    result = mutator(root);
    cachedRoot = root;
    await AsyncStorage.setItem(storageKey, JSON.stringify(root));
    emitChange();
  });
  writeQueue = write.catch(() => undefined);
  await write;
  return result;
}

function activeWorkspace(root: OfflineRoot): OfflineWorkspace {
  if (!root.activeWorkspaceId) throw new Error('The offline journal is not ready.');
  const workspace = root.workspaces[root.activeWorkspaceId];
  if (!workspace) throw new Error('The active offline journal could not be found.');
  return workspace;
}

function newOperationId(): string {
  return createOfflineId();
}

function hasEntityOperation(
  operations: OfflineOperation[],
  entityId: string,
  prefix: 'item.' | 'project.',
): boolean {
  return operations.some((operation) => {
    if (prefix === 'item.' && operation.type === 'item.reorder') {
      return operation.payload.some((item) => item.id === entityId);
    }
    return operation.entityId === entityId && operation.type.startsWith(prefix);
  });
}

function compactOperation(
  operations: OfflineOperation[],
  nextOperation: OfflineOperation,
): OfflineOperation[] {
  if (nextOperation.type === 'user.update') {
    const existing = operations.find(
      (operation): operation is UserUpdateOperation => operation.type === 'user.update',
    );
    if (existing) {
      return operations.map((operation) =>
        operation.id === existing.id
          ? {
              ...existing,
              id: nextOperation.id,
              payload: { ...existing.payload, ...nextOperation.payload },
              rollback: { ...nextOperation.rollback, ...existing.rollback },
              createdAt: nextOperation.createdAt,
            }
          : operation,
      );
    }
  }

  if (nextOperation.type === 'avatar.upload') {
    const existing = operations.find(
      (operation): operation is AvatarUploadOperation => operation.type === 'avatar.upload',
    );
    return [
      ...operations.filter((operation) => operation.type !== 'avatar.upload'),
      {
        ...nextOperation,
        rollbackAvatarUrl: existing?.rollbackAvatarUrl ?? nextOperation.rollbackAvatarUrl,
      },
    ];
  }

  if (nextOperation.type === 'project.create') {
    const existing = operations.find(
      (operation): operation is ProjectCreateOperation =>
        operation.type === 'project.create' && operation.entityId === nextOperation.entityId,
    );
    if (existing) {
      return operations.map((operation) =>
        operation.id === existing.id
          ? {
              ...existing,
              id: nextOperation.id,
              payload: { ...existing.payload, ...nextOperation.payload },
              createdAt: nextOperation.createdAt,
            }
          : operation,
      );
    }
  }

  if (nextOperation.type === 'item.update') {
    const create = operations.find(
      (operation): operation is ItemCreateOperation =>
        operation.type === 'item.create' && operation.entityId === nextOperation.entityId,
    );
    if (create) {
      return operations.map((operation) =>
        operation.id === create.id
          ? {
              ...create,
              id: nextOperation.id,
              payload: { ...create.payload, ...nextOperation.payload },
              createdAt: nextOperation.createdAt,
            }
          : operation,
      );
    }

    const existing = [...operations]
      .reverse()
      .find(
        (operation): operation is ItemUpdateOperation =>
          operation.type === 'item.update' && operation.entityId === nextOperation.entityId,
      );
    if (existing) {
      return operations.map((operation) =>
        operation.id === existing.id
          ? {
              ...existing,
              id: nextOperation.id,
              payload: { ...existing.payload, ...nextOperation.payload },
              rollback: existing.rollback ?? nextOperation.rollback,
              createdAt: nextOperation.createdAt,
            }
          : operation,
      );
    }
  }

  if (nextOperation.type === 'item.reorder') {
    const existing = operations.find(
      (operation): operation is ItemReorderOperation => operation.type === 'item.reorder',
    );
    return [
      ...operations.filter((operation) => operation.type !== 'item.reorder'),
      { ...nextOperation, rollback: existing?.rollback ?? nextOperation.rollback },
    ];
  }

  if (nextOperation.type === 'notification.read-all') {
    return [
      ...operations.filter((operation) => operation.type !== 'notification.read'),
      nextOperation,
    ];
  }

  if (nextOperation.type === 'notification.read') {
    if (
      operations.some(
        (operation) =>
          operation.type === 'notification.read-all' ||
          (operation.type === 'notification.read' && operation.entityId === nextOperation.entityId),
      )
    ) {
      return operations;
    }
  }

  if (nextOperation.type === 'notification.dismiss') {
    return [
      ...operations.filter(
        (operation) =>
          !(
            operation.type === 'notification.read' && operation.entityId === nextOperation.entityId
          ) &&
          !(
            operation.type === 'notification.dismiss' &&
            operation.entityId === nextOperation.entityId
          ),
      ),
      nextOperation,
    ];
  }

  if (nextOperation.type === 'push.subscribe') {
    return [
      ...operations.filter(
        (operation) =>
          !(
            (operation.type === 'push.subscribe' || operation.type === 'push.unsubscribe') &&
            operation.entityId === nextOperation.entityId
          ),
      ),
      nextOperation,
    ];
  }

  if (nextOperation.type === 'push.unsubscribe') {
    return [
      ...operations.filter(
        (operation) =>
          !(
            (operation.type === 'push.subscribe' || operation.type === 'push.unsubscribe') &&
            operation.entityId === nextOperation.entityId
          ),
      ),
      nextOperation,
    ];
  }

  return [...operations, nextOperation];
}

function projectForItem(workspace: OfflineWorkspace, projectId: string | null): Project | null {
  if (!projectId) return null;
  return workspace.projects.find((project) => project.id === projectId) ?? null;
}

function itemInput(item: Item): ItemInput & { id: string } {
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

function mergeUnique<T extends { id: string }>(left: T[], right: T[]): T[] {
  const merged = new Map(left.map((value) => [value.id, value]));
  right.forEach((value) => merged.set(value.id, value));
  return [...merged.values()];
}

export function createOfflineId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export const offlineStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async clear(): Promise<void> {
    const write = writeQueue.then(async () => {
      await loadingRoot?.catch(() => undefined);
      cachedRoot = emptyRoot();
      loadingRoot = null;
      await AsyncStorage.removeItem(storageKey);
      emitChange();
    });
    writeQueue = write.catch(() => undefined);
    await write;
  },

  async ensureWorkspace(ownerId: string): Promise<void> {
    await mutateRoot((root) => {
      root.workspaces[ownerId] ??= emptyWorkspace(ownerId);
      root.activeWorkspaceId = ownerId;
    });
  },

  async activateWorkspace(ownerId: string, mergeCurrent: boolean): Promise<void> {
    await mutateRoot((root) => {
      const currentId = root.activeWorkspaceId;
      const current = currentId ? root.workspaces[currentId] : null;
      const target = root.workspaces[ownerId] ?? emptyWorkspace(ownerId);

      if (mergeCurrent && current && currentId !== ownerId) {
        const migratedProjects = current.projects.map((project) => ({
          ...project,
          user_id: project.user_id === current.ownerId ? ownerId : project.user_id,
        }));
        const migratedItems = current.items.map((item) => ({
          ...item,
          user_id: item.user_id === current.ownerId ? ownerId : item.user_id,
        }));

        target.projects = mergeUnique(target.projects, migratedProjects);
        target.items = mergeUnique(target.items, migratedItems);
        target.notifications = mergeUnique(target.notifications, current.notifications);
        current.operations.forEach((operation) => {
          target.operations = compactOperation(target.operations, operation);
        });
        target.lastSyncError = current.lastSyncError ?? target.lastSyncError;
        delete root.workspaces[currentId!];
      }

      target.ownerId = ownerId;
      root.workspaces[ownerId] = target;
      root.activeWorkspaceId = ownerId;
    });
  },

  async getStatus(): Promise<OfflineStatus> {
    const workspace = activeWorkspace(await readRoot());
    return {
      pendingCount: workspace.operations.length,
      lastSyncedAt: workspace.lastSyncedAt,
      lastSyncError: workspace.lastSyncError,
    };
  },

  async getJournal(scope: ItemScope, delegation: boolean) {
    const workspace = activeWorkspace(await readRoot());
    const today = toDateKey(new Date());
    const inScope = (item: Item) => {
      if (item.status === 'done' || item.status === 'wontdo') return false;
      if (scope === 'all') return true;
      const planned = Boolean(item.scheduled_date && item.scheduled_date > today);
      return scope === 'planned' ? planned : !planned;
    };
    const sorted = workspace.items
      .filter(inScope)
      .sort((left, right) => left.position - right.position);
    return {
      mine: sorted.filter(
        (item) => item.user_id === workspace.ownerId && item.assignee_id === null,
      ),
      assigned: delegation
        ? sorted.filter(
            (item) => item.user_id !== workspace.ownerId && item.assignee_id === workspace.ownerId,
          )
        : [],
      delegated: delegation
        ? sorted.filter(
            (item) =>
              item.user_id === workspace.ownerId &&
              item.assignee_id !== null &&
              item.assignee_id !== workspace.ownerId,
          )
        : [],
      projects: workspace.projects.filter((project) => !project.archived_at),
    };
  },

  async getProjects(): Promise<Project[]> {
    const workspace = activeWorkspace(await readRoot());
    return workspace.projects.filter((project) => !project.archived_at);
  },

  async getItem(id: string): Promise<Item> {
    const workspace = activeWorkspace(await readRoot());
    const item = workspace.items.find((candidate) => candidate.id === id);
    if (!item) throw new Error('This task is not available on this device.');
    return clone(item);
  },

  async createProject(payload: { name: string; color?: string | null }): Promise<Project> {
    return mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const now = new Date().toISOString();
      const project: Project = {
        id: createOfflineId(),
        user_id: workspace.ownerId,
        name: payload.name,
        color: payload.color ?? null,
        archived_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      workspace.projects.push(project);
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'project.create',
        entityId: project.id,
        payload: { id: project.id, name: project.name, color: project.color },
        createdAt: now,
      });
      workspace.lastSyncError = null;
      return clone(project);
    });
  },

  async createItem(payload: ItemInput): Promise<Item> {
    return mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const now = new Date().toISOString();
      const completed = payload.status === 'done' || payload.status === 'wontdo';
      const nextPosition =
        workspace.items.reduce((highest, item) => Math.max(highest, item.position), -1) + 1;
      const item: Item = {
        id: payload.id ?? createOfflineId(),
        user_id: workspace.ownerId,
        assignee_id: payload.assignee_id ?? null,
        project_id: payload.project_id ?? null,
        title: payload.title,
        description: payload.description ?? null,
        assignee_notes: payload.assignee_notes ?? null,
        status: payload.status ?? 'todo',
        position: payload.position ?? nextPosition,
        scheduled_date: payload.scheduled_date ?? null,
        due_date: payload.due_date ?? null,
        completed_at: completed ? now : null,
        recurrence_rule: payload.recurrence_rule ?? null,
        recurrence_parent_id: null,
        recurrence_strategy: payload.recurrence_strategy ?? null,
        is_recurring_template: Boolean(payload.recurrence_rule),
        is_recurring_instance: false,
        is_assigned: Boolean(payload.assignee_id),
        is_delegated: Boolean(payload.assignee_id),
        created_at: now,
        updated_at: now,
        deleted_at: null,
        project: projectForItem(workspace, payload.project_id ?? null),
      };
      workspace.items.push(item);
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'item.create',
        entityId: item.id,
        payload: itemInput(item),
        createdAt: now,
      });
      workspace.lastSyncError = null;
      return clone(item);
    });
  },

  async updateItem(id: string, payload: Partial<ItemInput>): Promise<Item> {
    return mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const index = workspace.items.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('This task is not available on this device.');
      const current = workspace.items[index];
      const status = payload.status ?? current.status;
      const completed = status === 'done' || status === 'wontdo';
      const updated: Item = {
        ...current,
        ...payload,
        id: current.id,
        status,
        completed_at: completed ? (current.completed_at ?? new Date().toISOString()) : null,
        project:
          payload.project_id === undefined
            ? current.project
            : projectForItem(workspace, payload.project_id ?? null),
        is_assigned:
          payload.assignee_id === undefined ? current.is_assigned : Boolean(payload.assignee_id),
        is_delegated:
          payload.assignee_id === undefined
            ? current.is_delegated
            : Boolean(payload.assignee_id) && current.user_id === workspace.ownerId,
        updated_at: new Date().toISOString(),
      };
      if (payload.assignee_id === null) updated.assignee = null;
      workspace.items[index] = updated;
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'item.update',
        entityId: id,
        payload,
        rollback: current,
        createdAt: updated.updated_at,
      });
      workspace.lastSyncError = null;
      return clone(updated);
    });
  },

  async deleteItem(id: string): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const deleted = workspace.items.find((item) => item.id === id);
      if (!deleted) throw new Error('This task is not available on this device.');
      const wasPendingCreate = workspace.operations.some(
        (operation) => operation.type === 'item.create' && operation.entityId === id,
      );
      workspace.items = workspace.items.filter((item) => item.id !== id);
      workspace.operations = workspace.operations.filter(
        (operation) =>
          !(
            operation.entityId === id &&
            (operation.type === 'item.create' || operation.type === 'item.update')
          ),
      );
      workspace.operations = workspace.operations.map((operation) =>
        operation.type === 'item.reorder'
          ? { ...operation, payload: operation.payload.filter((item) => item.id !== id) }
          : operation,
      );
      if (!wasPendingCreate) {
        workspace.operations = compactOperation(workspace.operations, {
          id: newOperationId(),
          type: 'item.delete',
          entityId: id,
          rollback: deleted,
          createdAt: new Date().toISOString(),
        });
      }
      workspace.lastSyncError = null;
    });
  },

  async reorderItems(items: Item[]): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const positions = new Map(items.map((item, position) => [item.id, position]));
      const rollback = workspace.items
        .filter((item) => positions.has(item.id))
        .map((item) => ({ id: item.id, position: item.position }));
      const now = new Date().toISOString();
      workspace.items = workspace.items.map((item) =>
        positions.has(item.id)
          ? { ...item, position: positions.get(item.id)!, updated_at: now }
          : item,
      );
      const payload = items.map((item, position) => ({ id: item.id, position }));
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'item.reorder',
        entityId: 'journal',
        payload,
        rollback,
        createdAt: now,
      });
      workspace.lastSyncError = null;
    });
  },

  async queueUserUpdate(
    payload: UserUpdatePayload,
    rollback: UserUpdatePayload = {},
  ): Promise<void> {
    if (Object.keys(payload).length === 0) return;
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'user.update',
        entityId: 'profile',
        payload,
        rollback,
        createdAt: new Date().toISOString(),
      });
      workspace.lastSyncError = null;
    });
  },

  async queueAvatarUpload(
    payload: AvatarUploadPayload,
    rollbackAvatarUrl: string | null,
  ): Promise<string | null> {
    return mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const existing = workspace.operations.find(
        (operation): operation is AvatarUploadOperation => operation.type === 'avatar.upload',
      );
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'avatar.upload',
        entityId: 'profile-photo',
        payload,
        rollbackAvatarUrl,
        createdAt: new Date().toISOString(),
      });
      workspace.lastSyncError = null;
      return existing?.payload.fileUri ?? null;
    });
  },

  async getNotifications(): Promise<NotificationsResponse> {
    const workspace = activeWorkspace(await readRoot());
    return {
      data: clone(workspace.notifications),
      unread_count: workspace.notifications.filter((notification) => !notification.read_at).length,
    };
  },

  async markNotificationRead(id: string): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const rollback = workspace.notifications.find((notification) => notification.id === id);
      const now = new Date().toISOString();
      workspace.notifications = workspace.notifications.map((notification) =>
        notification.id === id && !notification.read_at
          ? { ...notification, read_at: now, updated_at: now }
          : notification,
      );
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'notification.read',
        entityId: id,
        rollback,
        createdAt: now,
      });
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const rollback = clone(workspace.notifications);
      const now = new Date().toISOString();
      workspace.notifications = workspace.notifications.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? now,
        updated_at: now,
      }));
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'notification.read-all',
        entityId: 'all',
        rollback,
        createdAt: now,
      });
    });
  },

  async dismissNotification(id: string): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const rollback = workspace.notifications.find((notification) => notification.id === id);
      workspace.notifications = workspace.notifications.filter(
        (notification) => notification.id !== id,
      );
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'notification.dismiss',
        entityId: id,
        rollback,
        createdAt: new Date().toISOString(),
      });
    });
  },

  async queuePushSubscription(payload: PushSubscribeOperation['payload']): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'push.subscribe',
        entityId: payload.expo_push_token,
        payload,
        createdAt: new Date().toISOString(),
      });
    });
  },

  async queuePushUnsubscription(expoPushToken: string): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      workspace.operations = compactOperation(workspace.operations, {
        id: newOperationId(),
        type: 'push.unsubscribe',
        entityId: expoPushToken,
        createdAt: new Date().toISOString(),
      });
    });
  },

  async getActivity(): Promise<CursorPaginatedResponse<ActivityLogItem>> {
    const workspace = activeWorkspace(await readRoot());
    const data = workspace.items
      .filter((item) => item.status === 'done' || item.status === 'wontdo')
      .sort((left, right) =>
        (right.completed_at ?? right.updated_at).localeCompare(
          left.completed_at ?? left.updated_at,
        ),
      )
      .map<ActivityLogItem>((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        is_assigned: item.is_assigned,
        is_assigned_to_me:
          item.user_id !== workspace.ownerId && item.assignee_id === workspace.ownerId,
        is_delegated:
          item.user_id === workspace.ownerId &&
          item.assignee_id !== null &&
          item.assignee_id !== workspace.ownerId,
        project: item.project
          ? { id: item.project.id, name: item.project.name, color: item.project.color }
          : null,
        assignee: item.assignee ?? null,
        owner: item.owner ?? null,
        completed_by: { id: null, name: null },
        activity_at: item.completed_at,
        completed_at: item.completed_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    return {
      data,
      meta: {
        next_cursor: null,
        prev_cursor: null,
        per_page: data.length,
        path: 'offline://activity',
      },
    };
  },

  async getNextOperation(): Promise<OfflineOperation | null> {
    const workspace = activeWorkspace(await readRoot());
    return workspace.operations[0] ? clone(workspace.operations[0]) : null;
  },

  async getPendingUserUpdate(): Promise<UserUpdatePayload | null> {
    const workspace = activeWorkspace(await readRoot());
    const operation = workspace.operations.find(
      (candidate): candidate is UserUpdateOperation => candidate.type === 'user.update',
    );
    return operation ? clone(operation.payload) : null;
  },

  async getPendingAvatarUpload(): Promise<AvatarUploadOperation | null> {
    const workspace = activeWorkspace(await readRoot());
    const operation = workspace.operations.find(
      (candidate): candidate is AvatarUploadOperation => candidate.type === 'avatar.upload',
    );
    return operation ? clone(operation) : null;
  },

  async rejectOperation(operationId: string, message: string): Promise<OfflineOperation | null> {
    return mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const operation = workspace.operations.find((candidate) => candidate.id === operationId);
      if (!operation) return null;

      workspace.operations = workspace.operations.filter(
        (candidate) => candidate.id !== operationId,
      );

      switch (operation.type) {
        case 'project.create':
          workspace.projects = workspace.projects.filter(
            (project) => project.id !== operation.entityId,
          );
          break;
        case 'item.create':
          workspace.items = workspace.items.filter((item) => item.id !== operation.entityId);
          break;
        case 'item.update':
          if (operation.rollback) {
            workspace.items = mergeUnique(
              workspace.items.filter((item) => item.id !== operation.entityId),
              [normaliseItem(operation.rollback)],
            );
          }
          break;
        case 'item.delete':
          if (operation.rollback) {
            workspace.items = mergeUnique(workspace.items, [normaliseItem(operation.rollback)]);
          }
          break;
        case 'item.reorder': {
          const positions = new Map(
            (operation.rollback ?? []).map((item) => [item.id, item.position]),
          );
          workspace.items = workspace.items.map((item) =>
            positions.has(item.id) ? { ...item, position: positions.get(item.id)! } : item,
          );
          break;
        }
        case 'notification.read':
          if (operation.rollback) {
            workspace.notifications = mergeUnique(
              workspace.notifications.filter(
                (notification) => notification.id !== operation.entityId,
              ),
              [operation.rollback],
            );
          }
          break;
        case 'notification.read-all':
          if (operation.rollback) workspace.notifications = operation.rollback;
          break;
        case 'notification.dismiss':
          if (operation.rollback) {
            workspace.notifications = mergeUnique(workspace.notifications, [operation.rollback]);
          }
          break;
        case 'user.update':
        case 'avatar.upload':
        case 'push.subscribe':
        case 'push.unsubscribe':
          break;
      }

      workspace.lastSyncError = message;
      return clone(operation);
    });
  },

  async acknowledgeOperation(operationId: string, serverEntity?: Project | Item): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const operation = workspace.operations.find((candidate) => candidate.id === operationId);
      if (!operation) return;
      workspace.operations = workspace.operations.filter(
        (candidate) => candidate.id !== operationId,
      );

      if (serverEntity && operation.type.startsWith('project.')) {
        const stillDirty = hasEntityOperation(workspace.operations, serverEntity.id, 'project.');
        if (!stillDirty) {
          workspace.projects = mergeUnique(
            workspace.projects.filter((project) => project.id !== serverEntity.id),
            [normaliseProject(serverEntity as Project)],
          );
        }
      }

      if (serverEntity && operation.type.startsWith('item.')) {
        const stillDirty = hasEntityOperation(workspace.operations, serverEntity.id, 'item.');
        if (!stillDirty) {
          workspace.items = mergeUnique(
            workspace.items.filter((item) => item.id !== serverEntity.id),
            [normaliseItem(serverEntity as Item)],
          );
        }
      }
    });
  },

  async mergeServerSnapshot(snapshot: ServerSnapshot): Promise<void> {
    await mutateRoot((root) => {
      const workspace = activeWorkspace(root);
      const dirtyProjectIds = new Set(
        workspace.operations
          .filter((operation) => operation.type.startsWith('project.'))
          .map((operation) => operation.entityId),
      );
      const dirtyItemIds = new Set<string>();
      workspace.operations.forEach((operation) => {
        if (operation.type === 'item.reorder') {
          operation.payload.forEach((item) => dirtyItemIds.add(item.id));
        } else if (operation.type.startsWith('item.')) {
          dirtyItemIds.add(operation.entityId);
        }
      });

      const localProjects = workspace.projects.filter((project) => dirtyProjectIds.has(project.id));
      const localItems = workspace.items.filter((item) => dirtyItemIds.has(item.id));
      workspace.projects = mergeUnique(
        snapshot.projects
          .map(normaliseProject)
          .filter((project) => !dirtyProjectIds.has(project.id)),
        localProjects,
      );
      workspace.items = mergeUnique(
        snapshot.items.map(normaliseItem).filter((item) => !dirtyItemIds.has(item.id)),
        localItems,
      );
      const dismissedNotificationIds = new Set(
        workspace.operations
          .filter((operation) => operation.type === 'notification.dismiss')
          .map((operation) => operation.entityId),
      );
      const readNotificationIds = new Set(
        workspace.operations
          .filter((operation) => operation.type === 'notification.read')
          .map((operation) => operation.entityId),
      );
      const allNotificationsRead = workspace.operations.some(
        (operation) => operation.type === 'notification.read-all',
      );
      const localNotifications = new Map(
        workspace.notifications.map((notification) => [notification.id, notification]),
      );
      workspace.notifications = snapshot.notifications
        .filter((notification) => !dismissedNotificationIds.has(notification.id))
        .map((notification) => {
          if (!allNotificationsRead && !readNotificationIds.has(notification.id)) {
            return notification;
          }
          const local = localNotifications.get(notification.id);
          return {
            ...notification,
            read_at: local?.read_at ?? notification.read_at ?? snapshot.syncedAt,
          };
        });
      workspace.lastSyncedAt = snapshot.syncedAt;
      workspace.lastSyncError = null;
    });
  },
};
