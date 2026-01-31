"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fetchStats } from "@/lib/api";
import type { StatsResponse } from "@/types";
import { Heatmap } from "@/components/Heatmap";
import { CategoryChart } from "@/components/CategoryChart";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function InsightsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable date range matching the backend default (364 days ago → today)
  const [dateRange] = useState(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 364);
    return { from: formatLocalDate(from), to: formatLocalDate(today) };
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchStats({ from: dateRange.from, to: dateRange.to })
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, dateRange.from, dateRange.to]);

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex flex-col gap-3">
        <header className="sticky top-0 z-10 -mx-4 bg-[var(--page-bg)]/95 px-4 pb-2 pt-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </header>
        <div className="h-48 bg-slate-100 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 -mx-4 bg-[var(--page-bg)]/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back"
            className="text-[var(--navy)] active:scale-95 transition-transform"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-[var(--navy)]">Insights</h1>
        </div>
      </header>

      {loading || !stats ? (
        <div className="flex flex-col gap-4">
          <div className="h-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-32 bg-slate-100 rounded-md animate-pulse" />
        </div>
      ) : (
        <>
          <Heatmap
            entries={stats.heatmap}
            from={dateRange.from}
            to={dateRange.to}
          />
          <CategoryChart categories={stats.category_distribution} />
        </>
      )}
    </div>
  );
}
