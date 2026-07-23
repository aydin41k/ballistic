import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/LoadingScreen';
import { NotificationSync } from '@/components/NotificationSync';
import { colours } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { JournalPreferencesProvider } from '@/contexts/JournalPreferencesContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { queryClient } from '@/lib/query-client';

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const { isReady } = useAuth();

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return <LoadingScreen />;

  return (
    <View style={styles.flex}>
      <NotificationSync />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colours.page } }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="task"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.62, 0.95],
            sheetInitialDetentIndex: 1,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="filters"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.48, 0.82],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.86, 1],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SyncProvider>
              <JournalPreferencesProvider>
                <Navigation />
              </JournalPreferencesProvider>
            </SyncProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
