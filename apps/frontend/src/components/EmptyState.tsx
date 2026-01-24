"use client";

import { useState, useEffect } from "react";

type Props = {
  type: "no-items" | "no-results" | "loading";
  message?: string;
};

export function EmptyState({ type, message }: Props) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (type === "loading") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [type]);

  const illustrations = {
    "no-items": (
      <div className="mx-auto mb-4 w-24 h-24 text-slate-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      </div>
    ),
    "no-results": (
      <div className="mx-auto mb-4 w-24 h-24 text-slate-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </div>
    ),
    loading: (
      <div className="mx-auto mb-4 w-24 h-24 text-slate-300">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-slate-400 rounded-full animate-spin"></div>
        </div>
      </div>
    ),
  };

  const messages = {
    "no-items": message || "No items yet. Start by adding your first task!",
    "no-results":
      message || "No items match your filters. Try adjusting your search.",
    loading: `Loading${dots}`,
  };

  return (
    <div className="py-16 text-center">
      <div className="animate-fade-in">
        {illustrations[type]}
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          {messages[type]}
        </p>
      </div>
    </div>
  );
}
