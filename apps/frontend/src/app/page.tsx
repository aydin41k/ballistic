"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, Project } from "@/types";
import {
  fetchItems,
  createItem,
  updateItem,
  saveItemOrder,
  fetchProjects,
  createProject,
} from "@/lib/api";
import { ItemRow } from "@/components/ItemRow";
import { EmptyState } from "@/components/EmptyState";
import { ItemForm } from "@/components/ItemForm";
import { SplashScreen } from "@/components/SplashScreen";
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

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [assignedItems, setAssignedItems] = useState<Item[]>([]);
  const [delegatedItems, setDelegatedItems] = useState<Item[]>([]);
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
      Promise.all([
        fetchItems(),
        fetchItems({ assigned_to_me: true }),
        fetchItems({ delegated: true }),
        fetchProjects(),
      ])
        .then(([itemsData, assignedData, delegatedData, projectsData]) => {
          setItems(itemsData);
          setAssignedItems(assignedData);
          setDelegatedItems(delegatedData);
          setProjects(projectsData);
        })
        .catch((error) => {
          console.error("Failed to fetch data:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  // Handle scrolling to newly added items
  useEffect(() => {
    if (scrollToItemId) {
      const timer = setTimeout(() => {
        const element = document.querySelector(
          `[data-item-id="${scrollToItemId}"]`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setScrollToItemId(null);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scrollToItemId]);

  // Combine all items: my tasks, assigned to me, and delegated
  // Assigned items come first, then my tasks, then delegated (tasks I gave to others)
  const allItems = [
    ...assignedItems, // Tasks assigned to me (from others)
    ...items, // My own tasks (not delegated)
    ...delegatedItems, // Tasks I delegated to others
  ];

  function onRowChange(updated: Item) {
    setItems((prev) => {
      if (!Array.isArray(prev)) {
        console.error("Previous items state is not an array:", prev);
        return [];
      }
      return prev.map((i) => (i.id === updated.id ? updated : i));
    });
  }

  function onReorder(nextList: Item[]) {
    // Ensure nextList is an array before setting it
    if (!Array.isArray(nextList)) {
      console.error("onReorder received non-array:", nextList);
      return;
    }
    // Update UI immediately for optimistic reordering
    setItems(nextList.map((item, index) => ({ ...item, position: index })));
  }

  // Optimistic reordering function that updates UI immediately
  function onOptimisticReorder(
    itemId: string,
    direction: "up" | "down" | "top",
  ) {
    setItems((prev) => {
      try {
        // Ensure prev is always an array
        if (!Array.isArray(prev)) {
          console.error("Previous items state is not an array:", prev);
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
          [newList[currentIndex], newList[currentIndex - 1]] = [
            newList[currentIndex - 1],
            newList[currentIndex],
          ];
        } else if (direction === "down" && currentIndex < newList.length - 1) {
          // Swap with next item
          [newList[currentIndex], newList[currentIndex + 1]] = [
            newList[currentIndex + 1],
            newList[currentIndex],
          ];
        } else if (direction === "top" && currentIndex > 0) {
          // Move to top - remove from current position and insert at the beginning
          const [item] = newList.splice(currentIndex, 1);
          newList.unshift(item);
        } else {
          // Invalid move direction for this item
          console.warn(
            `Invalid move direction ${direction} for item at index ${currentIndex}`,
          );
          return prev;
        }

        // Ensure we're returning an array
        if (!Array.isArray(newList)) {
          console.error("Generated newList is not an array:", newList);
          return prev;
        }

        return newList.map((item, index) => ({ ...item, position: index }));
      } catch (error) {
        console.error("Error during optimistic reordering:", error);
        // Return empty array on error to prevent crashes
        return [];
      }
    });
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
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
      if (!Array.isArray(prev)) {
        return [];
      }

      const sourceId = draggingId;

      const ordered =
        sourceId && sourceId !== targetId
          ? reorderList(prev, sourceId, targetId)
          : prev.map((entry, position) => ({ ...entry, position }));

      saveItemOrder(ordered).catch((error) => {
        console.error("Failed to save item order:", error);
      });

      return ordered;
    });

    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;
    dragOverRef.current = null;
  }

  // Show splash screen while checking auth or loading data
  if (authLoading || (!isAuthenticated && !authLoading) || loading) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
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
                  assignee_id: v.assignee_id ?? null,
                  project_id: v.project_id ?? null,
                  title: v.title,
                  description: v.description || null,
                  status: "todo",
                  position: items.length,
                  scheduled_date: null,
                  due_date: null,
                  completed_at: null,
                  recurrence_rule: null,
                  recurrence_parent_id: null,
                  is_recurring_template: false,
                  is_recurring_instance: false,
                  is_assigned: !!v.assignee_id,
                  is_delegated: !!v.assignee_id,
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
                  assignee_id: v.assignee_id,
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
                    // Keep the optimistic item - user already sees their new task
                    // Optionally show a subtle error notification if needed
                  });
              }}
            />
          </div>
        )}

        {/* Task Items */}
        {allItems.map((item, index) => (
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
                    }).catch((error) => {
                      console.error("Failed to update item:", error);
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
                isFirst={index === 0}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDropItem={handleDrop}
                onDragEnd={handleDragEnd}
                draggingId={draggingId}
                dragOverId={dragOverId}
              />
            )}
          </div>
        ))}

        {allItems.length === 0 && !loading && (
          <EmptyState
            type="no-items"
            message="Start your bullet journal journey by adding your first task!"
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-500">
        Psycode Pty. Ltd. © {new Date().getFullYear()}
      </footer>

      {/* Bottom Bar - Glassy style matching top bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-[var(--page-bg)]/95 backdrop-blur border-t border-slate-200/50">
        <div className="mx-auto flex max-w-sm items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => alert("Settings coming soon")}
            className="tap-target grid h-10 w-10 place-items-center rounded-md hover:bg-slate-100 active:scale-95 transition-all duration-200"
          >
            {/* gear icon */}
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
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
            className="tap-target grid h-12 w-12 place-items-center rounded-full bg-[var(--blue)] text-white shadow-md hover:shadow-lg hover:bg-[var(--blue-600)] active:scale-95 transition-all duration-200"
          >
            <span className="sr-only">Add new task...</span>
            <span className="text-2xl leading-none font-light">+</span>
          </button>
          <button
            type="button"
            aria-label="Filter"
            onClick={() => alert("Feature coming soon")}
            className="tap-target grid h-10 w-10 place-items-center rounded-md hover:bg-slate-100 active:scale-95 transition-all duration-200"
          >
            {/* funnel icon */}
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              className="text-[var(--navy)]"
            >
              <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
