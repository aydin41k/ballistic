"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PushNotificationToggle } from "./PushNotificationToggle";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { createMcpToken, fetchMcpTokens, revokeMcpToken } from "@/lib/api";
import type { McpToken } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for app settings including push notification preferences.
 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { dates, delegation, aiAssistant, setFlag } = useFeatureFlags();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcpTokens, setMcpTokens] = useState<McpToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenLoadError, setTokenLoadError] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmRevokeId) {
          setConfirmRevokeId(null);
        } else {
          onClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, confirmRevokeId]);

  // Close on click outside
  function handleBackdropClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  const loadMcpTokens = useCallback(async () => {
    if (!aiAssistant) {
      setMcpTokens([]);
      return;
    }

    setLoadingTokens(true);
    setTokenLoadError(false);
    try {
      const tokens = await fetchMcpTokens();
      setMcpTokens(tokens);
    } catch (err) {
      console.error("Failed to load MCP tokens:", err);
      setTokenLoadError(true);
    } finally {
      setLoadingTokens(false);
    }
  }, [aiAssistant]);

  useEffect(() => {
    if (isOpen && aiAssistant) {
      void loadMcpTokens();
    }
  }, [isOpen, aiAssistant, loadMcpTokens]);

  async function handleToggle(
    flag: "dates" | "delegation" | "ai_assistant",
    value: boolean,
  ) {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      await setFlag(flag, value);
      // Success - state is already updated via AuthContext
      setSaving(false);
    } catch (err) {
      console.error("Failed to save feature flag:", err);
      setError("Failed to save settings. Please try again.");
      setSaving(false);
    }
  }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenName.trim() || creatingToken) return;

    setCreatingToken(true);
    setError(null);
    try {
      const created = await createMcpToken(tokenName.trim());
      setMcpTokens((prev) => [created.token_record, ...prev]);
      setNewToken(created.token);
      setTokenName("");
    } catch (err) {
      console.error("Failed to create MCP token:", err);
      setError("Failed to create MCP token.");
    } finally {
      setCreatingToken(false);
    }
  }

  async function handleRevokeToken(tokenId: string) {
    setConfirmRevokeId(null);
    setError(null);
    try {
      await revokeMcpToken(tokenId);
      setMcpTokens((prev) => prev.filter((token) => token.id !== tokenId));
    } catch (err) {
      console.error("Failed to revoke MCP token:", err);
      setError("Failed to revoke MCP token.");
    }
  }

  function copyNewToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  const mcpBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
  const mcpUrl = new URL("/mcp", mcpBase).toString();

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

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Saving indicator */}
        {saving && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            Saving...
          </div>
        )}

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
                  onClick={() => handleToggle("dates", !dates)}
                  disabled={saving}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${dates ? "bg-blue-600" : "bg-gray-200"}
                    ${saving ? "opacity-50 cursor-not-allowed" : ""}
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
                  onClick={() => handleToggle("delegation", !delegation)}
                  disabled={saving}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${delegation ? "bg-blue-600" : "bg-gray-200"}
                    ${saving ? "opacity-50 cursor-not-allowed" : ""}
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

              {/* AI Assistant toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle("ai_assistant", !aiAssistant)}
                  disabled={saving}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${aiAssistant ? "bg-blue-600" : "bg-gray-200"}
                    ${saving ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  role="switch"
                  aria-checked={aiAssistant}
                  aria-label="AI Assistant"
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full
                      bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${aiAssistant ? "translate-x-5" : "translate-x-0"}
                    `}
                  />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    AI Assistant (MCP)
                  </span>
                  <span className="text-xs text-gray-500">
                    Enable MCP token management for agent integrations
                  </span>
                </div>
              </div>
            </div>
          </section>

          {aiAssistant && (
            <section>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                AI Assistant Tokens
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                {newToken && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-800 mb-2">
                      New token created. Copy it now, you won&apos;t be able to
                      view it again.
                    </p>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 text-xs rounded bg-green-100 p-2 break-all">
                        {newToken}
                      </code>
                      <button
                        type="button"
                        onClick={copyNewToken}
                        className="px-3 py-1 text-xs rounded bg-white border border-green-300 hover:bg-green-100"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleCreateToken}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="Token name (e.g. Claude Desktop)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={creatingToken || tokenName.trim().length === 0}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingToken ? "Creating..." : "Create"}
                  </button>
                </form>

                {loadingTokens ? (
                  <p className="text-xs text-gray-500">Loading tokens...</p>
                ) : tokenLoadError ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-red-600">
                      Failed to load tokens.
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadMcpTokens()}
                      className="text-xs text-blue-600 underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : mcpTokens.length === 0 ? (
                  <p className="text-xs text-gray-500">No MCP tokens yet.</p>
                ) : (
                  <div className="divide-y rounded-md border border-gray-200 bg-white">
                    {mcpTokens.map((token) => (
                      <div
                        key={token.id}
                        className="flex items-start justify-between gap-2 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {token.name}
                            {token.is_legacy_wildcard && (
                              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">
                                Legacy wildcard
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created{" "}
                            {token.created_at
                              ? new Date(token.created_at).toLocaleDateString()
                              : "—"}
                            {token.last_used_at
                              ? ` · Last used ${new Date(token.last_used_at).toLocaleDateString()}`
                              : ""}
                          </p>
                          {token.is_legacy_wildcard && (
                            <p className="mt-1 text-xs text-amber-700">
                              Replace this broad token with a dedicated MCP
                              token.
                            </p>
                          )}
                        </div>

                        {confirmRevokeId === token.id ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="text-xs text-gray-600">
                              Revoke?
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleRevokeToken(token.id)}
                              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRevokeId(null)}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeId(token.id)}
                            className="shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 rounded-md border border-gray-200 bg-white">
                  <p className="text-xs text-gray-700 mb-2">
                    MCP config (header auth):
                  </p>
                  <pre className="text-[11px] overflow-x-auto rounded bg-gray-100 p-2 text-gray-800">
                    {JSON.stringify(
                      {
                        mcpServers: {
                          ballistic: {
                            url: mcpUrl,
                            headers: {
                              Authorization: "Bearer YOUR_MCP_TOKEN",
                            },
                          },
                        },
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            </section>
          )}

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
              Ballistic v0.15.0
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
