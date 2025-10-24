import { NextResponse } from "next/server";
import { store } from "../_store";

const GAS_BASE = process.env.NEXT_PUBLIC_GAS_BASE_URL;

// Helper function to proxy requests to Google Apps Script
async function proxyToGAS(action: string, method: string, body?: Record<string, unknown>, searchParams?: URLSearchParams) {
  if (!GAS_BASE) {
    throw new Error("Google Apps Script base URL not configured");
  }

  const url = new URL(GAS_BASE);
  url.searchParams.set("action", action);
  
  // Add any additional search parameters
  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script request failed: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "list") {
    // If GAS is configured, proxy the request
    if (GAS_BASE) {
      try {
        const data = await proxyToGAS("list", "GET", undefined, searchParams);
        return NextResponse.json(data);
      } catch (error) {
        console.error("GAS proxy failed, falling back to local store:", error);
        // Fall back to local store if GAS fails
      }
    }

    // Map store items to GAS format
    const rows = store.items.map(item => ({
      id: item.id,
      task: item.title,
      project: item.project,
      status: item.status,
      notes: item.notes || "",
      created_at: item.startDate,
      updated_at: new Date().toISOString(),
      due_date: item.dueDate,
    }));

    return NextResponse.json({ rows });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const body = await request.json();

  // If GAS is configured, proxy the request
  if (GAS_BASE) {
    try {
      const data = await proxyToGAS(action!, "POST", body, searchParams);
      
      // For add action, GAS might return incomplete data, so we need to reconstruct the full item
      if (action === "add" && data.id) {
        const fullItem = {
          id: data.id,
          title: body.task,
          project: body.project,
          status: body.status,
          startDate: data.created_at ? data.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          dueDate: body.due_date || new Date().toISOString().slice(0, 10),
          notes: body.notes || "",
        };
        return NextResponse.json(fullItem);
      }
      
      return NextResponse.json(data);
    } catch (error) {
      console.error("GAS proxy failed, falling back to local store:", error);
      // Fall back to local store if GAS fails
    }
  }

  // Local store fallback
  if (action === "add") {
    const newItem = {
      id: String(Date.now()),
      title: body.task,
      project: body.project,
      status: body.status,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: body.due_date || new Date().toISOString().slice(0, 10),
      notes: body.notes || "",
    };

    store.items.unshift(newItem);
    return NextResponse.json(newItem);
  }

  if (action === "update") {
    const itemIndex = store.items.findIndex(item => item.id === body.id);
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (body.deleted) {
      store.items.splice(itemIndex, 1);
      return NextResponse.json({ ok: true });
    }

    if (body.status) {
      store.items[itemIndex].status = body.status;
    }

    if (body.task) {
      store.items[itemIndex].title = body.task;
    }

    if (body.project) {
      store.items[itemIndex].project = body.project;
    }

    if (body.due_date) {
      store.items[itemIndex].dueDate = body.due_date;
    }

    if (body.notes !== undefined) {
      store.items[itemIndex].notes = body.notes;
    }

    return NextResponse.json(store.items[itemIndex]);
  }

  if (action === "move") {
    const itemIndex = store.items.findIndex(item => item.id === body.id);
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (body.direction === "up" && itemIndex > 0) {
      [store.items[itemIndex], store.items[itemIndex - 1]] = [store.items[itemIndex - 1], store.items[itemIndex]];
    } else if (body.direction === "down" && itemIndex < store.items.length - 1) {
      [store.items[itemIndex], store.items[itemIndex + 1]] = [store.items[itemIndex + 1], store.items[itemIndex]];
    } else if (body.direction === "top" && itemIndex > 0) {
      // Remove the item from its current position and insert it at the top
      const [item] = store.items.splice(itemIndex, 1);
      store.items.unshift(item);
    }

    // Return the updated list in GAS format
    const rows = store.items.map(item => ({
      id: item.id,
      task: item.title,
      project: item.project,
      status: item.status,
      notes: item.notes || "",
      created_at: item.startDate,
      updated_at: new Date().toISOString(),
      due_date: item.dueDate,
    }));

    return NextResponse.json({ rows });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: Request) {
  // bulk replace not supported; intentionally left unimplemented
  return NextResponse.json({ message: "Not implemented" }, { status: 405 });
}

export type ReorderBody = { id: string; direction: "up" | "down" | "top" };


