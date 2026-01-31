"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PushNotificationToggle } from "./PushNotificationToggle";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for app settings including push notification preferences.
 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  function handleBackdropClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl animate-slide-in-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              className="text-gray-500"
            >
              <path
                d="M18 6 6 18M6 6l12 12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* Insights */}
          <section>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/insights");
              }}
              className="w-full flex items-center gap-3 rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors text-left"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                className="text-[var(--navy)] shrink-0"
              >
                <path
                  d="M18 20V10M12 20V4M6 20v-6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Insights</p>
                <p className="text-xs text-gray-500">
                  Activity heatmap &amp; project breakdown
                </p>
              </div>
            </button>
          </section>

          {/* Notifications Section */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Notifications
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <PushNotificationToggle />
            </div>
          </section>

          {/* Version Info */}
          <section className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Ballistic v0.10.0
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
