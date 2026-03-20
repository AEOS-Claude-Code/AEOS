"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Activity, Database, Server, Cpu, Key, Shield, Loader2, RefreshCw,
  CheckCircle2, XCircle, Zap, Globe, HardDrive, Clock, AlertTriangle,
  Wifi, WifiOff, RotateCcw, Play, Timer,
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheck, setNextCheck] = useState(180);
  const [redeploying, setRedeploying] = useState<string | null>(null);
  const [redeployMsg, setRedeployMsg] = useState<{ service: string; ok: boolean; msg: string } | null>(null);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchHealth(silent = false) {
    if (!silent) setLoading(true);
    setFrontendStatus("checking");
    try {
      const start = Date.now();
      const res = await api.get("/api/v1/admin/health");
      setBackendLatency(Date.now() - start);
      setHealth(res.data);
    } catch {} finally { if (!silent) setLoading(false); }

    // Check frontend
    try {
      const resp = await fetch(FRONTEND_URL, { method: "HEAD" });
      setFrontendStatus(resp.ok ? "healthy" : "unhealthy");
    } catch {
      setFrontendStatus("unhealthy");
    }
    setLastChecked(new Date());
    setNextCheck(180);
  }

  // Initial fetch
  useEffect(() => { if (token) fetchHealth(); }, [token]); // eslint-disable-line

  // Auto-refresh every 3 minutes
  useEffect(() => {
    if (!autoRefresh || !token) return;
    const interval = setInterval(() => {
      fetchHealth(true);
    }, 180000); // 3 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, token]); // eslint-disable-line

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setNextCheck(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  async function triggerRedeploy(service: "frontend" | "backend") {
    setRedeploying(service);
    setRedeployMsg(null);
    try {
      const res = await api.post(`/api/v1/admin/redeploy/${service}`);
      setRedeployMsg({ service, ok: res.data.success, msg: res.data.message || res.data.error || "Done" });
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Redeploy failed";
      setRedeployMsg({ service, ok: false, msg: detail });
    } finally { setRedeploying(null); }
  }

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
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              autoRefresh ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-slate-700/50 text-slate-500"
            }`}>
            <Timer size={12} />
            {autoRefresh ? `Auto ${Math.floor(nextCheck / 60)}:${String(nextCheck % 60).padStart(2, "0")}` : "Auto OFF"}
          </button>
          <button onClick={() => fetchHealth()} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
            <RefreshCw size={14} /> Check Now
          </button>
        </div>
      </div>

      {lastChecked && (
        <p className="text-2xs text-slate-600">Last checked: {lastChecked.toLocaleTimeString()}</p>
      )}

      {/* ── Redeploy Controls ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => triggerRedeploy("frontend")} disabled={redeploying === "frontend"}
          className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4 text-left transition hover:bg-blue-500/10 disabled:opacity-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            {redeploying === "frontend" ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <RotateCcw size={18} className="text-blue-400" />}
          </div>
          <div>
            <p className="text-sm font-bold text-blue-400">Redeploy Frontend</p>
            <p className="text-2xs text-slate-500">Vercel • Next.js</p>
          </div>
        </motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => triggerRedeploy("backend")} disabled={redeploying === "backend"}
          className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4 text-left transition hover:bg-violet-500/10 disabled:opacity-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            {redeploying === "backend" ? <Loader2 size={18} className="animate-spin text-violet-400" /> : <RotateCcw size={18} className="text-violet-400" />}
          </div>
          <div>
            <p className="text-sm font-bold text-violet-400">Redeploy Backend</p>
            <p className="text-2xs text-slate-500">Render • FastAPI</p>
          </div>
        </motion.button>

        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Database size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">Database</p>
            <p className="text-2xs text-slate-500">PostgreSQL • Managed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <HardDrive size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400">Redis</p>
            <p className="text-2xs text-slate-500">Cache • Managed</p>
          </div>
        </div>
      </div>

      {/* Redeploy feedback */}
      {redeployMsg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm ${
            redeployMsg.ok ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
          }`}>
          {redeployMsg.ok ? <CheckCircle2 size={14} className="inline mr-2" /> : <XCircle size={14} className="inline mr-2" />}
          <strong>{redeployMsg.service}:</strong> {redeployMsg.msg}
        </motion.div>
      )}

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

      {/* ── Cost & Usage Breakdown ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Zap size={18} className="text-emerald-400" /> Platform Cost & Usage
        </h2>

        {/* Cost summary cards */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-4 ring-1 ring-emerald-500/20">
            <p className="text-xs text-emerald-400/70">Estimated Total Cost</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">${tokens.estimated_cost_usd || "0.00"}</p>
            <p className="mt-1 text-2xs text-slate-500">Based on Claude Sonnet pricing</p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Internal Tokens Used</p>
            <p className="mt-1 text-2xl font-bold text-white">{(tokens.total_used_platform || 0).toLocaleString()}</p>
            <p className="mt-1 text-2xs text-slate-600">Across all workspaces</p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Est. API Tokens</p>
            <p className="mt-1 text-2xl font-bold text-white">{(tokens.estimated_api_tokens || 0).toLocaleString()}</p>
            <p className="mt-1 text-2xs text-slate-600">~100x internal tokens</p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Included Tokens</p>
            <p className="mt-1 text-2xl font-bold text-white">{(tokens.total_included_platform || 0).toLocaleString()}</p>
            <p className="mt-1 text-2xs text-slate-600">From all plans combined</p>
          </div>
        </div>

        {/* Per-operation breakdown */}
        {tokens.operations && tokens.operations.length > 0 && (
          <div className="mb-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-400">Usage by Operation</h3>
            <div className="space-y-2">
              {tokens.operations.map((op: any) => {
                const maxTokens = Math.max(...tokens.operations.map((o: any) => o.tokens));
                const pct = maxTokens > 0 ? (op.tokens / maxTokens) * 100 : 0;
                return (
                  <div key={op.operation} className="flex items-center gap-3">
                    <span className="w-40 truncate text-xs text-slate-400">{op.operation}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 text-right text-xs font-mono text-slate-500">{op.tokens.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-workspace breakdown */}
        {tokens.workspace_breakdown && tokens.workspace_breakdown.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-400">Usage by Workspace</h3>
            <div className="overflow-hidden rounded-xl border border-slate-700/50">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/80">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Workspace</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Used</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Included</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {tokens.workspace_breakdown.map((ws: any) => (
                    <tr key={ws.workspace_id} className="bg-slate-800/30">
                      <td className="px-4 py-2 text-sm text-white">{ws.workspace_name}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-slate-400">{ws.tokens_used.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-slate-500">{ws.tokens_included.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-emerald-400">${((ws.tokens_used * 100 * 9) / 1_000_000).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
