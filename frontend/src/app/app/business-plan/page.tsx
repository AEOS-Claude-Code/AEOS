"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Loader2, Sparkles, FileText, CheckCircle2, Clock, AlertTriangle,
  RefreshCw, ChevronRight, Rocket, ArrowRight, Bot, Target, TrendingUp,
  BarChart3, Shield, Map, Activity, Building2, Megaphone, Settings,
} from "lucide-react";
import { useBusinessPlan, type BusinessPlanSection } from "@/lib/hooks/useBusinessPlan";

const SECTION_ICONS: Record<string, any> = {
  executive_summary: Brain,
  company_overview: Building2,
  market_analysis: Target,
  organizational_structure: Bot,
  marketing_sales_strategy: Megaphone,
  operations_plan: Settings,
  financial_projections: BarChart3,
  risk_assessment: Shield,
  implementation_roadmap: Map,
  kpi_framework: Activity,
};

const SECTION_COLORS: Record<string, string> = {
  executive_summary: "from-violet-500 to-purple-600",
  company_overview: "from-blue-500 to-indigo-600",
  market_analysis: "from-emerald-500 to-teal-600",
  organizational_structure: "from-aeos-500 to-aeos-700",
  marketing_sales_strategy: "from-pink-500 to-rose-600",
  operations_plan: "from-amber-500 to-orange-600",
  financial_projections: "from-green-500 to-emerald-600",
  risk_assessment: "from-red-500 to-rose-600",
  implementation_roadmap: "from-cyan-500 to-blue-600",
  kpi_framework: "from-indigo-500 to-violet-600",
};

/* ── Empty state ──────────────────────────────────────────── */

function EmptyState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-aeos-400/10 via-violet-400/10 to-emerald-400/10 blur-xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-aeos-500 to-violet-600 shadow-2xl shadow-aeos-300/30">
          <Brain size={44} className="text-white" />
        </div>
      </div>
      <h2 className="mb-2 text-xl font-bold text-fg">AI Strategy Agent</h2>
      <p className="mb-1 text-sm text-fg-muted">McKinsey-grade business intelligence powered by Claude</p>
      <p className="mb-8 max-w-md text-center text-xs text-fg-hint">
        Generate a comprehensive 10-section business plan using all your company data —
        digital presence, gap analysis, market positioning, and organizational structure.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {["Market Analysis", "Org Structure", "Financial Model", "Risk Assessment", "KPI Framework"].map((label, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-3 ring-1 ring-border-light">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500/10 to-violet-500/10">
              <Sparkles size={14} className="text-aeos-600" />
            </div>
            <span className="text-2xs font-medium text-fg-secondary">{label}</span>
          </motion.div>
        ))}
      </div>

      <motion.button onClick={onGenerate} disabled={generating}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-aeos-600 via-aeos-500 to-violet-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-aeos-300/30 transition-all hover:shadow-2xl disabled:opacity-50">
        {generating ? (
          <><Loader2 size={18} className="animate-spin" /> Generating...</>
        ) : (
          <><Rocket size={18} /> Generate Business Plan <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
        )}
      </motion.button>
    </motion.div>
  );
}

/* ── Generation progress ──────────────────────────────────── */

function GeneratingView({ sections, currentSection, completed, total }: {
  sections: BusinessPlanSection[];
  currentSection: string | null;
  completed: number;
  total: number;
}) {
  const progress = Math.min(100, (completed / total) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-500 to-violet-600 shadow-lg shadow-aeos-300/30">
            <Brain size={32} className="text-white" />
          </motion.div>
        </div>
        <h2 className="text-lg font-bold text-fg">Generating your business plan</h2>
        <p className="text-sm text-fg-muted">{completed}/{total} sections complete</p>
      </div>

      <div className="mx-auto max-w-md">
        <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-inset">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-aeos-500 via-violet-500 to-emerald-500"
            animate={{ width: `${Math.max(3, progress)}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="space-y-1.5">
          {sections.map((sec, i) => {
            const Icon = SECTION_ICONS[sec.key] || FileText;
            const color = SECTION_COLORS[sec.key] || "from-slate-500 to-gray-600";
            const done = sec.status === "completed";
            const active = sec.key === currentSection;

            return (
              <motion.div key={sec.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  active ? "bg-aeos-50 ring-1 ring-aeos-200 shadow-sm" :
                  done ? "bg-emerald-50/50" : "opacity-40"
                }`}>
                {done ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                ) : active ? (
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color}`}>
                    <Loader2 size={14} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-inset">
                    <Icon size={14} className="text-fg-hint" />
                  </div>
                )}
                <span className={`text-sm ${done ? "font-medium text-emerald-700" : active ? "font-bold text-aeos-700" : "text-fg-hint"}`}>
                  {sec.title}
                </span>
                {done && <span className="ml-auto text-2xs text-emerald-500">{sec.word_count} words</span>}
                {active && (
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-auto text-2xs text-aeos-500">Writing...</motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Completed plan viewer ────────────────────────────────── */

function PlanViewer({ sections, onRegenerate, title, metadata }: {
  sections: BusinessPlanSection[];
  onRegenerate: (key: string) => void;
  title: string;
  metadata: Record<string, any>;
}) {
  const [activeSection, setActiveSection] = useState(sections[0]?.key || "");
  const totalWords = sections.reduce((sum, s) => sum + s.word_count, 0);

  return (
    <div className="flex gap-6">
      {/* Left TOC */}
      <div className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-6 space-y-1">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-hint">Sections</p>
          {sections.map((sec) => {
            const Icon = SECTION_ICONS[sec.key] || FileText;
            const isActive = sec.key === activeSection;
            return (
              <button key={sec.key} onClick={() => {
                setActiveSection(sec.key);
                document.getElementById(`section-${sec.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                  isActive ? "bg-aeos-50 text-aeos-700 ring-1 ring-aeos-200" : "text-fg-secondary hover:bg-surface-secondary"
                }`}>
                <Icon size={13} className={isActive ? "text-aeos-600" : "text-fg-hint"} />
                <span className="text-xs font-medium truncate">{sec.title}</span>
              </button>
            );
          })}
          <div className="mt-4 rounded-lg bg-surface-secondary p-3 ring-1 ring-border-light">
            <p className="text-2xs text-fg-muted">Total: <span className="font-bold text-fg">{totalWords.toLocaleString()}</span> words</p>
            {metadata?.generation_time_seconds && (
              <p className="text-2xs text-fg-muted">Generated in <span className="font-bold text-fg">{Math.round(metadata.generation_time_seconds)}s</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-4">
        {sections.map((sec, i) => {
          const Icon = SECTION_ICONS[sec.key] || FileText;
          const color = SECTION_COLORS[sec.key] || "from-slate-500 to-gray-600";

          return (
            <motion.div key={sec.key} id={`section-${sec.key}`}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/60 bg-surface shadow-sm">
              {/* Section header */}
              <div className="flex items-center gap-3 border-b border-border-light px-5 py-3.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-sm`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-fg">{sec.title}</h3>
                  <p className="text-2xs text-fg-hint">{sec.word_count} words</p>
                </div>
                <button onClick={() => onRegenerate(sec.key)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-2xs text-fg-hint transition hover:bg-surface-secondary hover:text-aeos-600">
                  <RefreshCw size={10} /> Regenerate
                </button>
              </div>

              {/* Section content */}
              <div className="prose prose-sm prose-slate max-w-none px-5 py-4"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(sec.content) }} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Simple markdown renderer ─────────────────────────────── */

function markdownToHtml(md: string): string {
  if (!md) return "<p class='text-fg-hint italic'>No content generated.</p>";

  return md
    .replace(/^### (.+)$/gm, "<h4 class='text-sm font-bold text-fg mt-4 mb-2'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 class='text-base font-bold text-fg mt-4 mb-2'>$1</h3>")
    .replace(/^\*\*(.+?)\*\*/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.+)$/gm, "<li class='ml-4 text-sm text-fg'>$1</li>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 text-sm text-fg'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 text-sm text-fg'><strong>$1.</strong> $2</li>")
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class='space-y-1 my-2'>${match}</ul>`)
    .replace(/\n\n/g, "</p><p class='text-sm text-fg leading-relaxed'>")
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith("<")) return line;
      return `<p class='text-sm text-fg leading-relaxed'>${line}</p>`;
    })
    .replace(/<p class='text-sm text-fg leading-relaxed'>\s*<\/p>/g, "");
}

/* ── Main page ────────────────────────────────────────────── */

export default function BusinessPlanPage() {
  const { plan, loading, generating, error, generate, regenerateSection } = useBusinessPlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-aeos-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-violet-600 shadow-lg shadow-aeos-200/40">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-fg">AI Strategy Agent</h1>
            <p className="text-xs text-fg-muted">McKinsey-grade business plan powered by Claude</p>
          </div>
        </div>
        {plan && plan.status === "completed" && (
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-2 text-xs font-medium text-fg transition hover:bg-surface-secondary disabled:opacity-50">
            {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            New version
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</div>
      )}

      {/* Content based on state */}
      {!plan && !generating && <EmptyState onGenerate={generate} generating={false} />}

      {generating && plan?.status === "generating" && (
        <GeneratingView
          sections={plan.sections}
          currentSection={plan.current_section}
          completed={plan.sections_completed}
          total={plan.sections_total}
        />
      )}

      {plan && plan.status === "completed" && (
        <PlanViewer
          sections={plan.sections}
          onRegenerate={regenerateSection}
          title={plan.title}
          metadata={plan.metadata}
        />
      )}
    </motion.div>
  );
}
