"use client";

import type { HealthScore } from "@/lib/hooks/useStrategyData";

const SEVERITY_CONFIG: Record<
  string,
  { dot: string; bg: string; text: string; label: string }
> = {
  critical: {
    dot: "bg-red-500",
    bg: "bg-status-danger-light",
    text: "text-status-danger-text",
    label: "Critical",
  },
  high: {
    dot: "bg-amber-500",
    bg: "bg-status-warning-light",
    text: "text-status-warning-text",
    label: "High",
  },
  medium: {
    dot: "bg-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-800 dark:text-yellow-200",
    label: "Medium",
  },
  low: {
    dot: "bg-slate-400",
    bg: "bg-surface-secondary",
    text: "text-fg",
    label: "Low",
  },
};

interface RiskDimension {
  label: string;
  score: number;
  threshold: number;
}

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 70
      ? "text-emerald-600"
      : clamped >= 45
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold tabular-nums ${color}`}>
        {clamped.toFixed(0)}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-fg-hint">
        Health
      </span>
    </div>
  );
}

function DimensionRow({ dim }: { dim: RiskDimension }) {
  const isAtRisk = dim.score < dim.threshold;
  const barColor = isAtRisk ? "bg-red-400" : "bg-emerald-400";
  const severity = isAtRisk
    ? dim.score < dim.threshold * 0.5
      ? "critical"
      : "high"
    : undefined;
  const cfg = severity ? SEVERITY_CONFIG[severity] : null;

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-fg-muted">{dim.label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, dim.score)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-fg-muted">
        {dim.score.toFixed(0)}
      </span>
      {cfg && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}
        >
          {cfg.label}
        </span>
      )}
    </div>
  );
}

export default function RiskSummaryCard({
  health,
  headline,
}: {
  health: HealthScore;
  headline: string;
}) {
  const dimensions: RiskDimension[] = [
    {
      label: "Digital presence",
      score: health.digital_presence,
      threshold: 50,
    },
    { label: "Lead generation", score: health.lead_generation, threshold: 50 },
    {
      label: "Competitive pos.",
      score: health.competitive_position,
      threshold: 50,
    },
    {
      label: "Integrations",
      score: health.integration_coverage,
      threshold: 40,
    },
    {
      label: "Setup complete",
      score: health.setup_completeness,
      threshold: 80,
    },
  ];

  const riskCount = dimensions.filter((d) => d.score < d.threshold).length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-hint">
          Risk summary
        </h3>
        {riskCount > 0 && (
          <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-status-danger-text">
            {riskCount} area{riskCount > 1 ? "s" : ""} at risk
          </span>
        )}
      </div>

      <div className="mb-4 flex items-start gap-4">
        <ScoreGauge score={health.overall} />
        <p className="flex-1 text-sm leading-relaxed text-fg-secondary">
          {headline}
        </p>
      </div>

      <div className="space-y-2.5">
        {dimensions.map((dim) => (
          <DimensionRow key={dim.label} dim={dim} />
        ))}
      </div>
    </div>
  );
}
