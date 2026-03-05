// ⚠ Server-only module — do not import from client components. The non-
// prefixed `API_BASE_URL` env var is unavailable in the browser bundle so an
// accidental client import would silently fall through to the public var,
// but this file exists specifically to run during SSR.
import type { GlobalFeatureFlags } from "@/types";

/**
 * Fetch site-wide feature flags during SSR.
 *
 * Called from the root layout (a server component) so the flag map is
 * embedded in the initial HTML and passed to the client provider as
 * `initialFlags`. This eliminates the client-side round trip that would
 * otherwise delay gated UI from rendering, causing a visible pop-in after
 * hydration.
 *
 * The endpoint is backed by a 5-minute Laravel cache, and we mirror that
 * TTL here with `next.revalidate` so Next's data cache serves repeat
 * requests without hitting Laravel at all during the window. On cache miss
 * or network failure we return `{}` — every flag then resolves to its
 * caller-supplied fallback (i.e. feature off), which is the safe default.
 *
 * Resolution order for the base URL:
 *   1. `API_BASE_URL` — server-only override for Docker/K8s where the
 *      internal service hostname differs from the public one
 *      (e.g. `http://laravel:80` vs `https://api.example.com`)
 *   2. `NEXT_PUBLIC_API_BASE_URL` — same value the browser uses
 *
 * If neither is set we skip the fetch entirely — a relative path would
 * resolve against the Next server itself, not the Laravel backend.
 */
export async function getGlobalFeatureFlags(): Promise<GlobalFeatureFlags> {
  const base =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  if (!base) {
    // Misconfiguration — log loudly once per process rather than on every
    // request (Next dedupes server-component renders). The app still works;
    // gated features just stay off until the client-side refresh() runs.
    console.warn(
      "[feature-flags] No API_BASE_URL / NEXT_PUBLIC_API_BASE_URL set; " +
        "serving empty flag map from SSR.",
    );
    return {};
  }

  try {
    const response = await fetch(new URL("/api/feature-flags", base), {
      headers: { Accept: "application/json" },
      // Mirror the Laravel-side cache TTL so the Next data cache absorbs
      // repeat hits during the same window. Keeps SSR cheap under load.
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(
        `[feature-flags] SSR fetch failed: ${response.status} ${response.statusText}`,
      );
      return {};
    }

    const payload = (await response.json()) as {
      data?: GlobalFeatureFlags;
    };
    return payload.data ?? {};
  } catch (err) {
    // Network-layer failure (ECONNREFUSED, timeout, DNS). Fail soft —
    // the client provider will refresh() after hydration as a backstop.
    console.error("[feature-flags] SSR fetch threw:", err);
    return {};
  }
}
