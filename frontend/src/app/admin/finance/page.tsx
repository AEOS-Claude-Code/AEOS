"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, Zap, Building2, Crown,
  Loader2, RefreshCw, ArrowUpRight, ArrowDownRight, PieChart,
  BarChart3, Wallet, CreditCard, AlertTriangle, Users,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PLAN_INFO: Record<string, { price: number; tokens: number; color: string }> = {
  starter: { price: 0, tokens: 5000, color: "from-slate-400 to-slate-500" },
  growth: { price: 49, tokens: 25000, color: "from-blue-500 to-blue-600" },
  professional: { price: 149, tokens: 100000, color: "from-violet-500 to-violet-600" },
  enterprise: { price: 499, tokens: 500000, color: "from-amber-500 to-amber-600" },
};

interface WorkspaceFinance {
  workspace_id: string; workspace_name: string;
  tokens_used: number; tokens_included: number; tokens_purchased: number;
}

interface OpUsage {
  operation: string; tokens: number;
}

export default function AdminFinancePage() {
  const { token } = useAdmin();
  const [health, setHealth] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchData() {
    setLoading(true);
    try {
      const [healthRes, wsRes] = await Promise.allSettled([
        api.get("/api/v1/admin/health"),
        api.get("/api/v1/admin/workspaces?limit=200"),
      ]);
      if (healthRes.status === "fulfilled") setHealth(healthRes.value.data);
      if (wsRes.status === "fulfilled") setWorkspaces(wsRes.value.data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchData(); }, [token]); // eslint-disable-line

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  const tokens = health?.token_stats || {};
  const wsBreakdown: WorkspaceFinance[] = tokens.workspace_breakdown || [];
  const operations: OpUsage[] = tokens.operations || [];
  const totalUsed = tokens.total_used_platform || 0;
  const totalIncluded = tokens.total_included_platform || 0;
  const estimatedCost = tokens.estimated_cost_usd || 0;

  // Revenue calculation from workspace plans
  const planCounts: Record<string, number> = {};
  let monthlyRevenue = 0;
  workspaces.forEach(ws => {
    const tier = ws.plan_tier || "starter";
    planCounts[tier] = (planCounts[tier] || 0) + 1;
    monthlyRevenue += PLAN_INFO[tier]?.price || 0;
  });
  const annualRevenue = monthlyRevenue * 12;
  const profit = monthlyRevenue - estimatedCost;

  // Top consumers
  const topConsumers = [...wsBreakdown].sort((a, b) => b.tokens_used - a.tokens_used).slice(0, 10);

  // Usage percentage
  const usagePct = totalIncluded > 0 ? Math.round((totalUsed / totalIncluded) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance & Billing</h1>
          <p className="text-sm text-slate-400">Revenue, costs, and token usage across all workspaces</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Revenue & Cost Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400/70">Monthly Revenue</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">${monthlyRevenue.toLocaleString()}</p>
          <p className="mt-1 text-2xs text-slate-500">${annualRevenue.toLocaleString()} /year projected</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-400" />
            <span className="text-xs font-medium text-red-400/70">AI API Cost</span>
          </div>
          <p className="text-3xl font-bold text-red-400">${estimatedCost.toFixed(2)}</p>
          <p className="mt-1 text-2xs text-slate-500">Anthropic Claude usage to date</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-5 ${profit >= 0 ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5" : "border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5"}`}>
          <div className="mb-2 flex items-center gap-2">
            {profit >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
            <span className={`text-xs font-medium ${profit >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>Net Profit</span>
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            ${Math.abs(profit).toFixed(2)}
          </p>
          <p className="mt-1 text-2xs text-slate-500">Revenue minus AI costs</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-400/70">Token Usage</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{usagePct}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
            <div className={`h-full rounded-full transition-all ${usagePct > 80 ? "bg-red-500" : usagePct > 50 ? "bg-amber-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(100, usagePct)}%` }} />
          </div>
          <p className="mt-1 text-2xs text-slate-500">{totalUsed.toLocaleString()} / {totalIncluded.toLocaleString()} tokens</p>
        </motion.div>
      </div>

      {/* ── Plan Distribution ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Crown size={18} className="text-amber-400" /> Plan Distribution
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PLAN_INFO).map(([tier, info]) => {
            const count = planCounts[tier] || 0;
            const revenue = count * info.price;
            return (
              <div key={tier} className="rounded-xl border border-slate-700/50 bg-slate-700/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${info.color} shadow-lg`}>
                    <Crown size={16} className="text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
                <p className="text-sm font-bold text-white capitalize">{tier}</p>
                <p className="text-xs text-slate-500">${info.price}/mo • {info.tokens.toLocaleString()} tokens</p>
                <div className="mt-2 border-t border-slate-700/50 pt-2">
                  <p className="text-xs text-emerald-400 font-semibold">${revenue}/mo revenue</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Usage by Operation ── */}
      {operations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <BarChart3 size={18} className="text-cyan-400" /> Cost by Operation
          </h2>
          <div className="space-y-3">
            {operations.map((op, i) => {
              const maxTokens = Math.max(...operations.map(o => o.tokens));
              const pct = maxTokens > 0 ? (op.tokens / maxTokens) * 100 : 0;
              const opCost = ((op.tokens * 100 * 9) / 1_000_000).toFixed(2);
              return (
                <div key={op.operation} className="flex items-center gap-4">
                  <span className="w-44 truncate text-sm text-slate-400">{op.operation.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-700/50 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                  </div>
                  <span className="w-20 text-right text-xs font-mono text-slate-500">{op.tokens.toLocaleString()}</span>
                  <span className="w-16 text-right text-xs font-bold text-emerald-400">${opCost}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Workspace Cost Breakdown ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Building2 size={18} className="text-violet-400" /> Workspace Billing Details
        </h2>

        {topConsumers.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Workspace</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Tokens Used</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Included</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Usage %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">AI Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Plan Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {topConsumers.map(ws => {
                  const wsData = workspaces.find(w => w.id === ws.workspace_id);
                  const plan = wsData?.plan_tier || "starter";
                  const planPrice = PLAN_INFO[plan]?.price || 0;
                  const aiCost = parseFloat(((ws.tokens_used * 100 * 9) / 1_000_000).toFixed(2));
                  const net = planPrice - aiCost;
                  const usage = ws.tokens_included > 0 ? Math.round((ws.tokens_used / ws.tokens_included) * 100) : 0;
                  return (
                    <tr key={ws.workspace_id} className="bg-slate-800/30 hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-white">{ws.workspace_name}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded-full px-2.5 py-1 text-2xs font-bold capitalize ${
                          plan === "enterprise" ? "bg-amber-500/10 text-amber-400" :
                          plan === "professional" ? "bg-violet-500/10 text-violet-400" :
                          plan === "growth" ? "bg-blue-500/10 text-blue-400" :
                          "bg-slate-700/50 text-slate-400"
                        }`}>{plan}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-slate-400">{ws.tokens_used.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-slate-500">{ws.tokens_included.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-700/50">
                            <div className={`h-full rounded-full ${usage > 80 ? "bg-red-500" : usage > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, usage)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{usage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-400">${aiCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-400">${planPrice}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {net >= 0 ? "+" : ""}${net.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700/50 bg-slate-800/60">
                  <td className="px-4 py-3 text-sm font-bold text-white">Total</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{workspaces.length} workspaces</td>
                  <td className="px-4 py-3 text-right text-sm font-bold font-mono text-white">{totalUsed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-slate-500">{totalIncluded.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{usagePct}%</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-400">${estimatedCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-emerald-400">${monthlyRevenue}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No workspace usage data yet</p>
        )}
      </motion.div>

      {/* ── Alerts ── */}
      {wsBreakdown.filter(ws => ws.tokens_included > 0 && (ws.tokens_used / ws.tokens_included) > 0.8).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-400">
            <AlertTriangle size={18} /> Token Usage Alerts
          </h2>
          <div className="space-y-2">
            {wsBreakdown
              .filter(ws => ws.tokens_included > 0 && (ws.tokens_used / ws.tokens_included) > 0.8)
              .map(ws => (
                <div key={ws.workspace_id} className="flex items-center justify-between rounded-xl bg-amber-500/10 px-4 py-2.5 ring-1 ring-amber-500/20">
                  <span className="text-sm text-amber-300">{ws.workspace_name}</span>
                  <span className="text-xs font-bold text-amber-400">
                    {Math.round((ws.tokens_used / ws.tokens_included) * 100)}% used — consider upgrading plan
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
