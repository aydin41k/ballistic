"use client";

import type { CategoryDistribution } from "@/types";

interface CategoryChartProps {
  categories: CategoryDistribution[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  if (categories.length === 0) {
    return (
      <div>
        <div className="text-sm font-medium text-[var(--navy)] mb-2">
          By project
        </div>
        <p className="text-sm text-slate-400 italic">
          No completed tasks yet.
        </p>
      </div>
    );
  }

  const max = Math.max(
    ...categories.map((c) => c.completed_count),
    1,
  );

  return (
    <div>
      <div className="text-sm font-medium text-[var(--navy)] mb-2">
        By project
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((cat) => (
          <div
            key={cat.project_id ?? "inbox"}
            className="flex items-center gap-2"
          >
            <div className="w-20 text-xs text-slate-600 truncate text-right shrink-0">
              {cat.project_name}
            </div>
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(cat.completed_count / max) * 100}%`,
                  backgroundColor: cat.project_color || "#0284c7",
                }}
              />
            </div>
            <div className="w-7 text-xs text-slate-500 text-right shrink-0">
              {cat.completed_count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
