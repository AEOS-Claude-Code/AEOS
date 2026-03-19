"use client";

import {
  Brain,
  Flag,
  ShieldAlert,
  CalendarRange,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";
import type {
  Priority,
  RiskAlert,
  Roadmap,
  HealthScore,
} from "@/lib/hooks/useStrategyData";

/* ── Severity config ──────────────────────────────────────────── */

const SEV: Record<
  string,
  { icon: React.ReactNode; dot: string; bg: string; text: string }
> = {
  critical: {
    icon: <XCircle size={13} />,
    dot: "bg-red-500",
    bg: "bg-status-danger-light border-red-200",
    text: "text-status-danger-text",
  },
  high: {
    icon: <AlertTriangle size={13} />,
    dot: "bg-amber-500",
    bg: "bg-status-warning-light border-amber-200",
    text: "text-status-warning-text",
  },
  medium: {
    icon: <Clock size={13} />,
    dot: "bg-yellow-400",
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
  },
  low: {
    icon: <CheckCircle2 size={13} />,
    dot: "bg-slate-400",
    bg: "bg-surface-secondary border-border",
    text: "text-fg-secondary",
  },
};

const CAT_COLORS: Record<string, string> = {
  marketing: "bg-blue-100 text-blue-700",
  growth: "bg-emerald-100 text-emerald-700",
  operations: "bg-amber-100 text-amber-700",
  technology: "bg-violet-100 text-violet-700",
  hr: "bg-pink-100 text-pink-700",
  finance: "bg-cyan-100 text-cyan-700",
};

const DEPT_COLORS: Record<string, string> = {
  Marketing: "bg-blue-100 text-blue-700",
  "Marketing / Strategy": "bg-emerald-100 text-emerald-700",
  "IT / Engineering": "bg-violet-100 text-violet-700",
  Operations: "bg-amber-100 text-amber-700",
  HR: "bg-pink-100 text-pink-700",
  Finance: "bg-cyan-100 text-cyan-700",
};

/* ── Sub-components ───────────────────────────────────────────── */

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-[68px] w-[68px]">
        <svg width={68} height={68} viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="5" />
          <circle
            cx="34" cy="34" r={radius}
            fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 34 34)"
            className="animate-score-fill"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold tabular-nums text-fg">{score.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-2xs font-medium text-fg-muted">{label}</span>
    </div>
  );
}

function ColHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-aeos-600">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{title}</span>
      {count !== undefined && (
        <span className="rounded-full bg-surface-inset px-1.5 py-0.5 text-2xs font-semibold text-fg-muted">{count}</span>
      )}
    </div>
  );
}

/* ── Loading state for 3-column layout ────────────────────────── */

function StrategyLoading() {
  return (
    <div className="grid gap-0 divide-x divide-border-light lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="px-6 py-5">
          <div className="mb-4 h-3 w-24 animate-pulse rounded-pill bg-surface-inset" />
          <div className="space-y-3">
            {[0, 1, 2].map((j) => (
              <div
                key={j}
                className="rounded-xl border border-border-light bg-surface-secondary px-3 py-3"
              >
                <div
                  className="h-3 animate-pulse rounded-pill bg-surface-inset"
                  style={{ width: `${80 - j * 15}%`, animationDelay: `${(i * 3 + j) * 60}ms` }}
                />
                <div
                  className="mt-2 h-2 animate-pulse rounded-pill bg-surface-inset"
                  style={{ width: `${50 - j * 5}%`, animationDelay: `${(i * 3 + j) * 60 + 30}ms` }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main card ────────────────────────────────────────────────── */

export default function StrategicIntelligenceCard({
  health,
  headline,
  priorities,
  risks,
  roadmap30,
  state = "success",
  error,
  onRetry,
}: {
  health: HealthScore;
  headline: string;
  priorities: Priority[];
  risks: RiskAlert[];
  roadmap30: Roadmap | undefined;
  state?: CardState;
  error?: string | null;
  onRetry?: () => void;
}) {
  const criticalCount = risks.filter(
    (r) => r.severity === "critical" || r.severity === "high"
  ).length;
  const top3 = priorities.slice(0, 3);
  const topRisks = risks.slice(0, 3);
  const actions = roadmap30?.actions?.slice(0, 3) ?? [];

  return (
    <div
      className="animate-card-in rounded-card border border-border bg-surface shadow-card"
      style={{ animationDelay: "360ms" }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-violet-600">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-fg">Strategic intelligence</h3>
            <p className="text-xs-tight text-fg-muted">
              Executive summary with priorities, risks, and roadmap
            </p>
          </div>
        </div>
        {state === "success" && criticalCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-status-danger-light px-2.5 py-1 text-2xs font-semibold text-status-danger-text">
            <ShieldAlert size={11} />
            {criticalCount} critical
          </span>
        )}
      </div>

      {/* Full-card loading */}
      {state === "loading" && (
        <>
          <div className="flex items-center gap-6 border-b border-border-light px-6 py-4">
            <div className="h-[68px] w-[68px] animate-pulse rounded-full bg-surface-inset" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded-pill bg-surface-inset" />
              <div className="h-2 w-1/2 animate-pulse rounded-pill bg-surface-inset" />
            </div>
          </div>
          <StrategyLoading />
        </>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="px-6 py-4">
          <CardError
            message="Strategic intelligence unavailable"
            detail={error ?? "Could not connect to the strategy API."}
            onRetry={onRetry}
          />
        </div>
      )}

      {/* Empty */}
      {state === "empty" && (
        <div className="px-6 py-4">
          <CardEmpty
            icon={<BarChart3 size={20} className="text-fg-hint" />}
            title="No strategic data available"
            description="Complete the Setup Wizard and connect integrations to unlock strategic intelligence."
          />
        </div>
      )}

      {/* Success */}
      {state === "success" && (
        <>
          {/* Score strip */}
          <div className="flex items-center gap-6 border-b border-border-light px-6 py-4">
            <ScoreRing score={health.overall} label="Overall" />
            <div className="h-12 w-px bg-surface-inset" />
            <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
              {[
                { label: "Digital presence", val: health.digital_presence },
                { label: "Lead generation", val: health.lead_generation },
                { label: "Competitive pos.", val: health.competitive_position },
                { label: "Integrations", val: health.integration_coverage },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-inset">
                    <div
                      className={`h-full rounded-full ${
                        m.val >= 60 ? "bg-emerald-400" : m.val >= 40 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min(100, m.val)}%` }}
                    />
                  </div>
                  <span className="text-xs-tight text-fg-secondary">{m.label}</span>
                  <span className="text-xs-tight font-semibold tabular-nums text-fg">{m.val.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div className="border-b border-border-light px-6 py-3">
            <p className="text-sm-tight leading-relaxed text-fg-secondary">{headline}</p>
          </div>

          {/* 3-column body */}
          <div className="grid gap-0 divide-x divide-border-light lg:grid-cols-3">
            {/* Col 1: Priorities */}
            <div className="px-6 py-5">
              <ColHeader icon={<Flag size={14} />} title="Top priorities" count={priorities.length} />
              {top3.length === 0 ? (
                <p className="text-xs text-fg-muted">Complete setup to unlock priorities.</p>
              ) : (
                <div className="space-y-2.5">
                  {top3.map((p) => (
                    <div
                      key={p.rank}
                      className="group flex items-start gap-2.5 rounded-xl border border-border-light bg-surface-secondary px-3 py-2.5 transition hover:border-aeos-200 hover:bg-aeos-50/30"
                    >
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aeos-600 text-[9px] font-bold text-white">
                        {p.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium leading-snug text-fg">{p.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${CAT_COLORS[p.category] ?? "bg-surface-inset text-fg-secondary"}`}>
                            {p.category}
                          </span>
                          <span className="text-2xs tabular-nums text-fg-muted">Impact {p.impact_score.toFixed(0)}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-fg-hint transition group-hover:text-aeos-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Col 2: Risks */}
            <div className="px-6 py-5">
              <ColHeader icon={<ShieldAlert size={14} />} title="Risk alerts" count={risks.length} />
              {topRisks.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-status-success-light px-3 py-3">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[12px] font-medium text-status-success-text">No active risks detected</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topRisks.map((r) => {
                    const cfg = SEV[r.severity] ?? SEV.low;
                    return (
                      <div key={r.id} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${cfg.bg}`}>
                        <span className={`mt-0.5 shrink-0 ${cfg.text}`}>{cfg.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[12px] font-medium leading-snug ${cfg.text}`}>{r.title}</p>
                          <p className="mt-0.5 text-xs-tight leading-snug text-fg-muted">{r.recommended_action}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${cfg.bg} ${cfg.text}`}>
                          {r.severity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Col 3: 30-day roadmap */}
            <div className="px-6 py-5">
              <ColHeader icon={<CalendarRange size={14} />} title="30-day roadmap" count={roadmap30?.actions?.length} />
              {actions.length === 0 ? (
                <p className="text-xs text-fg-muted">No roadmap available. Priorities are needed first.</p>
              ) : (
                <div className="relative space-y-2.5">
                  <div className="absolute bottom-3 left-[11px] top-1 w-px bg-border" />
                  {actions.map((a, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <span className="z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-aeos-50 text-2xs font-bold text-aeos-700">
                        W{a.week}
                      </span>
                      <div className="min-w-0 flex-1 rounded-xl border border-border-light bg-surface-secondary px-3 py-2">
                        <p className="text-[12px] font-medium leading-snug text-fg">{a.action}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${DEPT_COLORS[a.department] ?? "bg-surface-inset text-fg-secondary"}`}>
                            {a.department}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(roadmap30?.actions?.length ?? 0) > 3 && (
                    <p className="pl-8 text-2xs text-fg-muted">+ {(roadmap30?.actions?.length ?? 0) - 3} more actions</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
