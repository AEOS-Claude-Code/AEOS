"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Zap, ArrowRight, BarChart3, Brain, Shield, Globe, Bot,
  Users, Target, Sparkles, Building2, Check, ChevronRight,
  Cpu, TrendingUp, Lock, Star,
} from "lucide-react";

/* ── Animation variants ───────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimateWhenVisible({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Floating particles background ────────────────────────────── */

function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(46,121,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(46,121,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-aeos-400/[0.12] blur-[150px]" />
      <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-400/[0.08] blur-[130px]" />
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.05] blur-[120px]" />
    </div>
  );
}

/* ── Main landing page ────────────────────────────────────────── */

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/app/dashboard");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="dark">
        <div className="flex min-h-screen items-center justify-center bg-[#070b18]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="dark">
      <div className="min-h-screen bg-[#070b18]">
        {/* ═══ NAVIGATION ═══ */}
        <nav className="sticky top-0 z-50 border-b border-border bg-[#070b18]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700 shadow-md shadow-aeos-500/20">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-fg">AEOS</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-fg-secondary transition hover:text-fg">Features</a>
              <a href="#how-it-works" className="text-sm text-fg-secondary transition hover:text-fg">How it works</a>
              <a href="#pricing" className="text-sm text-fg-secondary transition hover:text-fg">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-fg-secondary transition hover:bg-surface-secondary">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-gradient-to-r from-aeos-500 to-aeos-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-aeos-600/20 transition hover:shadow-lg">
                Get started free
              </Link>
            </div>
          </div>
        </nav>

        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:pt-28">
          <GridBackground />
          {/* Glow orbs */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.12),transparent_70%)]" />
          <div className="pointer-events-none absolute right-[10%] top-[100px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(16,185,129,0.08),transparent_70%)]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-aeos-500/20 bg-aeos-500/10 px-4 py-1.5 text-xs font-semibold text-aeos-400 shadow-sm backdrop-blur">
                <Sparkles size={14} />
                AI-Powered Enterprise Operating System
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Your company deserves a
              <br />
              <span className="bg-gradient-to-r from-aeos-400 via-violet-400 to-aeos-400 bg-clip-text text-transparent">
                complete organization
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Enter your website. AEOS scans it, builds your company profile, identifies every
              missing department, and deploys AI agents to fill the gaps — giving a 7-person
              team the operational depth of a 70-person enterprise.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[0_0_24px_rgba(59,130,246,0.3)] transition-all hover:shadow-2xl hover:shadow-aeos-600/30">
                Get your free company report
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#how-it-works"
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary/50 px-6 py-3.5 text-sm font-semibold text-fg-secondary transition hover:bg-surface-secondary hover:shadow-md">
                See how it works
              </Link>
            </motion.div>

            {/* Trust bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-fg-hint">
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" /> Free company intelligence report</span>
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" /> 15 AI engines activate instantly</span>
              <span className="flex items-center gap-1"><Check size={14} className="text-emerald-500" /> McKinsey-grade strategy AI</span>
            </motion.div>
          </div>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <section className="border-y border-border bg-surface-secondary/50 py-12">
          <AnimateWhenVisible className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
            {[
              { value: "27", label: "AI agent task types", gradient: "from-blue-400 to-cyan-400" },
              { value: "9", label: "Departments automated", gradient: "from-emerald-400 to-green-400" },
              { value: "15", label: "Intelligence engines", gradient: "from-violet-400 to-purple-400" },
              { value: "2 min", label: "From signup to AI team", gradient: "from-amber-400 to-yellow-400" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center">
                <p className={`text-3xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>{stat.value}</p>
                <p className="mt-1 text-sm text-fg-muted">{stat.label}</p>
              </motion.div>
            ))}
          </AnimateWhenVisible>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="bg-surface-base px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold text-aeos-400">PLATFORM CAPABILITIES</p>
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                Everything your business needs, <span className="text-aeos-400">powered by AI</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-fg-muted">
                From website analysis to full organizational deployment, AEOS handles it all.
              </p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Globe, color: "from-blue-500 to-cyan-500", tint: "bg-blue-500/5 border-blue-500/10", title: "Smart Website Analysis", desc: "Headless browser scans your website to detect company info, contacts, social profiles, and technology stack automatically." },
                { icon: Brain, color: "from-violet-500 to-purple-600", tint: "bg-violet-500/5 border-violet-500/10", title: "Strategic Intelligence", desc: "McKinsey-level AI analyzes your market position, competitors, and generates a complete business plan with financial models." },
                { icon: Bot, color: "from-aeos-500 to-aeos-700", tint: "bg-aeos-500/5 border-aeos-500/10", title: "AI Department Agents", desc: "22+ AI agents deployed across 9 departments — Sales, Marketing, HR, Finance, Legal, Operations, IT, Procurement, Strategy." },
                { icon: Target, color: "from-orange-500 to-red-500", tint: "bg-orange-500/5 border-orange-500/10", title: "Lead Intelligence", desc: "AI-powered lead scoring, pipeline management, and automated outreach — your sales team gets AI colleagues from day one." },
                { icon: TrendingUp, color: "from-emerald-500 to-green-600", tint: "bg-emerald-500/5 border-emerald-500/10", title: "Digital Presence Engine", desc: "Continuous monitoring of your web presence, SEO, social media, and competitor positioning with actionable recommendations." },
                { icon: Lock, color: "from-slate-400 to-gray-500", tint: "bg-slate-500/5 border-slate-500/10", title: "Compliance & Legal AI", desc: "Contract review, regulatory monitoring, and compliance tracking — trained on Saudi Vision 2030, PDPL, and GCC commercial law." },
              ].map((feature) => (
                <motion.div key={feature.title} variants={fadeUp}
                  className={`group rounded-2xl border ${feature.tint} p-6 transition-all duration-300 hover:-translate-y-1 hover:border-aeos-500/20 hover:shadow-xl hover:shadow-aeos-500/5`}>
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-md`}>
                    <feature.icon size={20} className="text-white" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-fg">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-muted">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="bg-surface-secondary/50 px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-5xl">
            <motion.div variants={fadeUp} className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold text-aeos-400">THE 4-PHASE JOURNEY</p>
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                From signup to <span className="text-aeos-400">full AI deployment</span>
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                { step: "01", title: "Company Intake", desc: "Enter your website URL. AEOS scans it with a headless browser and auto-detects your company name, industry, contacts, social profiles, and tech stack.", icon: Globe, color: "from-blue-500 to-cyan-500", tint: "bg-blue-500/5 border-blue-500/10" },
                { step: "02", title: "AI Company Evaluation", desc: "360-degree analysis: SEO audit, competitor benchmarking, market research, organizational gap analysis, and financial health assessment.", icon: BarChart3, color: "from-violet-500 to-purple-600", tint: "bg-violet-500/5 border-violet-500/10" },
                { step: "03", title: "Business Plan & Model", desc: "AI Strategy Agent (trained on Big 4 frameworks) generates a board-ready business plan with 3-5 year financial model and KPI framework.", icon: Brain, color: "from-aeos-500 to-aeos-700", tint: "bg-aeos-500/5 border-aeos-500/10" },
                { step: "04", title: "AI Org Deployment", desc: "AEOS deploys AI agents across every department — each with a Director AI and specialist agents working alongside your human team.", icon: Bot, color: "from-emerald-500 to-green-600", tint: "bg-emerald-500/5 border-emerald-500/10" },
              ].map((phase) => (
                <motion.div key={phase.step} variants={fadeUp}
                  className={`relative overflow-hidden rounded-2xl border ${phase.tint} p-6 transition-all hover:shadow-lg`}>
                  <div className="absolute right-3 top-1 select-none text-[72px] font-black leading-none text-white/[0.04]">{phase.step}</div>
                  <div className="relative">
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${phase.color}`}>
                      <phase.icon size={18} className="text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-fg">Phase {phase.step}: {phase.title}</h3>
                    <p className="text-sm leading-relaxed text-fg-muted">{phase.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ AI DEPARTMENTS SHOWCASE ═══ */}
        <section className="bg-surface-base px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold text-aeos-400">AI-POWERED DEPARTMENTS</p>
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                Every department staffed, <span className="text-aeos-400">every gap filled</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-fg-muted">
                AEOS deploys industry-specific AI teams tailored to your business type.
              </p>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Target, name: "Sales", agents: "4 AI agents", desc: "Lead gen, pipeline, proposals, CRM", color: "from-orange-500 to-red-500", tint: "bg-orange-500/5 border-orange-500/10" },
                { icon: Sparkles, name: "Marketing", agents: "4 AI agents", desc: "SEO, content, social media, ads", color: "from-pink-500 to-rose-500", tint: "bg-pink-500/5 border-pink-500/10" },
                { icon: Users, name: "HR", agents: "3 AI agents", desc: "Hiring, onboarding, performance", color: "from-blue-500 to-indigo-500", tint: "bg-blue-500/5 border-blue-500/10" },
                { icon: BarChart3, name: "Finance", agents: "4 AI agents", desc: "Bookkeeping, reporting, budgets", color: "from-emerald-500 to-green-600", tint: "bg-emerald-500/5 border-emerald-500/10" },
                { icon: Shield, name: "Legal", agents: "3 AI agents", desc: "Contracts, compliance, regulatory", color: "from-slate-400 to-gray-500", tint: "bg-slate-500/5 border-slate-500/10" },
                { icon: Cpu, name: "Operations", agents: "3 AI agents", desc: "Process optimization, QC, SOPs", color: "from-amber-500 to-yellow-600", tint: "bg-amber-500/5 border-amber-500/10" },
                { icon: Lock, name: "IT & Security", agents: "3 AI agents", desc: "Systems, cybersecurity, data", color: "from-cyan-500 to-teal-500", tint: "bg-cyan-500/5 border-cyan-500/10" },
                { icon: Building2, name: "Procurement", agents: "3 AI agents", desc: "Vendor sourcing, RFQs, POs", color: "from-lime-500 to-green-500", tint: "bg-lime-500/5 border-lime-500/10" },
                { icon: Brain, name: "Strategy & BI", agents: "2 AI agents", desc: "KPI tracking, market intelligence", color: "from-violet-500 to-purple-600", tint: "bg-violet-500/5 border-violet-500/10" },
              ].map((dept) => (
                <motion.div key={dept.name} variants={fadeUp}
                  className={`flex items-center gap-3 rounded-xl border ${dept.tint} px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${dept.color} shadow-sm`}>
                    <dept.icon size={18} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-fg">{dept.name}</p>
                      <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-2xs font-semibold text-fg-secondary">{dept.agents}</span>
                    </div>
                    <p className="text-xs text-fg-muted">{dept.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="bg-surface-secondary/50 px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-5xl">
            <motion.div variants={fadeUp} className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold text-aeos-400">SIMPLE PRICING</p>
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                Start free. Scale as you grow.
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Starter", price: "Free", period: "", desc: "Scan your website and see what AEOS can do", features: ["1 workspace", "Company intelligence report", "Website analysis & SEO audit", "Digital presence scoring", "Basic AI copilot"], popular: false },
                { name: "Growth", price: "$49", period: "/mo", desc: "Full AI organization for growing companies", features: ["3 workspaces", "All 22+ AI agents", "Business plan generator", "Competitor intelligence", "Market research & financials", "KPI framework"], popular: true },
                { name: "Business", price: "$149", period: "/mo", desc: "Enterprise-grade intelligence at SME scale", features: ["10 workspaces", "Unlimited AI agents", "Financial model generator", "8 shareable report types", "Command center dashboard", "Priority support", "API access"], popular: false },
              ].map((plan) => (
                <motion.div key={plan.name} variants={fadeUp}
                  className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                    plan.popular ? "border-aeos-500/30 bg-aeos-500/5 shadow-xl shadow-aeos-500/10" : "border-border bg-surface"
                  }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-aeos-600 to-aeos-500 px-3 py-0.5 text-2xs font-bold text-white shadow-md">
                      POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-fg">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-fg">{plan.price}</span>
                    <span className="text-sm text-fg-muted">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">{plan.desc}</p>
                  <Link href="/register"
                    className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                      plan.popular
                        ? "bg-gradient-to-r from-aeos-600 to-aeos-500 text-white shadow-md shadow-aeos-500/20 hover:shadow-lg"
                        : "bg-surface-secondary text-fg-secondary hover:bg-surface-secondary/80"
                    }`}>
                    Get started
                  </Link>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-fg-muted">
                        <Check size={14} className="shrink-0 text-aeos-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="px-6 py-24">
          <AnimateWhenVisible>
            <motion.div variants={fadeUp}
              className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-aeos-500/10 to-emerald-500/5 border border-border p-12 text-center shadow-2xl">
              <h2 className="text-3xl font-bold text-fg lg:text-4xl">
                Every company deserves a complete organization
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-fg-muted">
                The tools, intelligence, and strategic capability that were once exclusive to
                large corporations — now available to every ambitious business from Day 1.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[0_0_24px_rgba(59,130,246,0.3)] transition hover:shadow-2xl">
                  Start free — get your intelligence report
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-700">
                    <Zap size={14} className="text-white" />
                  </div>
                  <span className="text-base font-bold text-fg-secondary">AEOS</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  AI Enterprise Operating System. Transform your company into an AI-powered organization.
                </p>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-hint">Product</h4>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li><a href="#features" className="hover:text-fg transition">Features</a></li>
                  <li><a href="#pricing" className="hover:text-fg transition">Pricing</a></li>
                  <li><a href="#how-it-works" className="hover:text-fg transition">How it works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-hint">Company</h4>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li><span className="hover:text-fg transition cursor-default">About</span></li>
                  <li><span className="hover:text-fg transition cursor-default">Blog</span></li>
                  <li><span className="hover:text-fg transition cursor-default">Careers</span></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-hint">Legal</h4>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li><span className="hover:text-fg transition cursor-default">Privacy</span></li>
                  <li><span className="hover:text-fg transition cursor-default">Terms</span></li>
                  <li><span className="hover:text-fg transition cursor-default">Security</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-border pt-6 text-center text-xs text-fg-hint">
              2025 AEOS. All rights reserved. Powered by AI.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
