import type { Status } from "@/types";

export const STATUS_CYCLE: Status[] = ["todo", "done", "wontdo", "doing"];

export function cycleStatus(current: Status): Status {
  const index = STATUS_CYCLE.indexOf(current);
  const nextIndex = (index + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
}

export function statusLabel(status: Status): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "doing":
      return "Doing";
    case "done":
      return "Done";
    case "wontdo":
      return "Won't Do";
  }
}
