"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PushNotificationToggle } from "./PushNotificationToggle";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/contexts/AuthContext";
import {
  createMcpToken,
  fetchMcpTokens,
  revokeMcpToken,
  uploadAvatar,
} from "@/lib/api";
import type { McpToken, Project } from "@/types";

type TabKey = "profile" | "features" | "integrations" | "notifications";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Active projects the user can exclude from their main feed. */
  projects?: Project[];
}

/**
 * Tabbed bottom-sheet settings modal.
 *
 * ┌─────────────────────────────────────┐
 * │ Settings                       [×]  │  ← sticky header + tab bar
 * │ ──────────────────────────────────  │
 * │ [Profile] [Features] [Integrations] │
 * ├─────────────────────────────────────┤
 * │                                     │  ← scrollable body
 * │ (active tab contents)               │
 * │                                     │
 * └─────────────────────────────────────┘
 *
 * Constrained to 85vh with internal scrolling on the body pane so long
 * sections (MCP tokens, project lists) don't push the close button off-screen.
 */
export function SettingsModal({
  isOpen,
  onClose,
  projects = [],
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset to the first tab when the modal re-opens so state doesn't leak
  // from a previous session ("why am I looking at MCP tokens?").
  useEffect(() => {
    if (isOpen) {
      setActiveTab("profile");
      setError(null);
    }
  }, [isOpen]);

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
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl animate-slide-in-up"
      >
        {/* Sticky header + tab bar */}
        <div className="shrink-0 border-b border-gray-100 px-6 pt-5">
          <div className="flex items-center justify-between">
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

          <nav className="mt-3 flex gap-1" role="tablist">
            <TabButton
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </TabButton>
            <TabButton
              active={activeTab === "features"}
              onClick={() => setActiveTab("features")}
            >
              Features
            </TabButton>
            <TabButton
              active={activeTab === "integrations"}
              onClick={() => setActiveTab("integrations")}
            >
              Integrations
            </TabButton>
            <TabButton
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            >
              Notifications
            </TabButton>
          </nav>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {activeTab === "profile" && (
            <ProfileTab projects={projects} onError={setError} />
          )}
          {activeTab === "features" && <FeaturesTab onError={setError} />}
          {activeTab === "integrations" && (
            <IntegrationsTab onError={setError} isActive={isOpen} />
          )}
          {activeTab === "notifications" && (
            <div className="rounded-lg bg-gray-50 p-4">
              <PushNotificationToggle />
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">
            Ballistic v0.17.0
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-3 pb-3 pt-1 text-sm font-medium transition-colors ${
        active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600" />
      )}
    </button>
  );
}

/** Reusable iOS-style toggle switch. */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Profile — name, email, avatar, hidden-project selection
// ─────────────────────────────────────────────────────────────────────────────

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

function ProfileTab({
  projects,
  onError,
}: {
  projects: Project[];
  onError: (msg: string | null) => void;
}) {
  const { user, updateUser, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [excludedIds, setExcludedIds] = useState<Set<string>>(
    () => new Set(user?.excluded_project_ids ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-seed local form state when the cached user changes (e.g. after a save
  // → the server normalised the email and AuthContext picked that up).
  //
  // We depend on primitive values, not the `user` object reference — object
  // identity isn't guaranteed stable across renders if a consumer (or test
  // mock) constructs a fresh user each time, and depending on `[user]` here
  // would trigger an infinite setState→render→effect loop in that case.
  // The array dep is flattened to a string for the same reason.
  const excludedKey = (user?.excluded_project_ids ?? []).join("|");
  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setExcludedIds(new Set(user?.excluded_project_ids ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.email, excludedKey]);

  const isDirty = useMemo(() => {
    if (name !== (user?.name ?? "")) return true;
    if (email !== (user?.email ?? "")) return true;
    const original = new Set(user?.excluded_project_ids ?? []);
    if (original.size !== excludedIds.size) return true;
    for (const id of excludedIds) if (!original.has(id)) return true;
    return false;
  }, [name, email, excludedIds, user]);

  function toggleExclusion(projectId: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !isDirty) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      onError("Name and email cannot be empty.");
      return;
    }

    setSaving(true);
    onError(null);
    try {
      await updateUser({
        name: trimmedName,
        email: trimmedEmail,
        excluded_project_ids: [...excludedIds],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Clear the input so selecting the same file twice still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      onError("Avatar must be under 2 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      onError("Avatar must be an image.");
      return;
    }

    setUploading(true);
    onError(null);
    try {
      await uploadAvatar(file);
      // The upload endpoint returns the updated user, but it bypasses the
      // AuthContext setter. Refresh to pick up the new avatar_url.
      await refreshUser();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-200">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xl font-semibold text-gray-500">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 text-xs text-white">
              …
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Change avatar"}
          </button>
          <p className="mt-1 text-[11px] text-gray-500">
            PNG or JPEG, max 2 MB
          </p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="settings-name"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Name
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="settings-email"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="settings-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {email !== user?.email && (
          <p className="mt-1 text-[11px] text-amber-600">
            Changing your email will require re-verification.
          </p>
        )}
      </div>

      {/* Hidden projects */}
      {projects.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium text-gray-700">
            Hidden projects
          </h3>
          <p className="mb-2 text-[11px] text-gray-500">
            Tasks in these projects won&apos;t appear in your main feed.
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
            {projects.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={excludedIds.has(p.id)}
                  onChange={() => toggleExclusion(p.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1 truncate text-sm text-gray-800">
                  {p.name}
                </span>
                {p.color && (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Features — per-user feature flag toggles
// ─────────────────────────────────────────────────────────────────────────────

function FeaturesTab({ onError }: { onError: (msg: string | null) => void }) {
  const { dates, delegation, aiAssistant, setFlag } = useFeatureFlags();
  const [saving, setSaving] = useState(false);

  async function handleToggle(
    flag: "dates" | "delegation" | "ai_assistant",
    value: boolean,
  ) {
    if (saving) return;
    setSaving(true);
    onError(null);
    try {
      await setFlag(flag, value);
    } catch (err) {
      console.error("Failed to save feature flag:", err);
      onError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      {saving && <p className="mb-3 text-xs text-blue-600">Saving…</p>}
      <div className="space-y-4">
        <FeatureRow
          title="Dates & Scheduling"
          description="Due dates, scheduled dates, and repeating tasks"
          checked={dates}
          disabled={saving}
          onChange={(v) => handleToggle("dates", v)}
        />
        <FeatureRow
          title="Task Delegation"
          description="Assign tasks to other users"
          checked={delegation}
          disabled={saving}
          onChange={(v) => handleToggle("delegation", v)}
        />
        <FeatureRow
          title="AI Assistant (MCP)"
          description="Enable MCP token management for agent integrations"
          checked={aiAssistant}
          disabled={saving}
          onChange={(v) => handleToggle("ai_assistant", v)}
        />
      </div>
    </div>
  );
}

function FeatureRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={title}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Integrations — MCP token management
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationsTab({
  onError,
  isActive,
}: {
  onError: (msg: string | null) => void;
  isActive: boolean;
}) {
  const { aiAssistant } = useFeatureFlags();
  const [mcpTokens, setMcpTokens] = useState<McpToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenLoadError, setTokenLoadError] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

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
    if (isActive && aiAssistant) void loadMcpTokens();
  }, [isActive, aiAssistant, loadMcpTokens]);

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenName.trim() || creatingToken) return;
    setCreatingToken(true);
    onError(null);
    try {
      const created = await createMcpToken(tokenName.trim());
      setMcpTokens((prev) => [created.token_record, ...prev]);
      setNewToken(created.token);
      setTokenName("");
    } catch (err) {
      console.error("Failed to create MCP token:", err);
      onError("Failed to create MCP token.");
    } finally {
      setCreatingToken(false);
    }
  }

  async function handleRevokeToken(tokenId: string) {
    setConfirmRevokeId(null);
    onError(null);
    try {
      await revokeMcpToken(tokenId);
      setMcpTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch (err) {
      console.error("Failed to revoke MCP token:", err);
      onError("Failed to revoke MCP token.");
    }
  }

  function copyNewToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!aiAssistant) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Enable <strong>AI Assistant (MCP)</strong> in the Features tab to
          manage integration tokens.
        </p>
      </div>
    );
  }

  const mcpBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const mcpUrl = mcpBase ? new URL("/mcp", mcpBase).toString() : "/mcp";

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-50 p-4 space-y-4">
        {newToken && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="mb-2 text-xs text-green-800">
              New token created. Copy it now — you won&apos;t be able to view it
              again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-green-100 p-2 text-xs">
                {newToken}
              </code>
              <button
                type="button"
                onClick={copyNewToken}
                className="rounded border border-green-300 bg-white px-3 py-1 text-xs hover:bg-green-100"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateToken} className="flex items-center gap-2">
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
            {creatingToken ? "Creating…" : "Create"}
          </button>
        </form>

        {loadingTokens ? (
          <p className="text-xs text-gray-500">Loading tokens…</p>
        ) : tokenLoadError ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-red-600">Failed to load tokens.</p>
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
                      Replace this broad token with a dedicated MCP token.
                    </p>
                  )}
                </div>

                {confirmRevokeId === token.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-gray-600">Revoke?</span>
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
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-3">
        <p className="mb-2 text-xs text-gray-700">MCP config (header auth):</p>
        <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-[11px] text-gray-800">
          {JSON.stringify(
            {
              mcpServers: {
                ballistic: {
                  url: mcpUrl,
                  headers: { Authorization: "Bearer YOUR_MCP_TOKEN" },
                },
              },
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
