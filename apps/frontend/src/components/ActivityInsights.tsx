"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatsPeriod, StatsResponse } from "@/types";
import { fetchStats } from "@/lib/api";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { ProjectDistributionChart } from "./ProjectDistributionChart";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ActivityInsights({ isOpen, onClose }: Props) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>("year");

  const loadStats = useCallback(async (selectedPeriod: StatsPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats({ period: selectedPeriod });
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStats(period);
    }
  }, [isOpen, period, loadStats]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-8 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 animate-slide-in-up">
        <div className="h-full bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              Activity Insights
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Period selector */}
          <div className="flex gap-1 px-4 py-3 border-b border-slate-100 bg-slate-50">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm font-medium"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                {p === "week" ? "Week" : p === "month" ? "Month" : "Year"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                  <span className="text-sm text-slate-500">
                    Loading insights...
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-600 mb-2">{error}</p>
                  <button
                    type="button"
                    onClick={() => loadStats(period)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.totals.completed}
                    </div>
                    <div className="text-xs text-slate-500">Completed</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.totals.created}
                    </div>
                    <div className="text-xs text-slate-500">Created</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.streaks.current}
                    </div>
                    <div className="text-xs text-slate-500">Current streak</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.streaks.longest}
                    </div>
                    <div className="text-xs text-slate-500">Longest streak</div>
                  </div>
                </div>

                {/* Heatmap */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Activity
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                    <ActivityHeatmap data={stats.heatmap} />
                  </div>
                </div>

                {/* Project distribution */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Focus
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <ProjectDistributionChart
                      data={stats.project_distribution}
                    />
                  </div>
                </div>

                {/* Date range info */}
                <div className="text-center text-xs text-slate-400">
                  {stats.period.from} to {stats.period.to}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
