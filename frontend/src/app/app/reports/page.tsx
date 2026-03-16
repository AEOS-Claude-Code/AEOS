"use client";

import { useEngineData } from "@/lib/hooks/useEngineData";
import DashCard from "@/components/dashboard/DashCard";
import { CardEmpty } from "@/components/ui/CardStates";
import { FileBarChart, Download, ExternalLink, Clock, Shield, TrendingUp, Users } from "lucide-react";

const REPORT_TEMPLATES = [
  { name: "Company Intelligence Report", icon: <Shield size={16} />, description: "Full website analysis, SEO score, social presence, tech stack.", available: true, engine: "company_scanner" },
  { name: "Lead Pipeline Report", icon: <Users size={16} />, description: "Lead volume, sources, conversion rates, and pipeline health.", available: true, engine: "lead_intelligence" },
  { name: "Opportunity Assessment", icon: <TrendingUp size={16} />, description: "Ranked growth opportunities with impact and effort scores.", available: true, engine: "opportunity_radar" },
  { name: "Strategic Intelligence Brief", icon: <FileBarChart size={16} />, description: "Executive summary with health score, priorities, risks, and roadmap.", available: true, engine: "strategic_intelligence" },
  { name: "Competitive Analysis", icon: <FileBarChart size={16} />, description: "Competitor benchmarking, gap analysis, and market positioning.", available: false, engine: "competitor_intelligence" },
  { name: "ROI Impact Report", icon: <FileBarChart size={16} />, description: "Return on investment analysis for marketing and sales initiatives.", available: false, engine: "roi_impact" },
];

export default function ReportsPage() {
  const { companyScan } = useEngineData();
  const shareToken = (companyScan as any)?.share_token;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-fg">Reports</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Generate and share intelligence reports powered by AEOS engines.
        </p>
      </div>

      {/* Shareable report banner */}
      {shareToken && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-aeos-200 bg-aeos-50/50 px-5 py-4">
          <Shield size={20} className="shrink-0 text-aeos-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-aeos-800">Your free Company Intelligence Report is ready</p>
            <p className="mt-0.5 text-2xs text-aeos-600">Share it with your team, investors, or clients.</p>
          </div>
          <a
            href={`/report/${shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-widget bg-aeos-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-aeos-700"
          >
            <ExternalLink size={13} /> View report
          </a>
        </div>
      )}

      {/* Report templates */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {REPORT_TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.name}
            className={`rounded-2xl border bg-surface p-5 shadow-card transition ${
              tmpl.available ? "border-border hover:border-aeos-200 hover:shadow-md" : "border-border-light opacity-50"
            }`}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tmpl.available ? "bg-aeos-50 text-aeos-600" : "bg-surface-secondary text-fg-hint"}`}>
                {tmpl.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{tmpl.name}</p>
                {!tmpl.available && <span className="text-2xs text-fg-hint">Coming soon</span>}
              </div>
            </div>
            <p className="mb-4 text-2xs leading-relaxed text-fg-muted">{tmpl.description}</p>
            {tmpl.available ? (
              <button className="flex w-full items-center justify-center gap-1.5 rounded-widget border border-aeos-200 bg-aeos-50/50 py-2 text-2xs font-medium text-aeos-700 transition hover:bg-aeos-100">
                <Download size={12} /> Generate report
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 rounded-widget bg-surface-secondary py-2 text-2xs text-fg-hint">
                <Clock size={12} /> Available in a future phase
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
