"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, AuthError } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match"] });
      return;
    }

    if (password.length < 8) {
      setFieldErrors({ password: ["Password must be at least 8 characters"] });
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password, passwordConfirmation);
      router.push("/");
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--navy)]">Ballistic</h1>
          <p className="mt-2 text-slate-500">Create your account</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 animate-scale-in">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={`w-full rounded-md border bg-white px-3 py-2 text-[var(--navy)] shadow-sm focus:border-[var(--blue-600)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-600)] ${
                fieldErrors.name ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Your name"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={`w-full rounded-md border bg-white px-3 py-2 text-[var(--navy)] shadow-sm focus:border-[var(--blue-600)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-600)] ${
                fieldErrors.email ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className={`w-full rounded-md border bg-white px-3 py-2 text-[var(--navy)] shadow-sm focus:border-[var(--blue-600)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-600)] ${
                fieldErrors.password ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className={`w-full rounded-md border bg-white px-3 py-2 text-[var(--navy)] shadow-sm focus:border-[var(--blue-600)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-600)] ${
                fieldErrors.password_confirmation ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password_confirmation[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[var(--navy)] px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-600)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--blue-600)] hover:text-[var(--blue)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}


