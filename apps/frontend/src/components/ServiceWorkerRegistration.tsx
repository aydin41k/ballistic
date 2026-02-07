"use client";

import { useEffect } from "react";
import { Serwist } from "@serwist/window";

/**
 * Registers the compiled service worker (/sw.js) on mount.
 * Must be a client component so it can access navigator.serviceWorker.
 * Without this, usePushNotifications hangs at navigator.serviceWorker.ready.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Serwist doesn't support Turbopack, so sw.js is only compiled during
    // `next build` (webpack). Skip registration outside production to avoid
    // a 404-caused installation error in dev/test.
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const serwist = new Serwist("/sw.js", { scope: "/" });
      serwist.register();
    }
  }, []);

  return null;
}
