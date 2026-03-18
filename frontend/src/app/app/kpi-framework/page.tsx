"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Loader2, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  XCircle, Target, Globe, DollarSign, Building2, ChevronDown,
} from "lucide-react";
import { useKPIFramework, type KPIItem } from "@/lib/hooks/useKPIFramework";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  on_track: { color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2, label: "On Track" },
  at_risk: { color: "bg-amber-50 text-amber-700 ring-amber-200", icon: AlertTriangle, label: "At Risk" },
  off_track: { color: "bg-red-50 text-red-700 ring-red-200", icon: XCircle, label: "Off Track" },
  not_tracked: { color: "bg-slate-50 text-slate-500 ring-slate-200", icon: Clock, label: "Not Tracked" },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-600",
};

const CATEGORY_ICONS: Record<string, any> = {
  company: Target, digital: Globe, financial: DollarSign, department: Building2,
};

function KPICard({ kpi }: { kpi: KPIItem }) {
  const st = STATUS_CONFIG[kpi.status] || STATUS_CONFIG.not_tracked;
  const Icon = st.icon;
  const prColor = PRIORITY_COLORS[kpi.priority] || PRIORITY_COLORS.medium;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${st.color} ring-1`}>
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-slate-900">{kpi.name}</p>
          <span className={`rounded-full px-1.5 py-px text-2xs font-bold ${prColor}`}>{kpi.priority}</span>
        </div>
        <p className="mt-0.5 text-2xs text-slate-500">{kpi.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {kpi.current_value && (
            <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-2xs font-semibold text-slate-700 ring-1 ring-slate-100">
              Current: {kpi.current_value}
            </span>
          )}
          <span className="text-2xs text-slate-400">Target: {kpi.target}</span>
          <span className="text-2xs text-slate-400">| {kpi.frequency}</span>
        </div>
      </div>
    </div>
  );
}

function KPISection({ title, icon: SectionIcon, kpis, color }: {
  title: string; icon: any; kpis: KPIItem[]; color: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const onTrack = kpis.filter(k => k.status === "on_track").length;
  const atRisk = kpis.filter(k => k.status === "at_risk").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-100/50">
      <button onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <SectionIcon size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-2xs text-slate-500">{kpis.length} KPIs · {onTrack} on track · {atRisk} at risk</p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          {kpis.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
        </div>
      )}
    </motion.div>
  );
}

export default function KPIFrameworkPage() {
  const { report, loading, error, recomputing, recompute } = useKPIFramework();

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
        <p className="text-sm text-slate-600">{error || "No KPI framework available"}</p>
        <button onClick={recompute} className="mt-4 rounded-lg bg-aeos-600 px-4 py-2 text-sm font-semibold text-white">Generate KPIs</button>
      </div>
    );
  }

  const score = report.overall_kpi_score;
  const scoreColor = score >= 60 ? "text-emerald-600" : score >= 35 ? "text-blue-600" : "text-amber-600";
  const scoreLabel = score >= 70 ? "Excellent" : score >= 50 ? "Good" : score >= 30 ? "Developing" : "Needs Setup";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/40">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">KPI Framework</h1>
            <p className="text-xs text-slate-500">{report.total_kpis} KPIs across {4} categories</p>
          </div>
        </div>
        <button onClick={recompute} disabled={recomputing}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
          {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recompute
        </button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <div className="text-center">
            <p className={`text-3xl font-bold ${scoreColor}`}>{score.toFixed(0)}</p>
            <p className={`text-xs font-semibold ${scoreColor}`}>{scoreLabel}</p>
            <p className="text-2xs text-slate-400">KPI Health</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <div>
            <p className="text-2xl font-bold text-slate-900">{report.tracked_kpis}/{report.total_kpis}</p>
            <p className="text-xs text-slate-500">KPIs Tracked</p>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-aeos-500" style={{ width: `${report.total_kpis > 0 ? (report.tracked_kpis / report.total_kpis) * 100 : 0}%` }} />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-2 text-xs font-semibold text-slate-500">Review Cadence</p>
          <div className="space-y-1">
            {Object.entries(report.review_cadence).map(([freq, items]) => (
              <div key={freq} className="flex items-center gap-2">
                <span className="w-16 text-2xs font-bold text-slate-600 capitalize">{freq}</span>
                <span className="text-2xs text-slate-400">{items.length} metrics</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* KPI Sections */}
      <div className="space-y-4">
        {report.company_kpis.length > 0 && (
          <KPISection title="Company KPIs" icon={Target} kpis={report.company_kpis} color="from-violet-500 to-purple-600" />
        )}
        {report.digital_kpis.length > 0 && (
          <KPISection title="Digital Performance KPIs" icon={Globe} kpis={report.digital_kpis} color="from-aeos-500 to-aeos-700" />
        )}
        {report.financial_kpis.length > 0 && (
          <KPISection title="Financial KPIs" icon={DollarSign} kpis={report.financial_kpis} color="from-emerald-500 to-green-600" />
        )}
        {report.department_kpis.length > 0 && (
          <KPISection title="Department KPIs" icon={Building2} kpis={report.department_kpis} color="from-blue-500 to-indigo-600" />
        )}
      </div>
    </motion.div>
  );
}
