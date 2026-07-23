import { useQueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { offlineStore, type OfflineStatus } from '@/lib/offline-store';
import { syncOfflineData } from '@/lib/sync-engine';

interface SyncContextValue extends OfflineStatus {
  isOnline: boolean | null;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

const initialStatus: OfflineStatus = {
  pendingCount: 0,
  lastSyncedAt: null,
  lastSyncError: null,
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated, isReady } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const network = Network.useNetworkState();
  const [status, setStatus] = useState<OfflineStatus>(initialStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const autoSyncState = useRef({
    userId: null as string | null,
    isAuthenticated: false,
    isOnline: null as boolean | null,
    pendingCount: 0,
  });
  const isOnline =
    network.isConnected === undefined
      ? null
      : network.isConnected && network.isInternetReachable !== false;

  const refreshStatus = useCallback(async () => {
    if (!userId) {
      setStatus(initialStatus);
      return;
    }
    setStatus(await offlineStore.getStatus());
  }, [userId]);

  const refreshLocalQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['journal'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['item'] }),
      queryClient.invalidateQueries({ queryKey: ['activity'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  }, [queryClient]);

  const syncNow = useCallback(async () => {
    if (!isReady) return;
    if (!isAuthenticated || isOnline !== true) {
      await refreshStatus().catch(() => undefined);
      return;
    }

    setIsSyncing(true);
    try {
      await syncOfflineData();
      await refreshLocalQueries();
    } catch {
      await refreshLocalQueries();
    } finally {
      await refreshStatus();
      setIsSyncing(false);
    }
  }, [isAuthenticated, isOnline, isReady, refreshLocalQueries, refreshStatus]);

  useEffect(() => {
    if (!isReady || !userId) {
      setStatus(initialStatus);
      return;
    }
    void refreshStatus().catch(() => setStatus(initialStatus));
    return offlineStore.subscribe(() => void refreshStatus().catch(() => undefined));
  }, [isReady, refreshStatus, userId]);

  useEffect(() => {
    if (!isReady) return;

    const previous = autoSyncState.current;
    autoSyncState.current = {
      userId,
      isAuthenticated,
      isOnline,
      pendingCount: status.pendingCount,
    };

    if (!userId || !isAuthenticated || isOnline !== true) return;

    const sessionStarted = previous.userId !== userId || !previous.isAuthenticated;
    const reconnected = previous.isOnline !== true;
    const hasNewChanges = status.pendingCount > previous.pendingCount;
    if (!sessionStarted && !reconnected && !hasNewChanges) return;

    const timer = setTimeout(() => void syncNow(), hasNewChanges ? 800 : 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isOnline, isReady, status.pendingCount, syncNow, userId]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || isOnline !== true) return;
    const interval = setInterval(() => void syncNow(), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isAuthenticated, isOnline, isReady, syncNow]);

  const value = useMemo<SyncContextValue>(
    () => ({ ...status, isOnline, isSyncing, syncNow }),
    [isOnline, isSyncing, status, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used inside SyncProvider.');
  return context;
}
