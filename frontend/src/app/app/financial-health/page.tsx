"use client";

import { motion } from "framer-motion";
import {
  DollarSign, Loader2, RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  Shield, Sparkles, Wallet, BarChart3, Target, Zap, CheckCircle2, ArrowUp,
} from "lucide-react";
import { useFinancialHealth } from "@/lib/hooks/useFinancialHealth";

function ScoreRing({ score, size = 130 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
}

function SubScore({ label, score, inverted }: { label: string; score: number; inverted?: boolean }) {
  const displayScore = inverted ? 100 - score : score;
  const color = displayScore >= 60 ? "bg-emerald-500" : displayScore >= 40 ? "bg-blue-500" : displayScore >= 20 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs font-medium text-fg">{label}</span>
        <span className="text-xs text-fg-muted">{score.toFixed(0)}{inverted ? "% risk" : "/100"}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-inset">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.8 }} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function FinancialHealthPage() {
  const { report, loading, error, recomputing, recompute } = useFinancialHealth();

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
        <p className="text-sm text-fg-secondary">{error || "No financial health data"}</p>
        <button onClick={recompute} className="mt-4 rounded-lg bg-aeos-600 px-4 py-2 text-sm font-semibold text-white">Analyze</button>
      </div>
    );
  }

  const score = report.overall_score;
  const label = score >= 75 ? "Excellent" : score >= 55 ? "Healthy" : score >= 35 ? "Developing" : "Needs Attention";
  const scoreColor = score >= 70 ? "text-emerald-600" : score >= 50 ? "text-blue-600" : "text-amber-600";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-200/40">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-fg">Financial Health</h1>
            <p className="text-xs text-fg-muted">AI-estimated financial assessment</p>
          </div>
        </div>
        <button onClick={recompute} disabled={recomputing}
          className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-secondary disabled:opacity-50">
          {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recompute
        </button>
      </div>

      {/* Top row: Score + Sub-scores + Revenue */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Overall score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-border/60 bg-surface p-6 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Financial Health</p>
          <div className="relative">
            <ScoreRing score={score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score.toFixed(0)}</span>
              <span className="text-2xs text-fg-hint">/ 100</span>
            </div>
          </div>
          <p className={`mt-3 text-sm font-bold ${scoreColor}`}>{label}</p>
        </motion.div>

        {/* Sub-scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-surface p-6 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Health Dimensions</p>
          <div className="space-y-3">
            <SubScore label="Revenue Potential" score={report.revenue_potential_score} />
            <SubScore label="Cost Efficiency" score={report.cost_efficiency_score} />
            <SubScore label="Growth Readiness" score={report.growth_readiness_score} />
            <SubScore label="Risk Exposure" score={report.risk_exposure_score} inverted />
            <SubScore label="Investment Readiness" score={report.investment_readiness_score} />
          </div>
        </motion.div>

        {/* Revenue & Cost summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/60 bg-surface p-6 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Estimated Financials</p>
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
              <p className="text-2xs text-emerald-600">Est. Annual Revenue</p>
              <p className="text-xl font-bold text-emerald-700">{report.revenue_model.revenue_label}</p>
              <p className="text-2xs text-emerald-500">{formatCurrency(report.revenue_model.revenue_per_employee)}/employee</p>
            </div>
            <div className="rounded-xl bg-surface-secondary p-3 ring-1 ring-border-light">
              <p className="text-2xs text-fg-muted">Est. Annual Costs</p>
              <p className="text-lg font-bold text-fg">{formatCurrency(report.cost_structure.estimated_annual_costs)}</p>
              <p className="text-2xs text-fg-hint">{(report.cost_structure.cost_to_revenue_ratio * 100).toFixed(0)}% cost ratio</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
              <p className="text-2xs text-blue-600">AI Optimization Potential</p>
              <p className="text-lg font-bold text-blue-700">{report.cost_structure.optimization_potential.toFixed(0)}% savings</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3-Year Projections */}
      {report.projections.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/60 bg-surface p-6 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">3-Year Projections (with AEOS AI)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {report.projections.map((p, i) => (
              <div key={p.year} className="rounded-xl bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-border-light">
                <p className="mb-2 text-xs font-bold text-fg-muted">Year {p.year}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-2xs text-fg-muted">Revenue</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(p.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-2xs text-fg-muted">Costs</span>
                    <span className="text-xs font-bold text-fg-secondary">{formatCurrency(p.costs)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-light pt-1.5">
                    <span className="text-2xs font-medium text-fg">Profit</span>
                    <span className={`text-xs font-bold ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(p.profit)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-2xs text-aeos-600">
                    <ArrowUp size={10} /> {p.growth_rate}% growth
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Growth Levers + Risks + Recommendations */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Growth Levers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-700"><TrendingUp size={14} /> Growth Levers</p>
          <div className="space-y-2">
            {report.growth_levers.map((g, i) => (
              <div key={i} className="rounded-lg bg-surface p-3 shadow-sm ring-1 ring-emerald-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-fg">{g.title}</p>
                  <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-px text-2xs font-bold text-emerald-700">+{g.estimated_impact_pct}%</span>
                </div>
                <p className="mt-0.5 text-2xs text-fg-muted">{g.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Financial Risks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-red-200/60 bg-red-50/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-red-700"><Shield size={14} /> Financial Risks</p>
          <div className="space-y-2">
            {report.financial_risks.map((r, i) => (
              <div key={i} className="rounded-lg bg-surface p-3 shadow-sm ring-1 ring-red-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-fg">{r.title}</p>
                  <span className={`ml-auto rounded-full px-1.5 py-px text-2xs font-bold ${r.severity === "high" ? "bg-red-100 text-red-700" : "bg-surface-inset text-fg-secondary"}`}>{r.severity}</span>
                </div>
                <p className="mt-0.5 text-2xs text-fg-muted">{r.description}</p>
                {r.mitigation && <p className="mt-1 text-2xs text-emerald-600 italic">{r.mitigation}</p>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-blue-700"><Sparkles size={14} /> Recommendations</p>
          <div className="space-y-2">
            {report.recommendations.map((r: any, i: number) => (
              <div key={i} className="flex gap-2.5 rounded-lg bg-surface p-3 shadow-sm ring-1 ring-blue-100">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aeos-500 text-2xs font-bold text-white">{r.priority}</div>
                <div>
                  <p className="text-xs font-bold text-fg">{r.title}</p>
                  <p className="mt-0.5 text-2xs text-fg-muted">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
