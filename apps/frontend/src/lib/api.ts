import type { Item, ItemScope, Project, Status, StatsResponse } from "@/types";
import { getAuthHeaders, clearToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ListParams = {
  project_id?: string;
  status?: Status | "all";
  scope?: ItemScope;
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
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
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
function buildUrl(
  path: string,
  params?: Record<string, string | undefined>,
): string {
  const baseUrl =
    API_BASE ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000");
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
    scope: params?.scope,
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
  return list.filter(
    (item) => item.status !== "done" && item.status !== "wontdo",
  );
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
  scheduled_date?: string | null;
  due_date?: string | null;
  recurrence_rule?: string | null;
  recurrence_strategy?: string | null;
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
      scheduled_date: payload.scheduled_date || null,
      due_date: payload.due_date || null,
      recurrence_rule: payload.recurrence_rule || null,
      recurrence_strategy: payload.recurrence_strategy || null,
    }),
  });

  const data = await handleResponse<Item | { data?: Item }>(response);
  return extractData(data);
}

/**
 * Bulk-reorder items via the dedicated reorder endpoint.
 * Sends a single POST instead of N individual PATCH requests.
 */
export async function reorderItems(
  orderedItems: { id: string; position: number }[],
): Promise<void> {
  if (orderedItems.length === 0) return;

  const response = await fetch(buildUrl("/api/items/reorder"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ items: orderedItems }),
  });

  await handleResponse<{ message: string }>(response);
}

/**
 * Update an item's fields
 */
export async function updateItem(
  id: string,
  fields: Partial<
    Pick<
      Item,
      | "title"
      | "description"
      | "project_id"
      | "position"
      | "scheduled_date"
      | "due_date"
      | "recurrence_rule"
      | "recurrence_strategy"
    >
  >,
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

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch activity stats (heatmap + category distribution)
 */
export async function fetchStats(params?: {
  from?: string;
  to?: string;
}): Promise<StatsResponse> {
  const url = buildUrl("/api/stats", {
    from: params?.from,
    to: params?.to,
  });

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return handleResponse<StatsResponse>(response);
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all projects for the authenticated user
 */
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(buildUrl("/api/projects"), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const payload = await handleResponse<Project[] | { data?: Project[] }>(
    response,
  );
  const projects = extractData(payload);
  return Array.isArray(projects) ? projects : [];
}

/**
 * Create a new project
 */
export async function createProject(payload: {
  name: string;
  color?: string | null;
}): Promise<Project> {
  const response = await fetch(buildUrl("/api/projects"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: payload.name,
      color: payload.color || null,
    }),
  });

  const data = await handleResponse<Project | { data?: Project }>(response);
  return extractData(data);
}
