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
  onOptimisticReorder: (itemId: string, direction: "up" | "down") => void;
  index: number;
  onEdit: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export function ItemRow({ item, onChange, onReorder, onOptimisticReorder, index, onEdit, isFirst, isLast }: Props) {
  const [optimisticItem, addOptimistic] = useOptimistic(
    item,
    (currentItem: Item, newStatus: Item["status"]) => ({
      ...currentItem,
      status: newStatus,
    })
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
      console.error('Failed to update status:', error);
      // Optionally show a toast notification or rollback the UI
      // For now, we'll just log the error since the UI is already updated
    });
  }

  async function onMove(direction: "up" | "down") {
    try {
      // Update UI immediately for optimistic reordering
      onOptimisticReorder(item.id, direction);
      
      // Send API request in background
      moveItem(item.id, direction).then((newList) => {
        // Validate the response before updating the parent
        if (Array.isArray(newList) && newList.length > 0) {
          // Update the parent with the actual result from the server
          onReorder(newList);
        } else {
          console.warn('moveItem returned invalid data:', newList);
          // Don't update the parent with invalid data
        }
      }).catch((error) => {
        console.error('Failed to move item:', error);
        // The parent should handle rollback if needed
      });
    } catch (error) {
      console.error('Error during move operation:', error);
      // Don't crash the UI, just log the error
    }
  }

  const isCompleted = optimisticItem.status === "done";
  const isCancelled = optimisticItem.status === "cancelled";

  return (
    <div 
      className={`flex items-center gap-3 rounded-md bg-white p-3 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 animate-slide-in-up cursor-pointer`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onClick={onEdit}
    >
      {/* Status circle */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <StatusCircle status={optimisticItem.status} onClick={onToggle} />
      </div>

      {/* Task details */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-400 line-through" : "text-[var(--navy)]"}`}>
          {optimisticItem.title}
        </div>
        <div className={`text-sm transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-300" : "text-[var(--blue-600)]"}`}>
          {optimisticItem.project}
        </div>
        {optimisticItem.notes && (
          <div className={`text-sm mt-1 transition-colors duration-200 ${isCompleted || isCancelled ? "text-slate-300" : "text-slate-500"}`}>
            {optimisticItem.notes}
          </div>
        )}
      </div>

      {/* Move controls - always visible */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {!isFirst && (
          <button
            className="tap-target rounded-md bg-slate-100 px-2 py-1 text-slate-700 transition-all duration-200 hover:bg-slate-200 active:scale-95"
            onClick={() => onMove("up")}
            aria-label="Move up"
          >
            ↑
          </button>
        )}
        {!isLast && (
          <button
            className="tap-target rounded-md bg-slate-100 px-2 py-1 text-slate-700 transition-all duration-200 hover:bg-slate-200 active:scale-95"
            onClick={() => onMove("down")}
            aria-label="Move down"
          >
            ↓
          </button>
        )}
      </div>
    </div>
  );
}


