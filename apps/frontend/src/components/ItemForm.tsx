"use client";

import type { Item, Project, UserLookup } from "@/types";
import { useState } from "react";
import { ProjectCombobox } from "./ProjectCombobox";
import { AssignModal } from "./AssignModal";

type Props = {
  initial?: Partial<Item>;
  onSubmit: (values: {
    title: string;
    description?: string;
    project_id?: string | null;
    assignee_id?: string | null;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
  projects?: Project[];
  onCreateProject?: (name: string) => Promise<Project>;
  showAssignment?: boolean;
};

export function ItemForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  projects = [],
  onCreateProject,
  showAssignment = true,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [projectId, setProjectId] = useState<string | null>(
    initial?.project_id ?? null,
  );
  const [assignee, setAssignee] = useState<UserLookup | null>(
    initial?.assignee ?? null,
  );
  const [showMoreSettings, setShowMoreSettings] = useState(!!initial); // Open by default for edit mode
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <form
      className="grid gap-3 animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title,
          description: description || undefined,
          project_id: projectId,
          assignee_id: assignee?.id ?? null,
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

            {/* Assign to */}
            {showAssignment && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Assign to
                </label>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="w-full flex items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 hover:border-slate-400 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
                >
                  {assignee ? (
                    <span className="text-slate-700">{assignee.name}</span>
                  ) : (
                    <span className="text-slate-400">Select user...</span>
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-400"
                  >
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSelect={setAssignee}
        currentAssignee={assignee}
      />

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
