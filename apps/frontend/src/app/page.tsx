"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, ItemScope, Project } from "@/types";
import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  fetchProjects,
  createProject,
} from "@/lib/api";
import { ItemRow } from "@/components/ItemRow";
import { EmptyState } from "@/components/EmptyState";
import { ItemForm } from "@/components/ItemForm";
import { useAuth } from "@/contexts/AuthContext";

function normaliseItemResponse(payload: Item | { data?: Item }): Item {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: Item }).data
  ) {
    return (payload as { data: Item }).data;
  }
  return payload as Item;
}

function getUrgencyRank(item: Item, todayStr: string, in72hMs: number): number {
  if (!item.due_date) return 4; // No deadline = lowest priority

  const dueMs = new Date(item.due_date + "T23:59:59").getTime();

  if (item.due_date < todayStr) return 1; // Overdue
  if (dueMs <= in72hMs) return 2; // Due within 72 hours
  return 3; // Has deadline, not urgent yet
}

function sortByUrgency(items: Item[]): Item[] {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const in72hMs = now.getTime() + 72 * 60 * 60 * 1000;

  return [...items].sort((a, b) => {
    const urgencyA = getUrgencyRank(a, todayStr, in72hMs);
    const urgencyB = getUrgencyRank(b, todayStr, in72hMs);

    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB; // Lower rank = higher priority
    }

    // Within the same urgency tier, sort by due_date ascending (nearest deadline first)
    if (a.due_date && b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    // Finally, fall back to position
    return a.position - b.position;
  });
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceRef = useRef<string | null>(null);
  const dragOverRef = useRef<string | null>(null);
  const dropHandledRef = useRef(false);
  const [viewScope, setViewScope] = useState<ItemScope>("active");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch items and projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([fetchItems({ scope: viewScope }), fetchProjects()])
        .then(([itemsData, projectsData]) => {
          setItems(itemsData);
          setProjects(projectsData);
        })
        .catch((error) => {
          console.error("Failed to fetch data:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, viewScope]);

  // Handle scrolling to newly added items
  useEffect(() => {
    if (scrollToItemId) {
      const timer = setTimeout(() => {
        const element = document.querySelector(
          `[data-item-id="${CSS.escape(scrollToItemId)}"]`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setScrollToItemId(null);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scrollToItemId]);

  const filtered = sortByUrgency(items);

  function onRowChange(itemOrUpdater: Item | ((current: Item) => Item)) {
    setItems((prev) => {
      if (!Array.isArray(prev)) return [];
      if (typeof itemOrUpdater === "function") {
        return prev.map(itemOrUpdater);
      }
      return prev.map((i) => (i.id === itemOrUpdater.id ? itemOrUpdater : i));
    });
  }

  // Optimistic reordering function that updates UI immediately and persists via bulk API
  function onOptimisticReorder(
    itemId: string,
    direction: "up" | "down" | "top",
  ) {
    setItems((prev) => {
      if (!Array.isArray(prev)) return [];

      const currentIndex = prev.findIndex((item) => item.id === itemId);
      if (currentIndex === -1) return prev;

      const newList = [...prev];
      if (direction === "up" && currentIndex > 0) {
        [newList[currentIndex], newList[currentIndex - 1]] = [
          newList[currentIndex - 1],
          newList[currentIndex],
        ];
      } else if (direction === "down" && currentIndex < newList.length - 1) {
        [newList[currentIndex], newList[currentIndex + 1]] = [
          newList[currentIndex + 1],
          newList[currentIndex],
        ];
      } else if (direction === "top" && currentIndex > 0) {
        const [item] = newList.splice(currentIndex, 1);
        newList.unshift(item);
      } else {
        return prev;
      }

      const ordered = newList.map((item, index) => ({
        ...item,
        position: index,
      }));

      // Persist via single bulk reorder call
      reorderItems(
        ordered.map((item, i) => ({ id: item.id, position: i })),
      ).catch((error) => {
        console.error("Failed to persist reorder:", error);
        setItems(prev);
        showError("Failed to reorder. Changes reverted.");
      });

      return ordered;
    });
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleDelete(id: string) {
    const deletedItem = items.find((item) => item.id === id);

    // Optimistic delete
    setItems((prev) => prev.filter((item) => item.id !== id));
    setEditing(null);

    try {
      await deleteItem(id);
    } catch (error) {
      console.error("Failed to delete item:", error);
      if (deletedItem) {
        setItems((prev) =>
          [...prev, deletedItem].sort((a, b) => a.position - b.position),
        );
      }
      showError("Failed to delete task. It has been restored.");
    }
  }

  async function handleCreateProject(name: string): Promise<Project> {
    const newProject = await createProject({ name });
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }

  function reorderList(
    list: Item[],
    sourceId: string,
    targetId: string,
  ): Item[] {
    const current = [...list];
    const fromIndex = current.findIndex((entry) => entry.id === sourceId);
    const toIndex = current.findIndex((entry) => entry.id === targetId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return current;
    }

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);

    return current.map((entry, position) => ({ ...entry, position }));
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
    setDragOverId(id);
    dragSourceRef.current = id;
    dragOverRef.current = id;
  }

  function handleDragEnter(id: string) {
    setDragOverId(id);
    dragOverRef.current = id;
  }

  function handleDragEnd() {
    if (dropHandledRef.current) {
      dropHandledRef.current = false;
      setDraggingId(null);
      setDragOverId(null);
      dragSourceRef.current = null;
      dragOverRef.current = null;
      return;
    }

    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;
    dragOverRef.current = null;
  }

  function handleDrop(targetId: string) {
    dropHandledRef.current = true;

    setItems((prev) => {
      if (!Array.isArray(prev)) return [];

      const sourceId = draggingId;

      const ordered =
        sourceId && sourceId !== targetId
          ? reorderList(prev, sourceId, targetId)
          : prev.map((entry, position) => ({ ...entry, position }));

      // Persist via single bulk reorder call
      reorderItems(
        ordered.map((item, i) => ({ id: item.id, position: i })),
      ).catch((error) => {
        console.error("Failed to persist reorder:", error);
        setItems(prev);
        showError("Failed to reorder. Changes reverted.");
      });

      return ordered;
    });

    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;
    dragOverRef.current = null;
  }

  // Show loading while checking auth
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex flex-col gap-3">
        <header className="sticky top-0 z-10 -mx-4 bg-[var(--page-bg)]/95 px-4 pb-2 pt-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[var(--navy)]">
              Ballistic
              <br />
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
              Ballistic
              <br />
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
    <div className="flex flex-col gap-3 pb-24">
      {/* Error toast */}
      {toast && (
        <div className="fixed top-4 inset-x-4 z-30 mx-auto max-w-md animate-fade-in">
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-lg">
            <span className="flex-1">{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
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
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 -mx-4 bg-[var(--page-bg)]/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--navy)]">
            Ballistic
            <br />
            <small>The Simplest Bullet Journal</small>
          </h1>
          <button
            type="button"
            aria-label="Logout"
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                handleLogout();
              }
            }}
            className="tap-target grid h-9 w-9 place-items-center rounded-md bg-white shadow-sm hover:shadow-md active:scale-95"
            title={`Logout ${user?.name || ""}`}
          >
            {/* logout icon */}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              className="text-[var(--navy)]"
            >
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Planned view banner */}
      {viewScope === "planned" && (
        <div className="flex items-center justify-between rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-700 border border-sky-200">
          <span>Showing planned items (future scheduled dates)</span>
          <button
            type="button"
            onClick={() => setViewScope("active")}
            className="text-xs font-medium text-sky-600 hover:text-sky-800 underline"
          >
            Back to active
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {showAdd && (
          <div className="rounded-md bg-white p-3 shadow-sm animate-scale-in">
            <ItemForm
              submitLabel="Add"
              onCancel={() => setShowAdd(false)}
              projects={projects}
              onCreateProject={handleCreateProject}
              onSubmit={async (v) => {
                // Create optimistic item for immediate UI feedback
                // Use a more unique temporary ID to avoid conflicts
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const selectedProject = v.project_id
                  ? projects.find((p) => p.id === v.project_id)
                  : null;
                const optimisticItem: Item = {
                  id: tempId, // Temporary ID
                  user_id: user?.id || "",
                  project_id: v.project_id ?? null,
                  title: v.title,
                  description: v.description || null,
                  status: "todo",
                  position: items.length,
                  scheduled_date: v.scheduled_date ?? null,
                  due_date: v.due_date ?? null,
                  completed_at: null,
                  recurrence_rule: v.recurrence_rule ?? null,
                  recurrence_parent_id: null,
                  recurrence_strategy:
                    (v.recurrence_strategy as Item["recurrence_strategy"]) ??
                    null,
                  is_recurring_template: !!v.recurrence_rule,
                  is_recurring_instance: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  deleted_at: null,
                  project: selectedProject ?? null,
                };

                // Update UI immediately and close form
                setItems((prev) => {
                  // Ensure we're working with an array and no duplicate IDs
                  if (!Array.isArray(prev)) {
                    return [optimisticItem];
                  }
                  // Check for duplicate IDs before adding
                  const hasDuplicate = prev.some((item) => item.id === tempId);
                  if (hasDuplicate) {
                    console.warn(
                      "Duplicate ID detected, skipping optimistic item",
                    );
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
                  project_id: v.project_id,
                  position: items.length,
                  scheduled_date: v.scheduled_date,
                  due_date: v.due_date,
                  recurrence_rule: v.recurrence_rule,
                  recurrence_strategy: v.recurrence_strategy,
                })
                  .then((created) => {
                    const resolvedItem = normaliseItemResponse(created);
                    // Update the optimistic item with the real item from server
                    setItems((prev) => {
                      if (!Array.isArray(prev)) {
                        return [resolvedItem];
                      }
                      return prev.map((item) =>
                        item.id === tempId ? resolvedItem : item,
                      );
                    });
                  })
                  .catch((error) => {
                    console.error("Failed to create item:", error);
                    setItems((prev) =>
                      prev.filter((item) => item.id !== tempId),
                    );
                    showError("Failed to create task. Please try again.");
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
                  projects={projects}
                  onCreateProject={handleCreateProject}
                  onSubmit={async (v) => {
                    // Create optimistic update for immediate UI feedback
                    const selectedProject = v.project_id
                      ? projects.find((p) => p.id === v.project_id)
                      : null;
                    const optimisticUpdate: Item = {
                      ...item,
                      title: v.title,
                      description: v.description || null,
                      project_id: v.project_id ?? null,
                      project: selectedProject ?? null,
                      scheduled_date: v.scheduled_date ?? null,
                      due_date: v.due_date ?? null,
                      recurrence_rule: v.recurrence_rule ?? null,
                      recurrence_strategy:
                        (v.recurrence_strategy as Item["recurrence_strategy"]) ??
                        null,
                      is_recurring_template: !!v.recurrence_rule,
                    };

                    // Update UI immediately and close edit form
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id ? optimisticUpdate : i,
                      ),
                    );
                    setEditing(null);

                    // Send API request in background (fire and forget)
                    updateItem(item.id, {
                      title: v.title,
                      description: v.description || null,
                      project_id: v.project_id,
                      scheduled_date: v.scheduled_date,
                      due_date: v.due_date,
                      recurrence_rule: v.recurrence_rule,
                      recurrence_strategy:
                        (v.recurrence_strategy as Item["recurrence_strategy"]) ??
                        null,
                    }).catch((error) => {
                      console.error("Failed to update item:", error);
                      setItems((prev) =>
                        prev.map((i) => (i.id === item.id ? item : i)),
                      );
                      showError("Failed to update task. Changes reverted.");
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
                onOptimisticReorder={onOptimisticReorder}
                index={index}
                onEdit={() => setEditing(item)}
                isFirst={index === 0}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDropItem={handleDrop}
                onDragEnd={handleDragEnd}
                draggingId={draggingId}
                dragOverId={dragOverId}
                onError={showError}
              />
            )}
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <EmptyState
            type={items.length === 0 ? "no-items" : "no-results"}
            message={
              items.length === 0
                ? "Start your bullet journal journey by adding your first task!"
                : undefined
            }
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-500">
        Psycode Pty. Ltd. © {new Date().getFullYear()}
      </footer>

      {/* Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur h-12">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => alert("Settings coming soon")}
            className="tap-target grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm hover:shadow-md active:scale-95"
          >
            {/* gear icon */}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              className="text-[var(--navy)]"
            >
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.4 7.4 0 0 0-.1-1l2.1-1.6-2-3.4-2.5 1a7.6 7.6 0 0 0-1.7-1l-.4-2.6H9.2L8.8 6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.4 2.1 1.6a7.4 7.4 0 0 0 0 2L2.6 14l2 3.4 2.5-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h5.6l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.4-2.1-1.6c.1-.3.1-.7.1-1Z"
                strokeWidth="1.4"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Add a new task"
            onClick={() => setShowAdd(true)}
            className="tap-target grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-sky-600 to-gray-600 text-white shadow-xl hover:shadow-2xl active:scale-95"
          >
            <span className="sr-only">Add new task...</span>
            <span className="text-3xl leading-none">+</span>
          </button>
          <button
            type="button"
            aria-label={
              viewScope === "planned"
                ? "Show active items"
                : "Show planned items"
            }
            onClick={() =>
              setViewScope(viewScope === "active" ? "planned" : "active")
            }
            className={`tap-target grid h-11 w-11 place-items-center rounded-full shadow-sm hover:shadow-md active:scale-95 ${viewScope === "planned" ? "bg-[var(--blue)] text-white" : "bg-white"}`}
          >
            {/* funnel icon */}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              className={
                viewScope === "planned" ? "text-white" : "text-[var(--navy)]"
              }
            >
              <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
