import { Platform } from "react-native";

import type { AuthResponse, ValidationError } from "@/types";
import {
  clearStoredAuth,
  getStoredToken,
  setStoredToken,
  setStoredUser,
} from "@/lib/storage";
import { ApiError, fetchWithHandling, readJsonResponse } from "@/lib/http";

const rawApiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export function getApiBaseUrl(): string {
  if (rawApiBase) {
    return rawApiBase.replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  return "http://127.0.0.1:8000";
}

export function isUsingFallbackApiBaseUrl(): boolean {
  return !rawApiBase;
}

export function getApiBaseUrlHelpText(): string {
  const base = getApiBaseUrl();

  if (rawApiBase) {
    return `Using EXPO_PUBLIC_API_BASE_URL=${base}`;
  }

  if (Platform.OS === "android") {
    return `No EXPO_PUBLIC_API_BASE_URL set. Falling back to ${base}, which only works for the Android emulator.`;
  }

  if (Platform.OS === "ios") {
    return `No EXPO_PUBLIC_API_BASE_URL set. Falling back to ${base}, which only works for the iOS simulator on this machine.`;
  }

  return `No EXPO_PUBLIC_API_BASE_URL set. Falling back to ${base}, which usually needs replacing with your machine's LAN IP on a real device.`;
}

function getDeviceName(): string {
  if (Platform.OS === "ios") {
    return "Ballistic iOS";
  }

  if (Platform.OS === "android") {
    return "Ballistic Android";
  }

  return "Ballistic Mobile";
}

export class AuthError extends Error {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "AuthError";
    this.errors = errors;
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetchWithHandling(
    `${getApiBaseUrl()}/api/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        device_name: getDeviceName(),
      }),
    },
    "Unable to sign in. Check that the backend is running and the mobile API base URL points to it.",
  );
  const errorResponse = response.clone();

  try {
    const data = await readJsonResponse<AuthResponse | ValidationError>(
      response,
      "Unable to sign in.",
    );

    if ("token" in data && "user" in data) {
      await Promise.all([setStoredToken(data.token), setStoredUser(data.user)]);
      return data;
    }
  } catch (candidate) {
    if (candidate instanceof ApiError) {
      const payload = await errorResponse
        .json()
        .catch(() => null as ValidationError | null);

      throw new AuthError(
        candidate.message,
        payload && typeof payload === "object" && "errors" in payload
          ? (payload.errors ?? {})
          : {},
      );
    }

    throw candidate;
  }

  throw new AuthError("Unable to sign in.");
}

export async function register(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthResponse> {
  const response = await fetchWithHandling(
    `${getApiBaseUrl()}/api/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        device_name: getDeviceName(),
      }),
    },
    "Unable to create the account. Check that the backend is running and the mobile API base URL points to it.",
  );
  const errorResponse = response.clone();

  try {
    const data = await readJsonResponse<AuthResponse | ValidationError>(
      response,
      "Unable to create account.",
    );

    if ("token" in data && "user" in data) {
      await Promise.all([setStoredToken(data.token), setStoredUser(data.user)]);
      return data;
    }
  } catch (candidate) {
    if (candidate instanceof ApiError) {
      const payload = await errorResponse
        .json()
        .catch(() => null as ValidationError | null);

      throw new AuthError(
        candidate.message,
        payload && typeof payload === "object" && "errors" in payload
          ? (payload.errors ?? {})
          : {},
      );
    }

    throw candidate;
  }

  throw new AuthError("Unable to create account.");
}

export async function logout(): Promise<void> {
  const token = await getStoredToken();

  if (token) {
    try {
      await fetchWithHandling(`${getApiBaseUrl()}/api/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Clearing local auth state is still the correct fallback.
    }
  }

  await clearStoredAuth();
}
