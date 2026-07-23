import * as Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { subscribeMobilePush, unsubscribeMobilePush } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
import { offlineStore } from '@/lib/offline-store';

export type PushState = 'unsupported' | 'prompt' | 'denied' | 'disabled' | 'enabled';

type NotificationsModule = typeof import('expo-notifications');

export function supportsNativeNotifications(): boolean {
  return !(
    Platform.OS === 'web' ||
    (Platform.OS === 'android' &&
      Constants.default.executionEnvironment === Constants.ExecutionEnvironment.StoreClient)
  );
}

async function loadNotifications(): Promise<NotificationsModule> {
  return import('expo-notifications');
}

function getProjectId(): string | undefined {
  const configured = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (configured) return configured;

  const extra = Constants.default.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return Constants.default.easConfig?.projectId ?? extra?.eas?.projectId;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('ballistic', {
    name: 'Ballistic tasks',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 100, 180],
    lightColor: '#2563EB',
    sound: 'default',
  });
}

export async function getPushState(): Promise<PushState> {
  if (!supportsNativeNotifications() || !Device.isDevice) return 'unsupported';
  const Notifications = await loadNotifications();
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status === 'denied') return 'denied';
  if (permissions.status !== 'granted') return 'prompt';
  return (await authStorage.getPushToken()) ? 'enabled' : 'disabled';
}

export async function registerCurrentDevicePush(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    throw new Error('Push notifications require a physical iOS or Android device.');
  }
  if (!supportsNativeNotifications()) {
    throw new Error('Remote push notifications require a development build on Android.');
  }

  const Notifications = await loadNotifications();
  await ensureAndroidChannel(Notifications);
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Set EXPO_PUBLIC_EAS_PROJECT_ID before enabling native push.');
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const payload = {
    expo_push_token: token,
    platform: Platform.OS as 'ios' | 'android',
    device_name: Device.deviceName || Device.modelName || `Ballistic on ${Platform.OS}`,
  };
  await authStorage.setPushToken(token);
  await subscribeMobilePush(payload).catch(() => offlineStore.queuePushSubscription(payload));
}

export async function unregisterCurrentDevicePush(): Promise<void> {
  const token = await authStorage.getPushToken();
  if (!token) return;
  await authStorage.clearPushToken();
  await unsubscribeMobilePush(token).catch(() => offlineStore.queuePushUnsubscription(token));
}

export async function clearLocalNotifications(): Promise<void> {
  if (!supportsNativeNotifications()) return;
  const Notifications = await loadNotifications();
  await Promise.allSettled([
    Notifications.cancelAllScheduledNotificationsAsync(),
    Notifications.dismissAllNotificationsAsync(),
    Notifications.setBadgeCountAsync(0),
    Notifications.unregisterForNotificationsAsync(),
  ]);
}
