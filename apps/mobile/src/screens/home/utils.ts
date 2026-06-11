import type { ActivityLogItem, Item, RecurrencePreset } from "@/types";
import { RECURRENCE_PRESET_RULES } from "@/types";

export type ItemCollections = {
  items: Item[];
  assigned: Item[];
  delegated: Item[];
};

export type TaskUrgency = "none" | "overdue" | "soon" | "upcoming";

function getUrgencyRank(item: Item, today: string, in72hMs: number): number {
  if (!item.due_date) {
    return 4;
  }

  const dueMs = new Date(`${item.due_date}T23:59:59`).getTime();

  if (item.due_date < today) {
    return 1;
  }

  if (dueMs <= in72hMs) {
    return 2;
  }

  return 3;
}

export function getTaskUrgency(item: Item, datesEnabled: boolean): TaskUrgency {
  const completed = item.status === "done" || item.status === "wontdo";

  if (!datesEnabled || !item.due_date || completed) {
    return "none";
  }

  const today = new Date().toISOString().slice(0, 10);
  const dueMs = new Date(`${item.due_date}T23:59:59`).getTime();
  const in72hMs = Date.now() + 72 * 60 * 60 * 1000;

  if (item.due_date < today) {
    return "overdue";
  }

  if (dueMs <= in72hMs) {
    return "soon";
  }

  return "upcoming";
}

export function sortByUrgency(items: Item[]): Item[] {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in72hMs = now.getTime() + 72 * 60 * 60 * 1000;

  return [...items].sort((left, right) => {
    const leftRank = getUrgencyRank(left, today, in72hMs);
    const rightRank = getUrgencyRank(right, today, in72hMs);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.due_date && right.due_date) {
      return left.due_date.localeCompare(right.due_date);
    }

    if (left.due_date) {
      return -1;
    }

    if (right.due_date) {
      return 1;
    }

    return left.position - right.position;
  });
}

export function applyItemUpdate(collections: ItemCollections, item: Item) {
  const patch = (list: Item[]) =>
    list.map((candidate) => (candidate.id === item.id ? item : candidate));

  return {
    items: patch(collections.items),
    assigned: patch(collections.assigned),
    delegated: patch(collections.delegated),
  };
}

export function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function derivePreset(rule: string | null | undefined): RecurrencePreset {
  if (!rule) {
    return "none";
  }

  for (const [key, value] of Object.entries(RECURRENCE_PRESET_RULES)) {
    if (value === rule) {
      return key as RecurrencePreset;
    }
  }

  return "none";
}

export function getActivityTimestamp(item: ActivityLogItem): string {
  return item.activity_at || item.completed_at || item.updated_at;
}

export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function reorderList(
  list: Item[],
  itemId: string,
  direction: "up" | "down" | "top",
): Item[] {
  const next = [...list];
  const index = next.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return list;
  }

  if (direction === "top" && index > 0) {
    const [item] = next.splice(index, 1);
    next.unshift(item);
  } else if (direction === "up" && index > 0) {
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
  } else if (direction === "down" && index < next.length - 1) {
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
  }

  return next.map((item, position) => ({ ...item, position }));
}
