import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supportsNativeNotifications } from '@/lib/push';

export function NotificationSync() {
  const { isAuthenticated } = useAuth();
  const { delegation } = useFeatureFlags();
  const client = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!supportsNativeNotifications()) return;

    let disposed = false;
    void import('expo-notifications')
      .then((Notifications) => {
        if (disposed) return;
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
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
          void client.invalidateQueries({ queryKey: ['notifications'] });
          void client.invalidateQueries({ queryKey: ['journal'] });
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
  }, [client, delegation, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void client.invalidateQueries({ queryKey: ['journal'] });
      if (delegation) void client.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => subscription.remove();
  }, [client, delegation, isAuthenticated]);

  return null;
}
