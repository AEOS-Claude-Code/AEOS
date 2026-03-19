"use client";

import { useEngineData } from "@/lib/hooks/useEngineData";
import { resolveCardState } from "@/components/ui/CardStates";
import OpportunityRadarCard from "@/components/dashboard/OpportunityRadarCard";
import TopOpportunitiesCard from "@/components/dashboard/TopOpportunitiesCard";
import DashCard from "@/components/dashboard/DashCard";
import { StaggerGrid } from "@/components/ui/StaggerGrid";
import { Sparkles, ArrowUpRight } from "lucide-react";

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-status-danger-light text-status-danger-text",
  medium: "bg-status-warning-light text-status-warning-text",
  low: "bg-status-success-light text-status-success-text",
};

const CATEGORY_COLORS: Record<string, string> = {
  seo: "bg-status-info-light text-status-info-text",
  content: "bg-violet-50 text-violet-700",
  social: "bg-pink-50 text-pink-700",
  lead_generation: "bg-status-success-light text-status-success-text",
  conversion: "bg-status-warning-light text-status-warning-text",
  competitive: "bg-status-danger-light text-status-danger-text",
};

export default function OpportunitiesPage() {
  const { opportunityRadar, loading, errors, refresh } = useEngineData();

  const oppState = resolveCardState({
    loading,
    error: !!errors.opportunities,
    hasData: (opportunityRadar?.total_detected ?? 0) > 0,
  });

  const oppCardItems = opportunityRadar?.opportunities?.map((o) => ({
    title: o.title,
    category: o.category,
    impact: o.impact as "high" | "medium" | "low",
  }));

  const allOpps = opportunityRadar?.opportunities ?? [];

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200/40">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-fg">Opportunities</h1>
          <p className="text-xs text-fg-muted">AI-detected growth opportunities ranked by impact</p>
        </div>
      </div>

      {/* Summary cards */}
      <StaggerGrid className="mb-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <OpportunityRadarCard
          opportunities={oppCardItems}
          totalDetected={opportunityRadar?.total_detected ?? 0}
          highImpact={opportunityRadar?.high_impact_count ?? 0}
          state={oppState}
          error={errors.opportunities}
          onRetry={refresh}
        />
        <TopOpportunitiesCard
          opportunities={opportunityRadar?.opportunities?.slice(0, 5) ?? []}
          state={oppState}
        />

        {/* Impact breakdown */}
        <DashCard title="Impact breakdown" subtitle="By category" delay={240}>
          {allOpps.length === 0 ? (
            <p className="py-6 text-center text-xs text-fg-muted">No opportunities detected yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(
                allOpps.reduce((acc, o) => {
                  acc[o.category] = (acc[o.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`rounded-pill px-2 py-0.5 text-2xs font-semibold ${CATEGORY_COLORS[cat] ?? "bg-surface-inset text-fg-hint"}`}>
                    {cat.replace(/_/g, " ")}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
                    <div className="h-full rounded-full bg-aeos-400" style={{ width: `${(count / allOpps.length) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-2xs font-semibold tabular-nums text-fg-secondary">{count}</span>
                </div>
              ))}
            </div>
          )}
        </DashCard>
      </StaggerGrid>

      {/* Full opportunity list */}
      <DashCard title="All opportunities" subtitle={`${allOpps.length} detected`} delay={0}>
        {allOpps.length === 0 ? (
          <p className="py-6 text-center text-xs text-fg-muted">No opportunities detected.</p>
        ) : (
          <div className="space-y-2">
            {allOpps.map((opp) => (
              <div key={opp.id} className="group flex items-start gap-3 rounded-widget border border-border-light bg-surface-secondary px-4 py-3 transition hover:border-aeos-200">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-fg">{opp.title}</p>
                  <p className="mt-0.5 text-2xs text-fg-muted line-clamp-2">{opp.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-pill px-2 py-0.5 text-2xs font-semibold ${IMPACT_COLORS[opp.impact] ?? ""}`}>{opp.impact}</span>
                    <span className={`rounded-pill px-2 py-0.5 text-2xs font-semibold ${CATEGORY_COLORS[opp.category] ?? "bg-surface-inset text-fg-hint"}`}>{opp.category.replace(/_/g, " ")}</span>
                    <span className="text-2xs tabular-nums text-fg-hint">Impact {opp.impact_score} · Effort {opp.effort_score}</span>
                  </div>
                </div>
                <ArrowUpRight size={14} className="mt-1 shrink-0 text-fg-hint transition group-hover:text-aeos-500" />
              </div>
            ))}
          </div>
        )}
      </DashCard>
    </div>
  );
}
