import { getApiBaseUrl } from "@/lib/auth";
import {
  ApiError,
  UnauthorisedError,
  fetchWithHandling,
  readJsonResponse,
} from "@/lib/http";
import { clearStoredAuth, getStoredToken } from "@/lib/storage";

type UnauthorisedHandler = (() => void | Promise<void>) | null;
type QueryParams = Record<string, string | undefined>;

type ApiRequestOptions = {
  path: string;
  method: string;
  errorMessage: string;
  params?: QueryParams;
  body?: unknown;
};

let unauthorisedHandler: UnauthorisedHandler = null;

export function setUnauthorisedHandler(handler: UnauthorisedHandler): void {
  unauthorisedHandler = handler;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildUrl(path: string, params?: QueryParams): string {
  const search = Object.entries(params ?? {})
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value ?? "")}`,
    )
    .join("&");

  const base = getApiBaseUrl();
  return `${base}${path}${search ? `?${search}` : ""}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  try {
    return await readJsonResponse<T>(response, "Request failed.");
  } catch (candidate) {
    if (candidate instanceof UnauthorisedError) {
      await clearStoredAuth();
      await unauthorisedHandler?.();
    }

    if (candidate instanceof ApiError) {
      throw candidate;
    }

    throw new ApiError("Request failed.");
  }
}

function extractData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const candidate = (payload as { data?: T }).data;

    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }

  return payload as T;
}

export async function apiRequest<T>({
  path,
  method,
  errorMessage,
  params,
  body,
}: ApiRequestOptions): Promise<T> {
  const response = await fetchWithHandling(
    buildUrl(path, params),
    {
      method,
      headers: await getAuthHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    errorMessage,
  );

  return handleResponse<T>(response);
}

export async function apiDataRequest<T>(
  options: ApiRequestOptions,
): Promise<T> {
  return extractData(await apiRequest<T | { data?: T }>(options));
}
