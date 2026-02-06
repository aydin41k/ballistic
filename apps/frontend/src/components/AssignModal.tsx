"use client";

import type { UserLookup } from "@/types";
import { useState, useEffect, useCallback } from "react";
import { lookupUsers, discoverUser } from "@/lib/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: UserLookup | null) => void;
  currentAssignee?: UserLookup | null;
};

export function AssignModal({
  isOpen,
  onClose,
  onSelect,
  currentAssignee,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserLookup[]>([]);
  const [discoveredUser, setDiscoveredUser] = useState<UserLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search: lookup connected users first, then discover if empty
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setDiscoveredUser(null);
      return;
    }

    setLoading(true);
    setError(null);
    setDiscoveredUser(null);

    try {
      // First search among connected users
      const users = await lookupUsers(searchQuery);

      if (users.length > 0) {
        setResults(users);
        return;
      }

      // No connected user found — try discovery (exact email or phone)
      setResults([]);
      const discovery = await discoverUser(searchQuery);
      if (discovery.found && discovery.user) {
        setDiscoveredUser(discovery.user);
      }
    } catch (err) {
      setError("Failed to search users");
      console.error("User lookup error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setDiscoveredUser(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[var(--navy)]">
            Assign Task
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              className="text-slate-500"
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

        {/* Search input */}
        <div className="p-4">
          <input
            type="text"
            placeholder="Search by email or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none"
            autoFocus
          />
          <p className="mt-2 text-xs text-slate-500">
            Enter email or last 9 digits of phone number
          </p>
        </div>

        {/* Current assignee */}
        {currentAssignee && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  {currentAssignee.name}
                </div>
                <div className="text-xs text-slate-500">
                  {currentAssignee.email_masked}
                </div>
              </div>
              <button
                onClick={() => onSelect(null)}
                className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="px-4 pb-4 max-h-64 overflow-y-auto">
          {loading && (
            <div className="py-4 text-center text-sm text-slate-500">
              Searching...
            </div>
          )}

          {error && (
            <div className="py-4 text-center text-sm text-red-500">{error}</div>
          )}

          {!loading &&
            !error &&
            results.length === 0 &&
            !discoveredUser &&
            query.length >= 3 && (
              <div className="py-4 text-center text-sm text-slate-500">
                No users found
              </div>
            )}

          {/* Connected users — direct selection */}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--blue)] flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {user.email_masked}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Discovered user — not yet connected, but backend auto-connects on assignment */}
          {!loading && discoveredUser && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                User found — a connection will be created automatically
              </p>
              <button
                onClick={() => {
                  onSelect(discoveredUser);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-md bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium">
                  {discoveredUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {discoveredUser.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {discoveredUser.email_masked}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
