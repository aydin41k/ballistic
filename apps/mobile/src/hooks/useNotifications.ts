import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { offlineStore } from '@/lib/offline-store';

export const notificationsKey = ['notifications'] as const;

export function useNotifications(enabled = true) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: notificationsKey });
  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: offlineStore.getNotifications,
    enabled,
    staleTime: Infinity,
    networkMode: 'always',
  });

  const markRead = useMutation({
    mutationFn: (id: string) => offlineStore.markNotificationRead(id),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: offlineStore.markAllNotificationsRead,
    onSuccess: refresh,
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => offlineStore.dismissNotification(id),
    onSuccess: refresh,
  });

  return { ...query, markRead, markAllRead, dismiss };
}
