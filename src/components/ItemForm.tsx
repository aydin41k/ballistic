"use client";

import type { Item } from "@/types";
import { useState } from "react";

type Props = {
  initial?: Partial<Item>;
  onSubmit: (values: { title: string; description?: string }) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export function ItemForm({ initial, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [showMoreSettings, setShowMoreSettings] = useState(!!initial); // Open by default for edit mode

  return (
    <form
      className="grid gap-3 animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, description: description || undefined });
      }}
    >
      {/* Title field - always visible */}
      <input 
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none" 
        placeholder="Task"
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        required 
        autoFocus
      />

      {/* More settings collapsible section */}
      <div className="border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={() => setShowMoreSettings(!showMoreSettings)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="16" 
            height="16" 
            fill="none" 
            stroke="currentColor"
            className={`transition-transform duration-200 ${showMoreSettings ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          More settings
        </button>

        {showMoreSettings && (
          <div className="grid gap-3 mt-3 animate-fade-in">
            <textarea 
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none resize-none" 
              rows={3}
              placeholder="Description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button 
          type="submit" 
          className="flex-1 rounded-md bg-[var(--blue)] px-3 py-2 text-white transition-all duration-200 hover:bg-[var(--blue-600)] active:scale-95 focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
        >
          {submitLabel}
        </button>
        <button 
          type="button" 
          className="flex-1  rounded-md bg-slate-200 px-3 py-2 transition-all duration-200 hover:bg-slate-300 active:scale-95 focus:ring-2 focus:ring-slate-400/20 focus:outline-none" 
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
