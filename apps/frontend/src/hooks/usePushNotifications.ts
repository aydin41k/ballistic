"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/api";

type PushState = "loading" | "unsupported" | "denied" | "prompt" | "subscribed";

interface UsePushNotificationsReturn {
  /** Current state of push notification support/subscription */
  state: PushState;
  /** Whether the user can enable push notifications */
  canEnable: boolean;
  /** Whether push is currently enabled for this browser */
  isEnabled: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Error message if something went wrong */
  error: string | null;
}

/**
 * Hook for managing Web Push notification subscriptions.
 * Handles browser permission, service worker registration, and server sync.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Check initial state on mount
  useEffect(() => {
    async function checkState() {
      // Check if push is supported
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }

      // Check permission state
      const permission = Notification.permission;
      if (permission === "denied") {
        setState("denied");
        return;
      }

      try {
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        setSwRegistration(registration);

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setState("subscribed");
        } else {
          setState("prompt");
        }
      } catch (err) {
        console.error("[Push] Failed to check state:", err);
        setState("unsupported");
      }
    }

    checkState();
  }, []);

  /**
   * Subscribe to push notifications.
   * Requests permission if needed, creates browser subscription, sends to server.
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (!swRegistration) {
      setError("Service worker not ready");
      return false;
    }

    try {
      // Get VAPID public key from server
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        setError("Push notifications not configured on server");
        return false;
      }

      // Request permission if needed
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("denied");
        setError("Notification permission denied");
        return false;
      }

      // Create push subscription
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Send subscription to server
      await subscribeToPush(subscription);

      setState("subscribed");
      return true;
    } catch (err) {
      console.error("[Push] Failed to subscribe:", err);
      setError(err instanceof Error ? err.message : "Failed to subscribe");
      return false;
    }
  }, [swRegistration]);

  /**
   * Unsubscribe from push notifications.
   * Removes browser subscription and notifies server.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (!swRegistration) {
      setError("Service worker not ready");
      return false;
    }

    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (!subscription) {
        setState("prompt");
        return true;
      }

      // Notify server
      await unsubscribeFromPush(subscription.endpoint);

      // Remove browser subscription
      await subscription.unsubscribe();

      setState("prompt");
      return true;
    } catch (err) {
      console.error("[Push] Failed to unsubscribe:", err);
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
      return false;
    }
  }, [swRegistration]);

  return {
    state,
    canEnable: state === "prompt",
    isEnabled: state === "subscribed",
    subscribe,
    unsubscribe,
    error,
  };
}

/**
 * Convert a URL-safe base64 string to Uint8Array for VAPID key.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
