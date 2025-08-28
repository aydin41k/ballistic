import type { Status } from "@/types";

export const STATUS_CYCLE: Status[] = [
  "pending",
  "done",
  "cancelled",
  "in_progress",
];

export function cycleStatus(current: Status): Status {
  const index = STATUS_CYCLE.indexOf(current);
  const nextIndex = (index + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
}

export function statusToCircleClasses(status: Status): string {
  switch (status) {
    case "pending":
      return "bg-white border border-slate-300 text-slate-300";
    case "done":
      return "bg-green-500 text-white";
    case "cancelled":
      return "bg-red-500 text-white";
    case "in_progress":
      return "bg-yellow-400 text-white";
    default:
      return "bg-white border border-slate-300";
  }
}

export function statusToEmoji(status: Status): string {
  switch (status) {
    case "pending":
      return "";
    case "done":
      return "✅";
    case "cancelled":
      return "—"; // dash
    case "in_progress":
      return "⏳";
  }
}


