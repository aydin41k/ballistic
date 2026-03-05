"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification } from "@/types";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
} from "@/lib/api";
import { useCursorPagination } from "@/hooks/useCursorPagination";

interface NotificationCentreProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional callback when the unread count is known (after a fetch or a bulk
   * action). Useful for syncing an external badge indicator in the bottom bar.
   */
  onUnreadCountChange?: (count: number) => void;
}

/**
 * Centre-screen modal showing the user's notification history.
 *
 * Infinite-scroll via cursor pagination (`GET /api/notifications`). Bulk
 * actions: "Mark all read" and "Clear read notifications". Individual
 * notifications are markable by clicking on them.
 *
 * Gated behind the `notification_centre` global feature flag — callers should
 * guard the open button with `enabled("notification_centre")`.
 */
export function NotificationCentre({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationCentreProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bulkBusy, setBulkBusy] = useState(false);

  // fetchNotifications returns `next_cursor` and `has_more` as optional
  // fields (legacy responses may omit them) so we coalesce to the shape the
  // pagination hook expects. This also lets us lift `unread_count` out of the
  // page payload without the hook needing to know about it.
  const fetcher = useCallback(async (cursor?: string) => {
    const page = await fetchNotifications({ cursor, perPage: 25 });
    setUnreadCount(page.unread_count);
    return {
      data: page.data,
      next_cursor: page.next_cursor ?? null,
      has_more: page.has_more ?? false,
    };
  }, []);

  const {
    items,
    setItems,
    initialLoading,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  } = useCursorPagination<Notification>(fetcher, isOpen);

  // Propagate unread count to the parent badge.
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Infinite-scroll sentinel.
  useEffect(() => {
    if (!isOpen || !sentinelRef.current) return;

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen, loadMore]);

  // Escape key closes.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  async function handleMarkOne(notification: Notification) {
    if (notification.read_at) return; // already read — no-op

    // Optimistic: paint the row as read before the server confirms.
    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read_at: readAt } : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const { unread_count } = await markNotificationAsRead(notification.id);
      setUnreadCount(unread_count);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Roll back.
      setItems((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: null } : n,
        ),
      );
      setUnreadCount((c) => c + 1);
    }
  }

  async function handleMarkAll() {
    if (bulkBusy || unreadCount === 0) return;
    setBulkBusy(true);
    try {
      const { unread_count } = await markAllNotificationsAsRead();
      const readAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: readAt })),
      );
      setUnreadCount(unread_count);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleClearRead() {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      await clearReadNotifications();
      // After delete, the remaining set is whatever was unread. Rather than
      // re-derive locally (pagination means we don't have the full set),
      // re-fetch from page 1 for a consistent view.
      reset();
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    } finally {
      setBulkBusy(false);
    }
  }

  if (!isOpen) return null;

  const hasRead = items.some((n) => n.read_at !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="flex max-h-[85vh] w-[90vw] max-w-2xl flex-col rounded-lg bg-white shadow-xl animate-scale-in"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              className="text-gray-500"
            >
              <path
                d="M18 6 6 18M6 6l12 12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Bulk action bar — hidden during initial load since counts aren't
            known yet and showing disabled buttons on an empty screen is noise. */}
        {!initialLoading && items.length > 0 && (
          <div className="flex gap-2 border-b border-gray-100 px-6 py-2.5">
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={bulkBusy || unreadCount === 0}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={handleClearRead}
              disabled={bulkBusy || !hasRead}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear read
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {initialLoading ? (
            <NotificationSkeleton />
          ) : error ? (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkOne}
                />
              ))}
            </ul>
          )}

          <div ref={sentinelRef} className="h-px" />

          {loading && !initialLoading && (
            <div className="py-4 text-center text-xs text-gray-400">
              Loading more…
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div className="py-4 text-center text-xs text-gray-400">
              — End —
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (n: Notification) => void;
}) {
  const isUnread = notification.read_at === null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onMarkRead(notification)}
        disabled={!isUnread}
        className={`flex w-full items-start gap-3 px-6 py-3 text-left transition-colors ${
          isUnread
            ? "bg-blue-50/40 hover:bg-blue-50 cursor-pointer"
            : "hover:bg-gray-50 cursor-default"
        }`}
      >
        {/* Unread dot */}
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            isUnread ? "bg-blue-500" : "bg-transparent"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${isUnread ? "font-semibold text-gray-900" : "font-normal text-gray-700"}`}
          >
            {notification.title}
          </p>
          {notification.message && (
            <p className="mt-0.5 text-xs text-gray-500">
              {notification.message}
            </p>
          )}
          <time className="mt-1 block text-[11px] text-gray-400">
            {formatRelativeTime(notification.created_at)}
          </time>
        </div>
      </button>
    </li>
  );
}

function NotificationSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 px-6 py-3">
          <div className="mt-1.5 h-2 w-2 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * "5 minutes ago"-style timestamps without pulling in a date library.
 * Caps at days — beyond two weeks we fall back to a locale date string,
 * which is more useful than "43 days ago" for scanning a long history.
 */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 14) return `${diffDay}d ago`;

  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
