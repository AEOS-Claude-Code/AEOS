"use client";

import { Sparkles, ArrowUpRight, SearchX } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";

interface Opportunity {
  title: string;
  category: string;
  impact: "high" | "medium" | "low";
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { title: "Untapped local SEO keywords with high purchase intent", category: "keyword_gaps", impact: "high" },
  { title: "Competitor weakness in mobile experience", category: "competitor", impact: "high" },
  { title: "Missing Google Business optimization", category: "local_market", impact: "medium" },
  { title: "Form conversion rate below benchmark", category: "conversion", impact: "high" },
];

const IMPACT_STYLES = {
  high: "bg-status-danger-light text-status-danger-text border-red-200",
  medium: "bg-status-warning-light text-status-warning-text border-amber-200",
  low: "bg-surface-secondary text-fg-secondary border-border",
};

const CATEGORY_LABELS: Record<string, string> = {
  keyword_gaps: "SEO",
  competitor: "Compete",
  local_market: "Local",
  conversion: "CRO",
  social: "Social",
};

export default function OpportunityRadarCard({
  opportunities = MOCK_OPPORTUNITIES,
  totalDetected = 14,
  highImpact = 4,
  state = "success",
  error,
  onRetry,
}: {
  opportunities?: Opportunity[];
  totalDetected?: number;
  highImpact?: number;
  state?: CardState;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <DashCard
      title="Opportunity radar"
      subtitle={
        state === "success"
          ? `${totalDetected} detected \u00b7 ${highImpact} high-impact`
          : "Detecting growth opportunities"
      }
      badge={
        state === "success" && highImpact > 0 ? (
          <span className="flex items-center gap-1 rounded-full bg-aeos-50 px-2 py-0.5 text-2xs font-semibold text-aeos-700">
            <Sparkles size={10} />
            {highImpact} new
          </span>
        ) : undefined
      }
      delay={120}
    >
      {state === "loading" && <CardLoading lines={4} />}

      {state === "error" && (
        <CardError
          message="Opportunity data unavailable"
          detail={error ?? undefined}
          onRetry={onRetry}
        />
      )}

      {state === "empty" && (
        <CardEmpty
          icon={<SearchX size={20} className="text-fg-hint" />}
          title="No opportunities detected"
          description="AEOS will scan for growth opportunities once integrations and competitor data are available."
        />
      )}

      {state === "success" && (
        <div className="space-y-2">
          {opportunities.slice(0, 4).map((opp, i) => (
            <div
              key={i}
              className="group flex items-start gap-3 rounded-xl border border-border-light bg-surface-secondary px-3 py-2.5 transition hover:border-aeos-200 hover:bg-aeos-50/30"
            >
              <span
                className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${IMPACT_STYLES[opp.impact]}`}
              >
                {opp.impact}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-fg">
                  {opp.title}
                </p>
                <span className="text-2xs text-fg-muted">
                  {CATEGORY_LABELS[opp.category] ?? opp.category}
                </span>
              </div>
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
