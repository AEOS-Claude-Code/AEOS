"use client";

import { motion } from "framer-motion";
import {
  Bot, Users, Building2, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Loader2, ArrowRight, Shield, TrendingUp, Brain,
  Target, Megaphone, Wallet, Settings, Cpu, Package, Heart,
  CalendarDays, Sparkles, ChevronDown,
} from "lucide-react";
import { useGapAnalysis, type GapDepartmentDetail, type GapRecommendation } from "@/lib/hooks/useGapAnalysis";
import { useState } from "react";

const DEPT_ICONS: Record<string, any> = {
  brain: Brain, target: Target, megaphone: Megaphone, users: Users, wallet: Wallet,
  shield: Shield, settings: Settings, cpu: Cpu, package: Package, heart: Heart,
  calendar: CalendarDays, sparkles: Sparkles,
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  none: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  low: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  high: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  critical: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
};

const STATUS_LABELS: Record<string, string> = {
  fully_staffed: "Fully Staffed",
  partially_staffed: "Partially Staffed",
  ai_only: "AI Only",
  missing: "Missing",
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  // Inverted: low score = green (good), high = red (bad)
  const color = score < 30 ? "#10b981" : score < 50 ? "#3b82f6" : score < 70 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000" />
    </svg>
  );
}

function SubScoreBar({ label, score, weight }: { label: string; score: number; weight: string }) {
  const color = score < 30 ? "bg-emerald-500" : score < 50 ? "bg-blue-500" : score < 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{score.toFixed(0)}% gap · {weight}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.3 }} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

function DeptCard({ dept }: { dept: GapDepartmentDetail }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DEPT_ICONS[dept.icon] || Building2;
  const sev = SEVERITY_COLORS[dept.gap_severity] || SEVERITY_COLORS.medium;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-slate-200/60 bg-white shadow-sm transition-all ${expanded ? "ring-1 " + sev.ring : ""}`}>
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${sev.bg}`}>
          <Icon size={16} className={sev.text} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{dept.department_name}</p>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${sev.bg} ${sev.text} ring-1 ${sev.ring}`}>
              {STATUS_LABELS[dept.status] || dept.status}
            </span>
            <span className="text-2xs text-slate-500">
              {dept.human_filled_roles}h · {dept.ai_filled_roles}ai
            </span>
          </div>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-1.5">
          {/* Head */}
          <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${dept.has_human_head ? "bg-blue-50" : "bg-slate-50"}`}>
            {dept.has_human_head ? <Users size={12} className="text-blue-500" /> : <Bot size={12} className="text-slate-400" />}
            <span className="text-xs text-slate-700">Department Head</span>
            <span className={`ml-auto rounded-full px-1.5 py-px text-2xs font-bold ${dept.has_human_head ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
              {dept.has_human_head ? "Human" : "AI"}
            </span>
          </div>
          {/* Human roles */}
          {dept.human_roles.map(r => (
            <div key={r} className="flex items-center gap-2 rounded-lg bg-blue-50/50 px-2.5 py-1">
              <Users size={10} className="text-blue-400" />
              <span className="text-xs text-slate-700">{r}</span>
              <span className="ml-auto text-2xs text-blue-600">Human</span>
            </div>
          ))}
          {/* AI roles */}
          {dept.ai_roles.map(r => (
            <div key={r} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1">
              <Bot size={10} className="text-slate-400" />
              <span className="text-xs text-slate-600">{r}</span>
              <span className="ml-auto text-2xs text-slate-400">AI</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RecCard({ rec }: { rec: GapRecommendation }) {
  const impactColor = rec.impact === "high" ? "bg-red-50 text-red-700" : rec.impact === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  const effortColor = rec.effort === "hard" ? "bg-slate-100 text-slate-700" : rec.effort === "medium" ? "bg-slate-50 text-slate-600" : "bg-emerald-50 text-emerald-600";

  return (
    <div className="flex gap-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aeos-500 to-aeos-700 text-xs font-bold text-white">
        {rec.priority}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{rec.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{rec.description}</p>
        <div className="mt-2 flex gap-2">
          <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${impactColor}`}>{rec.impact} impact</span>
          <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${effortColor}`}>{rec.effort} effort</span>
        </div>
      </div>
    </div>
  );
}

export default function GapAnalysisPage() {
  const { report, loading, error, recomputing, recompute } = useGapAnalysis();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-aeos-500" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-400" />
        <p className="text-sm text-slate-600">{error || "No gap analysis available"}</p>
        <button onClick={recompute} className="mt-4 rounded-lg bg-aeos-600 px-4 py-2 text-sm font-semibold text-white hover:bg-aeos-700">
          Run Gap Analysis
        </button>
      </div>
    );
  }

  const score = report.overall_gap_score;
  const scoreLabel = score < 20 ? "Excellent" : score < 40 ? "Good" : score < 60 ? "Moderate" : score < 80 ? "Significant" : "Critical";
  const scoreColor = score < 30 ? "text-emerald-600" : score < 50 ? "text-blue-600" : score < 70 ? "text-amber-600" : "text-red-600";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Organizational Gap Analysis</h1>
          <p className="text-sm text-slate-500">
            Comparing your team against the ideal {report.ideal_org_summary?.industry?.replace("_", " ")} structure
          </p>
        </div>
        <button onClick={recompute} disabled={recomputing}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
          {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Recompute
        </button>
      </div>

      {/* Top row: Score + Sub-scores */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Overall score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Gap Score</p>
          <div className="relative">
            <ScoreRing score={score} size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score.toFixed(0)}</span>
              <span className="text-2xs text-slate-400">/ 100</span>
            </div>
          </div>
          <p className={`mt-3 text-sm font-bold ${scoreColor}`}>{scoreLabel} Gaps</p>
          <p className="mt-1 text-2xs text-slate-400">Lower is better — 0 means fully staffed</p>
        </motion.div>

        {/* Sub-scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Gap Dimensions</p>
          <div className="space-y-4">
            <SubScoreBar label="Department Coverage" score={report.department_coverage_score} weight="25%" />
            <SubScoreBar label="Role Coverage" score={report.role_coverage_score} weight="25%" />
            <SubScoreBar label="Leadership Gaps" score={report.leadership_gap_score} weight="20%" />
            <SubScoreBar label="Critical Functions" score={report.critical_function_score} weight="15%" />
            <SubScoreBar label="Operational Maturity" score={report.operational_maturity_score} weight="15%" />
          </div>
        </motion.div>
      </div>

      {/* Department breakdown + Recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Departments */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-900">Department Breakdown</h2>
          <div className="space-y-2">
            {report.gap_breakdown.map((dept, i) => (
              <DeptCard key={dept.department_id} dept={dept} />
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-slate-900">Recommendations</h2>
          <div className="space-y-2">
            {report.recommendations.map((rec) => (
              <RecCard key={rec.priority} rec={rec} />
            ))}
            {report.recommendations.length === 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">No major gaps detected</p>
                <p className="text-xs text-emerald-600">Your organization is well-structured</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
