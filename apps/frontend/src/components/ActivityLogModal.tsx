"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ActivityLogEntry } from "@/types";
import { fetchActivityLog } from "@/lib/api";
import { statusToLabel } from "@/lib/status";
import { useCursorPagination } from "@/hooks/useCursorPagination";

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Centre-screen modal showing a chronological feed of closed items
 * (status = done or wontdo), grouped by completion date.
 *
 * Backed by `GET /api/activity-log` (cursor-paginated, composite-indexed on
 * `(user_id, status, updated_at)`). Gated behind the `activity_log` global
 * feature flag — callers should guard with `enabled("activity_log")` before
 * rendering the open button.
 */
export function ActivityLogModal({ isOpen, onClose }: ActivityLogModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Memoised so fetchPage's useCallback dep doesn't churn on every render.
  const fetcher = useCallback(
    (cursor?: string) => fetchActivityLog({ cursor, perPage: 30 }),
    [],
  );

  const { items, initialLoading, loading, hasMore, error, loadMore } =
    useCursorPagination<ActivityLogEntry>(fetcher, isOpen);

  // Infinite-scroll: fetch the next page when the sentinel enters the viewport.
  useEffect(() => {
    if (!isOpen || !sentinelRef.current) return;

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }, // prefetch slightly before the user hits the bottom
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen, loadMore]);

  // Escape key closes the modal.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Group entries by calendar day for the timeline headings. Order is preserved
  // because the server returns entries sorted desc by updated_at.
  const groups = useMemo(() => {
    const map = new Map<string, ActivityLogEntry[]>();
    for (const entry of items) {
      const ts = entry.completed_at ?? entry.updated_at;
      const key = ts.slice(0, 10); // YYYY-MM-DD
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return [...map.entries()];
  }, [items]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  if (!isOpen) return null;

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
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {initialLoading ? (
            <ActivityLogSkeleton />
          ) : error ? (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nothing done yet. Finish something!
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map(([day, entries]) => (
                <section key={day}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {formatDayHeading(day)}
                  </h3>
                  <ul className="space-y-1.5">
                    {entries.map((entry) => (
                      <ActivityRow key={entry.id} entry={entry} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-px" />

          {/* Inline spinner while loading subsequent pages */}
          {loading && !initialLoading && (
            <div className="py-4 text-center text-xs text-gray-400">
              Loading more…
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="py-4 text-center text-xs text-gray-400">
              — End of history —
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const isDone = entry.status === "done";
  return (
    <li className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50">
      <span
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
          isDone ? "bg-green-500" : "bg-gray-400"
        }`}
        aria-label={statusToLabel(entry.status)}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            isDone ? "text-gray-800" : "text-gray-500 line-through"
          }`}
        >
          {entry.title}
        </p>
        {entry.project && (
          <span
            className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: entry.project.color
                ? `${entry.project.color}20`
                : "#f1f5f9",
              color: entry.project.color ?? "#64748b",
            }}
          >
            {entry.project.name}
          </span>
        )}
      </div>
      <time className="shrink-0 text-[11px] text-gray-400">
        {formatTime(entry.completed_at ?? entry.updated_at)}
      </time>
    </li>
  );
}

function ActivityLogSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {[0, 1].map((g) => (
        <div key={g}>
          <div className="mb-3 h-3 w-24 rounded bg-gray-200" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-4 flex-1 rounded bg-gray-200" />
                <div className="h-3 w-10 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Render a YYYY-MM-DD key as "Today", "Yesterday", or a locale date string.
 * Appends `T00:00:00` so the Date is constructed in local time, not UTC.
 */
function formatDayHeading(ymd: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (ymd === today) return "Today";

  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (ymd === yesterday) return "Yesterday";

  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}
