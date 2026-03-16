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
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">
          Sign in to your AEOS workspace
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
          >
            {loading ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>

        {/* Dev shortcut */}
        <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3">
          <p className="text-[11px] text-amber-700">
            <span className="font-semibold">Dev mode:</span> Enter any
            email/password to sign in with the demo account.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-aeos-600 hover:text-aeos-700">
          Get started
        </Link>
      </p>
    </div>
  );
}
