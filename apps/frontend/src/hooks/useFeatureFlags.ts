"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "ballistic_feature_flags";

interface FeatureFlags {
  dates: boolean;
  delegation: boolean;
}

const DEFAULTS: FeatureFlags = { dates: false, delegation: false };

function readFlags(): FeatureFlags {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      dates: typeof parsed.dates === "boolean" ? parsed.dates : false,
      delegation:
        typeof parsed.delegation === "boolean" ? parsed.delegation : false,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(readFlags);

  const setFlag = useCallback(
    (flag: "dates" | "delegation", value: boolean) => {
      setFlags((prev) => {
        const next = { ...prev, [flag]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Silently ignore storage errors
        }
        return next;
      });
    },
    [],
  );

  return { dates: flags.dates, delegation: flags.delegation, setFlag };
}
