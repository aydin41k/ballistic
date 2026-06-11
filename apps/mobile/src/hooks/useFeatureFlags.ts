import { useCallback, useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";

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

const AVAILABLE_DEFAULTS: FeatureFlags = {
  dates: true,
  delegation: true,
  ai_assistant: true,
};

export function useFeatureFlags() {
  const { user, updateUser } = useAuth();

  const userFlags = useMemo(() => {
    if (!user?.feature_flags) {
      return DEFAULTS;
    }

    return {
      dates: user.feature_flags.dates ?? false,
      delegation: user.feature_flags.delegation ?? false,
      ai_assistant: user.feature_flags.ai_assistant ?? false,
    };
  }, [user?.feature_flags]);

  const available = useMemo(() => {
    if (!user?.available_feature_flags) {
      return AVAILABLE_DEFAULTS;
    }

    return {
      dates: user.available_feature_flags.dates ?? true,
      delegation: user.available_feature_flags.delegation ?? true,
      ai_assistant: user.available_feature_flags.ai_assistant ?? true,
    };
  }, [user?.available_feature_flags]);

  const setFlag = useCallback(
    async (flag: keyof FeatureFlags, value: boolean) => {
      await updateUser({ feature_flags: { [flag]: value } });
    },
    [updateUser],
  );

  return {
    dates: userFlags.dates && available.dates,
    delegation: userFlags.delegation && available.delegation,
    aiAssistant: userFlags.ai_assistant && available.ai_assistant,
    userFlags,
    available,
    setFlag,
  };
}
