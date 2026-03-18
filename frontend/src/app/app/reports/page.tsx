"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileBarChart, Loader2, Download, ExternalLink, Share2, Eye,
  Shield, TrendingUp, Users, Brain, BarChart3, Target, Activity,
  DollarSign, GitCompareArrows, Sparkles, Clock, Check, Link2,
} from "lucide-react";
import api from "@/lib/api";

const REPORT_TYPE_CONFIG: Record<string, { icon: any; color: string; description: string }> = {
  company_intelligence: { icon: Shield, color: "from-blue-500 to-indigo-600", description: "Website analysis, digital presence, and company profile" },
  strategic_brief: { icon: Brain, color: "from-violet-500 to-purple-600", description: "Executive summary combining all intelligence engines" },
  competitive_analysis: { icon: GitCompareArrows, color: "from-orange-500 to-red-500", description: "Competitor benchmarking across 6 dimensions" },
  financial_overview: { icon: DollarSign, color: "from-emerald-500 to-green-600", description: "Financial health, projections, and funding analysis" },
  market_research: { icon: BarChart3, color: "from-indigo-500 to-violet-600", description: "TAM/SAM/SOM, industry benchmarks, and growth drivers" },
  gap_analysis: { icon: Target, color: "from-amber-500 to-orange-600", description: "Organizational gap assessment by department" },
  kpi_dashboard: { icon: Activity, color: "from-cyan-500 to-blue-600", description: "KPI framework with tracking status" },
  full_business_plan: { icon: Sparkles, color: "from-aeos-500 to-aeos-700", description: "AI-generated 10-section business plan" },
};

interface ReportListItem {
  id: string; report_type: string; title: string; status: string;
  share_token: string; is_public: boolean; generated_at: string | null; created_at: string;
}

interface ReportType {
  type: string; title: string;
}

export default function ReportsPage() {
  const [types, setTypes] = useState<ReportType[]>([]);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, reportsRes] = await Promise.allSettled([
        api.get("/api/v1/reports/types"),
        api.get("/api/v1/reports/list"),
      ]);
      if (typesRes.status === "fulfilled") setTypes(typesRes.value.data);
      if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleGenerate(reportType: string) {
    setGenerating(reportType);
    try {
      await api.post("/api/v1/reports/generate", { report_type: reportType });
      await fetchData();
    } catch {} finally { setGenerating(null); }
  }

  async function handleToggleShare(reportId: string, isPublic: boolean) {
    try {
      await api.put(`/api/v1/reports/${reportId}/share`, { is_public: !isPublic });
      await fetchData();
    } catch {}
  }

  function copyShareLink(token: string) {
    const url = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-fg">Reports</h1>
        <p className="text-sm text-fg-muted">Generate and share board-ready intelligence reports</p>
      </div>

      {/* Report type cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {types.map((t, i) => {
          const config = REPORT_TYPE_CONFIG[t.type] || { icon: FileBarChart, color: "from-slate-500 to-gray-600", description: "" };
          const Icon = config.icon;
          const isGenerating = generating === t.type;
          const existing = reports.filter(r => r.report_type === t.type);

          return (
            <motion.div key={t.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm transition-all hover:shadow-lg">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.color} shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-fg">{t.title}</p>
              <p className="mt-0.5 mb-3 text-2xs text-fg-muted">{config.description}</p>

              <button onClick={() => handleGenerate(t.type)} disabled={isGenerating}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-secondary py-2 text-2xs font-semibold text-fg ring-1 ring-border-light transition hover:bg-aeos-50 hover:text-aeos-700 hover:ring-aeos-200 disabled:opacity-50">
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {isGenerating ? "Generating..." : existing.length > 0 ? "Regenerate" : "Generate"}
              </button>

              {existing.length > 0 && (
                <p className="mt-1.5 text-center text-2xs text-fg-hint">{existing.length} report{existing.length > 1 ? "s" : ""} generated</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Generated reports list */}
      {reports.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-fg">Generated Reports</h2>
          <div className="space-y-2">
            {reports.map((r, i) => {
              const config = REPORT_TYPE_CONFIG[r.report_type] || { icon: FileBarChart, color: "from-slate-500 to-gray-600" };
              const Icon = config.icon;

              return (
                <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-sm">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${config.color}`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-fg truncate">{r.title}</p>
                    <p className="text-2xs text-fg-hint">
                      {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : "Generating..."}
                      {r.status === "completed" && <span className="ml-2 text-emerald-500">Ready</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {r.status === "completed" && (
                      <>
                        <a href={`/report/${r.share_token}`} target="_blank" rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-fg-hint transition hover:bg-surface-secondary hover:text-aeos-600">
                          <Eye size={14} />
                        </a>
                        <button onClick={() => handleToggleShare(r.id, r.is_public)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${r.is_public ? "bg-emerald-50 text-emerald-600" : "text-fg-hint hover:bg-surface-secondary"}`}>
                          <Share2 size={14} />
                        </button>
                        {r.is_public && (
                          <button onClick={() => copyShareLink(r.share_token)}
                            className="flex h-7 items-center gap-1 rounded-lg bg-aeos-50 px-2 text-2xs font-semibold text-aeos-700 ring-1 ring-aeos-200 transition hover:bg-aeos-100">
                            {copiedId === r.share_token ? <><Check size={10} /> Copied</> : <><Link2 size={10} /> Copy link</>}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {reports.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <FileBarChart size={32} className="mx-auto mb-3 text-fg-hint" />
          <p className="text-sm text-fg-secondary">No reports generated yet</p>
          <p className="text-2xs text-fg-hint">Select a report type above to get started</p>
        </div>
      )}
    </motion.div>
  );
}
