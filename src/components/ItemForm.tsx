"use client";

import type { Item } from "@/types";
import { useState } from "react";

type Props = {
  initial?: Partial<Item>;
  onSubmit: (values: { title: string; project: string; startDate: string; dueDate: string; notes?: string }) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export function ItemForm({ initial, onSubmit, onCancel, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [project, setProject] = useState(initial?.project ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState((initial as { notes?: string } | undefined)?.notes ?? "");
  const [showMoreSettings, setShowMoreSettings] = useState(!!initial); // Open by default for edit mode

  return (
    <form
      className="grid gap-3 animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, project, startDate, dueDate, notes });
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
            <input 
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none" 
              placeholder="Project"
              value={project} 
              onChange={(e) => setProject(e.target.value)} 
            />
            
            <div className="grid grid-cols-2 gap-2 hidden">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 hidden">Due Date</label>
                <input 
                  type="date" 
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
            </div>

            <textarea 
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none resize-none" 
              rows={3}
              placeholder="Notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button 
          type="submit" 
          className="rounded-md bg-[var(--blue)] px-3 py-2 text-white transition-all duration-200 hover:bg-[var(--blue-600)] active:scale-95 focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
        >
          {submitLabel}
        </button>
        <button 
          type="button" 
          className="rounded-md bg-slate-200 px-3 py-2 transition-all duration-200 hover:bg-slate-300 active:scale-95 focus:ring-2 focus:ring-slate-400/20 focus:outline-none" 
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


