"use client";

import DashCard from "./DashCard";
import { CardLoading, CardEmpty, type CardState } from "@/components/ui/CardStates";
import { Target, ArrowUpRight } from "lucide-react";

interface OpportunityItem {
  id: string;
  title: string;
  category: string;
  impact: string;
  impact_score: number;
  effort_score: number;
  recommended_action: string;
}

const CAT_LABELS: Record<string, string> = {
  keyword_gaps: "SEO",
  competitor: "Compete",
  local_market: "Local",
  conversion: "CRO",
  social: "Social",
  content: "Content",
  technical: "Technical",
};

const IMPACT_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export default function TopOpportunitiesCard({
  opportunities,
  state = "success",
}: {
  opportunities: OpportunityItem[];
  state?: CardState;
}) {
  return (
    <DashCard
      title="Top opportunities"
      subtitle="Ranked by impact score"
      badge={
        state === "success" && opportunities.length > 0 ? (
          <span className="rounded-full bg-aeos-50 px-2 py-0.5 text-2xs font-semibold text-aeos-700">
            <Target size={10} className="mr-1 inline" />
            {opportunities.length}
          </span>
        ) : undefined
      }
      delay={480}
    >
      {state === "loading" && <CardLoading lines={5} />}

      {(state === "empty" || (state === "success" && opportunities.length === 0)) && (
        <CardEmpty
          icon={<Target size={20} className="text-fg-hint" />}
          title="No opportunities ranked yet"
          description="Opportunities will be ranked once enough data is available."
        />
      )}

      {state === "success" && opportunities.length > 0 && (
        <div className="space-y-2">
          {opportunities.map((o, i) => (
            <div
              key={o.id}
              className="group flex items-start gap-3 rounded-widget border border-border-light bg-surface-secondary px-3 py-2.5 transition hover:border-aeos-200 hover:bg-aeos-50/30"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-inset text-2xs font-bold text-fg-hint">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug text-fg">{o.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${IMPACT_DOT[o.impact] ?? "bg-slate-300"}`} />
                  <span className="text-2xs text-fg-muted">
                    {CAT_LABELS[o.category] ?? o.category}
                  </span>
                  <span className="text-2xs tabular-nums text-fg-hint">
                    Impact {o.impact_score} / Effort {o.effort_score}
                  </span>
                </div>
              </div>
              <ArrowUpRight
                size={13}
                className="mt-0.5 shrink-0 text-fg-hint transition group-hover:text-aeos-500"
              />
            </div>
          ))}
        </div>
      )}
    </DashCard>
  );
}
