"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Swords, Loader2, RefreshCw, Plus, Globe, TrendingUp, TrendingDown,
  Minus, Shield, Cpu, Share2, Search, Sparkles, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, ExternalLink,
} from "lucide-react";
import { useCompetitorIntel, type CompetitorItem, type DimensionScore } from "@/lib/hooks/useCompetitorIntel";

const DIM_ICONS: Record<string, any> = {
  seo: Search, performance: TrendingUp, social: Share2,
  tech_security: Shield, content: Globe, digital_maturity: Sparkles,
};

function PositionRing({ score, size = 130 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score > 60 ? "#10b981" : score > 40 ? "#3b82f6" : "#f59e0b";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
}

function DimensionBar({ dim }: { dim: DimensionScore }) {
  const Icon = DIM_ICONS[dim.dimension] || Globe;
  const gapColor = dim.gap > 5 ? "text-emerald-600" : dim.gap < -5 ? "text-red-600" : "text-slate-500";
  const gapIcon = dim.gap > 5 ? <TrendingUp size={12} /> : dim.gap < -5 ? <TrendingDown size={12} /> : <Minus size={12} />;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-slate-500" />
          <span className="text-xs font-medium text-slate-700">{dim.label}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${gapColor}`}>
          {gapIcon} {dim.gap > 0 ? "+" : ""}{dim.gap.toFixed(0)}
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${dim.client_score}%` }}
              transition={{ duration: 0.8 }} className="h-full rounded-full bg-aeos-500" />
          </div>
          <p className="mt-0.5 text-2xs text-aeos-600">You: {dim.client_score.toFixed(0)}</p>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${dim.competitor_avg}%` }}
              transition={{ duration: 0.8, delay: 0.1 }} className="h-full rounded-full bg-orange-400" />
          </div>
          <p className="mt-0.5 text-2xs text-orange-600">Avg competitor: {dim.competitor_avg.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}

function CompetitorCard({ comp }: { comp: CompetitorItem }) {
  const socials = Object.entries(comp.social_presence).filter(([, v]) => v).map(([k]) => k);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 ring-1 ring-orange-200">
          <Globe size={16} className="text-orange-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{comp.name || comp.url}</p>
          <a href={comp.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-2xs text-slate-400 hover:text-aeos-600">
            {comp.url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <ExternalLink size={8} />
          </a>
        </div>
        <div className={`rounded-full px-2 py-0.5 text-2xs font-bold ${
          comp.status === "scanned" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"
        }`}>{comp.status}</div>
      </div>

      {comp.status === "scanned" && (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
              <p className="text-xs font-bold text-slate-900">{comp.seo_score.toFixed(0)}</p>
              <p className="text-2xs text-slate-500">SEO</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
              <p className="text-xs font-bold text-slate-900">{comp.performance_score.toFixed(0)}</p>
              <p className="text-2xs text-slate-500">Perf</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
              <p className="text-xs font-bold text-slate-900">{comp.overall_score.toFixed(0)}</p>
              <p className="text-2xs text-slate-500">Overall</p>
            </div>
          </div>

          {comp.tech_stack.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {comp.tech_stack.slice(0, 5).map(t => (
                <span key={t} className="rounded-full bg-blue-50 px-2 py-0.5 text-2xs font-medium text-blue-700">{t}</span>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {socials.map(s => (
                <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-2xs text-emerald-700">{s}</span>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default function CompetitorsPage() {
  const { competitors, report, loading, scanning, error, scan, addCompetitor } = useCompetitorIntel();
  const [newUrl, setNewUrl] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-aeos-500" />
      </div>
    );
  }

  const posScore = report?.overall_positioning || 50;
  const posLabel = posScore > 65 ? "Market Leader" : posScore > 50 ? "Competitive" : posScore > 35 ? "Catching Up" : "Behind";
  const posColor = posScore > 60 ? "text-emerald-600" : posScore > 40 ? "text-blue-600" : "text-amber-600";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-200/40">
            <Swords size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Competitor Intelligence</h1>
            <p className="text-xs text-slate-500">{competitors.length} competitors tracked</p>
          </div>
        </div>
        <button onClick={scan} disabled={scanning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200/30 transition hover:shadow-xl disabled:opacity-50">
          {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {scanning ? "Scanning..." : "Scan all"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</div>}

      {/* Add competitor */}
      <div className="flex gap-2">
        <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)}
          placeholder="Add competitor URL (e.g. https://competitor.com)"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100" />
        <button onClick={() => { if (newUrl) { addCompetitor(newUrl); setNewUrl(""); } }}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Report + dimensions */}
      {report && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Positioning score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-100/50">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Competitive Position</p>
            <div className="relative">
              <PositionRing score={posScore} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${posColor}`}>{posScore.toFixed(0)}</span>
                <span className="text-2xs text-slate-400">/ 100</span>
              </div>
            </div>
            <p className={`mt-3 text-sm font-bold ${posColor}`}>{posLabel}</p>
            <p className="mt-1 text-2xs text-slate-400">{report.competitors_scanned} competitors analyzed</p>
          </motion.div>

          {/* Dimension comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-100/50">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">You vs Competitors</p>
            <div className="space-y-4">
              {report.dimension_scores.map(dim => (
                <DimensionBar key={dim.dimension} dim={dim} />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Insights */}
      {report && (report.strengths.length > 0 || report.weaknesses.length > 0 || report.opportunities.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Strengths */}
          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={14} /> Strengths
            </p>
            <div className="space-y-2">
              {report.strengths.map((s, i) => (
                <div key={i} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-emerald-100">
                  <p className="text-xs font-bold text-slate-900">{s.title}</p>
                  <p className="mt-0.5 text-2xs text-slate-500">{s.description}</p>
                </div>
              ))}
              {report.strengths.length === 0 && <p className="text-2xs text-emerald-600 italic">Scan competitors to find your strengths</p>}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="rounded-2xl border border-red-200/60 bg-red-50/30 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-red-700">
              <AlertTriangle size={14} /> Weaknesses
            </p>
            <div className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <div key={i} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-red-100">
                  <p className="text-xs font-bold text-slate-900">{w.title}</p>
                  <p className="mt-0.5 text-2xs text-slate-500">{w.description}</p>
                </div>
              ))}
              {report.weaknesses.length === 0 && <p className="text-2xs text-red-600 italic">No significant weaknesses detected</p>}
            </div>
          </div>

          {/* Opportunities */}
          <div className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-blue-700">
              <Sparkles size={14} /> Opportunities
            </p>
            <div className="space-y-2">
              {report.opportunities.map((o, i) => (
                <div key={i} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-blue-100">
                  <p className="text-xs font-bold text-slate-900">{o.title}</p>
                  <p className="mt-0.5 text-2xs text-slate-500">{o.description}</p>
                </div>
              ))}
              {report.opportunities.length === 0 && <p className="text-2xs text-blue-600 italic">Scan competitors to discover opportunities</p>}
            </div>
          </div>
        </div>
      )}

      {/* Competitor cards */}
      {competitors.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-900">Tracked Competitors</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {competitors.map(comp => (
              <CompetitorCard key={comp.id} comp={comp} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {competitors.length === 0 && !report && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Swords size={40} className="mx-auto mb-4 text-slate-300" />
          <h2 className="mb-2 text-lg font-bold text-slate-900">No competitors tracked yet</h2>
          <p className="mb-6 text-sm text-slate-500">Add competitor URLs above or during onboarding to start monitoring.</p>
        </div>
      )}
    </motion.div>
  );
}
