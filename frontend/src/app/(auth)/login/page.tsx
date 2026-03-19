"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

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

  const ic = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:bg-white focus:ring-2 focus:ring-aeos-500/20";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your AEOS workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" className={ic} required />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <button type="button" className="text-2xs font-medium text-aeos-400 hover:text-aeos-500 transition">
              Forgot password?
            </button>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={"\u2022".repeat(8)} className={ic} required />
        </div>

        {error && (
          <div className="rounded-xl bg-status-danger/10 px-4 py-2.5 text-xs text-status-danger">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3 text-sm font-bold text-white shadow-lg shadow-aeos-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:shadow-xl disabled:opacity-50">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-2xs text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-aeos-400 hover:text-aeos-500 transition">
          Get started free
        </Link>
      </p>
    </motion.div>
  );
}
