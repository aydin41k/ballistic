import type { Item, Status } from "@/types";
import { getAuthHeaders, clearToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ListParams = {
  project_id?: string;
  status?: Status | "all";
};

/**
 * Handle API response and check for auth errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Token expired or invalid - clear it and redirect to login
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorised");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Some endpoints wrap the payload in a { data } envelope.
 * Normalise responses so callers always receive the entity directly.
 */
function extractData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const unwrapped = (payload as { data?: T }).data;
    if (unwrapped !== undefined && unwrapped !== null) {
      return unwrapped;
    }
  }
  return payload as T;
}

/**
 * Build a URL for API requests
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const baseUrl = API_BASE || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const url = new URL(path, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}

/**
 * Fetch all items for the authenticated user
 */
export async function fetchItems(params?: ListParams): Promise<Item[]> {
  const url = buildUrl("/api/items", {
    project_id: params?.project_id,
    status: params?.status !== "all" ? params?.status : undefined,
  });

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const payload = await handleResponse<Item[] | { data?: Item[] }>(response);
  const items = extractData(payload);
  const list = Array.isArray(items) ? items : [];
  
  // Filter out completed/cancelled tasks for the main view
  return list.filter((item) => item.status !== "done" && item.status !== "wontdo");
}

/**
 * Update an item's status
 */
export async function updateStatus(id: string, status: Status): Promise<Item> {
  const response = await fetch(buildUrl(`/api/items/${id}`), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const payload = await handleResponse<Item | { data?: Item }>(response);
  return extractData(payload);
}

/**
 * Create a new item
 */
export async function createItem(payload: {
  title: string;
  description?: string;
  status: Status;
  project_id?: string | null;
  position?: number;
}): Promise<Item> {
  const response = await fetch(buildUrl("/api/items"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: payload.title,
      description: payload.description || null,
      status: payload.status,
      project_id: payload.project_id || null,
      position: payload.position ?? 0,
    }),
  });

  const data = await handleResponse<Item | { data?: Item }>(response);
  return extractData(data);
}

/**
 * Move an item (reorder)
 * Note: The backend uses position field, so we need to calculate new positions
 */
export async function moveItem(id: string, direction: "up" | "down" | "top"): Promise<Item[]> {
  // For now, we'll fetch the current list and recalculate positions client-side
  // In a more robust implementation, the backend would handle this
  const items = await fetchItems();
  const currentIndex = items.findIndex((item) => item.id === id);
  
  if (currentIndex === -1) {
    return items;
  }

  const newItems = [...items];
  
  if (direction === "up" && currentIndex > 0) {
    [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]];
  } else if (direction === "down" && currentIndex < newItems.length - 1) {
    [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
  } else if (direction === "top" && currentIndex > 0) {
    const [item] = newItems.splice(currentIndex, 1);
    newItems.unshift(item);
  }

  // Update positions on the backend
  await Promise.all(
    newItems.map((item, index) => 
      fetch(buildUrl(`/api/items/${item.id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ position: index }),
      })
    )
  );

  return newItems;
}

/**
 * Update an item's fields
 */
export async function updateItem(
  id: string,
  fields: Partial<Pick<Item, "title" | "description" | "project_id" | "position">>
): Promise<Item> {
  const response = await fetch(buildUrl(`/api/items/${id}`), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(fields),
  });

  const payload = await handleResponse<Item | { data?: Item }>(response);
  return extractData(payload);
}

/**
 * Delete an item
 */
export async function deleteItem(id: string): Promise<{ ok: true }> {
  const response = await fetch(buildUrl(`/api/items/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await handleResponse<void>(response);
  return { ok: true };
}
