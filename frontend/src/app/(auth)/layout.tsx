"use client";

import { Zap, Bot, Brain, Target, Shield, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: Bot, label: "22+ AI agents deployed per company" },
  { icon: Brain, label: "McKinsey-level strategy AI" },
  { icon: Target, label: "Automated lead intelligence" },
  { icon: Shield, label: "Legal & compliance AI agents" },
  { icon: BarChart3, label: "Real-time business analytics" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="flex min-h-screen">
        {/* Left panel — visual showcase (hidden on mobile) */}
        <div className="relative hidden w-[480px] shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-aeos-950 to-slate-900 lg:block">
          {/* Glow effects */}
          <div className="absolute left-1/2 top-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-aeos-500/10 blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/3 h-[200px] w-[200px] rounded-full bg-violet-500/10 blur-[80px]" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(46,121,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(46,121,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="relative flex h-full flex-col justify-between p-10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 shadow-lg shadow-aeos-500/20">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">AEOS</span>
            </Link>

            {/* Main content */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-aeos-500/10 px-3 py-1 text-xs font-medium text-aeos-400">
                  <Sparkles size={12} />
                  AI Enterprise Operating System
                </div>
                <h2 className="text-2xl font-bold leading-tight text-white">
                  Transform your company into an{" "}
                  <span className="bg-gradient-to-r from-aeos-400 to-violet-400 bg-clip-text text-transparent">
                    AI-powered organization
                  </span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Enter your website URL and AEOS deploys 22+ AI agents across 9 departments — in minutes.
                </p>
              </motion.div>

              {/* Feature list */}
              <div className="mt-8 space-y-3">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                      <f.icon size={14} className="text-aeos-400" />
                    </div>
                    <span className="text-sm text-slate-400">{f.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom quote */}
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-sm italic text-slate-500">
                &ldquo;Every company — regardless of size — deserves a complete organization.&rdquo;
              </p>
              <p className="mt-2 text-xs text-slate-500">AEOS Vision</p>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-10">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">AEOS</span>
          </Link>
          {children}
        </div>
      </div>
  );
}
