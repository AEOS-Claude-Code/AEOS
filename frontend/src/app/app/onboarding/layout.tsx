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
      {/* ── Left branding panel (hidden on mobile) ───────────── */}
      <div className="relative hidden w-[420px] shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-aeos-950 to-slate-900 xl:block">
        {/* Glow effects */}
        <div className="absolute left-1/2 top-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-aeos-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 h-[200px] w-[200px] rounded-full bg-violet-500/10 blur-[80px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,121,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(46,121,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative flex h-full flex-col justify-between p-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 shadow-lg shadow-aeos-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">AEOS</span>
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
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-aeos-500/10 px-3 py-1 text-xs font-medium text-aeos-400">
                <Sparkles size={12} />
                {currentStep.panel.badge}
              </div>
              <h2 className="text-2xl font-bold leading-tight text-white">
                {currentStep.panel.title}{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-violet-400 bg-clip-text text-transparent">
                  {currentStep.panel.highlight}
                </span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {currentStep.panel.subtitle}
              </p>

              {/* Feature list */}
              <div className="mt-8 space-y-3">
                {currentStep.panel.features.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                      <f.icon size={14} className="text-aeos-400" />
                    </div>
                    <span className="text-sm text-slate-400">{f.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom: progress + quote */}
          <div className="space-y-4">
            {/* Step progress indicators */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, i) => {
                const done = i < currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={step.num} className="flex items-center gap-2">
                    <div
                      className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all ${
                        done
                          ? "bg-emerald-500/15 text-emerald-400"
                          : active
                            ? "bg-aeos-500/15 text-aeos-400 ring-1 ring-aeos-500/30"
                            : "text-slate-600"
                      }`}
                    >
                      {done ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                          <Check size={10} className="text-white" />
                        </div>
                      ) : (
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                            active
                              ? "bg-aeos-500 text-white"
                              : "bg-white/5 text-slate-600 ring-1 ring-white/10"
                          }`}
                        >
                          {step.num}
                        </span>
                      )}
                      <span className="hidden min-[1400px]:inline">{step.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-px w-3 ${done ? "bg-emerald-500/40" : "bg-white/10"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quote */}
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-sm italic text-slate-500">
                &ldquo;{currentStep.panel.quote}&rdquo;
              </p>
            </div>
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
