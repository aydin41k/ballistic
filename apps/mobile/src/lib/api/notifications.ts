import type {
  ActivityLogItem,
  CursorPaginatedResponse,
  NotificationsResponse,
} from "@/types";

import { apiRequest } from "./client";

export async function fetchNotifications(
  unreadOnly?: boolean,
): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>({
    path: "/api/notifications",
    method: "GET",
    params: {
      unread_only: unreadOnly ? "true" : undefined,
    },
    errorMessage: "Unable to load notifications right now.",
  });
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ message: string; unread_count: number }> {
  return apiRequest<{ message: string; unread_count: number }>({
    path: `/api/notifications/${notificationId}/read`,
    method: "POST",
    errorMessage: "Unable to mark the notification as read right now.",
  });
}

export async function markAllNotificationsAsRead(): Promise<{
  message: string;
  marked_count: number;
}> {
  return apiRequest<{ message: string; marked_count: number }>({
    path: "/api/notifications/read-all",
    method: "POST",
    errorMessage: "Unable to update notifications right now.",
  });
}

export async function dismissNotification(
  notificationId: string,
): Promise<{ message: string; unread_count: number }> {
  return apiRequest<{ message: string; unread_count: number }>({
    path: `/api/notifications/${notificationId}`,
    method: "DELETE",
    errorMessage: "Unable to dismiss the notification right now.",
  });
}

export async function fetchActivityLog(
  cursor?: string,
): Promise<CursorPaginatedResponse<ActivityLogItem>> {
  return apiRequest<CursorPaginatedResponse<ActivityLogItem>>({
    path: "/api/activity-log",
    method: "GET",
    params: {
      per_page: "20",
      cursor,
    },
    errorMessage: "Unable to load the activity log right now.",
  });
}
