import { queryClient } from '@/lib/query-client';
import { Image } from 'expo-image';
import { authStorage } from '@/lib/auth-storage';
import { clearLocalAvatars, deleteLocalAvatar } from '@/lib/avatar-files';
import {
  fetchUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setUnauthorisedHandler,
} from '@/lib/api';
import { createOfflineId, offlineStore } from '@/lib/offline-store';
import { clearLocalNotifications, unregisterCurrentDevicePush } from '@/lib/push';
import { waitForSyncToSettle } from '@/lib/sync-engine';
import type { AvatarUploadPayload, User, UserUpdatePayload } from '@/types';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isRegistered: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  startOffline: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User>;
  updateUser: (payload: UserUpdatePayload) => Promise<User>;
  updateAvatar: (payload: AvatarUploadPayload) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isGuestUser(user: User | null): boolean {
  return Boolean(user?.id.startsWith('guest-'));
}

function createGuestUser(): User {
  const now = new Date().toISOString();
  return {
    id: `guest-${createOfflineId()}`,
    name: 'You',
    email: '',
    phone: null,
    notes: null,
    bio: null,
    avatar_url: null,
    feature_flags: { dates: true, delegation: false, ai_assistant: false },
    available_feature_flags: { dates: true, delegation: false, ai_assistant: false },
    email_verified_at: null,
    created_at: now,
    updated_at: now,
    favourites: [],
  };
}

function applyUserUpdate(user: User, payload: UserUpdatePayload): User {
  return {
    ...user,
    ...payload,
    feature_flags:
      payload.feature_flags === undefined || payload.feature_flags === null
        ? user.feature_flags
        : { ...user.feature_flags, ...payload.feature_flags },
    updated_at: new Date().toISOString(),
  };
}

function userUpdateRollback(user: User, payload: UserUpdatePayload): UserUpdatePayload {
  const rollback: UserUpdatePayload = {};
  if ('name' in payload) rollback.name = user.name;
  if ('email' in payload) rollback.email = user.email;
  if ('phone' in payload) rollback.phone = user.phone;
  if ('notes' in payload) rollback.notes = user.notes;
  if ('bio' in payload) rollback.bio = user.bio;
  if ('avatar_url' in payload) rollback.avatar_url = user.avatar_url;
  if ('feature_flags' in payload) rollback.feature_flags = user.feature_flags;
  return rollback;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const expireServerSession = useCallback(async () => {
    await authStorage.clearToken();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setUnauthorisedHandler(expireServerSession);
    return () => setUnauthorisedHandler(null);
  }, [expireServerSession]);

  useEffect(() => authStorage.subscribe(setUser), []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const [token, storedUser] = await Promise.all([
        authStorage.getToken(),
        authStorage.getUser(),
      ]);
      const localUser = storedUser ?? createGuestUser();
      await Promise.all([
        offlineStore.ensureWorkspace(localUser.id),
        storedUser ? Promise.resolve() : authStorage.setUser(localUser),
      ]);
      if (!mounted) return;
      setUser(localUser);
      setIsAuthenticated(Boolean(token));

      if (token) {
        try {
          const freshUser = await fetchUser();
          await offlineStore.activateWorkspace(freshUser.id, isGuestUser(localUser));
          const pendingUpdate = await offlineStore.getPendingUserUpdate();
          const pendingAvatar = await offlineStore.getPendingAvatarUpload();
          const restoredProfile = pendingUpdate
            ? applyUserUpdate(freshUser, pendingUpdate)
            : freshUser;
          const restoredUser = pendingAvatar
            ? { ...restoredProfile, avatar_url: pendingAvatar.payload.fileUri }
            : restoredProfile;
          await authStorage.setUser(restoredUser);
          if (mounted) {
            setUser(restoredUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.warn('Could not refresh the saved Ballistic account. Continuing offline.', error);
        }
      }

      if (mounted) setIsReady(true);
    }

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const persistAuth = useCallback(
    async (token: string, nextUser: User) => {
      await waitForSyncToSettle();
      const mergeCurrent = isGuestUser(user);
      await offlineStore.activateWorkspace(nextUser.id, mergeCurrent);
      const pendingUpdate = await offlineStore.getPendingUserUpdate();
      const pendingAvatar = await offlineStore.getPendingAvatarUpload();
      const linkedProfile = pendingUpdate ? applyUserUpdate(nextUser, pendingUpdate) : nextUser;
      const linkedUser = pendingAvatar
        ? { ...linkedProfile, avatar_url: pendingAvatar.payload.fileUri }
        : linkedProfile;
      await Promise.all([authStorage.setToken(token), authStorage.setUser(linkedUser)]);
      queryClient.clear();
      setUser(linkedUser);
      setIsAuthenticated(true);
    },
    [user],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email.trim(), password);
      await persistAuth(response.token, response.user);
    },
    [persistAuth],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
    }) => {
      const response = await registerRequest({
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim(),
      });
      await persistAuth(response.token, response.user);
    },
    [persistAuth],
  );

  const startOffline = useCallback(async () => {
    const localUser = user ?? createGuestUser();
    await Promise.all([
      offlineStore.ensureWorkspace(localUser.id),
      authStorage.setUser(localUser),
      authStorage.setOnboardingComplete(),
    ]);
    queryClient.clear();
    setUser(localUser);
    setIsAuthenticated(false);
  }, [user]);

  const logout = useCallback(async () => {
    await waitForSyncToSettle();
    await unregisterCurrentDevicePush().catch(() => undefined);
    await logoutRequest();
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
    await offlineStore.clear();
    await Promise.all([
      authStorage.clearSession(),
      clearLocalNotifications().catch(() => undefined),
      Image.clearMemoryCache().catch(() => false),
      Image.clearDiskCache().catch(() => false),
    ]);
    clearLocalAvatars();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) {
      if (!user) throw new Error('The local profile is not ready.');
      return user;
    }
    const freshUser = await fetchUser();
    const pendingUpdate = await offlineStore.getPendingUserUpdate();
    const pendingAvatar = await offlineStore.getPendingAvatarUpload();
    const nextProfile = pendingUpdate ? applyUserUpdate(freshUser, pendingUpdate) : freshUser;
    const nextUser = pendingAvatar
      ? { ...nextProfile, avatar_url: pendingAvatar.payload.fileUri }
      : nextProfile;
    await authStorage.setUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }, [isAuthenticated, user]);

  const updateUser = useCallback(
    async (payload: UserUpdatePayload) => {
      if (!user) throw new Error('The local profile is not ready.');
      const localPayload = { ...payload };
      if (isGuestUser(user) && localPayload.email === '') delete localPayload.email;
      const nextUser = applyUserUpdate(user, localPayload);
      await Promise.all([
        authStorage.setUser(nextUser),
        offlineStore.queueUserUpdate(localPayload, userUpdateRollback(user, localPayload)),
      ]);
      setUser(nextUser);
      return nextUser;
    },
    [user],
  );

  const updateAvatar = useCallback(
    async (payload: AvatarUploadPayload) => {
      if (!user) throw new Error('The local profile is not ready.');
      const previousPendingFile = await offlineStore.queueAvatarUpload(payload, user.avatar_url);
      const nextUser = applyUserUpdate(user, { avatar_url: payload.fileUri });
      await authStorage.setUser(nextUser);
      setUser(nextUser);
      if (previousPendingFile && previousPendingFile !== payload.fileUri) {
        deleteLocalAvatar(previousPendingFile);
      }
      return nextUser;
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated,
      isRegistered: Boolean(user && !isGuestUser(user)),
      login,
      register,
      startOffline,
      logout,
      refreshUser,
      updateUser,
      updateAvatar,
    }),
    [
      isAuthenticated,
      isReady,
      login,
      logout,
      refreshUser,
      register,
      startOffline,
      updateUser,
      updateAvatar,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
