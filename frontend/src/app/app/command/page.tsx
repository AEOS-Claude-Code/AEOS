"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Monitor, Loader2, RefreshCw, Bot, Zap, Globe, Target, Shield,
  BarChart3, DollarSign, Activity, Brain, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, Building2,
} from "lucide-react";
import api from "@/lib/api";

const ENGINE_ICONS: Record<string, any> = {
  "Digital Presence": Globe, "Gap Analysis": Target, "Competitor Intelligence": Shield,
  "Market Research": BarChart3, "Financial Health": DollarSign, "KPI Framework": Activity,
  "Business Plan": Brain,
};

interface DashboardData {
  company: { name: string; industry: string; team_size: number };
  agents: { total: number; active: number; departments: number; recent_tasks: any[] };
  scores: Record<string, number>;
  engines: { name: string; status: string; score: number; last_run: string }[];
  activity_feed: { type: string; title: string; time: string; department: string }[];
}

function ScoreMini({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#3b82f6" : score >= 25 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

export default function CommandDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/command/dashboard");
      setData(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  if (!data) return <div className="text-center py-12 text-fg-muted">No data available</div>;

  const avgScore = data.engines.filter(e => e.status === "active" && e.score > 0);
  const overallHealth = avgScore.length > 0 ? avgScore.reduce((s, e) => s + e.score, 0) / avgScore.length : 0;
  const healthColor = overallHealth >= 65 ? "text-emerald-600" : overallHealth >= 40 ? "text-blue-600" : "text-amber-600";
  const healthLabel = overallHealth >= 75 ? "Excellent" : overallHealth >= 55 ? "Healthy" : overallHealth >= 35 ? "Developing" : "Needs Attention";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
            <Monitor size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-fg">Command Center</h1>
            <p className="text-xs text-fg-muted">{data.company.name} — Real-time operations dashboard</p>
          </div>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-secondary">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Top stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Overall Health */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-4 shadow-lg shadow-slate-100/50">
          <div className="relative">
            <ScoreMini score={overallHealth} />
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${healthColor}`}>{overallHealth.toFixed(0)}</span>
          </div>
          <div>
            <p className={`text-sm font-bold ${healthColor}`}>{healthLabel}</p>
            <p className="text-2xs text-fg-muted">Overall Health</p>
          </div>
        </motion.div>

        {/* AI Agents */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl bg-gradient-to-br from-aeos-500 to-aeos-700 p-4 text-white shadow-lg shadow-aeos-200/40">
          <div className="flex items-center gap-2">
            <Bot size={18} />
            <p className="text-2xl font-bold">{data.agents.total}</p>
          </div>
          <p className="text-xs text-white/70">AI Agents ({data.agents.active} active)</p>
        </motion.div>

        {/* Departments */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white shadow-lg shadow-violet-200/40">
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <p className="text-2xl font-bold">{data.agents.departments}</p>
          </div>
          <p className="text-xs text-white/70">Departments</p>
        </motion.div>

        {/* Active Engines */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white shadow-lg shadow-emerald-200/40">
          <div className="flex items-center gap-2">
            <Zap size={18} />
            <p className="text-2xl font-bold">{data.engines.filter(e => e.status === "active").length}/{data.engines.length}</p>
          </div>
          <p className="text-xs text-white/70">Engines Active</p>
        </motion.div>
      </div>

      {/* Engine status grid + Activity feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Engine Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-2 rounded-2xl border border-border/60 bg-surface p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-fg-muted">Engine Status</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.engines.map((eng, i) => {
              const Icon = ENGINE_ICONS[eng.name] || Zap;
              const isActive = eng.status === "active";
              const scoreColor = eng.score >= 65 ? "text-emerald-600" : eng.score >= 40 ? "text-blue-600" : eng.score >= 20 ? "text-amber-600" : "text-fg-hint";

              return (
                <motion.div key={eng.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${isActive ? "bg-surface ring-1 ring-border-light hover:ring-aeos-200" : "bg-surface-secondary/50"}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-surface-inset text-fg-hint"}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-fg">{eng.name}</p>
                    <div className="flex items-center gap-1.5">
                      {isActive ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Clock size={10} className="text-fg-hint" />}
                      <span className="text-2xs text-fg-muted">{isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${scoreColor}`}>{eng.score > 0 ? `${eng.score.toFixed(0)}` : "—"}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/60 bg-surface p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-fg-muted">Activity Feed</p>
          <div className="space-y-2.5">
            {data.activity_feed.length > 0 ? data.activity_feed.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.type === "task" ? "bg-aeos-50 text-aeos-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {item.type === "task" ? <Bot size={10} /> : <Zap size={10} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xs text-fg">{item.title}</p>
                  <p className="text-2xs text-fg-hint">{item.time ? new Date(item.time).toLocaleString() : ""}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-2xs text-fg-hint py-4">No activity yet. Deploy agents to get started.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Score breakdown */}
      {Object.keys(data.scores).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border/60 bg-surface p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-fg-muted">Intelligence Scores</p>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(data.scores).map(([key, score]) => {
              const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              const color = score >= 65 ? "from-emerald-500 to-green-600" : score >= 40 ? "from-blue-500 to-indigo-600" : "from-amber-500 to-orange-600";
              return (
                <div key={key} className="text-center">
                  <div className={`mx-auto mb-1.5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>
                    <span className="text-sm font-bold">{score.toFixed(0)}</span>
                  </div>
                  <p className="text-2xs text-fg-secondary">{label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
