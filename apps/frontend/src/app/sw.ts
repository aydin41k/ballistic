/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | PrecacheEntry)[];
};

// Push notification payload structure from backend
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    notification_id?: string;
    type?: string;
    url?: string;
    [key: string]: unknown;
  };
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ─────────────────────────────────────────────────────────────────────────────
// Push Notification Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle incoming push notifications from the server.
 * Displays a notification to the user with the payload from the backend.
 */
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) {
    console.warn("[SW] Push event received without data");
    return;
  }

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    console.error("[SW] Failed to parse push payload");
    return;
  }

  const { title, body, icon, badge, data } = payload;

  const options: NotificationOptions = {
    body,
    icon: icon || "/icons/icon-192x192.png",
    badge: badge || "/icons/badge-72x72.png",
    data,
    // Keep notification visible until user interacts
    requireInteraction: true,
    // Tag to replace existing notifications of same type
    tag: data?.type || "default",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handle notification click events.
 * Opens the appropriate URL or focuses an existing window.
 */
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Navigate the existing window to the notification URL
            client.navigate(url);
            return client.focus();
          }
        }
        // No existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
