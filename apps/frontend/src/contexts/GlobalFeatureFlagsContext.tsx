"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GlobalFeatureFlags } from "@/types";
import { fetchGlobalFeatureFlags } from "@/lib/api";

interface GlobalFeatureFlagsContextValue {
  /** The flag map. Empty until the first fetch resolves. */
  flags: GlobalFeatureFlags;
  /**
   * True once the initial fetch has settled (success or error). Consumers
   * that need a stable flag state before rendering feature-gated UI can
   * await this to avoid flicker.
   */
  loaded: boolean;
  /**
   * Look up a flag by key. Returns `fallback` if the flag is absent
   * (never seeded, or fetch hasn't completed yet).
   */
  enabled: (key: string, fallback?: boolean) => boolean;
  /** Re-fetch flags from the server. */
  refresh: () => Promise<void>;
}

const GlobalFeatureFlagsContext =
  createContext<GlobalFeatureFlagsContextValue | null>(null);

/**
 * Provides site-wide, admin-controlled feature flags to the app.
 *
 * These are distinct from the per-user `feature_flags` on the User model
 * (exposed via useFeatureFlags). Global flags gate whole features for every
 * user and are managed from the Admin Dashboard.
 *
 * ## Zero-flicker SSR
 *
 * The root layout fetches flags server-side and passes them as `initialFlags`.
 * State is seeded from that payload and `loaded` starts `true`, so gated UI
 * renders correctly from the very first paint — no pop-in after a client
 * round trip.
 *
 * After hydration the provider schedules one background `refresh()` to
 * reconcile with any admin toggles that happened between the server render
 * and the client taking over (SSR output can be cached for up to 5 min).
 * This refresh does not block rendering and, because it preserves the current
 * flag map on failure, cannot revoke a feature the user is already seeing.
 *
 * If `initialFlags` is omitted (e.g. in Storybook or a test harness) the
 * provider falls back to a client-side fetch-on-mount, exactly as before.
 */
export function GlobalFeatureFlagsProvider({
  children,
  initialFlags,
}: {
  children: ReactNode;
  /** Server-fetched flag map from the root layout. */
  initialFlags?: GlobalFeatureFlags;
}) {
  const [flags, setFlags] = useState<GlobalFeatureFlags>(initialFlags ?? {});
  // When seeded from SSR we're already loaded — gated UI can render on first
  // paint. Without a seed we start false and wait for the mount fetch.
  const [loaded, setLoaded] = useState(initialFlags !== undefined);

  const refresh = useCallback(async () => {
    try {
      const fetched = await fetchGlobalFeatureFlags();
      setFlags(fetched);
    } catch (error) {
      // Swallow network errors — flags default to their fallback values.
      // We deliberately don't reset `flags` on error so a transient network
      // blip on refresh() doesn't revoke features the user is already seeing.
      console.error("Failed to fetch global feature flags:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // With an SSR seed: schedule a low-priority background refresh so admin
  // toggles propagate within one navigation even if the SSR output was cached.
  // Without a seed: fetch immediately — this is the only source of truth.
  //
  // `initialFlags` is captured at mount and never changes for a given
  // provider instance, so we intentionally omit it from deps to avoid the
  // lint rule demanding we re-fetch if a parent re-renders with a new object
  // (which would defeat the "once on mount" semantics).
  useEffect(() => {
    if (initialFlags !== undefined) {
      // Defer until the browser is idle so the refresh never contends with
      // hydration or first-interaction work. Falls back to a short timeout
      // where requestIdleCallback isn't available (Safari < 18).
      const schedule =
        typeof window !== "undefined" && "requestIdleCallback" in window
          ? window.requestIdleCallback
          : (cb: () => void) => setTimeout(cb, 1000);
      schedule(() => void refresh());
    } else {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const enabled = useCallback(
    (key: string, fallback: boolean = false): boolean => {
      return flags[key] ?? fallback;
    },
    [flags],
  );

  const value = useMemo(
    () => ({ flags, loaded, enabled, refresh }),
    [flags, loaded, enabled, refresh],
  );

  return (
    <GlobalFeatureFlagsContext.Provider value={value}>
      {children}
    </GlobalFeatureFlagsContext.Provider>
  );
}

// Returned when the hook is called outside a provider — notably in unit tests
// that render <Home /> directly. All flags resolve to their fallback (i.e.
// feature is off), which is the safest default since feature-gated UI stays
// hidden rather than appearing half-broken.
const FALLBACK_VALUE: GlobalFeatureFlagsContextValue = {
  flags: {},
  loaded: true,
  enabled: (_key, fallback = false) => fallback,
  refresh: async () => {},
};

/**
 * Read site-wide feature flags.
 *
 * When called outside a `GlobalFeatureFlagsProvider` (e.g. in isolated
 * component tests) this returns a no-op stub where every flag evaluates to its
 * fallback value. This mirrors the behaviour of the per-user `useFeatureFlags`
 * hook and avoids forcing every test to add boilerplate providers.
 *
 * @example
 *   const { enabled } = useGlobalFeatureFlags();
 *   if (!enabled("activity_log")) return null;
 */
export function useGlobalFeatureFlags(): GlobalFeatureFlagsContextValue {
  const ctx = useContext(GlobalFeatureFlagsContext);
  return ctx ?? FALLBACK_VALUE;
}
