"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { Zap, Globe, Check, Loader2, Building2, Phone, Share2, Brain, Bot } from "lucide-react";

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

/* ── Progress steps config ─────────────────────────────────────── */

const PROGRESS_STEPS = [
  { icon: Globe, label: "Creating your workspace", sublabel: "Setting up your account...", delay: 0 },
  { icon: Globe, label: "Scanning website", sublabel: "Fetching pages with headless browser...", delay: 2000 },
  { icon: Building2, label: "Detecting company info", sublabel: "Company name, industry, location...", delay: 5000 },
  { icon: Phone, label: "Extracting contacts", sublabel: "Phone numbers, emails, WhatsApp...", delay: 8000 },
  { icon: Share2, label: "Finding social profiles", sublabel: "LinkedIn, Instagram, Facebook...", delay: 11000 },
  { icon: Brain, label: "Analyzing tech stack", sublabel: "Technologies and platforms...", delay: 14000 },
  { icon: Bot, label: "Building AI org chart", sublabel: "Preparing your AI-powered team...", delay: 17000 },
];

/* ── Animated progress overlay ─────────────────────────────────── */

function ProgressOverlay({ websiteUrl }: { websiteUrl: string }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = PROGRESS_STEPS.map((step, i) =>
      setTimeout(() => setCurrentStep(i), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Progress bar width
  const progress = Math.min(100, ((currentStep + 1) / PROGRESS_STEPS.length) * 100);

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-400 to-aeos-700 shadow-lg shadow-aeos-200">
              <Globe size={36} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md">
              <Loader2 size={18} className="animate-spin text-aeos-500" />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 -m-3 animate-ping rounded-2xl border-2 border-aeos-200 opacity-20" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-fg">Setting up your AEOS workspace</h2>
            {websiteUrl && (
              <p className="mt-1 text-sm text-fg-muted">
                Analyzing <span className="font-medium text-aeos-600">{websiteUrl.replace(/https?:\/\/(www\.)?/, "")}</span>
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-aeos-500 to-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-2xs text-fg-hint">{Math.round(progress)}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {PROGRESS_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const Icon = step.icon;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500 ${
                  active ? "bg-aeos-50 shadow-sm" : done ? "opacity-70" : "opacity-30"
                }`}
              >
                {done ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
                    <Check size={14} className="text-white" />
                  </div>
                ) : active ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-aeos-100">
                    <Loader2 size={14} className="animate-spin text-aeos-600" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Icon size={14} className="text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${active ? "font-semibold text-aeos-800" : done ? "font-medium text-emerald-700" : "text-fg-hint"}`}>
                    {step.label}
                  </p>
                  {active && (
                    <p className="mt-0.5 text-2xs text-aeos-600">{step.sublabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fun fact */}
        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-2xs text-fg-muted">
            AEOS uses a headless browser to render JavaScript and extract every detail from your website
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main register page ────────────────────────────────────────── */

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

  const inputClass = "w-full rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100";

  /* ── Loading: show progress overlay ──────────────────────────── */

  if (loading) {
    return <ProgressOverlay websiteUrl={websiteUrl} />;
  }

  /* ── Registration form ───────────────────────────────────────── */

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
              <span className="ml-1.5 rounded-full bg-aeos-50 px-1.5 py-px text-2xs font-semibold text-aeos-700">
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
            className="w-full rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3 text-sm font-bold text-white shadow-md shadow-aeos-200/50 transition-all hover:shadow-lg hover:shadow-aeos-300/50 disabled:opacity-50">
            <span className="flex items-center justify-center gap-2">
              <Zap size={16} />
              Get free report
            </span>
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
