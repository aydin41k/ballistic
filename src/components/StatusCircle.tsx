"use client";

import type { Status } from "@/types";

type Props = {
  status: Status;
  onClick: () => void;
  size?: "sm" | "md";
};

export function StatusCircle({ status, onClick, size = "md" }: Props) {
  const dimension = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "pending":
        return (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
      case "done":
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        );
      case "cancelled":
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        );
      case "in_progress":
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
    }
  };

  const getStatusClasses = (status: Status) => {
    switch (status) {
      case "pending":
        return "bg-white border border-slate-300 text-slate-600";
      case "done":
        return "bg-green-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      case "in_progress":
        return "bg-yellow-400 text-white";
      default:
        return "bg-white border border-slate-300 text-slate-600";
    }
  };

  return (
    <button
      type="button"
      aria-label="Toggle status"
      className={`tap-target grid place-items-center rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${dimension} ${getStatusClasses(status)}`}
      onClick={onClick}
    >
      {getStatusIcon(status)}
    </button>
  );
}


