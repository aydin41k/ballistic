"use client";

import { useMemo, useCallback, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

interface FeatureFlags {
  dates: boolean;
  delegation: boolean;
  ai_assistant: boolean;
}

const DEFAULTS: FeatureFlags = {
  dates: false,
  delegation: false,
  ai_assistant: false,
};

export function useFeatureFlags() {
  // Use useContext directly instead of useAuth to avoid throwing in tests
  const auth = useContext(AuthContext);

  // In test environment or when AuthProvider is not available, use defaults
  const user = auth?.user ?? null;
  const updateUser = useMemo(
    () => auth?.updateUser ?? (async () => {}),
    [auth?.updateUser],
  );

  // Get flags from user object (no separate fetch needed)
  const flags = useMemo(() => {
    if (!user?.feature_flags) return DEFAULTS;
    return {
      dates: user.feature_flags.dates ?? false,
      delegation: user.feature_flags.delegation ?? false,
      ai_assistant: user.feature_flags.ai_assistant ?? false,
    };
  }, [user?.feature_flags]);

  const setFlag = useCallback(
    async (flag: "dates" | "delegation" | "ai_assistant", value: boolean) => {
      const currentFlags = user?.feature_flags ?? DEFAULTS;
      const next = {
        ...currentFlags,
        dates: currentFlags.dates ?? false,
        delegation: currentFlags.delegation ?? false,
        ai_assistant: currentFlags.ai_assistant ?? false,
        [flag]: value,
      };

      try {
        await updateUser({ feature_flags: next });
      } catch (error) {
        console.error("Failed to save feature flags:", error);
        throw error;
      }
    },
    [updateUser, user?.feature_flags],
  );

  return {
    dates: flags.dates,
    delegation: flags.delegation,
    aiAssistant: flags.ai_assistant,
    setFlag,
    loaded: user !== null,
  };
}
