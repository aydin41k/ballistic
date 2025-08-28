"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, Status } from "@/types";
import { fetchItems } from "@/lib/api";
import { ItemRow } from "@/components/ItemRow";
import { createItem, updateItem, deleteItem } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { ItemForm } from "@/components/ItemForm";

type Filter = { query: string; project: string; status: "all" | Status; startDate: string };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<Filter>({ query: "", project: "", status: "all", startDate: "" });
  const [editing, setEditing] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchItems({
      q: filters.query || undefined,
      status: filters.status,
      created_from: filters.startDate || undefined,
    })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters.query, filters.status, filters.startDate]);

  const projects = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return Array.from(new Set(items.map((i) => i.project))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((i) => {
      if (filters.project && i.project !== filters.project) return false;
      if (filters.status !== "all" && i.status !== filters.status) return false;
      if (filters.startDate && i.startDate !== filters.startDate) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!i.title.toLowerCase().includes(q) && !i.project.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function onRowChange(updated: Item) {
    setItems((prev) => {
      if (!Array.isArray(prev)) {
        console.error('Previous items state is not an array:', prev);
        return [];
      }
      return prev.map((i) => (i.id === updated.id ? updated : i));
    });
  }

  function onReorder(nextList: Item[]) {
    // Ensure nextList is an array before setting it
    if (!Array.isArray(nextList)) {
      console.error('onReorder received non-array:', nextList);
      return;
    }
    // Update UI immediately for optimistic reordering
    setItems(nextList);
  }

  // Optimistic reordering function that updates UI immediately
  function onOptimisticReorder(itemId: string, direction: "up" | "down") {
    setItems((prev) => {
      try {
        // Ensure prev is always an array
        if (!Array.isArray(prev)) {
          console.error('Previous items state is not an array:', prev);
          return [];
        }
        
        const currentIndex = prev.findIndex((item) => item.id === itemId);
        if (currentIndex === -1) {
          console.warn(`Item with id ${itemId} not found for reordering`);
          return prev;
        }

        const newList = [...prev];
        if (direction === "up" && currentIndex > 0) {
          // Swap with previous item
          [newList[currentIndex], newList[currentIndex - 1]] = [newList[currentIndex - 1], newList[currentIndex]];
        } else if (direction === "down" && currentIndex < newList.length - 1) {
          // Swap with next item
          [newList[currentIndex], newList[currentIndex + 1]] = [newList[currentIndex + 1], newList[currentIndex]];
        } else {
          // Invalid move direction for this item
          console.warn(`Invalid move direction ${direction} for item at index ${currentIndex}`);
          return prev;
        }
        
        // Ensure we're returning an array
        if (!Array.isArray(newList)) {
          console.error('Generated newList is not an array:', newList);
          return prev;
        }
        
        return newList;
      } catch (error) {
        console.error('Error during optimistic reordering:', error);
        // Return empty array on error to prevent crashes
        return [];
      }
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <header className="sticky top-0 z-10 -mx-4 bg-[var(--page-bg)]/95 px-4 pb-2 pt-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[var(--navy)]">
              Ballistic<br/>
              <small>The Simplest Bullet Journal</small>
            </h1>
            
            <div className="w-16 h-9 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
        </header>
        <EmptyState type="loading" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <header className="sticky top-0 z-10 -mx-4 bg-[var(--page-bg)]/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--navy)]">
            Ballistic<br/>
            <small>The Simplest Bullet Journal</small>
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Filter"
              onClick={() => alert('Feature coming soon')}
              className="tap-target grid h-9 w-9 place-items-center rounded-md bg-white shadow-sm hover:shadow-md active:scale-95"
            >
              {/* funnel icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" className="text-[var(--navy)]">
                <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" strokeWidth="1.5"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label="Settings"
              onClick={() => alert('Feature coming soon')}
              className="tap-target grid h-9 w-9 place-items-center rounded-md bg-white shadow-sm hover:shadow-md active:scale-95"
            >
              {/* gear icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" className="text-[var(--navy)]">
                <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 4a6.94 6.94 0 01-.14 1.4l2.06 1.6-2 3.46-2.46-1a7.03 7.03 0 01-2.02 1.17l-.37 2.62H9.99l-.37-2.62a7.03 7.03 0 01-2.02-1.17l-2.46 1-2-3.46 2.06-1.6A6.94 6.94 0 013.06 12c0-.47.05-.94.14-1.4L1.14 9l2-3.46 2.46 1A7.03 7.03 0 017.62 5.4L7.99 2.78h4.02l.37 2.62c.71.25 1.38.63 2.02 1.17l2.46-1 2 3.46-2.06 1.6c.09.46.14.93.14 1.37z" strokeWidth="1"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* List */}
      <div className="flex flex-col gap-2">
        {/* Quick Add Row */}
        <button
          type="button"
          aria-label="Add a new task"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 rounded-md bg-white p-3 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[var(--navy)] text-[var(--navy)] text-xl font-semibold">+</span>
          <span className="text-slate-500">Add new task...</span>
        </button>

        {showAdd && (
          <div className="rounded-md bg-white p-3 shadow-sm animate-scale-in">
            <ItemForm
              submitLabel="Add"
              onCancel={() => setShowAdd(false)}
              onSubmit={async (v) => {
                // Create optimistic item for immediate UI feedback
                const optimisticItem: Item = {
                  id: `temp-${Date.now()}`, // Temporary ID
                  title: v.title,
                  project: v.project || projects[0] || "General",
                  startDate: v.startDate,
                  dueDate: v.dueDate,
                  status: "pending",
                  notes: v.notes,
                };
                
                // Update UI immediately and close form
                setItems((prev) => [optimisticItem, ...prev]);
                setShowAdd(false);
                
                // Send API request in background (fire and forget)
                createItem({
                  title: v.title,
                  project: v.project || projects[0] || "General",
                  startDate: v.startDate,
                  dueDate: v.dueDate,
                  status: "pending",
                  notes: v.notes,
                } as unknown as Omit<Item, "id">).then((created) => {
                  // Update the optimistic item with the real ID from server
                  setItems((prev) => prev.map((item) => 
                    item.id === optimisticItem.id ? { ...created, id: created.id } : item
                  ));
                }).catch((error) => {
                  console.error('Failed to create item:', error);
                  // Keep the optimistic item - user already sees their new task
                  // Optionally show a subtle error notification if needed
                });
              }}
            />
          </div>
        )}

        {/* Task Items */}
        {filtered.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-2">
            {editing?.id === item.id ? (
              <div className="rounded-md bg-white p-3 shadow-sm animate-scale-in">
                <ItemForm
                  initial={item}
                  onCancel={() => setEditing(null)}
                  onSubmit={async (v) => {
                    // Create optimistic update for immediate UI feedback
                    const optimisticUpdate: Item = {
                      ...item,
                      title: v.title,
                      project: v.project,
                      startDate: v.startDate,
                      dueDate: v.dueDate,
                      notes: v.notes,
                    };
                    
                    // Update UI immediately and close edit form
                    setItems((prev) => prev.map((i) => (i.id === item.id ? optimisticUpdate : i)));
                    setEditing(null);
                    
                    // Send API request in background (fire and forget)
                    updateItem(item.id, {
                      title: v.title,
                      project: v.project,
                      startDate: v.startDate,
                      dueDate: v.dueDate,
                      notes: v.notes,
                    }).catch((error) => {
                      console.error('Failed to update item:', error);
                      // Keep the optimistic update - user already sees their changes
                      // Optionally show a subtle error notification if needed
                    });
                  }}
                />
              </div>
            ) : (
              <ItemRow
                item={item}
                onChange={onRowChange}
                onReorder={onReorder}
                onOptimisticReorder={onOptimisticReorder}
                index={index}
                onEdit={() => setEditing(item)}
                onDelete={async () => {
                  // Remove item from UI immediately for optimistic feedback
                  setItems((prev) => prev.filter((i) => i.id !== item.id));
                  
                  // Send API request in background
                  deleteItem(item.id).then(() => {
                    // Item already removed from UI, no further action needed
                  }).catch((error) => {
                    console.error('Failed to delete item:', error);
                    // Restore item to UI on failure
                    setItems((prev) => [...prev, item]);
                    // Optionally show error message to user
                  });
                }}
                isFirst={index === 0}
                isLast={index === filtered.length - 1}
              />
            )}
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <EmptyState 
            type={items.length === 0 ? "no-items" : "no-results"}
            message={items.length === 0 ? "Start your bullet journal journey by adding your first task!" : undefined}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-500">
        Psycode Pty. Ltd. © 2025
      </footer>
    </div>
  );
}
