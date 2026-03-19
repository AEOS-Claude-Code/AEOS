"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "./layout";
import { motion } from "framer-motion";
import {
  Users, Building2, Bot, FileBarChart, Activity, Zap,
  TrendingUp, Clock, Shield, Loader2,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function adminApi(token: string) {
  return axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });
}

interface Stats {
  total_users: number; total_workspaces: number; recent_signups_7d: number;
  active_workspaces: number; total_ai_agents: number; total_agent_tasks: number;
  total_reports: number; total_tokens_used: number;
}

export default function AdminOverview() {
  const { token } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const a = adminApi(token);
    Promise.allSettled([
      a.get("/api/v1/admin/stats"),
      a.get("/api/v1/admin/health"),
    ]).then(([s, h]) => {
      if (s.status === "fulfilled") setStats(s.value.data);
      if (h.status === "fulfilled") setHealth(h.value.data);
      setLoading(false);
    });
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-slate-500" />
    </div>
  );

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Workspaces", value: stats.total_workspaces, icon: Building2, color: "from-emerald-500 to-emerald-600" },
    { label: "Signups (7d)", value: stats.recent_signups_7d, icon: TrendingUp, color: "from-violet-500 to-violet-600" },
    { label: "Active Workspaces", value: stats.active_workspaces, icon: Activity, color: "from-amber-500 to-amber-600" },
    { label: "AI Agents", value: stats.total_ai_agents, icon: Bot, color: "from-cyan-500 to-cyan-600" },
    { label: "Agent Tasks", value: stats.total_agent_tasks, icon: Zap, color: "from-pink-500 to-pink-600" },
    { label: "Reports", value: stats.total_reports, icon: FileBarChart, color: "from-orange-500 to-orange-600" },
    { label: "Tokens Used", value: stats.total_tokens_used.toLocaleString(), icon: Clock, color: "from-red-500 to-red-600" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-slate-400">AEOS global admin dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-lg`}>
                <c.icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-medium text-slate-400">{c.label}</p>
            </div>
            <p className="text-3xl font-bold text-white">{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* System health */}
      {health && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Shield size={18} className="text-emerald-400" /> System Health
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-700/30 p-4">
              <p className="text-xs text-slate-500">Database</p>
              <p className="text-sm font-bold text-emerald-400">{health.database}</p>
            </div>
            <div className="rounded-xl bg-slate-700/30 p-4">
              <p className="text-xs text-slate-500">API Version</p>
              <p className="text-sm font-bold text-white">{health.api_version}</p>
            </div>
            <div className="rounded-xl bg-slate-700/30 p-4">
              <p className="text-xs text-slate-500">Engines</p>
              <p className="text-sm font-bold text-white">{health.engines_registered} registered</p>
            </div>
            <div className="rounded-xl bg-slate-700/30 p-4">
              <p className="text-xs text-slate-500">Anthropic Key</p>
              <p className={`text-sm font-bold ${health.anthropic_key_set ? "text-emerald-400" : "text-red-400"}`}>
                {health.anthropic_key_set ? "Configured" : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
