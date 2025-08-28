import { NextResponse } from "next/server";
import type { Status } from "@/types";
import { store } from "../../../_store";

const GAS_BASE = process.env.NEXT_PUBLIC_GAS_BASE_URL;

// Helper function to proxy status updates to Google Apps Script
async function proxyStatusToGAS(id: string, status: Status) {
  if (!GAS_BASE) {
    throw new Error("Google Apps Script base URL not configured");
  }

  const url = new URL(GAS_BASE);
  url.searchParams.set("action", "update");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, status }),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script request failed: ${response.status}`);
  }

  return response.json();
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { status } = (await request.json()) as { status: Status };
  const { id } = await params;

  // If GAS is configured, proxy the request
  if (GAS_BASE) {
    try {
      const data = await proxyStatusToGAS(id, status);
      return NextResponse.json(data);
    } catch (error) {
      console.error("GAS proxy failed, falling back to local store:", error);
      // Fall back to local store if GAS fails
    }
  }

  // Local store fallback
  const index = store.items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
  store.items[index] = { ...store.items[index], status };
  return NextResponse.json(store.items[index]);
}


