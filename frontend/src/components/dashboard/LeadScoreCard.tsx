"use client";

import DashCard from "./DashCard";
import { CardLoading, CardEmpty, type CardState } from "@/components/ui/CardStates";
import { Thermometer } from "lucide-react";

const CLASS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  hot: { label: "Hot", color: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  warm: { label: "Warm", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  cold: { label: "Cold", color: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
};

export default function LeadScoreCard({
  distribution,
  totalLeads,
  state = "success",
}: {
  distribution: Record<string, number>;
  totalLeads: number;
  state?: CardState;
}) {
  const hot = distribution.hot ?? 0;
  const warm = distribution.warm ?? 0;
  const cold = distribution.cold ?? 0;
  const total = hot + warm + cold || 1;

  const segments = [
    { key: "hot", count: hot, pct: (hot / total) * 100 },
    { key: "warm", count: warm, pct: (warm / total) * 100 },
    { key: "cold", count: cold, pct: (cold / total) * 100 },
  ];

  return (
    <DashCard
      title="Lead score distribution"
      subtitle="Classification breakdown"
      badge={
        state === "success" && totalLeads > 0 ? (
          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-2xs font-semibold text-fg-muted">
            {totalLeads} leads
          </span>
        ) : undefined
      }
      delay={420}
    >
      {state === "loading" && <CardLoading lines={3} />}

      {(state === "empty" || (state === "success" && totalLeads === 0)) && (
        <CardEmpty
          icon={<Thermometer size={20} className="text-fg-hint" />}
          title="No score data yet"
          description="Lead scores will appear once leads are captured and scored."
        />
      )}

      {state === "success" && totalLeads > 0 && (
        <>
          {/* Stacked bar */}
          <div className="mb-4 flex h-4 overflow-hidden rounded-pill">
            {segments.map((s) =>
              s.pct > 0 ? (
                <div
                  key={s.key}
                  className={`${CLASS_CONFIG[s.key]?.color ?? "bg-slate-300"}`}
                  style={{ width: `${s.pct}%` }}
                />
              ) : null
            )}
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {segments.map((s) => {
              const cfg = CLASS_CONFIG[s.key];
              if (!cfg) return null;
              return (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3 w-3 rounded-full ${cfg.color}`} />
                    <span className="text-sm-tight font-medium text-fg">{cfg.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      score {s.key === "hot" ? "70-100" : s.key === "warm" ? "40-69" : "0-39"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm-tight font-bold tabular-nums text-fg">{s.count}</span>
                    <span className="text-2xs tabular-nums text-fg-hint">
                      {s.pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashCard>
  );
}
