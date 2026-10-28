import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { User } from '@/types';

const tokenKey = 'ballistic_auth_token';
const userKey = 'ballistic_user';
const pushTokenKey = 'ballistic_expo_push_token';

async function setSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function removeSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const authStorage = {
  getToken: () => getSecret(tokenKey),
  setToken: (token: string) => setSecret(tokenKey, token),
  getPushToken: () => getSecret(pushTokenKey),
  setPushToken: (token: string) => setSecret(pushTokenKey, token),
  clearPushToken: () => removeSecret(pushTokenKey),
  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(userKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      await AsyncStorage.removeItem(userKey);
      return null;
    }
  },
  setUser: (user: User) => AsyncStorage.setItem(userKey, JSON.stringify(user)),
  async clearSession(): Promise<void> {
    await Promise.all([removeSecret(tokenKey), AsyncStorage.removeItem(userKey)]);
  },
};
