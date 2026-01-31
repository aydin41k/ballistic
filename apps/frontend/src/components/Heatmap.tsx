"use client";

import type { HeatmapEntry } from "@/types";

interface HeatmapProps {
  entries: HeatmapEntry[];
  from: string;
  to: string;
}

const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function intensityBg(count: number): string {
  if (count === 0) return "#f1f5f9";
  if (count === 1) return "#bae6fd";
  if (count <= 3) return "#38bdf8";
  return "#0284c7";
}

/**
 * Format a Date as YYYY-MM-DD using local time.
 */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Build an array of weeks (Mon–Sun) spanning the date range.
 * Uses noon local time to avoid DST edge cases.
 */
function buildWeeks(from: string, to: string): string[][] {
  const start = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");

  // Align start back to the Monday of its week.
  // getDay(): 0=Sun … 6=Sat  →  (day+6)%7 gives Mon=0 … Sun=6
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);

  const weeks: string[][] = [];
  const cur = new Date(start);

  while (cur <= end) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(toDateString(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * Return a map of weekIndex → short month name, emitting a label
 * the first time each calendar month appears.
 */
function buildMonthLabels(weeks: string[][]): Map<number, string> {
  const labels = new Map<number, string>();
  let lastMonth = -1;

  for (let wi = 0; wi < weeks.length; wi++) {
    const d = new Date(weeks[wi][0] + "T12:00:00");
    const m = d.getMonth();
    if (m !== lastMonth) {
      labels.set(wi, MONTH_NAMES[m]);
      lastMonth = m;
    }
  }

  return labels;
}

export function Heatmap({ entries, from, to }: HeatmapProps) {
  const countMap = new Map<string, number>();
  for (const e of entries) {
    countMap.set(e.date, e.completed_count);
  }

  const weeks = buildWeeks(from, to);
  const monthLabels = buildMonthLabels(weeks);
  const totalCompleted = entries.reduce((sum, e) => sum + e.completed_count, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-[var(--navy)]">Activity</span>
        <span className="text-xs text-slate-500">
          {totalCompleted} completed
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[2px]">
          {/* Day-of-week labels column */}
          <div className="flex flex-col gap-[2px] mr-1 pt-4">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="h-[12px] w-[12px] flex items-center justify-center text-[8px] text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          {/* One column per week */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {/* Month label row */}
              <div className="h-4 flex items-end justify-start text-[8px] text-slate-400 leading-none pb-0.5">
                {monthLabels.get(wi) || ""}
              </div>

              {/* Seven day cells */}
              {week.map((date, di) => {
                const count = countMap.get(date) || 0;
                const inRange = date >= from && date <= to;
                return (
                  <div
                    key={di}
                    className="h-[12px] w-[12px] rounded-sm"
                    style={{
                      backgroundColor: inRange
                        ? intensityBg(count)
                        : "transparent",
                    }}
                    title={
                      inRange && count > 0 ? `${date}: ${count}` : undefined
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-[2px] mt-1 text-[9px] text-slate-400">
        <span className="mr-0.5">Less</span>
        {["#f1f5f9", "#bae6fd", "#38bdf8", "#0284c7"].map((color) => (
          <div
            key={color}
            className="h-[12px] w-[12px] rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="ml-0.5">More</span>
      </div>
    </div>
  );
}
