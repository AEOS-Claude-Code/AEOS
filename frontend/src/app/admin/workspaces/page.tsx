"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Building2, Globe, Users, Zap, Crown, Loader2, Search, RefreshCw,
  ArrowUpCircle, ChevronDown,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface WorkspaceItem {
  id: string; name: string; slug: string; industry: string; country: string;
  team_size: number; website: string; members: number; owner_email: string;
  plan_tier: string; tokens_used: number; tokens_included: number; created_at: string;
}

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-slate-500/10 text-slate-400",
  growth: "bg-blue-500/10 text-blue-400",
  professional: "bg-violet-500/10 text-violet-400",
  enterprise: "bg-amber-500/10 text-amber-400",
};

const PLANS = ["starter", "growth", "professional", "enterprise"];

export default function AdminWorkspacesPage() {
  const { token } = useAdmin();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchWorkspaces() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/admin/workspaces?limit=200");
      setWorkspaces(res.data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchWorkspaces(); }, [token]); // eslint-disable-line

  async function changePlan(wsId: string, plan: string) {
    try {
      await api.put(`/api/v1/admin/workspaces/${wsId}/plan`, { plan_tier: plan });
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, plan_tier: plan } : w));
    } catch {} finally { setUpgradingId(null); }
  }

  const filtered = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.owner_email.toLowerCase().includes(search.toLowerCase()) ||
    w.industry.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-sm text-slate-400">{workspaces.length} total workspaces</p>
        </div>
        <button onClick={fetchWorkspaces} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/30 focus:ring-2 focus:ring-red-500/10"
          placeholder="Search by name, owner, or industry..." />
      </div>

      <div className="grid gap-4">
        {filtered.map((w, i) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 ring-1 ring-emerald-500/20">
                  <Building2 size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{w.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{w.owner_email}</span>
                    {w.industry && <><span>•</span><span>{w.industry}</span></>}
                    {w.country && <><span>•</span><span>{w.country}</span></>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Plan badge with upgrade dropdown */}
                <div className="relative">
                  <button onClick={() => setUpgradingId(upgradingId === w.id ? null : w.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-slate-700/50 ${PLAN_COLORS[w.plan_tier] || PLAN_COLORS.starter}`}>
                    <Crown size={10} />
                    {w.plan_tier.charAt(0).toUpperCase() + w.plan_tier.slice(1)}
                    <ChevronDown size={10} />
                  </button>
                  {upgradingId === w.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 rounded-xl border border-slate-700 bg-slate-800 p-1 shadow-xl">
                      {PLANS.map(p => (
                        <button key={p} onClick={() => changePlan(w.id, p)}
                          className={`block w-full rounded-lg px-4 py-2 text-left text-xs font-medium transition ${
                            p === w.plan_tier ? "bg-slate-700/50 text-white" : "text-slate-400 hover:bg-slate-700/30 hover:text-white"
                          }`}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users size={12} /> {w.members} members
              </div>
              {w.website && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe size={12} /> {w.website.replace(/https?:\/\/(www\.)?/, "")}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Zap size={12} /> {w.tokens_used.toLocaleString()} / {w.tokens_included.toLocaleString()} tokens
              </div>
              <div className="ml-auto text-xs text-slate-600">
                Joined {new Date(w.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Token usage bar */}
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                  style={{ width: `${Math.min(100, w.tokens_included > 0 ? (w.tokens_used / w.tokens_included) * 100 : 0)}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">No workspaces found</div>
      )}
    </div>
  );
}
