import type { Status } from "@/types";

export const STATUS_CYCLE: Status[] = ["todo", "done", "wontdo", "doing"];

export function cycleStatus(current: Status): Status {
  const index = STATUS_CYCLE.indexOf(current);
  const nextIndex = (index + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
}

export function statusToCircleClasses(status: Status): string {
  switch (status) {
    case "todo":
      return "bg-white border border-slate-300 text-slate-300";
    case "done":
      return "bg-green-500 text-white";
    case "wontdo":
      return "bg-red-500 text-white";
    case "doing":
      return "bg-yellow-400 text-white";
    default:
      return "bg-white border border-slate-300";
  }
}

export function statusToEmoji(status: Status): string {
  switch (status) {
    case "todo":
      return "";
    case "done":
      return "✅";
    case "wontdo":
      return "—"; // dash
    case "doing":
      return "⏳";
  }
}

export function statusToLabel(status: Status): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "doing":
      return "In Progress";
    case "done":
      return "Done";
    case "wontdo":
      return "Won't Do";
  }
}
