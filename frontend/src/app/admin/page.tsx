"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "./layout";
import { motion } from "framer-motion";
import {
  Users, Building2, Bot, FileBarChart, Zap, TrendingUp, Clock,
  Loader2, Wifi, WifiOff, BarChart3,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Stats {
  total_users: number; total_workspaces: number; recent_signups_7d: number;
  active_workspaces: number; total_ai_agents: number; total_agent_tasks: number;
  total_reports: number; total_tokens_used: number;
}

interface WsItem {
  id: string; name: string; owner_email: string; plan_tier: string;
  tokens_used: number; tokens_included: number; created_at: string;
}

export default function AdminOverview() {
  const { token } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [workspaces, setWorkspaces] = useState<WsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });
    Promise.allSettled([
      api.get("/api/v1/admin/stats"),
      api.get("/api/v1/admin/workspaces?limit=50"),
    ]).then(([s, w]) => {
      if (s.status === "fulfilled") setStats(s.value.data);
      if (w.status === "fulfilled") setWorkspaces(w.value.data);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Workspaces", value: stats.total_workspaces, icon: Building2, color: "from-emerald-500 to-emerald-600" },
    { label: "Signups (7d)", value: stats.recent_signups_7d, icon: TrendingUp, color: "from-violet-500 to-violet-600" },
    { label: "Active Workspaces", value: stats.active_workspaces, icon: Zap, color: "from-amber-500 to-amber-600" },
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

      {/* Workspace Status & Usage */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Building2 size={18} className="text-emerald-400" /> Workspace Status & Usage
        </h2>
        {workspaces.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Workspace</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Plan</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Usage</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {workspaces.map(ws => {
                  const usagePct = ws.tokens_included > 0 ? Math.round((ws.tokens_used / ws.tokens_included) * 100) : 0;
                  const isRecent = ws.created_at && (Date.now() - new Date(ws.created_at).getTime()) < 24 * 60 * 60 * 1000;
                  return (
                    <tr key={ws.id} className="bg-slate-800/30 hover:bg-slate-700/30 transition">
                      <td className="px-4 py-2.5 text-sm font-semibold text-white">{ws.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-2xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                          Online
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-2xs font-bold text-slate-400 capitalize">{ws.plan_tier}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700/50">
                            <div className={`h-full rounded-full ${usagePct > 80 ? "bg-red-500" : usagePct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, usagePct)}%` }} />
                          </div>
                          <span className="text-2xs font-mono text-slate-500">{usagePct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{ws.owner_email}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No workspaces yet</p>
        )}
      </motion.div>
    </div>
  );
}
