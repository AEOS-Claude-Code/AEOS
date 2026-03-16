"use client";

import DashCard from "./DashCard";
import { CardLoading, CardEmpty, type CardState } from "@/components/ui/CardStates";
import { BarChart3 } from "lucide-react";

interface SourceData {
  source: string;
  count: number;
  avg_score: number;
}

const SOURCE_LABELS: Record<string, string> = {
  organic_search: "Organic search",
  paid_search: "Paid search",
  social: "Social",
  referral: "Referral",
  direct: "Direct",
  email: "Email",
  whatsapp: "WhatsApp",
};

const SOURCE_COLORS: Record<string, string> = {
  organic_search: "bg-emerald-500",
  paid_search: "bg-blue-500",
  social: "bg-pink-500",
  referral: "bg-violet-500",
  direct: "bg-slate-400",
  email: "bg-amber-500",
  whatsapp: "bg-green-500",
};

export default function LeadSourcesCard({
  sources,
  state = "success",
}: {
  sources: SourceData[];
  state?: CardState;
}) {
  const maxCount = Math.max(1, ...sources.map((s) => s.count));

  return (
    <DashCard
      title="Lead sources"
      subtitle="Attribution by channel"
      badge={
        state === "success" && sources.length > 0 ? (
          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-2xs font-semibold text-fg-muted">
            {sources.length} sources
          </span>
        ) : undefined
      }
      delay={360}
    >
      {state === "loading" && <CardLoading lines={4} />}

      {(state === "empty" || (state === "success" && sources.length === 0)) && (
        <CardEmpty
          icon={<BarChart3 size={20} className="text-fg-hint" />}
          title="No source data yet"
          description="Lead sources will appear once leads are captured."
        />
      )}

      {state === "success" && sources.length > 0 && (
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.source} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs-tight text-fg-secondary">
                {SOURCE_LABELS[s.source] ?? s.source}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-inset">
                <div
                  className={`h-full rounded-pill ${SOURCE_COLORS[s.source] ?? "bg-aeos-500"}`}
                  style={{ width: `${(s.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs-tight font-bold tabular-nums text-fg">
                {s.count}
              </span>
              <span className="w-10 text-right text-2xs tabular-nums text-fg-hint">
                avg {s.avg_score.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashCard>
  );
}
