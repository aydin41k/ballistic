"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Notification, NotificationsResponse } from "@/types";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
} from "@/lib/api";

interface NotificationCentreProps {
  delegation: boolean;
  variant?: "icon" | "sidebar";
}

export function NotificationCentre({
  delegation,
  variant = "icon",
}: NotificationCentreProps) {
  const isSidebar = variant === "sidebar";
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const response: NotificationsResponse = await fetchNotifications();
      setNotifications(response.data);
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Poll for new notifications every 30s when delegation is on
  useEffect(() => {
    if (!delegation) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void load();
    pollRef.current = setInterval(() => void load(), 30_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [delegation, load]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen && !isSidebar) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen, isSidebar]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isSidebar || !isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSidebar]);

  async function handleMarkAsRead(id: string) {
    try {
      const result = await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount(result.unread_count);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  async function handleDismiss(id: string) {
    try {
      const result = await dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount(result.unread_count);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  }

  async function handleToggle() {
    if (isSidebar) {
      if (isOpen) {
        setIsOpen(false);
        return;
      }

      setIsOpen(true);
      if (!loading) {
        setLoading(true);
        void load().finally(() => setLoading(false));
      }
      return;
    }

    if (!isOpen && !loading) {
      setLoading(true);
      await load();
      setLoading(false);
    }
    setIsOpen((prev) => !prev);
  }

  if (!delegation) return null;

  return (
    <div
      ref={dropdownRef}
      className={isSidebar ? "relative w-full" : "relative"}
    >
      {/* Bell button */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => void handleToggle()}
        className={
          isSidebar
            ? `tap-target relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${isOpen ? "bg-blue-50 text-[var(--navy)]" : "text-slate-600 hover:bg-slate-50 hover:text-[var(--navy)]"}`
            : "tap-target relative grid h-10 w-10 place-items-center rounded-md transition-all duration-200 hover:bg-slate-100 active:scale-95"
        }
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          className={isSidebar ? "text-slate-500" : "text-[var(--navy)]"}
        >
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isSidebar && <span className="flex-1 text-left">Notifications</span>}
        {unreadCount > 0 && (
          <span
            className={
              isSidebar
                ? "flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white"
                : "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            }
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && isSidebar && (
        <NotificationPortal enabled>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/20 backdrop-blur-[1px]"
          />
        </NotificationPortal>
      )}

      {/* Dropdown */}
      {isOpen && (
        <NotificationPortal enabled={isSidebar}>
          <div
            role={isSidebar ? "dialog" : undefined}
            aria-modal={isSidebar ? "true" : undefined}
            aria-label={isSidebar ? "Notifications" : undefined}
            className={
              isSidebar
                ? "animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-[26rem] flex-col border-l border-slate-200 bg-white shadow-2xl"
                : "absolute bottom-full right-0 z-50 mb-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200/70 bg-white shadow-xl animate-slide-in-up"
            }
          >
            {/* Header */}
            <div
              className={`flex shrink-0 items-center justify-between border-b border-gray-100 ${isSidebar ? "px-6 py-5" : "px-4 py-3"}`}
            >
              <div>
                <h3
                  className={`${isSidebar ? "text-lg" : "text-sm"} font-semibold text-gray-900`}
                >
                  Notifications
                </h3>
                {isSidebar && (
                  <p className="mt-1 text-xs text-slate-500">
                    Updates about assigned and delegated tasks.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAllAsRead()}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
                {isSidebar && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close notifications"
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        d="M18 6 6 18M6 6l12 12"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className={isSidebar ? "min-h-0 flex-1 overflow-y-auto" : ""}>
              {/* Loading */}
              {loading && notifications.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-500">
                  Loading...
                </p>
              )}

              {/* Empty */}
              {!loading && notifications.length === 0 && (
                <div className="px-6 py-12 text-center">
                  {isSidebar && (
                    <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                  <p className="text-sm text-gray-500">No notifications yet.</p>
                </div>
              )}

              {/* List */}
              {notifications.length > 0 && (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        !notification.read_at
                          ? "bg-blue-50/50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!notification.read_at && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleMarkAsRead(notification.id)
                            }
                            className="rounded p-1 transition-colors hover:bg-blue-100"
                            title="Mark as read"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              className="text-blue-600"
                            >
                              <path
                                d="M20 6 9 17l-5-5"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDismiss(notification.id)}
                          className="rounded p-1 transition-colors hover:bg-red-100"
                          title="Dismiss"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            className="text-gray-400"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </NotificationPortal>
      )}
    </div>
  );
}

function NotificationPortal({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return enabled ? createPortal(children, document.body) : children;
}

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}
