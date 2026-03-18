"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, Users, Building2, Bot, FileBarChart,
  Activity, Globe, Server, RefreshCw, Mail, Clock, Zap,
} from "lucide-react";
import api from "@/lib/api";

interface PlatformStats {
  total_users: number; total_workspaces: number; recent_signups_7d: number;
  active_workspaces: number; total_ai_agents: number; total_agent_tasks: number;
  total_reports: number;
}

interface WorkspaceItem {
  id: string; name: string; slug: string; industry: string; country: string;
  team_size: number; website: string; members: number; created_at: string;
}

interface UserItem {
  id: string; email: string; full_name: string; role: string;
  is_active: boolean; created_at: string; last_login_at: string | null;
}

export default function AdminConsolePage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "workspaces" | "users">("overview");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, wsRes, usersRes] = await Promise.allSettled([
        api.get("/api/v1/admin/stats"),
        api.get("/api/v1/admin/workspaces"),
        api.get("/api/v1/admin/users"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (wsRes.status === "fulfilled") setWorkspaces(wsRes.value.data);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.status === 403 ? "Admin access required" : "Failed to load admin data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <ShieldCheck size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <p className="mt-1 text-2xs text-red-500">Only platform admins can access this page.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Admin Console</h1>
            <p className="text-xs text-slate-500">Platform management & monitoring</p>
          </div>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: stats.total_users, icon: Users, color: "from-blue-500 to-indigo-600", sub: `+${stats.recent_signups_7d} this week` },
            { label: "Workspaces", value: stats.total_workspaces, icon: Building2, color: "from-violet-500 to-purple-600", sub: `${stats.active_workspaces} active` },
            { label: "AI Agents", value: stats.total_ai_agents, icon: Bot, color: "from-aeos-500 to-aeos-700", sub: `${stats.total_agent_tasks} tasks executed` },
            { label: "Reports Generated", value: stats.total_reports, icon: FileBarChart, color: "from-emerald-500 to-green-600", sub: "Across all workspaces" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl bg-gradient-to-br ${s.color} p-4 text-white shadow-lg`}>
              <div className="flex items-center gap-2">
                <s.icon size={18} />
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
              <p className="text-xs text-white/80">{s.label}</p>
              <p className="text-2xs text-white/60">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {(["overview", "workspaces", "users"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Platform Metrics</p>
            <div className="space-y-2.5">
              {[
                { label: "Total Users", value: stats.total_users, icon: Users },
                { label: "Total Workspaces", value: stats.total_workspaces, icon: Building2 },
                { label: "Active Workspaces", value: stats.active_workspaces, icon: Activity },
                { label: "AI Agents Deployed", value: stats.total_ai_agents, icon: Bot },
                { label: "Tasks Executed", value: stats.total_agent_tasks, icon: Zap },
                { label: "Reports Generated", value: stats.total_reports, icon: FileBarChart },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <m.icon size={14} className="text-slate-500" />
                    <span className="text-xs text-slate-700">{m.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">System Health</p>
            <div className="space-y-2.5">
              {[
                { label: "Database", status: "Healthy", color: "text-emerald-600" },
                { label: "API Server", status: "Running", color: "text-emerald-600" },
                { label: "Engines", status: "11 registered", color: "text-blue-600" },
                { label: "API Version", status: "v0.4.0", color: "text-slate-600" },
              ].map(h => (
                <div key={h.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700">{h.label}</span>
                  <span className={`text-xs font-bold ${h.color}`}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "workspaces" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Workspace</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Industry</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Country</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Team</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Members</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map(ws => (
                  <tr key={ws.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-slate-900">{ws.name}</p>
                      <p className="text-2xs text-slate-400">{ws.website || ws.slug}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{ws.industry?.replace("_", " ") || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{ws.country || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{ws.team_size}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{ws.members}</td>
                    <td className="px-4 py-2.5 text-slate-400">{ws.created_at ? new Date(ws.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
                {workspaces.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No workspaces found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Last Login</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{u.full_name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${u.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{u.is_active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}</td>
                    <td className="px-4 py-2.5 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
