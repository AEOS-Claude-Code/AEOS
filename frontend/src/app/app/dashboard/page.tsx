"use client";

import { useStrategyData } from "@/lib/hooks/useStrategyData";
import { resolveCardState, type CardState } from "@/components/ui/CardStates";
import type { ConnectionStatus } from "@/lib/hooks/useStrategyData";

import DigitalPresenceCard from "@/components/dashboard/DigitalPresenceCard";
import LeadIntelligenceCard from "@/components/dashboard/LeadIntelligenceCard";
import OpportunityRadarCard from "@/components/dashboard/OpportunityRadarCard";
import IntegrationStatusCard from "@/components/dashboard/IntegrationStatusCard";
import AIBriefingCard from "@/components/dashboard/AIBriefingCard";
import StrategicPrioritiesCard from "@/components/dashboard/StrategicPrioritiesCard";
import StrategicIntelligenceCard from "@/components/dashboard/StrategicIntelligenceCard";

/* ── Connection status bar ────────────────────────────────────── */

function ConnectionBar({ connection }: { connection: ConnectionStatus }) {
  const sources = [
    { label: "Backend", status: connection.backend },
    { label: "Strategy API", status: connection.strategy },
    { label: "Lead data", status: connection.leads === "live" ? "connected" : "mock" },
    { label: "Opportunities", status: connection.opportunities === "live" ? "connected" : "mock" },
    { label: "Integrations", status: connection.integrations === "live" ? "connected" : "mock" },
  ] as const;

  const dotColor: Record<string, string> = {
    connected: "bg-emerald-500",
    live: "bg-emerald-500",
    loading: "bg-yellow-400",
    error: "bg-red-500",
    mock: "bg-amber-400",
  };

  const labelText: Record<string, string> = {
    connected: "Live",
    live: "Live",
    loading: "\u2026",
    error: "Offline",
    mock: "Demo",
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-card">
      <span className="text-2xs font-semibold uppercase tracking-wider text-fg-hint">
        Data sources
      </span>
      {sources.map((s) => (
        <span
          key={s.label}
          className="flex items-center gap-1.5 text-xs-tight text-fg-secondary"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dotColor[s.status] ?? "bg-slate-300"
            } ${s.status === "connected" || s.status === "live" ? "pulse-dot" : ""}`}
          />
          {s.label}
          <span className="font-medium text-fg-muted">
            {labelText[s.status] ?? s.status}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ── Dashboard page ───────────────────────────────────────────── */

export default function DashboardPage() {
  const {
    summary,
    priorities,
    roadmap,
    risks,
    leads,
    opportunities,
    integrations,
    connection,
    loading,
    errors,
    refresh,
  } = useStrategyData();

  const roadmap30 = roadmap.roadmaps?.["30"];

  /* Resolve per-card states */
  const strategyState: CardState = resolveCardState({
    loading,
    error: connection.strategy === "error",
    hasData: priorities.priorities.length > 0 || risks.risks.length > 0,
  });

  const leadState: CardState = resolveCardState({
    loading,
    error: !!errors.leads,
    hasData: (leads?.totalLeads ?? 0) > 0,
  });

  const oppState: CardState = resolveCardState({
    loading,
    error: !!errors.opportunities,
    hasData: (opportunities?.totalDetected ?? 0) > 0,
  });

  const integState: CardState = resolveCardState({
    loading,
    error: !!errors.integrations,
    hasData: (integrations?.items?.length ?? 0) > 0,
  });

  /* Full-page loading (only on first load) */
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
          <span className="text-sm text-fg-muted">
            Loading strategic intelligence\u2026
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page heading */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-fg">Dashboard</h1>
        <p className="mt-0.5 text-sm text-fg-muted">
          Executive overview of {summary.company_name}
        </p>
      </div>

      <ConnectionBar connection={connection} />

      {/* Strategic Intelligence – full width */}
      <div className="mb-5">
        <StrategicIntelligenceCard
          health={summary.health_score}
          headline={summary.headline}
          priorities={priorities.priorities}
          risks={risks.risks}
          roadmap30={roadmap30}
          state={strategyState}
          error={errors.strategy}
          onRetry={refresh}
        />
      </div>

      {/* Card grid */}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DigitalPresenceCard health={summary.health_score} />

        <LeadIntelligenceCard
          data={leads}
          state={leadState}
          error={errors.leads}
          onRetry={refresh}
        />

        <OpportunityRadarCard
          totalDetected={opportunities.totalDetected}
          highImpact={opportunities.highImpactCount}
          state={oppState}
          error={errors.opportunities}
          onRetry={refresh}
        />

        <IntegrationStatusCard
          integrations={integrations.items}
          state={integState}
          error={errors.integrations}
          onRetry={refresh}
        />

        <AIBriefingCard
          headline={summary.headline}
          keyInsight={summary.key_insight}
          healthScore={summary.health_score.overall}
          companyName={summary.company_name}
        />

        <StrategicPrioritiesCard priorities={priorities.priorities} />
      </div>
    </>
  );
}
