import { queryClient } from '@/lib/query-client';
import { authStorage } from '@/lib/auth-storage';
import {
  fetchUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setUnauthorisedHandler,
  updateUser as updateUserRequest,
  type UserUpdatePayload,
} from '@/lib/api';
import { unregisterCurrentDevicePush } from '@/lib/push';
import type { User } from '@/types';
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
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User>;
  updateUser: (payload: UserUpdatePayload) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearLocalSession = useCallback(async () => {
    await authStorage.clearSession();
    setUser(null);
    queryClient.clear();
  }, []);

  useEffect(() => {
    setUnauthorisedHandler(clearLocalSession);
    return () => setUnauthorisedHandler(null);
  }, [clearLocalSession]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const [token, cachedUser] = await Promise.all([
        authStorage.getToken(),
        authStorage.getUser(),
      ]);
      if (!mounted) return;

      if (!token) {
        setUser(null);
        setIsReady(true);
        return;
      }

      if (cachedUser) setUser(cachedUser);

      try {
        const freshUser = await fetchUser();
        if (!mounted) return;
        setUser(freshUser);
        await authStorage.setUser(freshUser);
      } catch (error) {
        if (!cachedUser && mounted) setUser(null);
        console.warn('Could not refresh the saved Ballistic session.', error);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const persistAuth = useCallback(async (token: string, nextUser: User) => {
    await Promise.all([authStorage.setToken(token), authStorage.setUser(nextUser)]);
    queryClient.clear();
    setUser(nextUser);
  }, []);

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

  const logout = useCallback(async () => {
    await unregisterCurrentDevicePush().catch(() => authStorage.clearPushToken());
    await logoutRequest();
    await clearLocalSession();
  }, [clearLocalSession]);

  const refreshUser = useCallback(async () => {
    const nextUser = await fetchUser();
    setUser(nextUser);
    await authStorage.setUser(nextUser);
    return nextUser;
  }, []);

  const updateUser = useCallback(async (payload: UserUpdatePayload) => {
    const nextUser = await updateUserRequest(payload);
    setUser(nextUser);
    await authStorage.setUser(nextUser);
    return nextUser;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [isReady, login, logout, refreshUser, register, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
