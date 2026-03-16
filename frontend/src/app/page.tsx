"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Zap, ArrowRight, BarChart3, Brain, Shield } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /* If already logged in, redirect to dashboard */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/app/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            AEOS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-aeos-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-aeos-700"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center lg:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-aeos-200 bg-aeos-50 px-4 py-1.5 text-[12px] font-medium text-aeos-700">
          <Brain size={14} />
          AI-powered business intelligence
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 lg:text-5xl">
          Your autonomous
          <br />
          <span className="bg-gradient-to-r from-aeos-600 to-violet-600 bg-clip-text text-transparent">
            enterprise operating system
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
          AEOS analyzes your business performance, detects growth opportunities,
          and builds strategic roadmaps — so your team can focus on execution.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-aeos-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-aeos-600/25 transition hover:bg-aeos-700"
          >
            Start free trial
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-slate-100 bg-slate-50/60 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            {
              icon: <BarChart3 size={22} className="text-aeos-600" />,
              title: "Strategic intelligence",
              desc: "Aggregates signals across marketing, leads, competitors, and operations into executive-level insights.",
            },
            {
              icon: <Brain size={22} className="text-violet-600" />,
              title: "AI copilot",
              desc: "Claude-powered analysis that suggests actions — you approve, the system executes.",
            },
            {
              icon: <Shield size={22} className="text-emerald-600" />,
              title: "Risk detection",
              desc: "Continuous monitoring of business health with automated alerts when metrics drop below thresholds.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <div className="mb-3">{f.icon}</div>
              <h3 className="mb-2 text-[15px] font-semibold text-slate-800">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
        AEOS &bull; Autonomous Enterprise Operating System &bull; v0.1.0
      </footer>
    </div>
  );
}
