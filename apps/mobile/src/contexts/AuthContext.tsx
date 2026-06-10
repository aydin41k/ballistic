import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  fetchUser,
  setUnauthorisedHandler,
  updateUser as apiUpdateUser,
  type UserUpdatePayload,
} from "@/lib/api";
import { UnauthorisedError, toDisplayMessage } from "@/lib/http";
import {
  AuthError,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
} from "@/lib/auth";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredUser,
} from "@/lib/storage";
import type { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  bootstrapError: string | null;
  clearBootstrapError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (payload: UserUpdatePayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const handleSignedOut = useCallback(async () => {
    await clearStoredAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorisedHandler(handleSignedOut);
    return () => setUnauthorisedHandler(null);
  }, [handleSignedOut]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [token, storedUser] = await Promise.all([
        getStoredToken(),
        getStoredUser(),
      ]);

      if (cancelled) {
        return;
      }

      if (storedUser) {
        setUser(storedUser);
      }

      if (!token) {
        setBootstrapError(null);
        setIsReady(true);
        return;
      }

      try {
        const freshUser = await fetchUser();
        if (!cancelled) {
          setUser(freshUser);
          setBootstrapError(null);
          await setStoredUser(freshUser);
        }
      } catch (candidate) {
        if (!cancelled) {
          if (candidate instanceof UnauthorisedError) {
            await handleSignedOut();
            setBootstrapError(null);
          } else if (!storedUser) {
            setBootstrapError(
              toDisplayMessage(
                candidate,
                "Unable to restore your session right now.",
              ),
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [handleSignedOut]);

  const login = useCallback(async (email: string, password: string) => {
    setBootstrapError(null);
    const response = await authLogin(email, password);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      passwordConfirmation: string,
    ) => {
      setBootstrapError(null);
      const response = await authRegister(
        name,
        email,
        password,
        passwordConfirmation,
      );
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const freshUser = await fetchUser();
    setUser(freshUser);
    await setStoredUser(freshUser);
  }, []);

  const updateUser = useCallback(async (payload: UserUpdatePayload) => {
    const updated = await apiUpdateUser(payload);
    setUser(updated);
    await setStoredUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      bootstrapError,
      clearBootstrapError: () => setBootstrapError(null),
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [
      bootstrapError,
      isReady,
      login,
      logout,
      refreshUser,
      register,
      updateUser,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return value;
}

export { AuthError };
