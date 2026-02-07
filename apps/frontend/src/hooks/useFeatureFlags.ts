"use client";

import { useMemo, useCallback, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

interface FeatureFlags {
  dates: boolean;
  delegation: boolean;
}

const DEFAULTS: FeatureFlags = { dates: false, delegation: false };

export function useFeatureFlags() {
  // Use useContext directly instead of useAuth to avoid throwing in tests
  const auth = useContext(AuthContext);

  // In test environment or when AuthProvider is not available, use defaults
  const user = auth?.user ?? null;
  const updateUser = useMemo(() => auth?.updateUser ?? (async () => {}), [auth?.updateUser]);

  // Get flags from user object (no separate fetch needed)
  const flags = useMemo(() => {
    if (!user?.feature_flags) return DEFAULTS;
    return {
      dates: user.feature_flags.dates ?? false,
      delegation: user.feature_flags.delegation ?? false,
    };
  }, [user?.feature_flags]);

  const setFlag = useCallback(
    async (flag: "dates" | "delegation", value: boolean) => {
      const next = { ...flags, [flag]: value };

      try {
        await updateUser({ feature_flags: next });
      } catch (error) {
        console.error("Failed to save feature flags:", error);
        throw error;
      }
    },
    [flags, updateUser],
  );

  return {
    dates: flags.dates,
    delegation: flags.delegation,
    setFlag,
    loaded: user !== null
  };
}
