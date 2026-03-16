"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";

export default function RegisterPage() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      /*
       * Phase 2: POST /api/auth/register → creates user + workspace
       * then auto-login and redirect to /app/dashboard or setup wizard
       */
      await login(email, password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">
          Create your workspace
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Start your free trial — no credit card required
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-700">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dana Chen"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-700">
              Work email
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
              Company name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Digital"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
          >
            {loading ? "Creating workspace\u2026" : "Create workspace"}
          </button>
        </form>

        <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3">
          <p className="text-[11px] text-amber-700">
            <span className="font-semibold">Dev mode:</span> Submit any data to
            create a demo session. Phase 2 will add real registration.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-aeos-600 hover:text-aeos-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
