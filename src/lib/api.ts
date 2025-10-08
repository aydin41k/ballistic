import type { Item, Status } from "@/types";

const API_BASE = "/api/items";

type ListParams = {
  q?: string;
  status?: Status | "all";
  created_from?: string;
};

function buildUrl(action: string, params?: Record<string, string | undefined>) {
  // Always use local API - the proxy will handle Google Apps Script calls
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set("action", action);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

type GasRow = {
  id?: string;
  task?: string;
  project?: string;
  status?: Status;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  rowNumber?: number;
  [key: string]: string | Status | number | undefined; // Allow additional dynamic columns
};

type GasListResponse = { rows?: GasRow[] };

export async function fetchItems(params?: ListParams): Promise<Item[]> {
  const res = await fetch(
    buildUrl("list", {
      q: params?.q,
      status: params?.status && params.status !== "all" ? params.status : undefined,
      created_from: params?.created_from,
    }),
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch items");
  const data = (await res.json()) as GasListResponse;
  
  // Map GAS response rows to Item with dynamic column mapping and filter out completed/cancelled tasks
  return (data.rows || [])
    .map((r, idx) => ({
      id: r.id || String(r.rowNumber ?? idx + 1),
      title: r.task || "",
      project: r.project || "",
      startDate: r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      dueDate: r.due_date ? r.due_date.slice(0, 10) : r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: r.status || "pending",
      notes: r.notes || "",
    }))
    .filter((item) => item.status !== "done" && item.status !== "cancelled") as Item[];
}

export async function updateStatus(id: string, status: Status): Promise<Item> {
  const res = await fetch(buildUrl("update"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function createItem(payload: Omit<Item, "id">): Promise<Item> {
  const res = await fetch(buildUrl("add"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: payload.title,
      project: payload.project,
      status: payload.status,
      due_date: payload.dueDate,
      notes: payload.notes,
    }),
  });
  if (!res.ok) throw new Error("Failed to create item");
  return res.json();
}

export async function moveItem(id: string, direction: "up" | "down" | "top"): Promise<Item[]> {
  const res = await fetch(buildUrl("move"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, direction }),
  });
  if (!res.ok) throw new Error("Failed to reorder");
  const data = await res.json();
  
  // Handle both GAS format ({ rows: [...] }) and direct Item[] format
  const rows = data.rows || data;
  
  // Ensure rows is an array
  if (!Array.isArray(rows)) {
    console.warn('moveItem received non-array response:', data);
    return [];
  }
  
  // Convert GAS rows back to Item format if needed
  if (rows.length > 0 && rows[0].task !== undefined) {
    // This is GAS format, convert to Item format
    return rows.map((r: GasRow) => ({
      id: r.id || String(Date.now()),
      title: r.task || "",
      project: r.project || "",
      startDate: r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      dueDate: r.due_date ? r.due_date.slice(0, 10) : r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: r.status || "pending",
      notes: r.notes || "",
    })) as Item[];
  }
  
  // Assume it's already in Item format
  return rows as Item[];
}

export async function updateItem(
  id: string,
  fields: Partial<Pick<Item, "title" | "project" | "startDate" | "dueDate">> & { notes?: string }
): Promise<Item> {
  const res = await fetch(buildUrl("update"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      task: fields.title,
      project: fields.project,
      due_date: fields.dueDate,
      notes: (fields as { notes?: string }).notes,
    }),
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}

export async function deleteItem(id: string): Promise<{ ok: true }> {
  const res = await fetch(buildUrl("update"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, deleted: true }),
  });
  if (!res.ok) throw new Error("Failed to delete item");
  return { ok: true };
}


