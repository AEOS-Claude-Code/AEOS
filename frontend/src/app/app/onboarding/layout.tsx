"use client";

import { usePathname } from "next/navigation";
import {
  Zap, Check, Sparkles,
  Building2, Users, Plug, GitBranch, Rocket,
  Globe, Brain, Target, Shield, BarChart3,
  Search, Cpu, Network,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RequireAuth } from "@/lib/auth/AuthProvider";

/* ── Step definitions ──────────────────────────────────────────── */

interface StepDef {
  path: string;
  label: string;
  num: number;
  /** Left panel content per step */
  panel: {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    features: { icon: React.ElementType; label: string }[];
    quote: string;
  };
}

const STEPS: StepDef[] = [
  {
    path: "/app/onboarding/company",
    label: "Company",
    num: 1,
    panel: {
      badge: "AI Website Analysis",
      title: "We scanned your website with",
      highlight: "AI-powered detection",
      subtitle: "AEOS analyzed your website and extracted company data, contacts, social profiles, and services automatically.",
      features: [
        { icon: Search, label: "Deep website crawling & extraction" },
        { icon: Globe, label: "Social profiles auto-detected" },
        { icon: Brain, label: "AI-powered industry classification" },
        { icon: Target, label: "Contact & team member discovery" },
        { icon: BarChart3, label: "Digital readiness scoring" },
      ],
      quote: "Review and confirm the details we found — or edit anything that needs adjusting.",
    },
  },
  {
    path: "/app/onboarding/competitors",
    label: "Competitors",
    num: 2,
    panel: {
      badge: "Competitive Intelligence",
      title: "Know your market with",
      highlight: "AI competitor analysis",
      subtitle: "AEOS identifies your key competitors and continuously monitors their digital strategy.",
      features: [
        { icon: Search, label: "Auto-discover competitors by industry" },
        { icon: BarChart3, label: "Digital presence comparison" },
        { icon: Target, label: "Market positioning insights" },
        { icon: Brain, label: "Strategy gap identification" },
        { icon: Shield, label: "Continuous monitoring & alerts" },
      ],
      quote: "Add or remove competitors — AEOS will track them across all channels.",
    },
  },
  {
    path: "/app/onboarding/integrations",
    label: "Integrations",
    num: 3,
    panel: {
      badge: "Platform Integrations",
      title: "Connect your tools or let",
      highlight: "AEOS AI manage them",
      subtitle: "Link existing business tools for deeper insights, or let AEOS handle entire departments autonomously.",
      features: [
        { icon: Plug, label: "One-click OAuth integrations" },
        { icon: Cpu, label: "AI manages departments for you" },
        { icon: BarChart3, label: "Unified analytics dashboard" },
        { icon: Network, label: "Cross-platform data sync" },
        { icon: Shield, label: "Enterprise-grade security" },
      ],
      quote: "No integrations? No problem — AEOS AI can run your departments from scratch.",
    },
  },
  {
    path: "/app/onboarding/org-chart",
    label: "Org Chart",
    num: 4,
    panel: {
      badge: "AI Organization",
      title: "Deploy your",
      highlight: "AI-powered workforce",
      subtitle: "AEOS builds a complete organizational structure with AI agents ready to work across every department.",
      features: [
        { icon: Users, label: "22+ AI agents per company" },
        { icon: GitBranch, label: "9 department coverage" },
        { icon: Brain, label: "McKinsey-level strategy AI" },
        { icon: Shield, label: "Legal & compliance agents" },
        { icon: Cpu, label: "24/7 autonomous operation" },
      ],
      quote: "Toggle any role between AI and human — build the org chart that fits your vision.",
    },
  },
  {
    path: "/app/onboarding/complete",
    label: "Ready",
    num: 5,
    panel: {
      badge: "Launch Ready",
      title: "Your AI company is",
      highlight: "ready to launch",
      subtitle: "All systems configured. Your AI agents are deployed and ready to start working across your organization.",
      features: [
        { icon: Rocket, label: "All AI agents deployed & active" },
        { icon: BarChart3, label: "Real-time dashboard available" },
        { icon: Brain, label: "Intelligence reports generating" },
        { icon: Network, label: "Cross-department coordination" },
        { icon: Sparkles, label: "Continuous learning & optimization" },
      ],
      quote: "Welcome to the future of enterprise — your AI-powered organization starts now.",
    },
  },
];

/* ── Layout component ──────────────────────────────────────────── */

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <OnboardingShell>{children}</OnboardingShell>
    </RequireAuth>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIdx = STEPS.findIndex((s) => pathname.startsWith(s.path));
  const currentStep = STEPS[currentIdx] || STEPS[0];

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel (hidden on mobile, sticky on scroll) ── */}
      <div className="sticky top-0 hidden h-screen w-[420px] shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-aeos-950 to-slate-900 xl:block">
        {/* Glow effects */}
        <div className="absolute left-1/2 top-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-aeos-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 h-[200px] w-[200px] rounded-full bg-violet-500/10 blur-[80px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,121,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(46,121,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative flex h-full flex-col px-6 py-5">
          {/* Logo */}
          <Link href="/" className="mb-5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 shadow-lg shadow-aeos-500/20">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-white">AEOS</span>
          </Link>

          {/* Step-specific content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-aeos-500/10 px-3 py-1 text-[11px] font-medium text-aeos-400">
                <Sparkles size={11} />
                {currentStep.panel.badge}
              </div>
              <h2 className="text-[22px] font-bold leading-snug text-white">
                {currentStep.panel.title}{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-violet-400 bg-clip-text text-transparent">
                  {currentStep.panel.highlight}
                </span>
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {currentStep.panel.subtitle}
              </p>

              {/* Feature list */}
              <div className="mt-5 space-y-2">
                {currentStep.panel.features.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                      <f.icon size={13} className="text-aeos-400" />
                    </div>
                    <span className="text-xs text-slate-400">{f.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom: progress wizard + quote */}
          <div className="mt-auto space-y-3">

            {/* ── Animated Wizard Step Tracker ── */}
            <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
              {/* Header */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Onboarding Progress</span>
                <span className="text-[10px] font-bold text-aeos-400">{currentIdx + 1} / {STEPS.length}</span>
              </div>

              {/* Overall progress bar */}
              <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-aeos-400 to-violet-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIdx) / (STEPS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* Step nodes */}
              <div className="relative flex items-start justify-between">
                {/* Connecting track behind nodes */}
                <div className="absolute left-3.5 right-3.5 top-3.5 h-px bg-white/[0.08]" />
                {/* Filled segment */}
                <motion.div
                  className="absolute left-3.5 top-3.5 h-px bg-gradient-to-r from-aeos-500 to-violet-500 origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: currentIdx === 0 ? 0 : currentIdx / (STEPS.length - 1) }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ right: "0.875rem", transformOrigin: "left" }}
                />

                {STEPS.map((step, i) => {
                  const done = i < currentIdx;
                  const active = i === currentIdx;
                  const StepIcon = [Building2, Target, Plug, GitBranch, Rocket][i];
                  return (
                    <div key={step.num} className="relative flex flex-col items-center gap-1.5 z-10">
                      {/* Node circle */}
                      <div className="relative">
                        {/* Pulse ring for active step */}
                        {active && (
                          <>
                            <motion.div
                              className="absolute inset-0 rounded-full bg-aeos-500/30"
                              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                              className="absolute inset-0 rounded-full ring-2 ring-aeos-400/50"
                              animate={{ scale: [1, 1.4], opacity: [1, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                            />
                          </>
                        )}
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.08, duration: 0.35 }}
                          className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                            done
                              ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                              : active
                                ? "bg-gradient-to-br from-aeos-400 to-violet-500 shadow-lg shadow-aeos-500/40"
                                : "bg-white/5 ring-1 ring-white/10"
                          }`}
                        >
                          {done ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                              <Check size={11} className="text-white" />
                            </motion.div>
                          ) : (
                            <StepIcon size={11} className={active ? "text-white" : "text-slate-600"} />
                          )}
                        </motion.div>
                      </div>

                      {/* Step label */}
                      <motion.span
                        animate={{ opacity: active ? 1 : done ? 0.7 : 0.35 }}
                        className={`text-[9px] font-semibold leading-tight text-center max-w-[48px] ${
                          active ? "text-aeos-300" : done ? "text-emerald-400" : "text-slate-600"
                        }`}
                      >
                        {step.label}
                      </motion.span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quote */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.path + "-quote"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10"
              >
                <p className="text-xs italic text-slate-500">
                  &ldquo;{currentStep.panel.quote}&rdquo;
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Right panel — content ────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-surface-base">
        {/* Mobile header (only shown on smaller screens) */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6 xl:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide text-fg">AEOS</span>
          </Link>

          {/* Mobile step indicators */}
          <div className="hidden items-center gap-1 sm:flex">
            {STEPS.map((step, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.num} className="flex items-center">
                  <div
                    className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-2xs font-semibold transition-all ${
                      done
                        ? "bg-status-success/10 text-status-success"
                        : active
                          ? "bg-surface-secondary text-fg ring-1 ring-border"
                          : "text-fg-hint"
                    }`}
                  >
                    {done ? (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-status-success">
                        <Check size={10} className="text-white" />
                      </div>
                    ) : (
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                          active
                            ? "bg-aeos-500 text-white"
                            : "bg-surface-secondary border border-border text-fg-hint"
                        }`}
                      >
                        {step.num}
                      </span>
                    )}
                    {step.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-1 h-px w-5 ${done ? "bg-status-success/40" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <span className="text-2xs text-fg-hint sm:hidden">
            Step {(currentIdx >= 0 ? currentIdx : 0) + 1}/5
          </span>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
