"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "@/types";
import {
  getToken,
  getStoredUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  AuthError,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authLogin(email, password);
    setUser(response.user);
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    const response = await authRegister(name, email, password, passwordConfirmation);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthError };


