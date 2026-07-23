import { useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';

const disabledFlags = { dates: false, delegation: false, ai_assistant: false };
const availableFlags = { dates: true, delegation: true, ai_assistant: true };

export function useFeatureFlags() {
  const { user, updateUser, isRegistered } = useAuth();

  return useMemo(() => {
    const userFlags = user?.feature_flags ?? disabledFlags;
    const serverAvailable = user?.available_feature_flags ?? availableFlags;
    const available = {
      ...serverAvailable,
      delegation: isRegistered && serverAvailable.delegation,
      ai_assistant: isRegistered && serverAvailable.ai_assistant,
    };

    return {
      dates: userFlags.dates && available.dates,
      delegation: userFlags.delegation && available.delegation,
      aiAssistant: userFlags.ai_assistant && available.ai_assistant,
      userFlags,
      available,
      setFlag: async (flag: 'dates' | 'delegation' | 'ai_assistant', enabled: boolean) => {
        await updateUser({ feature_flags: { [flag]: enabled } });
      },
    };
  }, [isRegistered, updateUser, user]);
}
