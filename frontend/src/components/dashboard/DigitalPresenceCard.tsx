"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";
import type { HealthScore } from "@/lib/hooks/useStrategyData";

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 48 48)" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-fg">{score.toFixed(0)}</span>
        <span className="text-2xs text-fg-hint">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 65 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs-tight text-fg-secondary">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-7 text-right text-xs-tight font-semibold tabular-nums text-fg-secondary">{value.toFixed(0)}</span>
    </div>
  );
}

export default function DigitalPresenceCard({
  health,
  state = "success",
  error,
  onRetry,
}: {
  health: HealthScore;
  state?: CardState;
  error?: string | null;
  onRetry?: () => void;
}) {
  const breakdown = [
    { label: "Digital", value: health.digital_presence },
    { label: "Lead gen", value: health.lead_generation },
    { label: "Competitive", value: health.competitive_position },
    { label: "Integrations", value: health.integration_coverage },
    { label: "Setup", value: health.setup_completeness },
  ];

  return (
    <DashCard
      title="Digital presence score"
      subtitle="Composite score across all channels"
      badge={
        <Link href="/app/digital-presence" className="text-2xs font-medium text-aeos-600 hover:text-aeos-700">
          View details →
        </Link>
      }
      delay={0}
    >
      {state === "loading" && <CardLoading lines={4} />}
      {state === "error" && <CardError message="Presence data unavailable" detail={error ?? undefined} onRetry={onRetry} />}
      {state === "empty" && (
        <CardEmpty icon={<Activity size={20} className="text-fg-hint" />} title="No presence data" description="Complete onboarding to generate your digital presence score." />
      )}
      {state === "success" && (
        <div className="flex items-center gap-6">
          <ScoreRing score={health.digital_presence} />
          <div className="flex-1 space-y-2.5">
            {breakdown.map((b) => <BreakdownBar key={b.label} {...b} />)}
          </div>
        </div>
      )}
    </DashCard>
  );
}
