"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Activity, Database, Server, Cpu, Key, Shield, Loader2, RefreshCw,
  CheckCircle2, XCircle, Zap,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminSystemPage() {
  const { token } = useAdmin();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/admin/health");
      setHealth(res.data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchHealth(); }, [token]); // eslint-disable-line

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  const checks = health ? [
    { label: "Database", value: health.database, ok: health.database === "healthy", icon: Database },
    { label: "API Version", value: health.api_version, ok: true, icon: Server },
    { label: "Engines Registered", value: `${health.engines_registered} engines`, ok: health.engines_registered > 0, icon: Cpu },
    { label: "Anthropic API Key", value: health.anthropic_key_set ? "Configured" : "Not set", ok: health.anthropic_key_set, icon: Key },
    { label: "Status", value: health.uptime, ok: health.uptime === "active", icon: Activity },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-sm text-slate-400">Backend infrastructure monitoring</p>
        </div>
        <button onClick={fetchHealth} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <c.icon size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-400">{c.label}</span>
              </div>
              {c.ok ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <XCircle size={16} className="text-red-400" />
              )}
            </div>
            <p className={`text-lg font-bold ${c.ok ? "text-emerald-400" : "text-red-400"}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Engine Status */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Zap size={18} className="text-amber-400" /> Registered Engines
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Company Scanner", "Digital Presence", "Smart Intake",
            "Org Chart", "Gap Analysis", "Competitor Intelligence",
            "Market Research", "Financial Health", "Financial Model",
            "KPI Framework", "Business Plan", "Reports", "Agent Framework",
            "Command Dashboard", "Executive Copilot",
          ].map(e => (
            <div key={e} className="flex items-center gap-2 rounded-xl bg-slate-700/30 px-4 py-2.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-sm text-slate-300">{e}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
