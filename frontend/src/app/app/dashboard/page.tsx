"use client";

import { useStrategyData } from "@/lib/hooks/useStrategyData";
import { useEngineData } from "@/lib/hooks/useEngineData";
import { resolveCardState, type CardState } from "@/components/ui/CardStates";

import DigitalPresenceCard from "@/components/dashboard/DigitalPresenceCard";
import LeadIntelligenceCard from "@/components/dashboard/LeadIntelligenceCard";
import OpportunityRadarCard from "@/components/dashboard/OpportunityRadarCard";
import IntegrationStatusCard from "@/components/dashboard/IntegrationStatusCard";
import StrategicPrioritiesCard from "@/components/dashboard/StrategicPrioritiesCard";
import StrategicIntelligenceCard from "@/components/dashboard/StrategicIntelligenceCard";
import LeadSourcesCard from "@/components/dashboard/LeadSourcesCard";
import LeadScoreCard from "@/components/dashboard/LeadScoreCard";
import TopOpportunitiesCard from "@/components/dashboard/TopOpportunitiesCard";
import CompanyIntelligenceCard from "@/components/dashboard/CompanyIntelligenceCard";
import AskAeosCard from "@/components/dashboard/AskAeosCard";
import BillingCard from "@/components/dashboard/BillingCard";

/* ── Connection bar ───────────────────────────────────────────── */

function ConnectionBar({
  stratConnected,
  stratLoading,
  engineLoading,
  engineErrors,
}: {
  stratConnected: boolean;
  stratLoading: boolean;
  engineLoading: boolean;
  engineErrors: { leads: string | null; opportunities: string | null; scan: string | null };
}) {
  const sources = [
    {
      label: "Strategy",
      status: stratLoading ? "loading" : stratConnected ? "live" : "error",
    },
    {
      label: "Scanner",
      status: engineLoading ? "loading" : engineErrors.scan ? "error" : "live",
    },
    {
      label: "Leads",
      status: engineLoading ? "loading" : engineErrors.leads ? "error" : "live",
    },
    {
      label: "Opportunities",
      status: engineLoading ? "loading" : engineErrors.opportunities ? "error" : "live",
    },
  ];

  const dotColor: Record<string, string> = {
    live: "bg-emerald-500",
    loading: "bg-yellow-400",
    error: "bg-red-500",
  };

  const labelText: Record<string, string> = {
    live: "Live",
    loading: "\u2026",
    error: "Err",
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-card">
      <span className="text-2xs font-semibold uppercase tracking-wider text-fg-hint">
        Intelligence engines
      </span>
      {sources.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5 text-xs-tight text-fg-secondary">
          <span
            className={`h-1.5 w-1.5 rounded-full ${dotColor[s.status] ?? "bg-slate-300"} ${
              s.status === "live" ? "pulse-dot" : ""
            }`}
          />
          {s.label}
          <span className="font-medium text-fg-muted">{labelText[s.status] ?? s.status}</span>
        </span>
      ))}
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────── */

export default function DashboardPage() {
  /* Strategy layer (SIE — reads from real DB via auth) */
  const {
    summary,
    priorities,
    roadmap,
    risks,
    loading: stratLoading,
    error: stratError,
    connected: stratConnected,
    refresh: stratRefresh,
  } = useStrategyData();

  /* Engine layer (Lead + Opportunity — reads from real DB via auth) */
  const {
    leadSummary,
    opportunityRadar,
    companyScan,
    loading: engineLoading,
    errors: engineErrors,
    refresh: engineRefresh,
  } = useEngineData();

  const loading = stratLoading || engineLoading;
  const roadmap30 = roadmap.roadmaps?.["30"];

  function refreshAll() {
    stratRefresh();
    engineRefresh();
  }

  /* Card states */
  const strategyState: CardState = resolveCardState({
    loading: stratLoading,
    error: !!stratError,
    hasData: priorities.priorities.length > 0 || risks.risks.length > 0,
  });

  const leadState: CardState = resolveCardState({
    loading: engineLoading,
    error: !!engineErrors.leads,
    hasData: (leadSummary?.total_leads_30d ?? 0) > 0,
  });

  const oppState: CardState = resolveCardState({
    loading: engineLoading,
    error: !!engineErrors.opportunities,
    hasData: (opportunityRadar?.total_detected ?? 0) > 0,
  });

  const scanState: CardState = resolveCardState({
    loading: engineLoading,
    error: !!engineErrors.scan,
    hasData: !!companyScan && companyScan.status === "completed",
  });

  /* Map engine data to card props */
  const leadCardData = leadSummary
    ? {
        totalLeads: leadSummary.total_leads_30d,
        qualifiedLeads: leadSummary.qualified_leads_30d,
        conversionRate: leadSummary.conversion_rate,
        topSource: leadSummary.top_source
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        trend: leadSummary.trend,
      }
    : undefined;

  const oppCardItems = opportunityRadar?.opportunities?.map((o) => ({
    title: o.title,
    category: o.category,
    impact: o.impact as "high" | "medium" | "low",
  }));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
          <span className="text-sm text-fg-muted">Loading intelligence engines\u2026</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2">
        <h1 className="text-xl font-bold text-fg">Dashboard</h1>
        <p className="mt-0.5 text-sm text-fg-muted">
          Executive overview of {summary.company_name}
        </p>
      </div>

      <ConnectionBar
        stratConnected={stratConnected}
        stratLoading={stratLoading}
        engineLoading={engineLoading}
        engineErrors={engineErrors}
      />

      {/* Row 0: Strategic Intelligence – full width */}
      <div className="mb-5">
        <StrategicIntelligenceCard
          health={summary.health_score}
          headline={summary.headline}
          priorities={priorities.priorities}
          risks={risks.risks}
          roadmap30={roadmap30}
          state={strategyState}
          error={stratError}
          onRetry={refreshAll}
        />
      </div>

      {/* Row 1: Core metrics */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <CompanyIntelligenceCard
          report={companyScan}
          state={scanState}
          error={engineErrors.scan}
          onRetry={engineRefresh}
        />

        <LeadIntelligenceCard
          data={leadCardData}
          state={leadState}
          error={engineErrors.leads}
          onRetry={engineRefresh}
        />

        <OpportunityRadarCard
          opportunities={oppCardItems}
          totalDetected={opportunityRadar?.total_detected ?? 0}
          highImpact={opportunityRadar?.high_impact_count ?? 0}
          state={oppState}
          error={engineErrors.opportunities}
          onRetry={engineRefresh}
        />
      </div>

      {/* Row 2: Deep intelligence */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <LeadSourcesCard
          sources={leadSummary?.by_source ?? []}
          state={leadState}
        />

        <LeadScoreCard
          distribution={leadSummary?.by_classification ?? {}}
          totalLeads={leadSummary?.total_leads_30d ?? 0}
          state={leadState}
        />

        <TopOpportunitiesCard
          opportunities={opportunityRadar?.opportunities?.slice(0, 5) ?? []}
          state={oppState}
        />
      </div>

      {/* Row 3: Platform */}
      {/* Row 3: Platform + AI */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <DigitalPresenceCard health={summary.health_score} state={strategyState} error={stratError} onRetry={stratRefresh} />

        <IntegrationStatusCard />

        <AskAeosCard />

        <StrategicPrioritiesCard priorities={priorities.priorities} state={strategyState} />
      </div>

      {/* Row 4: Billing */}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <BillingCard />
      </div>
    </>
  );
}
