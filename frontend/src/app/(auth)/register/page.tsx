"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName, companyName, websiteUrl);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <h1 className="mb-1 text-xl font-bold text-fg">Create your workspace</h1>
        <p className="mb-6 text-sm text-fg-muted">Get a free company intelligence report</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Dana Chen"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Work email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Company name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Digital"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Company website
              <span className="ml-1.5 rounded-pill bg-aeos-50 px-1.5 py-px text-2xs font-semibold text-aeos-700">
                Free report
              </span>
            </label>
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100" />
            <p className="mt-1 text-2xs text-fg-hint">
              We'll analyze your website and generate a shareable intelligence report — free.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" minLength={6}
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required />
          </div>

          {error && (
            <p className="rounded-lg bg-status-danger-light px-3 py-2 text-xs text-status-danger-text">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing your company\u2026
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap size={14} />
                Get free report
              </span>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-aeos-600 hover:text-aeos-700">Sign in</Link>
      </p>
    </div>
  );
}
