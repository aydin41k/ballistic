"use client";

import { useState } from "react";
import { getGoogleAuthorisationUrl } from "@/lib/auth";

export function GoogleSignInButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function beginGoogleSignIn() {
    setIsLoading(true);
    onError("");

    try {
      window.location.assign(await getGoogleAuthorisationUrl());
    } catch {
      onError("Google sign-in is not available right now. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void beginGoogleSignIn()}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--blue-600)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="#4285F4"
          d="M22.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.96a5.1 5.1 0 0 1-2.21 3.34v2.72h3.58c2.1-1.93 3.27-4.78 3.27-7.9Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.98 0 5.49-.98 7.33-2.67l-3.58-2.72a6.7 6.7 0 0 1-9.98-3.52H2.08v2.8A11 11 0 0 0 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.77 14.09a6.6 6.6 0 0 1 0-4.18v-2.8H2.08a11 11 0 0 0 0 9.78l3.69-2.8Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.31c1.75 0 3.32.6 4.56 1.79l3.44-3.44A11.52 11.52 0 0 0 2.08 7.11l3.69 2.8A6.56 6.56 0 0 1 12 5.31Z"
        />
      </svg>
      {isLoading ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
