import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { authStorage } from '@/lib/auth-storage';
import { supportsNativeNotifications } from '@/lib/push';

export function NotificationSync() {
  const { isAuthenticated } = useAuth();
  const { delegation } = useFeatureFlags();
  const { syncNow } = useSync();
  const router = useRouter();

  useEffect(() => {
    if (!supportsNativeNotifications()) return;

    let disposed = false;
    void import('expo-notifications')
      .then((Notifications) => {
        if (disposed) return;
        Notifications.setNotificationHandler({
          handleNotification: async () => {
            const hasServerSession = Boolean(await authStorage.getToken());
            return {
              shouldShowBanner: hasServerSession,
              shouldShowList: hasServerSession,
              shouldPlaySound: hasServerSession,
              shouldSetBadge: hasServerSession,
            };
          },
        });
      })
      .catch((error) => console.warn('Could not configure notification handling.', error));

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !delegation || !supportsNativeNotifications()) return;

    let disposed = false;
    let removeListeners: (() => void) | undefined;

    void import('expo-notifications')
      .then((Notifications) => {
        if (disposed) return;
        const received = Notifications.addNotificationReceivedListener(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void syncNow();
        });
        const responded = Notifications.addNotificationResponseReceivedListener(() => {
          router.push('/notifications');
        });
        removeListeners = () => {
          received.remove();
          responded.remove();
        };
      })
      .catch((error) => console.warn('Could not start notification listeners.', error));

    return () => {
      disposed = true;
      removeListeners?.();
    };
  }, [delegation, isAuthenticated, router, syncNow]);

  return null;
}
