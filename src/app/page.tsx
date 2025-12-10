"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "@/types";
import { fetchItems, createItem, updateItem, deleteItem } from "@/lib/api";
import { ItemRow } from "@/components/ItemRow";
import { EmptyState } from "@/components/EmptyState";
import { ItemForm } from "@/components/ItemForm";
import { useAuth } from "@/contexts/AuthContext";

function normaliseItemResponse(payload: Item | { data?: Item }): Item {
  if (payload && typeof payload === "object" && "data" in payload && (payload as { data?: Item }).data) {
    return (payload as { data: Item }).data;
  }
  return payload as Item;
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch items when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchItems()
        .then(setItems)
        .catch((error) => {
          console.error('Failed to fetch items:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  // Handle scrolling to newly added items
  useEffect(() => {
    if (scrollToItemId) {
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-item-id="${scrollToItemId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setScrollToItemId(null);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [scrollToItemId]);

  const filtered = items;

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
  function onOptimisticReorder(itemId: string, direction: "up" | "down" | "top") {
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
        } else if (direction === "top" && currentIndex > 0) {
          // Move to top - remove from current position and insert at the beginning
          const [item] = newList.splice(currentIndex, 1);
          newList.unshift(item);
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

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleDelete(id: string) {
    // Optimistic delete
    setItems((prev) => prev.filter((item) => item.id !== id));
    setEditing(null);
    
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Failed to delete item:', error);
      // Optionally refetch items to restore state
    }
  }

  // Show loading while checking auth
  if (authLoading || (!isAuthenticated && !authLoading)) {
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
              aria-label="Logout"
              onClick={handleLogout}
              className="tap-target grid h-9 w-9 place-items-center rounded-md bg-white shadow-sm hover:shadow-md active:scale-95"
              title={`Logout ${user?.name || ''}`}
            >
              {/* logout icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" className="text-[var(--navy)]">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                // Use a more unique temporary ID to avoid conflicts
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const optimisticItem: Item = {
                  id: tempId, // Temporary ID
                  user_id: user?.id || "",
                  project_id: null,
                  title: v.title,
                  description: v.description || null,
                  status: "todo",
                  position: items.length,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  deleted_at: null,
                };
                
                // Update UI immediately and close form
                setItems((prev) => {
                  // Ensure we're working with an array and no duplicate IDs
                  if (!Array.isArray(prev)) {
                    return [optimisticItem];
                  }
                  // Check for duplicate IDs before adding
                  const hasDuplicate = prev.some(item => item.id === tempId);
                  if (hasDuplicate) {
                    console.warn('Duplicate ID detected, skipping optimistic item');
                    return prev;
                  }
                  return [...prev, optimisticItem];
                });
                setShowAdd(false);
                
                // Set the item to scroll to
                setScrollToItemId(tempId);
                
                // Send API request in background (fire and forget)
                createItem({
                  title: v.title,
                  description: v.description,
                  status: "todo",
                  position: items.length,
                }).then((created) => {
                  const resolvedItem = normaliseItemResponse(created);
                  // Update the optimistic item with the real item from server
                  setItems((prev) => {
                    if (!Array.isArray(prev)) {
                      return [resolvedItem];
                    }
                    return prev.map((item) => 
                      item.id === tempId ? resolvedItem : item
                    );
                  });
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
          <div key={item.id || `item-${index}`} className="flex flex-col gap-2">
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
                      description: v.description || null,
                    };
                    
                    // Update UI immediately and close edit form
                    setItems((prev) => prev.map((i) => (i.id === item.id ? optimisticUpdate : i)));
                    setEditing(null);
                    
                    // Send API request in background (fire and forget)
                    updateItem(item.id, {
                      title: v.title,
                      description: v.description || null,
                    }).catch((error) => {
                      console.error('Failed to update item:', error);
                      // Keep the optimistic update - user already sees their changes
                      // Optionally show a subtle error notification if needed
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="mt-2 w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
                >
                  Delete task
                </button>
              </div>
            ) : (
              <ItemRow
                item={item}
                onChange={onRowChange}
                onReorder={onReorder}
                onOptimisticReorder={onOptimisticReorder}
                index={index}
                onEdit={() => setEditing(item)}
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
