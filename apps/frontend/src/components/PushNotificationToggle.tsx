"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationToggleProps {
  /** Optional class name for the container */
  className?: string;
}

/**
 * Toggle component for enabling/disabling push notifications.
 * Shows current state and allows users to subscribe or unsubscribe.
 */
export function PushNotificationToggle({
  className = "",
}: PushNotificationToggleProps) {
  const { state, isEnabled, subscribe, unsubscribe, error } =
    usePushNotifications();

  // Don't render anything while loading
  if (state === "loading") {
    return null;
  }

  // Don't render if push is not supported
  if (state === "unsupported") {
    return null;
  }

  const handleToggle = async () => {
    if (isEnabled) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={state === "denied"}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isEnabled ? "bg-blue-600" : "bg-gray-200"}
          ${state === "denied" ? "cursor-not-allowed opacity-50" : ""}
        `}
        role="switch"
        aria-checked={isEnabled}
        aria-label="Push notifications"
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isEnabled ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>

      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          Push notifications
        </span>
        <span className="text-xs text-gray-500">
          {state === "denied" && "Blocked in browser settings"}
          {state === "prompt" && "Get notified when tasks are assigned"}
          {state === "subscribed" && "Enabled for this device"}
        </span>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
