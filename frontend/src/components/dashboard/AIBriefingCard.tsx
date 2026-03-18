"use client";

import { Brain, ChevronRight } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  type CardState,
} from "@/components/ui/CardStates";

interface BriefingProps {
  headline: string;
  keyInsight: string;
  healthScore: number;
  companyName: string;
  state?: CardState;
}

export default function AIBriefingCard({
  headline,
  keyInsight,
  healthScore,
  companyName,
  state = "success",
}: BriefingProps) {
  const scoreColor =
    healthScore >= 70
      ? "from-emerald-500 to-emerald-600"
      : healthScore >= 45
        ? "from-amber-500 to-amber-600"
        : "from-red-500 to-red-600";

  return (
    <DashCard
      title="AI executive briefing"
      subtitle="Today's strategic summary"
      badge={
        <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
          <Brain size={10} />
          AI
        </span>
      }
      delay={240}
    >
      {state === "loading" && <CardLoading lines={3} />}

      {state === "empty" && (
        <CardEmpty
          icon={<Brain size={20} className="text-fg-hint" />}
          title="No briefing available"
          description="Strategic data is needed to generate an AI briefing."
        />
      )}

      {state === "success" && (
        <>
          {/* Health score banner */}
      <div
        className={`mb-4 flex items-center gap-4 rounded-xl bg-gradient-to-r ${scoreColor} px-4 py-3`}
      >
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-white">
            {healthScore.toFixed(0)}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-white/70">
            Health
          </span>
        </div>
        <div className="h-8 w-px bg-white/20" />
        <p className="flex-1 text-[12px] leading-relaxed text-white/90">
          {headline}
        </p>
      </div>

      {/* Key insight */}
      <div className="rounded-xl border border-border-light bg-surface-secondary px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-hint">
          Key insight
        </span>
        <p className="mt-1 text-[12px] leading-relaxed text-fg-secondary">
          {keyInsight}
        </p>
      </div>

      {/* Action */}
      <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-aeos-200 bg-aeos-50/50 py-2.5 text-[12px] font-semibold text-aeos-700 transition hover:bg-aeos-100/60">
        Ask AEOS for details
        <ChevronRight size={14} />
      </button>
        </>
      )}
    </DashCard>
  );
}
