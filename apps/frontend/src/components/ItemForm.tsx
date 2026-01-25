"use client";

import type { Item, Project, RecurrencePreset } from "@/types";
import { RECURRENCE_PRESET_RULES } from "@/types";
import { useState } from "react";
import { ProjectCombobox } from "./ProjectCombobox";

function derivePreset(rule: string | null | undefined): RecurrencePreset {
  if (!rule) return "none";
  for (const [key, value] of Object.entries(RECURRENCE_PRESET_RULES)) {
    if (value === rule) return key as RecurrencePreset;
  }
  return "none";
}

type Props = {
  initial?: Partial<Item>;
  onSubmit: (values: {
    title: string;
    description?: string;
    project_id?: string | null;
    scheduled_date?: string | null;
    due_date?: string | null;
    recurrence_rule?: string | null;
    recurrence_strategy?: string | null;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
  projects?: Project[];
  onCreateProject?: (name: string) => Promise<Project>;
};

export function ItemForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  projects = [],
  onCreateProject,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [projectId, setProjectId] = useState<string | null>(
    initial?.project_id ?? null,
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    initial?.scheduled_date ?? "",
  );
  const [dueDate, setDueDate] = useState<string>(initial?.due_date ?? "");
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>(
    derivePreset(initial?.recurrence_rule),
  );
  const [recurrenceStrategy, setRecurrenceStrategy] = useState<string>(
    initial?.recurrence_strategy ?? "carry_over",
  );
  const [showMoreSettings, setShowMoreSettings] = useState(!!initial); // Open by default for edit mode

  return (
    <form
      className="grid gap-3 animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title,
          description: description || undefined,
          project_id: projectId,
          scheduled_date: scheduledDate || null,
          due_date: dueDate || null,
          recurrence_rule: RECURRENCE_PRESET_RULES[recurrencePreset],
          recurrence_strategy:
            recurrencePreset !== "none" ? recurrenceStrategy : null,
        });
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
            <path
              d="m6 9 6 6 6-6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          More settings
        </button>

        {showMoreSettings && (
          <div className="grid gap-3 mt-3 animate-fade-in">
            {/* Project selector */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Project
              </label>
              <ProjectCombobox
                projects={projects}
                value={projectId}
                onChange={setProjectId}
                onCreateProject={
                  onCreateProject ??
                  (async (name) => {
                    // Fallback if no onCreateProject provided - shouldn't happen in practice
                    throw new Error(
                      `Cannot create project "${name}" - no handler provided`,
                    );
                  })
                }
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Description
              </label>
              <textarea
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none resize-none w-full"
                rows={3}
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Scheduled date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Item will appear on this date. Leave empty for immediate
                visibility.
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Due date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={scheduledDate || undefined}
              />
              <p className="mt-1 text-xs text-slate-400">
                Deadline for this item.
              </p>
            </div>

            {/* Repeat */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Repeat
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                value={recurrencePreset}
                onChange={(e) =>
                  setRecurrencePreset(e.target.value as RecurrencePreset)
                }
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays (Mon–Fri)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* If missed — only shown when repeat is set */}
            {recurrencePreset !== "none" && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  If missed
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                  value={recurrenceStrategy}
                  onChange={(e) => setRecurrenceStrategy(e.target.value)}
                >
                  <option value="carry_over">Carries over until done</option>
                  <option value="expires">Expires if missed</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  {recurrenceStrategy === "expires"
                    ? "Past occurrences are automatically skipped."
                    : "Past occurrences stay overdue until completed."}
                </p>
              </div>
            )}
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
