import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  dismissNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api';
import type { NotificationsResponse } from '@/types';

export const notificationsKey = ['notifications'] as const;

export function useNotifications(enabled = true) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: fetchNotifications,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });

  const markRead = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: notificationsKey });
      const previous = client.getQueryData<NotificationsResponse>(notificationsKey);
      client.setQueryData<NotificationsResponse>(notificationsKey, (data) =>
        data
          ? {
              data: data.data.map((notification) =>
                notification.id === id
                  ? { ...notification, read_at: new Date().toISOString() }
                  : notification,
              ),
              unread_count: Math.max(0, data.unread_count - 1),
            }
          : data,
      );
      return { previous };
    },
    onError: (_error, _id, context) => client.setQueryData(notificationsKey, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: notificationsKey }),
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      const previous = client.getQueryData<NotificationsResponse>(notificationsKey);
      client.setQueryData<NotificationsResponse>(notificationsKey, (data) =>
        data
          ? {
              data: data.data.map((notification) => ({
                ...notification,
                read_at: notification.read_at ?? new Date().toISOString(),
              })),
              unread_count: 0,
            }
          : data,
      );
      return { previous };
    },
    onError: (_error, _variables, context) =>
      client.setQueryData(notificationsKey, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: notificationsKey }),
  });

  const dismiss = useMutation({
    mutationFn: dismissNotification,
    onMutate: async (id) => {
      const previous = client.getQueryData<NotificationsResponse>(notificationsKey);
      client.setQueryData<NotificationsResponse>(notificationsKey, (data) => {
        if (!data) return data;
        const removed = data.data.find((notification) => notification.id === id);
        return {
          data: data.data.filter((notification) => notification.id !== id),
          unread_count: Math.max(0, data.unread_count - (removed && !removed.read_at ? 1 : 0)),
        };
      });
      return { previous };
    },
    onError: (_error, _id, context) => client.setQueryData(notificationsKey, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: notificationsKey }),
  });

  return { ...query, markRead, markAllRead, dismiss };
}
