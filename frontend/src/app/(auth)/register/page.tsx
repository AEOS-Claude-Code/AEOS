"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Globe, Check, Loader2, Building2, Phone, Share2, Bot, ArrowRight, Rocket } from "lucide-react";

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "bg-slate-50", width: "w-0" };
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

const PROGRESS_STEPS = [
  { icon: Globe, label: "Workspace", delay: 0 },
  { icon: Globe, label: "Scanning", delay: 2500 },
  { icon: Building2, label: "Company", delay: 6000 },
  { icon: Phone, label: "Contacts", delay: 10000 },
  { icon: Share2, label: "Social", delay: 14000 },
  { icon: Bot, label: "AI Agents", delay: 18000 },
];

const ACTIVE_MESSAGES = [
  "Setting up your account...",
  "Fetching pages with headless browser...",
  "Detecting name, industry, location...",
  "Phone numbers, emails, WhatsApp...",
  "LinkedIn, Instagram, Facebook...",
  "Preparing your AI-powered team...",
];

function ProgressOverlay({ websiteUrl }: { websiteUrl: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    const timers = PROGRESS_STEPS.map((step, i) => setTimeout(() => setCurrentStep(i), step.delay));
    return () => timers.forEach(clearTimeout);
  }, []);
  const progress = Math.min(100, ((currentStep + 1) / PROGRESS_STEPS.length) * 100);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-400 to-aeos-700 shadow-lg shadow-aeos-500/20">
              <Globe size={28} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
              <Loader2 size={12} className="animate-spin text-aeos-500" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Setting up your AEOS workspace</h2>
            {websiteUrl && (
              <p className="text-sm text-slate-500">
                Analyzing <span className="font-semibold text-aeos-400">{websiteUrl.replace(/https?:\/\/(www\.)?/, "")}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mb-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-50">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-aeos-500 to-emerald-500"
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          {PROGRESS_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const Icon = step.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-1.5">
                {done ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow">
                    <Check size={16} className="text-white" />
                  </div>
                ) : active ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aeos-500/10 shadow ring-2 ring-aeos-400">
                    <Loader2 size={16} className="animate-spin text-aeos-400" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
                    <Icon size={16} className="text-slate-400" />
                  </div>
                )}
                <span className={`text-center text-2xs leading-tight ${
                  done ? "font-medium text-emerald-400" : active ? "font-bold text-aeos-400" : "text-slate-400"
                }`}>{step.label}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-5 rounded-xl bg-gradient-to-r from-aeos-500/10 to-violet-500/10 px-4 py-2.5 text-center">
          <p className="text-xs font-medium text-aeos-400">{ACTIVE_MESSAGES[currentStep] || "Processing..."}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill website URL from landing page query param
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) setWebsiteUrl(urlParam);
  }, [searchParams]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain uppercase, lowercase, and a digit."); return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName, websiteUrl);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 502 || status === 503) setError("Server is starting up. Please wait a moment and try again.");
      else if (Array.isArray(detail)) setError(detail.map((d: any) => d.msg || d).join(". "));
      else setError(detail || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  }

  const ic = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:bg-white focus:ring-2 focus:ring-aeos-500/20";

  if (loading) return <ProgressOverlay websiteUrl={websiteUrl} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Start your AI-powered company</h1>
        <p className="mt-1 text-sm text-slate-500">AEOS will analyze your business and deploy AI agents across every department</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name" className={ic} required />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Work email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" className={ic} required />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Company website
            <span className="ml-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-aeos-500/10 px-2 py-0.5 text-2xs font-bold text-emerald-400">
              Auto-setup
            </span>
          </label>
          <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourcompany.com" className={ic} />
          <p className="mt-1 text-2xs text-slate-400">
            AEOS will scan your website and deploy AI agents for your company.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={"\u2022".repeat(8)} minLength={8} className={ic} required />
          {password && (
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-slate-50">
                <div className={`h-1 rounded-full transition-all ${strength.color} ${strength.width}`} />
              </div>
              <p className="mt-0.5 text-2xs text-slate-400">{strength.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={"\u2022".repeat(8)} minLength={8}
            className={`${ic} ${passwordMismatch ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20" : ""}`} required />
          {passwordMismatch && <p className="mt-1 text-2xs text-status-danger">Passwords do not match</p>}
        </div>

        {error && (
          <div className="rounded-xl bg-status-danger/10 px-4 py-2.5 text-xs text-status-danger">{error}</div>
        )}

        <button type="submit" disabled={loading || passwordMismatch}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3 text-sm font-bold text-white shadow-lg shadow-aeos-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:shadow-xl disabled:opacity-50">
          <Rocket size={16} />
          Create workspace & deploy AI
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-aeos-400 hover:text-aeos-500 transition">Sign in</Link>
      </p>
    </motion.div>
  );
}
