"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { completeGoogleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");

    if (!code) {
      setError("Google sign-in was cancelled or could not be completed.");
      return;
    }

    void completeGoogleLogin(code)
      .then(() => router.replace("/app"))
      .catch(() =>
        setError("This Google sign-in has expired. Please try again."),
      );
  }, [completeGoogleLogin, router]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold text-[var(--navy)]">
        {error ? "Couldn’t sign you in" : "Finishing Google sign-in…"}
      </h1>
      {error ? (
        <>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
          <Link
            href="/login"
            className="mt-6 font-medium text-[var(--blue-600)]"
          >
            Return to sign in
          </Link>
        </>
      ) : null}
    </div>
  );
}
