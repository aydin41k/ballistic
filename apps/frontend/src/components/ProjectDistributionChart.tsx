"use client";

import type { ProjectDistributionEntry } from "@/types";

type Props = {
  data: ProjectDistributionEntry[];
  className?: string;
};

export function ProjectDistributionChart({ data, className = "" }: Props) {
  if (!data.length) {
    return (
      <div className={`text-center py-4 text-slate-400 ${className}`}>
        No completed tasks in this period
      </div>
    );
  }

  // Calculate total and percentages
  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((entry) => {
        const percentage = total > 0 ? (entry.count / total) * 100 : 0;

        return (
          <div key={entry.project_id ?? "inbox"} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.project_color }}
                />
                <span className="text-slate-700 truncate max-w-[140px]">
                  {entry.project_name}
                </span>
              </div>
              <div className="text-slate-500 tabular-nums">
                {entry.count}{" "}
                <span className="text-slate-400">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: entry.project_color,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-medium">
        <span className="text-slate-600">Total completed</span>
        <span className="text-slate-900 tabular-nums">{total}</span>
      </div>
    </div>
  );
}
