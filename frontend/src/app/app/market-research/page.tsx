"use client";

import { motion } from "framer-motion";
import { StaggerGrid } from "@/components/ui/StaggerGrid";
import {
  TrendingUp, TrendingDown, Loader2, RefreshCw, AlertTriangle,
  Target, Sparkles, Shield, Globe, BarChart3, Zap, ArrowUp, ArrowDown, Minus,
  CheckCircle2,
} from "lucide-react";
import { useMarketResearch, type BenchmarkItem } from "@/lib/hooks/useMarketResearch";

function MarketFunnel({ tam, sam, som, tamLabel, samLabel, somLabel }: {
  tam: number; sam: number; som: number; tamLabel: string; samLabel: string; somLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* TAM */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6 }}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-100 to-purple-100 ring-1 ring-violet-200">
        <div className="text-center">
          <p className="text-lg font-bold text-violet-700">{tamLabel}</p>
          <p className="text-2xs text-violet-500">TAM — Total Addressable Market</p>
        </div>
      </motion.div>
      {/* SAM */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
        className="flex h-14 w-4/5 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100 ring-1 ring-blue-200">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-700">{samLabel}</p>
          <p className="text-2xs text-blue-500">SAM — Serviceable Market</p>
        </div>
      </motion.div>
      {/* SOM */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
        className="flex h-14 w-3/5 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-100 to-green-100 ring-1 ring-emerald-200">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-700">{somLabel}</p>
          <p className="text-2xs text-emerald-500">SOM — Obtainable Market</p>
        </div>
      </motion.div>
    </div>
  );
}

function BenchmarkBar({ item }: { item: BenchmarkItem }) {
  const statusIcon = item.status === "above" ? <ArrowUp size={12} className="text-emerald-500" /> :
    item.status === "below" ? <ArrowDown size={12} className="text-red-500" /> :
    <Minus size={12} className="text-fg-hint" />;
  const statusColor = item.status === "above" ? "text-emerald-600" : item.status === "below" ? "text-red-600" : "text-fg-secondary";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-border-light">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-fg">{item.metric}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-sm font-bold ${statusColor}`}>
            {item.unit === "USD" ? `$${(item.your_value / 1000).toFixed(0)}K` :
             item.unit === "%" ? `${item.your_value}%` :
             item.your_value}
          </span>
          <span className="text-2xs text-fg-hint">vs avg</span>
          <span className="text-xs text-fg-muted">
            {item.unit === "USD" ? `$${(item.industry_avg / 1000).toFixed(0)}K` :
             item.unit === "%" ? `${item.industry_avg}%` :
             item.industry_avg}
          </span>
          {statusIcon}
        </div>
      </div>
    </div>
  );
}

export default function MarketResearchPage() {
  const { report, loading, error, recomputing, recompute } = useMarketResearch();

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;
  }

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
        <p className="text-sm text-fg-secondary">{error || "No market research available"}</p>
        <button onClick={recompute} className="mt-4 rounded-lg bg-aeos-600 px-4 py-2 text-sm font-semibold text-white">
          Generate Market Research
        </button>
      </div>
    );
  }

  const pos = report.market_positioning;
  const posColor = pos.score >= 60 ? "text-emerald-600" : pos.score >= 40 ? "text-blue-600" : "text-amber-600";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200/40">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-fg">Market Research</h1>
            <p className="text-xs text-fg-muted">{report.industry.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} sector analysis</p>
          </div>
        </div>
        <button onClick={recompute} disabled={recomputing}
          className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-secondary disabled:opacity-50">
          {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recompute
        </button>
      </div>

      {/* Top row: TAM/SAM/SOM + Positioning + Growth Rate */}
      <StaggerGrid className="grid gap-4 lg:grid-cols-3">
        {/* Market Sizing Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-surface p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">Market Sizing</p>
          <MarketFunnel
            tam={report.market_sizing.tam} sam={report.market_sizing.sam} som={report.market_sizing.som}
            tamLabel={report.market_sizing.tam_label} samLabel={report.market_sizing.sam_label} somLabel={report.market_sizing.som_label}
          />
        </motion.div>

        {/* Market Positioning */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-surface p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Market Position</p>
          <div className="mb-4 text-center">
            <p className={`text-4xl font-bold ${posColor}`}>{pos.score.toFixed(0)}</p>
            <p className={`text-sm font-semibold ${posColor}`}>{pos.label}</p>
          </div>
          {pos.strengths.length > 0 && (
            <div className="mb-2 space-y-1">
              {pos.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-2xs text-emerald-700">
                  <CheckCircle2 size={10} /> {s}
                </div>
              ))}
            </div>
          )}
          {pos.growth_areas.length > 0 && (
            <div className="space-y-1">
              {pos.growth_areas.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5 text-2xs text-amber-700">
                  <TrendingUp size={10} /> {g}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Industry Benchmarks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/60 bg-surface p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Industry Benchmarks</p>
          <div className="space-y-2">
            {report.benchmarks.map((b, i) => (
              <BenchmarkBar key={i} item={b} />
            ))}
          </div>
        </motion.div>
      </StaggerGrid>

      {/* Growth Drivers + Threats + Opportunities */}
      <StaggerGrid className="grid gap-4 lg:grid-cols-3">
        {/* Growth Drivers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
            <TrendingUp size={14} /> Growth Drivers
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-2xs">{report.market_growth_rate}% CAGR</span>
          </p>
          <div className="space-y-2">
            {report.growth_drivers.map((d, i) => (
              <div key={i} className="rounded-lg bg-surface p-3 shadow-sm ring-1 ring-emerald-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-fg">{d.title}</p>
                  <span className={`ml-auto rounded-full px-1.5 py-px text-2xs font-bold ${
                    d.impact === "high" ? "bg-emerald-100 text-emerald-700" : "bg-surface-inset text-fg-secondary"
                  }`}>{d.impact}</span>
                </div>
                <p className="mt-0.5 text-2xs text-fg-muted">{d.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Threats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-red-200/60 bg-red-50/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-red-700">
            <Shield size={14} /> Market Threats
          </p>
          <div className="space-y-2">
            {report.threats.map((t, i) => (
              <div key={i} className="rounded-lg bg-surface p-3 shadow-sm ring-1 ring-red-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-fg">{t.title}</p>
                  <span className={`ml-auto rounded-full px-1.5 py-px text-2xs font-bold ${
                    t.severity === "high" ? "bg-red-100 text-red-700" : "bg-surface-inset text-fg-secondary"
                  }`}>{t.severity}</span>
                </div>
                <p className="mt-0.5 text-2xs text-fg-muted">{t.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Opportunities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-blue-700">
            <Sparkles size={14} /> Opportunities
          </p>
          <div className="space-y-2">
            {report.opportunities.map((o, i) => (
              <div key={i} className="rounded-lg bg-surface p-3 shadow-sm ring-1 ring-blue-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-fg">{o.title}</p>
                  <span className={`ml-auto rounded-full px-1.5 py-px text-2xs font-bold ${
                    o.impact === "high" ? "bg-blue-100 text-blue-700" : "bg-surface-inset text-fg-secondary"
                  }`}>{o.impact}</span>
                </div>
                <p className="mt-0.5 text-2xs text-fg-muted">{o.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </StaggerGrid>
    </motion.div>
  );
}
