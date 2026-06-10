import type { Item, ItemScope, Status, TaskDraft } from "@/types";

import { apiDataRequest, apiRequest } from "./client";

type ListParams = {
  project_id?: string;
  status?: Status | "all";
  scope?: ItemScope;
  assigned_to_me?: boolean;
  delegated?: boolean;
  include_completed?: boolean;
};

export async function fetchItems(params?: ListParams): Promise<Item[]> {
  const items = await apiDataRequest<Item[]>({
    path: "/api/items",
    method: "GET",
    params: {
      project_id: params?.project_id,
      status: params?.status !== "all" ? params?.status : undefined,
      scope: params?.scope,
      assigned_to_me: params?.assigned_to_me ? "true" : undefined,
      delegated: params?.delegated ? "true" : undefined,
      include_completed: params?.include_completed ? "true" : undefined,
    },
    errorMessage: "Unable to load tasks right now.",
  });

  return Array.isArray(items) ? items : [];
}

export async function updateStatus(id: string, status: Status): Promise<Item> {
  return apiDataRequest<Item>({
    path: `/api/items/${id}`,
    method: "PATCH",
    body: { status },
    errorMessage: "Unable to update the task status right now.",
  });
}

export async function createItem(
  payload: TaskDraft & { status: Status; position?: number },
): Promise<Item> {
  return apiDataRequest<Item>({
    path: "/api/items",
    method: "POST",
    body: {
      title: payload.title,
      description: payload.description || null,
      status: payload.status,
      project_id: payload.project_id || null,
      position: payload.position ?? 0,
      scheduled_date: payload.scheduled_date || null,
      due_date: payload.due_date || null,
      recurrence_rule: payload.recurrence_rule || null,
      recurrence_strategy: payload.recurrence_strategy || null,
      assignee_id: payload.assignee_id || null,
    },
    errorMessage: "Unable to create the task right now.",
  });
}

export async function updateItem(
  id: string,
  fields: Partial<
    Pick<
      Item,
      | "title"
      | "description"
      | "assignee_notes"
      | "project_id"
      | "position"
      | "scheduled_date"
      | "due_date"
      | "recurrence_rule"
      | "recurrence_strategy"
      | "assignee_id"
    >
  >,
): Promise<Item> {
  return apiDataRequest<Item>({
    path: `/api/items/${id}`,
    method: "PATCH",
    body: fields,
    errorMessage: "Unable to save the task changes right now.",
  });
}

export async function deleteItem(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/items/${id}`,
    method: "DELETE",
    errorMessage: "Unable to delete the task right now.",
  });
}

export async function reorderItems(
  orderedItems: { id: string; position: number }[],
): Promise<void> {
  if (orderedItems.length === 0) {
    return;
  }

  await apiRequest<void>({
    path: "/api/items/reorder",
    method: "POST",
    body: { items: orderedItems },
    errorMessage: "Unable to reorder tasks right now.",
  });
}
