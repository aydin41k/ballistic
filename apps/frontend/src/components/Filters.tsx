"use client";

import type { Status } from "@/types";

type Props = {
  value: {
    query: string;
    project: string;
    status: "all" | Status;
    date: string; // YYYY-MM-DD or ""
  };
  onChange: (next: Props["value"]) => void;
  projects: string[];
};

export function Filters({ value, onChange, projects }: Props) {
  return (
    <div className="grid grid-cols-12 gap-2 pb-2">
      <input
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
        placeholder="Search..."
        className="col-span-12 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
      />
      <select
        value={value.project}
        onChange={(e) => onChange({ ...value, project: e.target.value })}
        className="col-span-5 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        value={value.status}
        onChange={(e) =>
          onChange({
            ...value,
            status: e.target.value as Props["value"]["status"],
          })
        }
        className="col-span-3 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
      >
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="done">Done</option>
        <option value="cancelled">Cancelled</option>
        <option value="in_progress">In progress</option>
      </select>
      <input
        type="date"
        value={value.date}
        onChange={(e) => onChange({ ...value, date: e.target.value })}
        className="col-span-4 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
      />
    </div>
  );
}
