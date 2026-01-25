"use client";

import { cycleStatus } from "@/lib/status";
import { updateStatus, moveItem } from "@/lib/api";
import type { Item } from "@/types";
import { useOptimistic, startTransition } from "react";
import { StatusCircle } from "./StatusCircle";

type Props = {
  item: Item;
  onChange: (item: Item) => void;
  onReorder: (items: Item[]) => void;
  onOptimisticReorder: (
    itemId: string,
    direction: "up" | "down" | "top",
  ) => void;
  index: number;
  onEdit: () => void;
  isFirst: boolean;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDropItem: (id: string) => void;
  onDragEnd: () => void;
  draggingId: string | null;
  dragOverId: string | null;
};

export function ItemRow({
  item,
  onChange,
  onReorder,
  onOptimisticReorder,
  index,
  onEdit,
  isFirst,
  onDragStart,
  onDragEnter,
  onDropItem,
  onDragEnd,
  draggingId,
  dragOverId,
}: Props) {
  const [optimisticItem, addOptimistic] = useOptimistic(
    item,
    (currentItem: Item, newStatus: Item["status"]) => ({
      ...currentItem,
      status: newStatus,
    }),
  );

  async function onToggle() {
    const nextStatus = cycleStatus(optimisticItem.status);

    // Update UI immediately (optimistic update)
    startTransition(() => {
      addOptimistic(nextStatus);
    });

    // Also update the parent state immediately for immediate UI feedback
    onChange({
      ...item,
      status: nextStatus,
    });

    // Send API request in background (fire and forget)
    updateStatus(item.id, nextStatus).catch((error) => {
      console.error("Failed to update status:", error);
      // Optionally show a toast notification or rollback the UI
      // For now, we'll just log the error since the UI is already updated
    });
  }

  async function onMove(direction: "up" | "down" | "top") {
    try {
      // Update UI immediately for optimistic reordering
      onOptimisticReorder(item.id, direction);

      // Send API request in background
      moveItem(item.id, direction)
        .then((newList) => {
          // Validate the response before updating the parent
          if (Array.isArray(newList) && newList.length > 0) {
            // Update the parent with the actual result from the server
            onReorder(newList);
          } else {
            console.warn("moveItem returned invalid data:", newList);
            // Don't update the parent with invalid data
          }
        })
        .catch((error) => {
          console.error("Failed to move item:", error);
          // The parent should handle rollback if needed
        });
    } catch (error) {
      console.error("Error during move operation:", error);
      // Don't crash the UI, just log the error
    }
  }

  const isCompleted = optimisticItem.status === "done";
  const isCancelled = optimisticItem.status === "wontdo";

  // Get project name from nested project object if available
  const projectName = optimisticItem.project?.name || null;
  const isDragging = draggingId === item.id;
  const isDragOver = dragOverId === item.id && draggingId !== item.id;

  return (
    <div
      data-item-id={item.id}
      className={`flex items-center gap-3 rounded-md bg-white p-3 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 animate-slide-in-up cursor-pointer ${isDragging ? "scale-105 shadow-xl ring-2 ring-[var(--blue)]/40 bg-blue-50/50 z-50" : ""} ${isDragOver ? "ring-2 ring-[var(--blue)]/60 bg-blue-50/30" : ""}`}
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
          className={`font-medium transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-400 line-through" : "text-[var(--navy)]"}`}
        >
          {optimisticItem.title}
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
          {optimisticItem.is_delegated && optimisticItem.assignee && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-200 ${isCompleted || isCancelled ? "bg-slate-100 text-slate-300" : "bg-amber-100 text-amber-700 border border-amber-200"}`}
            >
              → {optimisticItem.assignee.name}
            </span>
          )}
          {optimisticItem.is_assigned &&
            !optimisticItem.is_delegated &&
            optimisticItem.owner && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-200 ${isCompleted || isCancelled ? "bg-slate-100 text-slate-300" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
              >
                ← {optimisticItem.owner.name}
              </span>
            )}
        </div>
      </div>

      {/* Move controls - always visible */}
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {!isFirst && (
          <button
            className="tap-target rounded-md bg-slate-100 px-2 py-1 text-slate-700 transition-all duration-200 hover:bg-slate-200 active:scale-95"
            onClick={() => onMove("top")}
            aria-label="Move to top"
          >
            ⇈
          </button>
        )}
        <span
          className="tap-target rounded-md bg-slate-100 px-2 py-1 text-slate-700 transition-all duration-200 hover:bg-slate-200 active:scale-95 cursor-grab"
          aria-label="Drag to reorder"
        >
          ☰
        </span>
      </div>
    </div>
  );
}
