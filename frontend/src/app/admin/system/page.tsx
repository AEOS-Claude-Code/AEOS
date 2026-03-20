"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Activity, Database, Server, Cpu, Key, Shield, Loader2, RefreshCw,
  CheckCircle2, XCircle, Zap, Globe, HardDrive, Clock, AlertTriangle,
  Wifi, WifiOff,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const FRONTEND_URL = typeof window !== "undefined" ? window.location.origin : "";

export default function AdminSystemPage() {
  const { token } = useAdmin();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [frontendStatus, setFrontendStatus] = useState<"healthy" | "checking" | "unhealthy">("checking");
  const [backendLatency, setBackendLatency] = useState(0);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchHealth() {
    setLoading(true);
    setFrontendStatus("checking");
    try {
      const start = Date.now();
      const res = await api.get("/api/v1/admin/health");
      setBackendLatency(Date.now() - start);
      setHealth(res.data);
    } catch {} finally { setLoading(false); }

    // Check frontend
    try {
      const resp = await fetch(FRONTEND_URL, { method: "HEAD" });
      setFrontendStatus(resp.ok ? "healthy" : "unhealthy");
    } catch {
      setFrontendStatus("unhealthy");
    }
  }

  useEffect(() => { if (token) fetchHealth(); }, [token]); // eslint-disable-line

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  const db = health?.services?.database || {};
  const redis = health?.services?.redis || {};
  const backend = health?.services?.backend || {};
  const anth = health?.anthropic || {};
  const tokens = health?.token_stats || {};

  function StatusDot({ ok }: { ok: boolean }) {
    return (
      <span className={`relative flex h-3 w-3`}>
        {ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />}
        <span className={`relative inline-flex h-3 w-3 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-sm text-slate-400">Infrastructure monitoring & API status</p>
        </div>
        <button onClick={fetchHealth} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Service Status Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Frontend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Frontend</span>
            </div>
            <StatusDot ok={frontendStatus === "healthy"} />
          </div>
          <p className={`text-lg font-bold ${frontendStatus === "healthy" ? "text-emerald-400" : frontendStatus === "checking" ? "text-amber-400" : "text-red-400"}`}>
            {frontendStatus === "healthy" ? "Healthy" : frontendStatus === "checking" ? "Checking..." : "Unhealthy"}
          </p>
          <p className="mt-1 text-2xs text-slate-600">Vercel • Next.js 14</p>
        </motion.div>

        {/* Backend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-violet-400" />
              <span className="text-sm font-medium text-slate-300">Backend</span>
            </div>
            <StatusDot ok={true} />
          </div>
          <p className="text-lg font-bold text-emerald-400">Healthy</p>
          <p className="mt-1 text-2xs text-slate-600">Render • FastAPI • {backendLatency}ms latency</p>
        </motion.div>

        {/* Database */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Database</span>
            </div>
            <StatusDot ok={db.status === "healthy"} />
          </div>
          <p className={`text-lg font-bold ${db.status === "healthy" ? "text-emerald-400" : "text-red-400"}`}>
            {db.status === "healthy" ? "Healthy" : db.status || "Unknown"}
          </p>
          <p className="mt-1 text-2xs text-slate-600">PostgreSQL • {db.latency_ms || 0}ms latency</p>
        </motion.div>

        {/* Redis */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Redis</span>
            </div>
            <StatusDot ok={redis.status === "healthy"} />
          </div>
          <p className={`text-lg font-bold ${
            redis.status === "healthy" ? "text-emerald-400" :
            redis.status === "not_configured" ? "text-amber-400" : "text-red-400"
          }`}>
            {redis.status === "healthy" ? "Healthy" :
             redis.status === "not_configured" ? "Not Configured" : redis.status || "Unknown"}
          </p>
          <p className="mt-1 text-2xs text-slate-600">
            {redis.status === "healthy" ? `${redis.latency_ms}ms latency` : "Cache & queue layer"}
          </p>
        </motion.div>
      </div>

      {/* ── Anthropic API Status ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Key size={18} className="text-amber-400" /> Anthropic API (Claude)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">API Key</p>
            <div className="mt-1 flex items-center gap-2">
              {anth.key_set ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <XCircle size={14} className="text-red-400" />
              )}
              <p className={`text-sm font-bold ${anth.key_set ? "text-emerald-400" : "text-red-400"}`}>
                {anth.key_set ? "Configured" : "Not Set"}
              </p>
            </div>
            {anth.key_prefix && <p className="mt-1 text-2xs text-slate-600 font-mono">{anth.key_prefix}</p>}
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Key Status</p>
            <div className="mt-1 flex items-center gap-2">
              {anth.key_valid ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <XCircle size={14} className="text-red-400" />
              )}
              <p className={`text-sm font-bold ${anth.key_valid ? "text-emerald-400" : "text-red-400"}`}>
                {anth.key_valid ? "Valid & Active" : anth.key_set ? "Invalid" : "No Key"}
              </p>
            </div>
            {anth.error && <p className="mt-1 text-2xs text-red-400">{anth.error}</p>}
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Platform Tokens Used</p>
            <p className="mt-1 text-sm font-bold text-white">{(tokens.total_used_platform || 0).toLocaleString()}</p>
            <p className="mt-1 text-2xs text-slate-600">Across all workspaces</p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Billing Console</p>
            <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-blue-400 hover:text-blue-300 transition">
              Open Anthropic Console <Globe size={12} />
            </a>
            <p className="mt-1 text-2xs text-slate-600">Check balance & usage</p>
          </div>
        </div>
      </motion.div>

      {/* ── Engines ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Zap size={18} className="text-amber-400" /> Registered Engines ({health?.engines_registered || 0})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Company Scanner", "Digital Presence", "Smart Intake",
            "Org Chart", "Gap Analysis", "Competitor Intelligence",
            "Market Research", "Financial Health", "Financial Model",
            "KPI Framework", "Business Plan (AI)", "Reports & PDF",
            "Agent Framework", "Command Dashboard", "Executive Copilot (AI)",
          ].map(e => (
            <div key={e} className="flex items-center gap-2 rounded-xl bg-slate-700/30 px-4 py-2.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-sm text-slate-300">{e}</span>
              {e.includes("AI") && (
                <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-2xs font-bold text-amber-400">Requires API Key</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── API Info ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Shield size={18} className="text-emerald-400" /> Configuration
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">API Version</p>
            <p className="text-sm font-bold text-white">{health?.api_version || "—"}</p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Frontend URL</p>
            <p className="text-sm font-bold text-blue-400 truncate">{FRONTEND_URL}</p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Backend URL</p>
            <p className="text-sm font-bold text-blue-400 truncate">{API}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
