"use client";

import { cycleStatus } from "@/lib/status";
import { updateStatus } from "@/lib/api";
import type { Item } from "@/types";
import { useOptimistic, startTransition, useEffect, useRef } from "react";
import { StatusCircle } from "./StatusCircle";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

type Props = {
  item: Item;
  onChange: (itemOrUpdater: Item | ((current: Item) => Item)) => void;
  onOptimisticReorder: (
    itemId: string,
    direction: "up" | "down" | "top",
  ) => void;
  index: number;
  onEdit: () => void;
  isFirst: boolean;
  isLast?: boolean;
  onDecline?: () => void;
  onDelete?: () => void;
  desktopCanReorder?: boolean;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDropItem: (id: string) => void;
  onDragEnd: () => void;
  draggingId: string | null;
  dragOverId: string | null;
  onError: (message: string) => void;
};

export function ItemRow({
  item,
  onChange,
  onOptimisticReorder,
  index,
  onEdit,
  isFirst,
  isLast = false,
  onDecline,
  onDelete,
  desktopCanReorder = true,
  onDragStart,
  onDragEnter,
  onDropItem,
  onDragEnd,
  draggingId,
  dragOverId,
  onError,
}: Props) {
  const { dates, delegation } = useFeatureFlags();
  const pendingStatusRef = useRef<Item["status"] | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [optimisticItem, addOptimistic] = useOptimistic(
    item,
    (currentItem: Item, newStatus: Item["status"]) => ({
      ...currentItem,
      status: newStatus,
      completed_at:
        newStatus === "done"
          ? new Date().toISOString()
          : currentItem.status === "done"
            ? null
            : currentItem.completed_at,
    }),
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  function onToggle() {
    const nextStatus = cycleStatus(optimisticItem.status);

    const completedAt =
      nextStatus === "done" || nextStatus === "wontdo"
        ? new Date().toISOString()
        : optimisticItem.status === "done" || optimisticItem.status === "wontdo"
          ? null
          : optimisticItem.completed_at;

    // Update UI immediately (optimistic update)
    startTransition(() => {
      addOptimistic(nextStatus);
    });

    // Update parent state immediately
    onChange((current) => {
      if (current.id !== item.id) return current;
      return {
        ...current,
        status: nextStatus,
        completed_at: completedAt,
      };
    });

    pendingStatusRef.current = nextStatus;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const statusToSend = pendingStatusRef.current;
      if (!statusToSend) return;

      updateStatus(item.id, statusToSend)
        .then((serverItem) => {
          onChange((current) => {
            if (current.id !== item.id) return current;
            if (current.status !== statusToSend) return current;
            return {
              ...current,
              status: serverItem.status,
              completed_at: serverItem.completed_at,
              updated_at: serverItem.updated_at,
            };
          });
        })
        .catch((error) => {
          console.error("Failed to update status:", error);
          onChange(item);
          onError("Failed to update status. Change reverted.");
        })
        .finally(() => {
          if (pendingStatusRef.current === statusToSend) {
            pendingStatusRef.current = null;
          }
        });
    }, 3000);
  }

  function onMove(direction: "up" | "down" | "top") {
    onOptimisticReorder(item.id, direction);
  }

  const isCompleted = optimisticItem.status === "done";
  const isCancelled = optimisticItem.status === "wontdo";

  // Urgency calculation
  const urgency = (() => {
    if (!optimisticItem.due_date || isCompleted || isCancelled) return "none";
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dueMs = new Date(optimisticItem.due_date + "T23:59:59").getTime();
    const in72hMs = today.getTime() + 72 * 60 * 60 * 1000;

    if (optimisticItem.due_date < todayStr) return "overdue";
    if (dueMs <= in72hMs) return "due-soon";
    return "upcoming";
  })();

  // Get project name from nested project object if available
  const projectName = optimisticItem.project?.name || null;
  const isDragging = draggingId === item.id;
  const isDragOver = dragOverId === item.id && draggingId !== item.id;

  return (
    <div
      data-item-id={item.id}
      className={`flex items-center gap-3 rounded-md bg-white p-3 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 animate-slide-in-up cursor-pointer lg:min-h-[5.5rem] lg:gap-4 lg:rounded-xl lg:border lg:border-slate-200/80 lg:p-4 lg:shadow-none lg:hover:translate-y-0 lg:hover:border-slate-300 lg:hover:shadow-sm ${isDragging ? "scale-105 shadow-xl ring-2 ring-[var(--blue)]/40 bg-blue-50/50 z-50" : ""} ${isDragOver ? "ring-2 ring-[var(--blue)]/60 bg-blue-50/30" : ""} ${dates && urgency === "overdue" ? "border-l-4 border-l-red-500 bg-red-50/50" : ""} ${dates && urgency === "due-soon" ? "border-l-4 border-l-amber-400 bg-amber-50/30" : ""}`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onClick={onEdit}
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
        }
        onDragStart(item.id);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragEnter(item.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragEnter(item.id);
        onDropItem(item.id);
      }}
      onDragEnd={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragEnd();
      }}
    >
      {/* Status circle */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <StatusCircle status={optimisticItem.status} onClick={onToggle} />
      </div>

      {/* Task details */}
      <div className="flex-1 min-w-0">
        <div
          className={`font-reading flex items-center gap-1 font-medium transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-400 line-through" : "text-[var(--navy)]"}`}
        >
          {optimisticItem.title}
          {dates &&
            (optimisticItem.is_recurring_template ||
              optimisticItem.is_recurring_instance) && (
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                className={`shrink-0 ${isCompleted || isCancelled ? "text-slate-300" : "text-slate-400"}`}
              >
                <path
                  d="M17 1l4 4-4 4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 13v2a4 4 0 0 1-4 4H3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
        </div>
        {/* Project, tags, and assignment badges */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {projectName && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full transition-colors duration-200 ${isCompleted || isCancelled ? "bg-slate-100 text-slate-300" : "bg-[var(--blue)]/10 text-[var(--blue-600)]"}`}
            >
              {projectName}
            </span>
          )}
          {/* Tags */}
          {optimisticItem.tags?.map((tag) => (
            <span
              key={tag.id}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors duration-200 ${isCompleted || isCancelled ? "bg-slate-100 text-slate-300" : "bg-violet-100 text-violet-700"}`}
              style={
                tag.color && !isCompleted && !isCancelled
                  ? {
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }
                  : undefined
              }
            >
              {tag.name}
            </span>
          ))}
          {delegation &&
            optimisticItem.is_delegated &&
            optimisticItem.assignee && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-200 ${isCompleted || isCancelled ? "bg-slate-100 text-slate-300" : "bg-amber-100 text-amber-700 border border-amber-200"}`}
              >
                → {optimisticItem.assignee.name}
              </span>
            )}
          {delegation &&
            optimisticItem.is_assigned &&
            !optimisticItem.is_delegated &&
            optimisticItem.owner && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-200 ${isCompleted || isCancelled ? "bg-slate-100 text-slate-300" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
              >
                ← {optimisticItem.owner.name}
              </span>
            )}
        </div>
        {optimisticItem.description && (
          <div
            className={`font-reading mt-1 text-sm transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-300" : "text-slate-500"}`}
          >
            <span className="lg:hidden">
              {optimisticItem.description.length > 50
                ? `${optimisticItem.description.slice(0, 50)}...`
                : optimisticItem.description}
            </span>
            <span className="hidden lg:inline">
              {optimisticItem.description.length > 140
                ? `${optimisticItem.description.slice(0, 140)}...`
                : optimisticItem.description}
            </span>
          </div>
        )}
        {delegation && optimisticItem.assignee_notes && (
          <div
            className={`font-reading text-sm mt-1 italic transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-300" : "text-slate-400"}`}
          >
            <span className="text-xs font-medium not-italic text-slate-500">
              Note:{" "}
            </span>
            {optimisticItem.assignee_notes.length > 80
              ? `${optimisticItem.assignee_notes.slice(0, 80)}...`
              : optimisticItem.assignee_notes}
          </div>
        )}
        {dates && optimisticItem.due_date && !isCompleted && !isCancelled && (
          <div
            className={`text-xs mt-1 flex items-center gap-1 ${
              urgency === "overdue"
                ? "text-red-600 font-medium"
                : urgency === "due-soon"
                  ? "text-amber-600"
                  : "text-slate-400"
            }`}
          >
            {urgency === "overdue" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
            {urgency === "overdue" ? "Overdue" : "Due"}{" "}
            {new Date(optimisticItem.due_date + "T00:00:00").toLocaleDateString(
              "en-AU",
              {
                day: "numeric",
                month: "short",
              },
            )}
          </div>
        )}
        {dates &&
          optimisticItem.scheduled_date &&
          !isCompleted &&
          !isCancelled && (
            <div className="text-xs mt-0.5 text-slate-400">
              Scheduled{" "}
              {new Date(
                optimisticItem.scheduled_date + "T00:00:00",
              ).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
              })}
            </div>
          )}
      </div>

      {/* Mobile reorder controls and explicit desktop actions */}
      <div
        className="flex items-center gap-1 lg:w-[17rem] lg:flex-wrap lg:justify-end lg:gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onEdit}
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
          aria-label="Edit task"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Edit
        </button>
        {!isFirst && (
          <button
            type="button"
            className={`tap-target inline-flex size-8 min-h-8 min-w-8 flex-none items-center justify-center rounded-md bg-slate-100 text-slate-700 transition-all duration-200 hover:bg-slate-200 active:scale-95 lg:h-8 lg:w-auto lg:gap-1 lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white lg:px-2.5 lg:text-xs lg:font-semibold lg:hover:border-slate-300 lg:hover:bg-slate-50 ${desktopCanReorder ? "" : "lg:hidden"}`}
            onClick={() => onMove("top")}
            aria-label="Move to top"
          >
            <span aria-hidden="true">⇈</span>
            <span className="hidden lg:inline">Top</span>
          </button>
        )}
        <span
          className="tap-target inline-flex size-8 min-h-8 min-w-8 flex-none cursor-grab items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 active:scale-95 lg:hidden"
          aria-label="Drag to reorder"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            className="block"
          >
            <circle cx="8" cy="7" r="1.4" />
            <circle cx="16" cy="7" r="1.4" />
            <circle cx="8" cy="12" r="1.4" />
            <circle cx="16" cy="12" r="1.4" />
            <circle cx="8" cy="17" r="1.4" />
            <circle cx="16" cy="17" r="1.4" />
          </svg>
        </span>
        {desktopCanReorder && !isFirst && (
          <DesktopActionButton
            label="Move up"
            icon="up"
            onClick={() => onMove("up")}
          />
        )}
        {desktopCanReorder && !isLast && (
          <DesktopActionButton
            label="Move down"
            icon="down"
            onClick={() => onMove("down")}
          />
        )}
        {onDecline && (
          <DesktopActionButton
            label="Decline"
            icon="decline"
            tone="amber"
            onClick={onDecline}
          />
        )}
        {onDelete && (
          <DesktopActionButton
            label="Delete"
            icon="delete"
            tone="danger"
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
}

function DesktopActionButton({
  label,
  icon,
  tone = "default",
  onClick,
}: {
  label: string;
  icon: "up" | "down" | "decline" | "delete";
  tone?: "default" | "amber" | "danger";
  onClick: () => void;
}) {
  const classes =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
  const paths = {
    up: <path d="m18 15-6-6-6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    decline: (
      <>
        <path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 5 5v1" />
      </>
    ),
    delete: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" />
      </>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`hidden h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition lg:inline-flex ${classes}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths[icon]}
      </svg>
      {label}
    </button>
  );
}
