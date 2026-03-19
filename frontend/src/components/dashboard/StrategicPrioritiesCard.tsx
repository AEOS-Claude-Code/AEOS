"use client";

import { Flag, ArrowUpRight } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  type CardState,
} from "@/components/ui/CardStates";
import type { Priority } from "@/lib/hooks/useStrategyData";

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "bg-blue-500",
  growth: "bg-emerald-500",
  operations: "bg-amber-500",
  technology: "bg-violet-500",
  hr: "bg-pink-500",
  finance: "bg-cyan-500",
};

const CATEGORY_BG: Record<string, string> = {
  marketing: "bg-blue-100 text-blue-700",
  growth: "bg-emerald-100 text-emerald-700",
  operations: "bg-amber-100 text-amber-700",
  technology: "bg-violet-100 text-violet-700",
  hr: "bg-pink-100 text-pink-700",
  finance: "bg-cyan-100 text-cyan-700",
};

export default function StrategicPrioritiesCard({
  priorities,
  state = "success",
}: {
  priorities: Priority[];
  state?: CardState;
}) {
  const top = priorities.slice(0, 4);

  return (
    <DashCard
      title="Strategic priorities"
      subtitle="Ranked by impact score"
      badge={
        <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
          <Flag size={10} />
          {priorities.length}
        </span>
      }
      delay={300}
    >
      {state === "loading" && <CardLoading lines={4} />}

      {state === "empty" && (
        <CardEmpty
          icon={<Flag size={20} className="text-fg-hint" />}
          title="No priorities yet"
          description="Complete setup to unlock strategic priorities."
        />
      )}

      {state === "success" && top.length === 0 && (
        <p className="py-4 text-center text-xs text-fg-muted">
          Complete setup to unlock priorities.
        </p>
      )}

      {state === "success" && top.length > 0 && (
        <div className="space-y-2">
          {top.map((p) => (
            <div
              key={p.rank}
              className="group flex items-center gap-3 rounded-xl border border-border-light bg-surface-secondary px-3 py-2.5 transition hover:border-aeos-200 hover:bg-aeos-50/30"
            >
              {/* Rank */}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-inset text-[10px] font-bold text-fg-secondary">
                {p.rank}
              </span>

              {/* Category dot */}
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  CATEGORY_COLORS[p.category] ?? "bg-slate-400"
                }`}
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-fg">
                  {p.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${
                      CATEGORY_BG[p.category] ?? "bg-surface-inset text-fg-secondary"
                    }`}
                  >
                    {p.category}
                  </span>
                  <span className="text-[10px] tabular-nums text-fg-hint">
                    Impact {p.impact_score.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ArrowUpRight
                size={14}
                className="shrink-0 text-fg-hint transition group-hover:text-aeos-500"
              />
            </div>
          ))}
        </div>
      )}
    </DashCard>
  );
}
