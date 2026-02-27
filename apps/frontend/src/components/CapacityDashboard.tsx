"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchVelocityForecast } from "@/lib/api";
import type { VelocityForecast } from "@/types";

interface CapacityDashboardProps {
  refreshKey?: number;
}

export function CapacityDashboard({ refreshKey }: CapacityDashboardProps) {
  const [forecast, setForecast] = useState<VelocityForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVelocityForecast();
      setForecast(data);
    } catch (err) {
      console.error("Failed to load velocity forecast:", err);
      setError("Failed to load forecast.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadForecast();
  }, [loadForecast, refreshKey]);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-8 bg-slate-200 rounded w-full mb-2" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void loadForecast()}
          className="mt-2 text-xs text-red-600 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!forecast) return null;

  const hasProbability = forecast.probability_of_success !== null;
  const pct = hasProbability
    ? Math.round(forecast.probability_of_success! * 100)
    : null;
  const gaugeColour =
    pct === null
      ? "bg-slate-300"
      : pct >= 70
        ? "bg-emerald-500"
        : pct >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  // Find max for bar chart scaling
  const maxEffort = Math.max(
    ...forecast.weekly_totals.map((w) => w.total_effort),
    1,
  );

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Velocity Forecast
        </h3>
        {forecast.burnout_risk && (
          <span
            data-testid="burnout-badge"
            className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Burnout risk
          </span>
        )}
      </div>

      {/* Probability gauge */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          {pct !== null ? (
            <>
              <span className="text-2xl font-bold text-slate-800">{pct}%</span>
              <span className="text-xs text-slate-400">
                chance of completion
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-400">
              Complete some tasks to see predictions
            </span>
          )}
        </div>
        <div
          className="h-2 rounded-full bg-slate-100 overflow-hidden"
          data-testid="probability-gauge"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${gaugeColour}`}
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-800">
            {forecast.velocity.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Velocity
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">
            {forecast.demand}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Demand
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">
            {forecast.capacity.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Capacity
          </p>
        </div>
      </div>

      {/* Weekly history bar chart */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">
          Weekly effort ({forecast.data_points} weeks)
        </p>
        <div className="flex items-end gap-1 h-12">
          {forecast.weekly_totals.map((week) => {
            const heightPct =
              maxEffort > 0
                ? Math.max((week.total_effort / maxEffort) * 100, 2)
                : 2;
            return (
              <div
                key={week.week_label}
                className="flex-1 bg-blue-200 hover:bg-blue-300 rounded-t transition-colors"
                style={{ height: `${heightPct}%` }}
                title={`${week.week_label}: ${week.total_effort} pts`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
