import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import {
  createItem,
  createProject,
  deleteItem,
  fetchItems,
  fetchProjects,
  reorderItems,
  updateItem,
  type ItemInput,
} from '@/lib/api';
import type { Item, ItemScope, Project, Status, User } from '@/types';

export interface JournalData {
  mine: Item[];
  assigned: Item[];
  delegated: Item[];
  projects: Project[];
}

export const journalKey = (scope: ItemScope, delegation: boolean) =>
  ['journal', scope, delegation] as const;

export function useJournal(scope: ItemScope, delegation: boolean) {
  return useQuery({
    queryKey: journalKey(scope, delegation),
    queryFn: async (): Promise<JournalData> => {
      const [mine, assigned, delegated, projects] = await Promise.all([
        fetchItems({ scope }),
        delegation ? fetchItems({ scope, assigned_to_me: true }) : Promise.resolve([]),
        delegation ? fetchItems({ scope, delegated: true }) : Promise.resolve([]),
        fetchProjects(),
      ]);
      return { mine, assigned, delegated, projects };
    },
  });
}

function mapAllJournalData(
  client: QueryClient,
  transform: (data: JournalData) => JournalData,
): void {
  client.setQueriesData<JournalData>({ queryKey: ['journal'] }, (data) =>
    data ? transform(data) : data,
  );
}

function mapItem(data: JournalData, itemId: string, transform: (item: Item) => Item): JournalData {
  const map = (items: Item[]) => items.map((item) => (item.id === itemId ? transform(item) : item));
  return {
    ...data,
    mine: map(data.mine),
    assigned: map(data.assigned),
    delegated: map(data.delegated),
  };
}

function snapshotJournal(client: QueryClient) {
  return client.getQueriesData<JournalData>({ queryKey: ['journal'] });
}

function restoreJournal(
  client: QueryClient,
  snapshots: [readonly unknown[], JournalData | undefined][],
): void {
  snapshots.forEach(([key, data]) => client.setQueryData(key, data));
}

interface PendingStatusUpdate {
  status: Status;
  timer: ReturnType<typeof setTimeout>;
  onError?: () => void;
}

const statusUpdateDebounceMs = 3000;

export function findCachedItem(client: QueryClient, id: string): Item | undefined {
  for (const [, data] of client.getQueriesData<JournalData>({ queryKey: ['journal'] })) {
    const item = [
      ...(data?.mine ?? []),
      ...(data?.assigned ?? []),
      ...(data?.delegated ?? []),
    ].find((candidate) => candidate.id === id);
    if (item) return item;
  }
  return undefined;
}

export function useJournalActions(user: User | null) {
  const client = useQueryClient();
  const pendingStatusUpdates = useRef(new Map<string, PendingStatusUpdate>());
  const statusBaselines = useRef(new Map<string, ReturnType<typeof snapshotJournal>>());
  const latestStatuses = useRef(new Map<string, Status>());
  const statusRequestChains = useRef(new Map<string, Promise<void>>());

  const flushStatusUpdate = useCallback(
    (id: string) => {
      const pending = pendingStatusUpdates.current.get(id);
      if (!pending) return;

      clearTimeout(pending.timer);
      pendingStatusUpdates.current.delete(id);
      const { status, onError } = pending;
      const previousRequest = statusRequestChains.current.get(id) ?? Promise.resolve();

      const request = previousRequest
        .catch(() => undefined)
        .then(async () => {
          try {
            const updated = await updateItem(id, { status });
            const hasNewerStatus =
              pendingStatusUpdates.current.has(id) || latestStatuses.current.get(id) !== status;

            if (!hasNewerStatus) {
              mapAllJournalData(client, (data) => mapItem(data, updated.id, () => updated));
              latestStatuses.current.delete(id);
              statusBaselines.current.delete(id);
              await client.invalidateQueries({ queryKey: ['journal'] });
            }
          } catch {
            const hasNewerStatus =
              pendingStatusUpdates.current.has(id) || latestStatuses.current.get(id) !== status;

            if (!hasNewerStatus) {
              const baseline = statusBaselines.current.get(id);
              if (baseline) restoreJournal(client, baseline);
              latestStatuses.current.delete(id);
              statusBaselines.current.delete(id);
              onError?.();
              await client.invalidateQueries({ queryKey: ['journal'] });
            }
          }
        })
        .finally(() => {
          if (statusRequestChains.current.get(id) === request) {
            statusRequestChains.current.delete(id);
          }
        });

      statusRequestChains.current.set(id, request);
    },
    [client],
  );

  const queueStatusUpdate = useCallback(
    (id: string, status: Status, options?: { onError?: () => void }) => {
      const existing = pendingStatusUpdates.current.get(id);
      if (existing) clearTimeout(existing.timer);
      if (!statusBaselines.current.has(id)) {
        statusBaselines.current.set(id, snapshotJournal(client));
      }

      latestStatuses.current.set(id, status);
      void client.cancelQueries({ queryKey: ['journal'] });

      const now = new Date().toISOString();
      const completed = status === 'done' || status === 'wontdo';
      mapAllJournalData(client, (data) =>
        mapItem(data, id, (item) => ({
          ...item,
          status,
          completed_at: completed ? (item.completed_at ?? now) : null,
          updated_at: now,
        })),
      );

      const timer = setTimeout(() => flushStatusUpdate(id), statusUpdateDebounceMs);
      pendingStatusUpdates.current.set(id, { status, timer, onError: options?.onError });
    },
    [client, flushStatusUpdate],
  );

  const createTask = useMutation({
    mutationFn: createItem,
    onMutate: async (input: ItemInput) => {
      await client.cancelQueries({ queryKey: ['journal'] });
      const snapshots = snapshotJournal(client);
      const temporaryId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      mapAllJournalData(client, (data) => {
        const project = input.project_id
          ? (data.projects.find((candidate) => candidate.id === input.project_id) ?? null)
          : null;
        const optimistic: Item = {
          id: temporaryId,
          user_id: user?.id ?? '',
          assignee_id: input.assignee_id ?? null,
          project_id: input.project_id ?? null,
          title: input.title,
          description: input.description ?? null,
          assignee_notes: input.assignee_notes ?? null,
          status: input.status ?? 'todo',
          position: input.position ?? data.mine.length,
          scheduled_date: input.scheduled_date ?? null,
          due_date: input.due_date ?? null,
          completed_at: null,
          recurrence_rule: input.recurrence_rule ?? null,
          recurrence_parent_id: null,
          recurrence_strategy: input.recurrence_strategy ?? null,
          is_recurring_template: Boolean(input.recurrence_rule),
          is_recurring_instance: false,
          is_assigned: Boolean(input.assignee_id),
          is_delegated: Boolean(input.assignee_id),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          project,
        };
        return { ...data, mine: [...data.mine, optimistic] };
      });
      return { snapshots, temporaryId };
    },
    onSuccess: (created, _input, context) => {
      if (!context) return;
      mapAllJournalData(client, (data) => mapItem(data, context.temporaryId, () => created));
    },
    onError: (_error, _input, context) => {
      if (context) restoreJournal(client, context.snapshots);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['journal'] }),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ItemInput> }) =>
      updateItem(id, payload),
    onMutate: async ({ id, payload }) => {
      await client.cancelQueries({ queryKey: ['journal'] });
      const snapshots = snapshotJournal(client);
      mapAllJournalData(client, (data) => {
        const selectedProject =
          payload.project_id === undefined
            ? undefined
            : (data.projects.find((project) => project.id === payload.project_id) ?? null);
        return mapItem(data, id, (item) => ({
          ...item,
          ...payload,
          project: selectedProject === undefined ? item.project : selectedProject,
          is_assigned:
            payload.assignee_id === undefined ? item.is_assigned : Boolean(payload.assignee_id),
          is_delegated:
            payload.assignee_id === undefined ? item.is_delegated : Boolean(payload.assignee_id),
          updated_at: new Date().toISOString(),
        }));
      });
      return { snapshots };
    },
    onSuccess: (updated) =>
      mapAllJournalData(client, (data) => mapItem(data, updated.id, () => updated)),
    onError: (_error, _variables, context) => {
      if (context) restoreJournal(client, context.snapshots);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['journal'] }),
  });

  const removeTask = useMutation({
    mutationFn: deleteItem,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ['journal'] });
      const snapshots = snapshotJournal(client);
      mapAllJournalData(client, (data) => ({
        ...data,
        mine: data.mine.filter((item) => item.id !== id),
        assigned: data.assigned.filter((item) => item.id !== id),
        delegated: data.delegated.filter((item) => item.id !== id),
      }));
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreJournal(client, context.snapshots);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['journal'] }),
  });

  const declineTask = useMutation({
    mutationFn: (id: string) => updateItem(id, { assignee_id: null }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ['journal'] });
      const snapshots = snapshotJournal(client);
      mapAllJournalData(client, (data) => ({
        ...data,
        assigned: data.assigned.filter((item) => item.id !== id),
      }));
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreJournal(client, context.snapshots);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['journal'] }),
  });

  const reorderTasks = useMutation({
    mutationFn: (items: Item[]) =>
      reorderItems(items.map((item, position) => ({ id: item.id, position }))),
    onMutate: async (items) => {
      await client.cancelQueries({ queryKey: ['journal'] });
      const snapshots = snapshotJournal(client);
      const positions = new Map(items.map((item, index) => [item.id, index]));
      mapAllJournalData(client, (data) => ({
        ...data,
        mine: data.mine
          .map((item) => ({ ...item, position: positions.get(item.id) ?? item.position }))
          .sort((left, right) => left.position - right.position),
      }));
      return { snapshots };
    },
    onError: (_error, _items, context) => {
      if (context) restoreJournal(client, context.snapshots);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['journal'] }),
  });

  const addProject = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      mapAllJournalData(client, (data) => ({ ...data, projects: [...data.projects, project] }));
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['journal'] }),
  });

  return {
    createTask,
    updateTask,
    queueStatusUpdate,
    removeTask,
    declineTask,
    reorderTasks,
    addProject,
  };
}
