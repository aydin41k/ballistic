"use client";

import { useMemo, useState } from "react";
import type { HeatmapEntry } from "@/types";

type Props = {
  data: HeatmapEntry[];
  className?: string;
};

function getIntensityLevel(completed: number): number {
  if (completed === 0) return 0;
  if (completed <= 2) return 1;
  if (completed <= 4) return 2;
  if (completed <= 6) return 3;
  return 4;
}

function getIntensityColor(level: number): string {
  switch (level) {
    case 0:
      return "var(--heatmap-empty)";
    case 1:
      return "var(--heatmap-l1)";
    case 2:
      return "var(--heatmap-l2)";
    case 3:
      return "var(--heatmap-l3)";
    case 4:
      return "var(--heatmap-l4)";
    default:
      return "var(--heatmap-empty)";
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ActivityHeatmap({ data, className = "" }: Props) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapEntry | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Organise data into weeks (columns) and days (rows)
  const { weeks, monthLabels } = useMemo(() => {
    if (!data.length) return { weeks: [], monthLabels: [] };

    // Create a map for quick lookup
    const dataMap = new Map(data.map((d) => [d.date, d]));

    // Get the date range
    const startDate = new Date(data[0].date);
    const endDate = new Date(data[data.length - 1].date);

    // Adjust start to the previous Sunday
    const firstDay = new Date(startDate);
    while (firstDay.getDay() !== 0) {
      firstDay.setDate(firstDay.getDate() - 1);
    }

    const weeks: (HeatmapEntry | null)[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let currentWeek: (HeatmapEntry | null)[] = [];
    const currentDate = new Date(firstDay);
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const entry = dataMap.get(dateStr);

      // Track month changes for labels
      const month = currentDate.getMonth();
      if (month !== lastMonth && weeks.length > 0) {
        monthLabels.push({
          month: currentDate.toLocaleDateString("en-AU", { month: "short" }),
          weekIndex: weeks.length,
        });
        lastMonth = month;
      } else if (lastMonth === -1) {
        lastMonth = month;
      }

      // Add entry or null for days outside the data range
      if (currentDate >= startDate && entry) {
        currentWeek.push(entry);
      } else if (currentDate >= startDate) {
        currentWeek.push({ date: dateStr, completed: 0, created: 0 });
      } else {
        currentWeek.push(null);
      }

      // Start new week on Sunday
      if (currentDate.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [data]);

  const handleMouseEnter = (
    entry: HeatmapEntry,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredDay(entry);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  if (!data.length) {
    return (
      <div className={`text-center py-4 text-slate-400 ${className}`}>
        No activity data available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Month labels */}
      <div className="flex text-[10px] text-slate-400 mb-1 ml-8">
        {monthLabels.map((label, i) => (
          <div
            key={`${label.month}-${i}`}
            style={{
              marginLeft: i === 0 ? `${label.weekIndex * 13}px` : "auto",
              width: "32px",
            }}
          >
            {label.month}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col justify-between text-[10px] text-slate-400 pr-1 py-0.5">
          <span></span>
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="w-[11px] h-[11px] rounded-sm cursor-pointer transition-transform hover:scale-110"
                  style={{
                    backgroundColor: day
                      ? getIntensityColor(getIntensityLevel(day.completed))
                      : "transparent",
                    opacity: day ? 1 : 0,
                  }}
                  onMouseEnter={
                    day ? (e) => handleMouseEnter(day, e) : undefined
                  }
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 justify-end">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-[11px] h-[11px] rounded-sm"
            style={{ backgroundColor: getIntensityColor(level) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-slate-800 text-white rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="font-medium">{formatDate(hoveredDay.date)}</div>
          <div className="text-slate-300">
            {hoveredDay.completed} completed, {hoveredDay.created} created
          </div>
        </div>
      )}
    </div>
  );
}
