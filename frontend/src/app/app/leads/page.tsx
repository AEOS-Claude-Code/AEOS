"use client";

import { useEngineData } from "@/lib/hooks/useEngineData";
import { resolveCardState } from "@/components/ui/CardStates";
import LeadIntelligenceCard from "@/components/dashboard/LeadIntelligenceCard";
import LeadSourcesCard from "@/components/dashboard/LeadSourcesCard";
import LeadScoreCard from "@/components/dashboard/LeadScoreCard";
import DashCard from "@/components/dashboard/DashCard";
import { Users, Filter, Download } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-emerald-100 text-emerald-700",
  proposal: "bg-violet-100 text-violet-700",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-700",
};

export default function LeadsPage() {
  const { leadSummary, leads, loading, errors, refresh } = useEngineData();

  const leadState = resolveCardState({
    loading,
    error: !!errors.leads,
    hasData: (leadSummary?.total_leads_30d ?? 0) > 0,
  });

  const leadCardData = leadSummary
    ? {
        totalLeads: leadSummary.total_leads_30d,
        qualifiedLeads: leadSummary.qualified_leads_30d,
        conversionRate: leadSummary.conversion_rate,
        topSource: leadSummary.top_source.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        trend: leadSummary.trend,
      }
    : undefined;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200/40">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-fg">Leads</h1>
            <p className="text-xs text-fg-muted">Track, score, and manage your sales pipeline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl bg-surface-inset px-3 py-2 text-xs font-medium text-fg transition hover:bg-surface-secondary">
            <Filter size={13} /> Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-surface-inset px-3 py-2 text-xs font-medium text-fg transition hover:bg-surface-secondary">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <LeadIntelligenceCard data={leadCardData} state={leadState} error={errors.leads} onRetry={refresh} />
        <LeadSourcesCard sources={leadSummary?.by_source ?? []} state={leadState} />
        <LeadScoreCard distribution={leadSummary?.by_classification ?? {}} totalLeads={leadSummary?.total_leads_30d ?? 0} state={leadState} />
      </div>

      {/* Lead table */}
      <DashCard title="Lead pipeline" subtitle={`${leads.length} leads`} delay={0}>
        {leads.length === 0 ? (
          <p className="py-6 text-center text-xs text-fg-muted">No leads captured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-light text-2xs font-bold uppercase tracking-wider text-fg-hint">
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 15).map((lead) => (
                  <tr key={lead.id} className="border-b border-border-light/50 transition-colors hover:bg-surface-secondary/50 last:border-0">
                    <td className="px-3 py-2.5 font-bold text-fg">{lead.name}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{lead.company}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{lead.source.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2.5">
                      <span className="tabular-nums font-bold text-fg">{lead.score}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${STATUS_COLORS[lead.status] ?? "bg-surface-inset text-fg-muted"}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-fg-hint">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>
    </div>
  );
}
