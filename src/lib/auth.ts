import type { AuthResponse, User, ValidationError } from "@/types";

const TOKEN_KEY = "ballistic_auth_token";
const USER_KEY = "ballistic_user";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * Get the stored auth token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the auth token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the auth token from localStorage
 */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Get the stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Store the user in localStorage
 */
export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json() as ValidationError;
    throw new AuthError(error.message, error.errors);
  }

  const data = await response.json() as AuthResponse;
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

/**
 * Register a new user
 */
export async function register(
  name: string,
  email: string,
  password: string,
  password_confirmation: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ name, email, password, password_confirmation }),
  });

  if (!response.ok) {
    const error = await response.json() as ValidationError;
    throw new AuthError(error.message, error.errors);
  }

  const data = await response.json() as AuthResponse;
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  const token = getToken();
  
  if (token) {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore errors - we'll clear local state anyway
    }
  }
  
  clearToken();
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "AuthError";
    this.errors = errors;
  }
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

