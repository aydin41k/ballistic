import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { offlineStore } from '@/lib/offline-store';
import type { Item, ItemInput, ItemScope, Project, Status, User } from '@/types';

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
    queryFn: () => offlineStore.getJournal(scope, delegation),
    staleTime: Infinity,
    networkMode: 'always',
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

async function refreshJournal(client: QueryClient): Promise<void> {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['journal'] }),
    client.invalidateQueries({ queryKey: ['projects'] }),
    client.invalidateQueries({ queryKey: ['item'] }),
    client.invalidateQueries({ queryKey: ['activity'] }),
  ]);
}

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

export function useJournalActions(_user: User | null) {
  const client = useQueryClient();

  const queueStatusUpdate = useCallback(
    (id: string, status: Status, options?: { onError?: () => void }) => {
      const snapshots = snapshotJournal(client);
      const now = new Date().toISOString();
      const completed = status === 'done' || status === 'wontdo';
      if (!completed) {
        mapAllJournalData(client, (data) =>
          mapItem(data, id, (item) => ({
            ...item,
            status,
            completed_at: null,
            updated_at: now,
          })),
        );
      }

      void offlineStore
        .updateItem(id, { status })
        .then(() => refreshJournal(client))
        .catch(() => {
          restoreJournal(client, snapshots);
          options?.onError?.();
        });
    },
    [client],
  );

  const createTask = useMutation({
    mutationFn: (input: ItemInput) => offlineStore.createItem(input),
    onSuccess: () => refreshJournal(client),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ItemInput> }) =>
      offlineStore.updateItem(id, payload),
    onSuccess: () => refreshJournal(client),
  });

  const removeTask = useMutation({
    mutationFn: (id: string) => offlineStore.deleteItem(id),
    onSuccess: () => refreshJournal(client),
  });

  const declineTask = useMutation({
    mutationFn: (id: string) => offlineStore.updateItem(id, { assignee_id: null }),
    onSuccess: () => refreshJournal(client),
  });

  const reorderTasks = useMutation({
    mutationFn: (items: Item[]) => offlineStore.reorderItems(items),
    onSuccess: () => refreshJournal(client),
  });

  const addProject = useMutation({
    mutationFn: (payload: { name: string; color?: string | null }) =>
      offlineStore.createProject(payload),
    onSuccess: () => refreshJournal(client),
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
