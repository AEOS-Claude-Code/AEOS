"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <h1 className="mb-1 text-xl font-bold text-fg">Welcome back</h1>
        <p className="mb-6 text-sm text-fg-muted">Sign in to your AEOS workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-status-danger-light px-3 py-2 text-xs text-status-danger-text">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
          >
            {loading ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-aeos-600 hover:text-aeos-700">
          Get started
        </Link>
      </p>
    </div>
  );
}
