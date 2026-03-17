"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { Zap } from "lucide-react";

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "bg-gray-200", width: "w-0" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-400", width: "w-1/4" };
  if (score === 3) return { label: "Fair", color: "bg-yellow-400", width: "w-2/4" };
  if (score === 4) return { label: "Good", color: "bg-blue-400", width: "w-3/4" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain uppercase, lowercase, and a digit.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName, websiteUrl);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 502 || status === 503) {
        setError("Server is starting up. Please wait a moment and try again.");
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || d).join(". "));
      } else {
        setError(detail || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100";

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <h1 className="mb-1 text-xl font-bold text-fg">Create your workspace</h1>
        <p className="mb-6 text-sm text-fg-muted">Get a free company intelligence report</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Dana Chen" className={inputClass} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Work email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" className={inputClass} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Company website
              <span className="ml-1.5 rounded-pill bg-aeos-50 px-1.5 py-px text-2xs font-semibold text-aeos-700">
                Free report
              </span>
            </label>
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com" className={inputClass} />
            <p className="mt-1 text-2xs text-fg-hint">
              We'll analyze your website and generate a shareable intelligence report — free.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={"\u2022".repeat(8)} minLength={8} className={inputClass} required />
            {password && (
              <div className="mt-1.5">
                <div className="h-1 w-full rounded-full bg-gray-100">
                  <div className={`h-1 rounded-full transition-all ${strength.color} ${strength.width}`} />
                </div>
                <p className="mt-0.5 text-2xs text-fg-hint">{strength.label} — min 8 chars, uppercase, lowercase, digit</p>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Confirm password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={"\u2022".repeat(8)} minLength={8}
              className={`${inputClass} ${passwordMismatch ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
              required />
            {passwordMismatch && (
              <p className="mt-1 text-2xs text-red-500">Passwords do not match</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-status-danger-light px-3 py-2 text-xs text-status-danger-text">{error}</p>
          )}

          <button type="submit" disabled={loading || passwordMismatch}
            className="w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing your company…
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
