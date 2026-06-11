// Abort requests that hang longer than this so a stalled backend can't leave
// the UI stuck on a spinner forever.
const REQUEST_TIMEOUT_MS = 15_000;

type ApiErrorCode = "http" | "network" | "unauthorised";

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;

  constructor(
    message: string,
    options?: {
      code?: ApiErrorCode;
      status?: number;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options?.code ?? "http";
    this.status = options?.status;
  }
}

export class UnauthorisedError extends ApiError {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message, { code: "unauthorised", status: 401 });
    this.name = "UnauthorisedError";
  }
}

async function readResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => "");
}

function getMessageFromPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return fallback;
}

export async function fetchWithHandling(
  input: string,
  init: RequestInit,
  networkMessage = "Unable to reach the Ballistic backend. Check that the API is running and the mobile API base URL is correct.",
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch {
    throw new ApiError(networkMessage, { code: "network" });
  } finally {
    clearTimeout(timeout);
  }
}

export async function readJsonResponse<T>(
  response: Response,
  fallbackMessage = "Request failed.",
): Promise<T> {
  const payload = await readResponsePayload(response);

  if (response.status === 401) {
    throw new UnauthorisedError(
      getMessageFromPayload(
        payload,
        "Your session has expired. Please sign in again.",
      ),
    );
  }

  if (!response.ok) {
    throw new ApiError(getMessageFromPayload(payload, fallbackMessage), {
      code: "http",
      status: response.status,
    });
  }

  return payload as T;
}

export function toDisplayMessage(
  candidate: unknown,
  fallback: string,
): string {
  if (candidate instanceof Error && candidate.message.trim()) {
    return candidate.message;
  }

  return fallback;
}
