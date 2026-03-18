"use client";

import { useDigitalPresence } from "@/lib/hooks/useDigitalPresence";
import { useEngineData } from "@/lib/hooks/useEngineData";
import DashCard from "@/components/dashboard/DashCard";
import { CardEmpty, CardLoading } from "@/components/ui/CardStates";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Globe,
  Shield,
  Share2,
  Cpu,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
} from "lucide-react";
import type { ScoreBreakdownItem, Recommendation } from "@/lib/hooks/useDigitalPresence";

/* ── Score Ring ────────────────────────────────────────────────── */

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  const mid = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={mid} cy={mid} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx={mid} cy={mid} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${mid} ${mid})`}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-fg">{score.toFixed(0)}</span>
        <span className="text-xs text-fg-hint">/ 100</span>
      </div>
    </div>
  );
}

/* ── Sub-score Bar ────────────────────────────────────────────── */

function SubScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const barColor = value >= 65 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-secondary">{label}</span>
        <span className="text-xs tabular-nums text-fg-hint">{value.toFixed(0)} <span className="text-2xs">({(weight * 100).toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-inset">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

/* ── Trend Badge ──────────────────────────────────────────────── */

function TrendBadge({ trend, change }: { trend: string; change: number | null }) {
  if (trend === "insufficient_data") return null;
  const icon = trend === "improving" ? <ArrowUpRight size={14} /> : trend === "declining" ? <ArrowDownRight size={14} /> : <Minus size={14} />;
  const color = trend === "improving" ? "text-emerald-600 bg-emerald-50" : trend === "declining" ? "text-red-600 bg-red-50" : "text-fg-secondary bg-surface-secondary";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      {icon}
      {change !== null && `${change > 0 ? "+" : ""}${change}`}
      {trend === "improving" ? " improving" : trend === "declining" ? " declining" : " stable"}
    </span>
  );
}

/* ── Breakdown Detail Card ────────────────────────────────────── */

function BreakdownDetail({ item }: { item: ScoreBreakdownItem }) {
  const scoreColor = item.score >= 65 ? "text-emerald-600" : item.score >= 40 ? "text-amber-600" : "text-red-600";
  return (
    <DashCard title={item.label} subtitle={item.explanation} delay={0}>
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>{item.score.toFixed(0)}/100</span>
          <span className="text-2xs text-fg-hint">Weight: {(item.weight * 100).toFixed(0)}%</span>
        </div>
        {item.items.map((check, i) => (
          <div key={i} className="flex items-center gap-2">
            {check.passed ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
            ) : (
              <XCircle size={14} className="shrink-0 text-red-400" />
            )}
            <span className={`text-xs ${check.passed ? "text-fg-secondary" : "text-fg-hint"}`}>{check.check}</span>
          </div>
        ))}
      </div>
    </DashCard>
  );
}

/* ── Recommendation Card ──────────────────────────────────────── */

function RecommendationItem({ rec }: { rec: Recommendation }) {
  const impactColor = rec.impact === "high" ? "bg-status-danger-light text-status-danger-text" : rec.impact === "medium" ? "bg-status-warning-light text-status-warning-text" : "bg-surface-secondary text-fg-secondary";
  const effortColor = rec.effort === "easy" ? "bg-status-success-light text-status-success-text" : rec.effort === "medium" ? "bg-status-warning-light text-status-warning-text" : "bg-status-danger-light text-status-danger-text";
  return (
    <div className="rounded-xl border border-border-light p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aeos-50 text-xs font-bold text-aeos-700">
          {rec.priority}
        </span>
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-fg">{rec.title}</h4>
          <p className="mt-0.5 text-2xs text-fg-muted leading-relaxed">{rec.description}</p>
          <div className="mt-2 flex gap-2">
            <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${impactColor}`}>
              {rec.impact} impact
            </span>
            <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${effortColor}`}>
              {rec.effort} effort
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini History Chart (SVG) ─────────────────────────────────── */

function HistoryChart({ snapshots }: { snapshots: { date: string; overall_score: number }[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-fg-hint">
        More data points needed for trend chart
      </div>
    );
  }

  const w = 400, h = 120, pad = 20;
  const scores = snapshots.map((s) => s.overall_score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const range = maxScore - minScore || 1;

  const points = snapshots.map((s, i) => {
    const x = pad + (i / (snapshots.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((s.overall_score - minScore) / range) * (h - 2 * pad);
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${pad + ((snapshots.length - 1) / (snapshots.length - 1)) * (w - 2 * pad)},${h - pad}`, `${pad},${h - pad}`];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <polygon points={areaPoints.join(" ")} fill="url(#grad)" />
      <polyline points={points.join(" ")} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {snapshots.map((s, i) => {
        const x = pad + (i / (snapshots.length - 1)) * (w - 2 * pad);
        const y = h - pad - ((s.overall_score - minScore) / range) * (h - 2 * pad);
        return <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />;
      })}
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Social Details ───────────────────────────────────────────── */

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram",
  twitter: "Twitter / X", youtube: "YouTube",
};

/* ── Main Page ────────────────────────────────────────────────── */

export default function DigitalPresencePage() {
  const { report, history, loading, error, recomputing, recompute } = useDigitalPresence();
  const { companyScan, loading: engineLoading } = useEngineData();

  const social = companyScan?.social_presence ?? {};
  const techStack = companyScan?.tech_stack ?? [];
  const keywords = (companyScan as any)?.detected_keywords ?? [];

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-fg">Digital Presence</h1>
          <p className="mt-1 text-sm text-fg-muted">Unified scoring, history, and recommendations.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <DashCard key={i} title="" delay={0}><CardLoading lines={4} /></DashCard>
          ))}
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-fg">Digital Presence</h1>
        </div>
        <DashCard title="Error" delay={0}>
          <CardEmpty icon={<Activity size={20} className="text-fg-hint" />} title="Unable to load" description={error} />
        </DashCard>
      </div>
    );
  }

  const breakdown = report?.score_breakdown ?? [];
  const recommendations = report?.recommendations ?? [];
  const snapshots = history?.snapshots ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-fg">Digital Presence</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Unified scoring, history, and actionable recommendations.
          </p>
        </div>
        <button
          onClick={recompute}
          disabled={recomputing}
          className="flex items-center gap-2 rounded-lg bg-aeos-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={recomputing ? "animate-spin" : ""} />
          {recomputing ? "Computing…" : "Re-compute"}
        </button>
      </div>

      {/* Row 1: Score Overview + Trend + History */}
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        {/* Overall Score */}
        <DashCard title="Overall digital presence" subtitle="Composite score across all channels" delay={0}>
          <div className="flex items-center gap-5">
            <ScoreRing score={report?.overall_score ?? 0} />
            <div className="flex-1 space-y-3">
              {breakdown.map((b) => (
                <SubScoreBar key={b.category} label={b.label} value={b.score} weight={b.weight} />
              ))}
            </div>
          </div>
          {history && (
            <div className="mt-3 flex items-center gap-2 border-t border-border-light pt-3">
              <TrendBadge trend={history.trend} change={history.change_30d} />
              {report?.data_sources && report.data_sources.length > 0 && (
                <span className="text-2xs text-fg-hint">
                  Sources: {report.data_sources.join(", ")}
                </span>
              )}
            </div>
          )}
        </DashCard>

        {/* History Chart */}
        <DashCard title="Score history" subtitle="90-day trend" delay={80}>
          <HistoryChart snapshots={snapshots} />
          {snapshots.length > 0 && (
            <div className="mt-2 flex justify-between text-2xs text-fg-hint">
              <span>{snapshots[0]?.date}</span>
              <span>{snapshots[snapshots.length - 1]?.date}</span>
            </div>
          )}
        </DashCard>

        {/* Recommendations */}
        <DashCard
          title="Top recommendations"
          subtitle={`${recommendations.length} action items`}
          badge={recommendations.length > 0 ? <Zap size={14} className="text-amber-500" /> : undefined}
          delay={160}
        >
          {recommendations.length === 0 ? (
            <CardEmpty
              icon={<TrendingUp size={20} className="text-fg-hint" />}
              title="No recommendations"
              description="Your digital presence looks great!"
            />
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {recommendations.slice(0, 5).map((rec, i) => (
                <RecommendationItem key={i} rec={rec} />
              ))}
            </div>
          )}
        </DashCard>
      </div>

      {/* Row 2: Category Breakdown Details */}
      <div className="mb-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {breakdown.map((item) => (
          <BreakdownDetail key={item.category} item={item} />
        ))}
      </div>

      {/* Row 3: Social + Tech + Keywords (from scanner) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DashCard title="Social presence" subtitle="Platform coverage" delay={0}>
          {Object.keys(social).length === 0 ? (
            <CardEmpty icon={<Share2 size={20} className="text-fg-hint" />} title="No social data" description="Run a company scan to detect social media presence." />
          ) : (
            <div className="space-y-2.5">
              {Object.entries(SOCIAL_LABELS).map(([key, label]) => {
                const active = social[key] ?? false;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-status-success" : "bg-surface-inset"}`} />
                    <span className={`flex-1 text-xs ${active ? "font-medium text-fg" : "text-fg-hint"}`}>{label}</span>
                    <span className={`text-2xs font-semibold ${active ? "text-status-success-text" : "text-fg-hint"}`}>
                      {active ? "Detected" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>

        <DashCard title="Technology stack" subtitle={`${techStack.length} technologies detected`} delay={80}>
          {techStack.length === 0 ? (
            <CardEmpty icon={<Cpu size={20} className="text-fg-hint" />} title="No tech data" description="Run a company scan to detect technologies." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech: string) => (
                <span key={tech} className="rounded-widget bg-aeos-50 px-3 py-1.5 text-xs font-medium text-aeos-700">{tech}</span>
              ))}
            </div>
          )}
        </DashCard>

        <DashCard title="Detected keywords" subtitle={`${keywords.length} keywords found`} delay={160}>
          {keywords.length === 0 ? (
            <CardEmpty icon={<Globe size={20} className="text-fg-hint" />} title="No keywords detected" description="Keywords are extracted during the company website scan." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 20).map((kw: string) => (
                <span key={kw} className="rounded-widget bg-surface-secondary px-3 py-1.5 text-xs text-fg-secondary">{kw}</span>
              ))}
            </div>
          )}
        </DashCard>
      </div>
    </div>
  );
}
