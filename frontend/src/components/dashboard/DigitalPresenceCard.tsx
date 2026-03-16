"use client";

import DashCard from "./DashCard";
import type { HealthScore } from "@/lib/hooks/useStrategyData";

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 96 96">
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth="6"
        />
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          style={{ animation: "score-fill 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-slate-800">
          {score.toFixed(0)}
        </span>
        <span className="text-[10px] text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

interface BreakdownItem {
  label: string;
  value: number;
}

function BreakdownBar({ label, value }: BreakdownItem) {
  const barColor =
    value >= 65 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[11px] text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-slate-600">
        {value.toFixed(0)}
      </span>
    </div>
  );
}

export default function DigitalPresenceCard({
  health,
}: {
  health: HealthScore;
}) {
  const breakdown: BreakdownItem[] = [
    { label: "Website", value: 65 },
    { label: "Search", value: 38 },
    { label: "Social", value: 55 },
    { label: "Reputation", value: 60 },
    { label: "Conversion", value: 42 },
  ];

  return (
    <DashCard
      title="Digital presence score"
      subtitle="Composite score across all channels"
      delay={0}
    >
      <div className="flex items-center gap-6">
        <ScoreRing score={health.digital_presence} />
        <div className="flex-1 space-y-2.5">
          {breakdown.map((b) => (
            <BreakdownBar key={b.label} {...b} />
          ))}
        </div>
      </div>
    </DashCard>
  );
}
