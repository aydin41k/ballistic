import { NextResponse } from "next/server";
import { store } from "../../_store";

export async function POST(request: Request) {
  const { id, direction } = (await request.json()) as {
    id: string;
    direction: "up" | "down";
  };

  const index = store.items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const newIndex = direction === "up" ? Math.max(0, index - 1) : Math.min(store.items.length - 1, index + 1);
  if (newIndex === index) return NextResponse.json(store.items);

  const [moved] = store.items.splice(index, 1);
  store.items.splice(newIndex, 0, moved);
  return NextResponse.json(store.items);
}


