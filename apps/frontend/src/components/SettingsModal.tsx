"use client";

import { useEffect, useRef } from "react";
import { PushNotificationToggle } from "./PushNotificationToggle";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for app settings including push notification preferences.
 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { dates, delegation, setFlag } = useFeatureFlags();

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
          {/* Features Section */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Features
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Dates & Scheduling toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFlag("dates", !dates)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${dates ? "bg-blue-600" : "bg-gray-200"}
                  `}
                  role="switch"
                  aria-checked={dates}
                  aria-label="Dates & Scheduling"
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full
                      bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${dates ? "translate-x-5" : "translate-x-0"}
                    `}
                  />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Dates &amp; Scheduling
                  </span>
                  <span className="text-xs text-gray-500">
                    Due dates, scheduled dates, and repeating tasks
                  </span>
                </div>
              </div>

              {/* Task Delegation toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFlag("delegation", !delegation)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${delegation ? "bg-blue-600" : "bg-gray-200"}
                  `}
                  role="switch"
                  aria-checked={delegation}
                  aria-label="Task Delegation"
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full
                      bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${delegation ? "translate-x-5" : "translate-x-0"}
                    `}
                  />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Task Delegation
                  </span>
                  <span className="text-xs text-gray-500">
                    Assign tasks to other users
                  </span>
                </div>
              </div>
            </div>
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
              Ballistic v0.12.0
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
