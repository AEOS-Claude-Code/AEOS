"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Cpu, CheckCircle2, Key, Globe, Building2, Search, Share2, BarChart3,
  Brain, Bot, FileBarChart, Zap, Target, Shield, Activity, Loader2,
  RefreshCw, MessageCircle, DollarSign, PieChart, Layers, Rocket,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface EngineInfo {
  name: string;
  icon: any;
  category: string;
  description: string;
  aiPowered: boolean;
  status: "active" | "requires_key";
}

const ENGINES: EngineInfo[] = [
  { name: "Company Scanner", icon: Search, category: "Intake", description: "Website crawling, tech stack detection, metadata extraction", aiPowered: false, status: "active" },
  { name: "Smart Intake", icon: Zap, category: "Intake", description: "URL-first onboarding with auto-detection of company info, contacts, social", aiPowered: false, status: "active" },
  { name: "Digital Presence", icon: Globe, category: "Analysis", description: "5-category weighted scoring: website, search, social, reputation, conversion", aiPowered: false, status: "active" },
  { name: "Org Chart", icon: Layers, category: "Intake", description: "Industry-specific AI organizational structure recommendation", aiPowered: false, status: "active" },
  { name: "Gap Analysis", icon: Target, category: "Analysis", description: "Organizational gap scoring across departments with recommendations", aiPowered: false, status: "active" },
  { name: "Competitor Intelligence", icon: Search, category: "Intelligence", description: "Competitor discovery, benchmarking, market positioning analysis", aiPowered: true, status: "requires_key" },
  { name: "Market Research", icon: BarChart3, category: "Intelligence", description: "TAM/SAM/SOM sizing, industry trends, growth trajectory", aiPowered: true, status: "requires_key" },
  { name: "Financial Health", icon: DollarSign, category: "Intelligence", description: "Revenue modeling, cost structure analysis, industry benchmarks", aiPowered: false, status: "active" },
  { name: "Financial Model", icon: PieChart, category: "Intelligence", description: "3-5yr projections, EBITDA, break-even, funding requirements", aiPowered: false, status: "active" },
  { name: "KPI Framework", icon: Target, category: "Strategy", description: "Department-level KPIs, cascade alignment, tracking dashboards", aiPowered: false, status: "active" },
  { name: "Business Plan Generator", icon: Brain, category: "Strategy", description: "Claude-powered McKinsey-grade business plan with market analysis", aiPowered: true, status: "requires_key" },
  { name: "Reports & PDF", icon: FileBarChart, category: "Output", description: "Board-ready PDF generation, shareable intelligence reports", aiPowered: false, status: "active" },
  { name: "Agent Framework", icon: Bot, category: "Execution", description: "AI agent registry, task execution, department specializations", aiPowered: true, status: "requires_key" },
  { name: "Command Dashboard", icon: Activity, category: "Execution", description: "Real-time ops dashboard, agent activity feed, engine status", aiPowered: false, status: "active" },
  { name: "Executive Copilot", icon: MessageCircle, category: "Execution", description: "Natural language queries across all engines, conversation history", aiPowered: true, status: "requires_key" },
];

const CATEGORIES = ["Intake", "Analysis", "Intelligence", "Strategy", "Output", "Execution"];
const CAT_COLORS: Record<string, string> = {
  Intake: "from-blue-500 to-cyan-500",
  Analysis: "from-emerald-500 to-green-500",
  Intelligence: "from-violet-500 to-purple-500",
  Strategy: "from-amber-500 to-orange-500",
  Output: "from-pink-500 to-rose-500",
  Execution: "from-red-500 to-red-600",
};

export default function AdminEnginesPage() {
  const { token } = useAdmin();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    if (!token) return;
    api.get("/api/v1/admin/health").then(r => {
      setHealth(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]); // eslint-disable-line

  const hasApiKey = health?.anthropic?.key_valid || false;
  const totalEngines = ENGINES.length;
  const activeEngines = ENGINES.filter(e => !e.aiPowered || hasApiKey).length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engines</h1>
          <p className="text-sm text-slate-400">{activeEngines} of {totalEngines} engines fully active</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 size={12} /> {activeEngines} Active
          </span>
          {!hasApiKey && (
            <span className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/20">
              <Key size={12} /> {totalEngines - activeEngines} Need API Key
            </span>
          )}
        </div>
      </div>

      {/* Category sections */}
      {CATEGORIES.map(cat => {
        const catEngines = ENGINES.filter(e => e.category === cat);
        if (catEngines.length === 0) return null;
        return (
          <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${CAT_COLORS[cat]} shadow-lg`}>
                <Rocket size={14} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">{cat}</h2>
              <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-2xs font-bold text-slate-400">{catEngines.length} engines</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catEngines.map((engine, i) => {
                const Icon = engine.icon;
                const isActive = !engine.aiPowered || hasApiKey;
                return (
                  <motion.div key={engine.name}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border p-4 transition ${
                      isActive
                        ? "border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                        : "border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
                    }`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isActive ? "bg-emerald-500/10" : "bg-amber-500/10"
                        }`}>
                          <Icon size={14} className={isActive ? "text-emerald-400" : "text-amber-400"} />
                        </div>
                        <span className="text-sm font-bold text-white">{engine.name}</span>
                      </div>
                      {isActive ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <Key size={14} className="text-amber-400" />
                      )}
                    </div>
                    <p className="text-2xs text-slate-500 leading-relaxed">{engine.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {engine.aiPowered && (
                        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-2xs font-bold text-violet-400 ring-1 ring-violet-500/20">
                          AI-Powered
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${
                        isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {isActive ? "Active" : "Needs Key"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
