import { NextResponse } from "next/server";
import type { Item, Status } from "@/types";

// Reuse module state from parent route by importing via relative path is not possible.
// So we keep a local registry on the globalThis between route handlers.
const globalStore: { __ballistic_items?: Item[]; __ballistic_items_parent?: Item[] } =
  (globalThis as unknown as typeof globalThis & {
    __ballistic_items?: Item[];
    __ballistic_items_parent?: Item[];
  });
if (!globalStore.__ballistic_items) {
  globalStore.__ballistic_items = [] as Item[];
}

function getStore(): Item[] {
  const parent = globalStore.__ballistic_items_parent as Item[] | undefined;
  const here = globalStore.__ballistic_items as Item[];
  return parent?.length ? parent : here;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const items: Item[] = getStore();
  const { id } = await params;
  const payload = (await request.json()) as Partial<Item> & { status?: Status };
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
  items[idx] = { ...items[idx], ...payload } as Item;
  return NextResponse.json(items[idx]);
}


