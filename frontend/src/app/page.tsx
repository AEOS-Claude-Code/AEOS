"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Zap, ArrowRight, BarChart3, Brain, Shield, Globe, Bot,
  Users, Target, Sparkles, Building2, Check, ChevronDown,
  Cpu, TrendingUp, Lock, Star, ScanLine, ArrowLeftRight,
  Search, FileText, Link2, ImageIcon, FolderOpen, Play,
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

/* ── Grid background ──────────────────────────────────────────── */

function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(46,121,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(46,121,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-aeos-400/[0.15] blur-[150px]" />
      <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-400/[0.10] blur-[130px]" />
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.07] blur-[120px]" />
    </div>
  );
}

/* ── FAQ Item ─────────────────────────────────────────────────── */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface transition-all">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <span className="pr-4 text-sm font-semibold text-fg">{question}</span>
        <ChevronDown size={16} className={`shrink-0 text-fg-hint transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="region" className="border-t border-border-light px-5 pb-5 pt-3">
          <p className="text-sm leading-relaxed text-fg-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ── Testimonial data ─────────────────────────────────────────── */

const TESTIMONIALS = [
  { quote: "AEOS completely replaced three consultants we were paying $15k/month. The AI agents are that good.", name: "Sarah K.", role: "E-commerce Founder", initials: "SK" },
  { quote: "We went from a 5-person team to having the operational depth of a 50-person company overnight.", name: "Ahmed R.", role: "SaaS CEO", initials: "AR" },
  { quote: "The gap analysis alone was worth it. AEOS found blind spots we'd missed for two years.", name: "David L.", role: "Agency Owner", initials: "DL" },
  { quote: "I entered my URL and had a complete business plan with financial model in under 10 minutes. Insane.", name: "Maria C.", role: "Startup Founder", initials: "MC" },
  { quote: "Our marketing strategy went from guesswork to AI-driven intelligence. Revenue up 40% in 3 months.", name: "James W.", role: "Growth Lead", initials: "JW" },
  { quote: "The fact that it deploys AI agents across 9 departments automatically is mind-blowing.", name: "Priya S.", role: "Operations Director", initials: "PS" },
  { quote: "Finally, an AI tool that actually understands business operations, not just content generation.", name: "Tom H.", role: "Business Consultant", initials: "TH" },
  { quote: "AEOS is what happens when you let AI build your company's operating system. It just works.", name: "Lina M.", role: "Tech Entrepreneur", initials: "LM" },
];

/* ── FAQ data ─────────────────────────────────────────────────── */

const FAQS = [
  { q: "What does AEOS actually do?", a: "AEOS scans your website, analyzes your business, and deploys AI agents across 9 departments — Sales, Marketing, HR, Finance, Legal, Operations, IT, Procurement, and Strategy. Each department gets a Director AI and specialist agents that work 24/7 alongside your human team." },
  { q: "How long does the AI deployment take?", a: "Under 2 minutes. Enter your website URL, and AEOS automatically scans your site, evaluates your business, generates a strategic plan, and deploys AI agents. No setup, no configuration, no technical knowledge required." },
  { q: "Do I need technical knowledge?", a: "Not at all. AEOS is designed for business owners and operators, not engineers. If you can enter a URL, you can deploy a full AI workforce." },
  { q: "What departments does AEOS cover?", a: "AEOS covers 9 departments: Sales, Marketing, HR, Finance, Legal, Operations, IT & Security, Procurement, and Strategy & Business Intelligence. Each department has specialized AI agents for different functions." },
  { q: "Can I try it for free?", a: "Yes. The Starter plan is completely free and includes a full company scan, AI evaluation, and basic AI agent deployment. No credit card required." },
  { q: "Is my company data secure?", a: "Absolutely. All data is encrypted in transit and at rest. We follow SOC 2 compliance standards and never share your company data with third parties." },
];

/* ── Main landing page ────────────────────────────────────────── */

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/app/dashboard");
  }, [isAuthenticated, isLoading, router]);

  function handleSubmitUrl(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || !trimmed.includes(".")) {
      setUrlError("Please enter a valid URL");
      return;
    }
    setUrlError("");
    router.push(`/register?url=${encodeURIComponent(trimmed)}`);
  }

  if (isLoading) {
    return (
      <div className="dark">
        <div className="flex min-h-screen items-center justify-center bg-[#0d1424]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="dark">
      <div className="min-h-screen bg-[#0d1424]">
        {/* ═══ NAVIGATION ═══ */}
        <nav className="sticky top-0 z-50 border-b border-border bg-[#0d1424]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700 shadow-md shadow-aeos-500/20">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-fg">AEOS</span>
              <span className="hidden text-xs font-semibold uppercase tracking-widest text-fg-hint lg:block">Autonomous Enterprise OS</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-fg-secondary transition hover:text-fg">Features</a>
              <a href="#how-it-works" className="text-sm text-fg-secondary transition hover:text-fg">How it works</a>
              <a href="#pricing" className="text-sm text-fg-secondary transition hover:text-fg">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 sm:flex">
                <Sparkles size={12} /> FREE INTELLIGENT REPORT
              </div>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-fg-secondary transition hover:bg-surface-secondary">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-gradient-to-r from-aeos-500 to-aeos-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-aeos-600/20 transition hover:shadow-lg">
                Get Started Free
              </Link>
            </div>
          </div>
        </nav>

        {/* ═══ HERO — SPLIT LAYOUT ═══ */}
        <section className="relative overflow-hidden px-6 pb-16 pt-16 lg:pb-24 lg:pt-24">
          <GridBackground />
          <div className="relative mx-auto max-w-7xl lg:flex lg:items-center lg:gap-16">
            {/* Left — Text + URL Input */}
            <div className="flex-1 lg:max-w-xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles size={14} />
                  Free intelligent company reports · No credit card required
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-4xl lg:text-5xl">
                Turn your company into a{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-emerald-400 bg-clip-text text-transparent">
                  fully staffed AI company
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 max-w-lg text-base leading-relaxed text-fg-muted">
                AEOS scans your website, builds your company profile, and deploys 27 AI agents
                across 9 departments — in under 2 minutes. One scan. Real results.
              </motion.p>

              {/* URL Input */}
              <motion.form onSubmit={handleSubmitUrl} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8">
                <div className={`flex items-center gap-2 rounded-xl border ${urlError ? "border-red-500/50" : "border-border"} bg-surface p-1.5 transition-all focus-within:border-aeos-500/40 focus-within:shadow-lg focus-within:shadow-aeos-500/10`}>
                  <div className="flex items-center gap-2 pl-3">
                    <Globe size={16} className="shrink-0 text-fg-hint" />
                  </div>
                  <label htmlFor="hero-url" className="sr-only">Website URL</label>
                  <input
                    id="hero-url"
                    type="text"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                    placeholder="Enter your website URL or domain"
                    className="flex-1 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-hint focus:outline-none"
                    aria-describedby={urlError ? "url-error" : undefined}
                  />
                  <button type="submit"
                    className="shrink-0 rounded-lg bg-gradient-to-r from-aeos-500 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:shadow-aeos-500/20">
                    Build my AI team <ArrowRight size={14} className="ml-1 inline" />
                  </button>
                </div>
                {urlError && <p id="url-error" className="mt-2 text-xs text-red-400">{urlError}</p>}
              </motion.form>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-4 flex items-center gap-4 text-xs text-fg-hint">
                <span className="flex items-center gap-1"><Zap size={12} className="text-amber-400" /> Takes under 2 minutes</span>
                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-500" /> No setup complexity</span>
              </motion.div>
            </div>

            {/* Right — Live Preview Card */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-12 flex-1 lg:mt-0 hidden lg:block">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-aeos-500/5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-fg-hint">Live Preview</span>
                    <h3 className="text-base font-bold text-fg">How AEOS thinks</h3>
                  </div>
                  <span className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-2xs font-medium text-fg-secondary">
                    Scan → Evaluate → Deploy
                  </span>
                </div>

                {/* Stat boxes */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "SCAN SPEED", value: "~2m", color: "text-fg" },
                    { label: "CONFIDENCE", value: "94%+", color: "text-emerald-400" },
                    { label: "DEPLOYMENT", value: "Ready", color: "text-fg" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-surface-secondary px-3 py-2.5">
                      <p className="text-2xs font-semibold uppercase tracking-wider text-fg-hint">{s.label}</p>
                      <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Result cards */}
                <div className="space-y-2.5">
                  {[
                    { icon: Search, tag: "Gap Analysis", tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", match: "92% match", title: "Missing Finance department", desc: "Critical organizational gap detected in financial oversight." },
                    { icon: BarChart3, tag: "Strategic Priority", tagColor: "text-violet-400 bg-violet-500/10 border-violet-500/20", match: "88% match", title: "Market expansion into GCC region", desc: "High-growth opportunity with strong competitive fit." },
                    { icon: Bot, tag: "AI Agent", tagColor: "text-aeos-400 bg-aeos-500/10 border-aeos-500/20", match: "85% match", title: "Deploy Marketing Director AI", desc: "Recommended agent to fill identified department gap." },
                  ].map((card) => (
                    <div key={card.title} className="rounded-xl border border-border bg-surface-secondary p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${card.tagColor}`}>
                          <card.icon size={11} /> {card.tag}
                        </span>
                        <span className="text-2xs font-semibold text-emerald-400">{card.match}</span>
                      </div>
                      <p className="text-sm font-semibold text-fg">{card.title}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF BAR ═══ */}
        <section className="border-y border-border bg-surface-secondary/30 py-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-6 sm:flex-row sm:gap-8">
            {/* Overlapping avatars */}
            <div className="flex -space-x-2">
              {["SK", "AR", "DL", "MC", "JW"].map((initials, i) => (
                <div key={initials} aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#070b18] bg-gradient-to-br from-aeos-400 to-violet-500 text-[9px] font-bold text-white"
                  style={{ zIndex: 5 - i }}>
                  {initials}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-fg-secondary">5.0 rating</span>
            </div>
            {/* PLACEHOLDER: update with real metrics */}
            <span className="text-sm text-fg-muted">Trusted by <span className="font-semibold text-fg-secondary">500+ companies</span></span>
          </div>
        </section>

        {/* ═══ TESTIMONIALS CAROUSEL ═══ */}
        <section className="overflow-hidden py-16" aria-label="Customer testimonials">
          <style>{`
            @keyframes scroll-left {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .testimonial-track {
              animation: scroll-left 40s linear infinite;
            }
            .testimonial-track:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="testimonial-track flex w-max gap-4">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} aria-roledescription="slide"
                className="w-[340px] shrink-0 rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} className="fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-fg-secondary">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-aeos-400 to-violet-500 text-[10px] font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fg">{t.name}</p>
                    <p className="text-xs text-fg-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-1.5 text-xs font-semibold text-fg-secondary">
                <Sparkles size={12} className="text-emerald-400" /> BUILT FOR GROWING COMPANIES
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                Everything you need.{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-emerald-400 bg-clip-text text-transparent">Nothing you don&apos;t.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-fg-muted">
                Enterprise-grade AI infrastructure with zero setup. Move fast without sacrificing intelligence.
              </p>
            </motion.div>

            {/* Stat cards */}
            <motion.div variants={fadeUp} className="mb-10 grid grid-cols-3 gap-4">
              {[
                { label: "AVG DEPLOYMENT TIME", value: "< 2 min" },
                { label: "AI DEPARTMENTS", value: "9" },
                { label: "INTELLIGENCE ENGINES", value: "15" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-surface-secondary px-5 py-4 text-center">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-fg-hint">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-fg">{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Feature cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: ScanLine, title: "Smart Website Analysis", desc: "Scans your website to detect company info, tech stack, social profiles, and competitive positioning automatically.", tint: "bg-blue-500/5 border-blue-500/10" },
                { icon: Brain, title: "Strategic Intelligence", desc: "McKinsey-grade AI analyzes your market, generates a business plan, financial model, and KPI framework.", tint: "bg-violet-500/5 border-violet-500/10" },
                { icon: Bot, title: "AI Department Agents", desc: "27 specialized AI agents across Sales, Marketing, HR, Finance, Legal, Operations, IT, Procurement, and Strategy.", tint: "bg-aeos-500/5 border-aeos-500/10" },
                { icon: Target, title: "Lead Intelligence", desc: "AI-powered lead scoring, pipeline management, and automated outreach. Your sales team gets AI colleagues from day one.", tint: "bg-orange-500/5 border-orange-500/10" },
                { icon: ArrowLeftRight, title: "Gap Analysis", desc: "Identifies missing departments, understaffed roles, and operational gaps — then fills them with AI agents.", tint: "bg-emerald-500/5 border-emerald-500/10" },
                { icon: Globe, title: "Digital Presence", desc: "Continuous monitoring of your SEO, social media, and competitor positioning with actionable recommendations.", tint: "bg-cyan-500/5 border-cyan-500/10" },
              ].map((f) => (
                <motion.div key={f.title} variants={fadeUp}
                  className={`rounded-xl border ${f.tint} p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <f.icon size={20} />
                  </div>
                  <h3 className="mb-1.5 text-base font-bold text-fg">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-muted">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                One scan.{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-emerald-400 bg-clip-text text-transparent">Full deployment.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-fg-muted">
                No complexity. No decision fatigue. Just a guided flow that builds your AI organization.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "01", title: "Scan", desc: "Enter your URL. We analyze your site and auto-detect your company profile, industry, team, and tech stack.", checks: ["Site analysis", "Industry detection", "Team mapping"], icon: ScanLine },
                { step: "02", title: "Evaluate", desc: "AI runs a 360° audit: competitors, financials, org gaps, market position. You get a strategic intelligence report.", checks: ["Gap analysis", "Market research", "Financial health"], icon: BarChart3 },
                { step: "03", title: "Plan", desc: "AI Strategy Agent generates a board-ready business plan with financial model and KPI framework.", checks: ["Business plan", "Financial model", "KPI framework"], icon: Brain },
                { step: "04", title: "Deploy", desc: "AI agents activate across every department. Director AI + specialists work alongside your human team.", checks: ["27 AI agents", "9 departments", "24/7 operations"], icon: Bot },
              ].map((s) => (
                <motion.div key={s.step} variants={fadeUp}
                  className="rounded-xl border border-border bg-surface p-5 transition-all hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <s.icon size={18} />
                    </div>
                    <span className="text-2xl font-bold text-fg-hint/50">{s.step}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-fg">{s.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-fg-muted">{s.desc}</p>
                  <ul className="space-y-1.5">
                    {s.checks.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-sm text-fg-secondary">
                        <Check size={14} className="shrink-0 text-emerald-400" /> {c}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ AI DEPARTMENTS ═══ */}
        <section className="px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold text-emerald-400">AI-POWERED DEPARTMENTS</p>
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                Every department staffed,{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-emerald-400 bg-clip-text text-transparent">every gap filled</span>
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
        <section id="pricing" className="px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-5xl">
            <motion.div variants={fadeUp} className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
                Get started with AEOS
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-fg-muted">
                Fair pricing and fair access for startups, growing companies, and enterprises.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Starter", price: "Free", period: "", desc: "Scan your website and see what AEOS can do", features: ["1 workspace", "Company intelligence report", "Website analysis & SEO audit", "Digital presence scoring", "Basic AI copilot"], popular: false },
                { name: "Growth", price: "$49", period: "/mo", desc: "Full AI organization for growing companies", features: ["3 workspaces", "All 27 AI agents", "Business plan generator", "Competitor intelligence", "Market research & financials", "KPI framework"], popular: true },
                { name: "Business", price: "$149", period: "/mo", desc: "Enterprise-grade intelligence at SME scale", features: ["10 workspaces", "Unlimited AI agents", "Financial model generator", "8 shareable report types", "Command center dashboard", "Priority support", "API access"], popular: false },
              ].map((plan) => (
                <motion.div key={plan.name} variants={fadeUp}
                  className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                    plan.popular ? "border-emerald-500/30 bg-emerald-500/5 shadow-xl shadow-emerald-500/10" : "border-border bg-surface"
                  }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-0.5 text-2xs font-bold text-white shadow-md">
                      <Sparkles size={10} /> MOST POPULAR
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
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg"
                        : "bg-surface-secondary text-fg-secondary hover:bg-surface-secondary/80"
                    }`}>
                    Get {plan.name}
                  </Link>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-fg-muted">
                        <Check size={14} className="shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="px-6 py-24">
          <AnimateWhenVisible className="mx-auto max-w-4xl">
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-fg">Got questions?</h2>
              <p className="mt-3 text-base text-fg-muted">Here are the answers.</p>
            </motion.div>
            <div className="grid gap-3 md:grid-cols-2">
              {FAQS.map((faq) => (
                <motion.div key={faq.q} variants={fadeUp}>
                  <FAQItem question={faq.q} answer={faq.a} />
                </motion.div>
              ))}
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="px-6 py-16">
          <AnimateWhenVisible>
            <motion.div variants={fadeUp}
              className="mx-auto max-w-4xl rounded-2xl border border-border bg-surface p-10 text-center shadow-2xl sm:p-14">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles size={12} /> READY WHEN YOU ARE
              </div>
              <h2 className="text-3xl font-bold text-fg lg:text-4xl">
                Ready to build your{" "}
                <span className="bg-gradient-to-r from-aeos-400 to-emerald-400 bg-clip-text text-transparent">AI organization?</span>
              </h2>
              {/* PLACEHOLDER: update with real metrics */}
              <p className="mx-auto mt-4 max-w-lg text-base text-fg-muted">
                Join 500+ companies using AEOS to deploy a full AI workforce in under 2 minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-aeos-500 to-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-aeos-500/20 transition hover:shadow-2xl">
                  Start for free <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  onClick={() => alert("Demo video coming soon!")}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-6 py-3.5 text-sm font-semibold text-fg-secondary transition hover:bg-surface-secondary/80">
                  <Play size={14} /> Watch demo
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-fg-hint">
                <span className="rounded-full border border-border px-3 py-1">No credit card required</span>
                <span className="rounded-full border border-border px-3 py-1">Free intelligent company reports</span>
                <span className="rounded-full border border-border px-3 py-1">Cancel anytime</span>
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
                  AI-powered content generation that ranks. Built for SEO teams, agencies, and creators who care about outcomes.
                </p>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-hint">Product</h4>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li><a href="#features" className="transition hover:text-fg">Features</a></li>
                  <li><a href="#pricing" className="transition hover:text-fg">Pricing</a></li>
                  <li><a href="#how-it-works" className="transition hover:text-fg">How it works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-hint">Company</h4>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li><span className="cursor-default transition hover:text-fg">About</span></li>
                  <li><span className="cursor-default transition hover:text-fg">Blog</span></li>
                  <li><span className="cursor-default transition hover:text-fg">Careers</span></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-hint">Legal</h4>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li><span className="cursor-default transition hover:text-fg">Privacy</span></li>
                  <li><span className="cursor-default transition hover:text-fg">Terms</span></li>
                  <li><span className="cursor-default transition hover:text-fg">Security</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-border pt-6 text-center text-xs text-fg-hint">
              © 2026 AEOS. All rights reserved. Powered by AI.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
