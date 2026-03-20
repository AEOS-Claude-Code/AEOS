"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Brain, Bot, MessageCircle, Search, Key, CheckCircle2, XCircle,
  Globe, Loader2, ExternalLink,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const AI_ENGINES = [
  { name: "Executive Copilot", icon: MessageCircle, description: "Natural language queries across all engines — Claude-powered conversation with full company context", model: "Claude Sonnet 4", tokensPerCall: "~100" },
  { name: "Business Plan Generator", icon: Brain, description: "McKinsey-grade business plans with 8-10 AI-generated sections: market analysis, strategy, financials", model: "Claude Sonnet 4", tokensPerCall: "~2,000" },
  { name: "Competitor Discovery", icon: Search, description: "AI-powered competitor identification and market positioning analysis from industry context", model: "Claude Sonnet 4", tokensPerCall: "~300" },
  { name: "Agent Task Execution", icon: Bot, description: "Department AI agents execute tasks using Claude: proposals, content, analysis, reports", model: "Claude Sonnet 4", tokensPerCall: "~50-500" },
];

export default function AiEnginesPage() {
  const { token } = useAdmin();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    if (!token) return;
    api.get("/api/v1/admin/health").then(r => { setHealth(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [token]); // eslint-disable-line

  const anth = health?.anthropic || {};
  const hasKey = anth.key_valid;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Anthropic Engines</h1>
          <p className="text-sm text-slate-400">{AI_ENGINES.length} AI-powered engines using Claude API — require Anthropic API key</p>
        </div>
        {hasKey ? (
          <span className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 size={12} /> All {AI_ENGINES.length} Active
          </span>
        ) : (
          <span className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 ring-1 ring-red-500/20">
            <XCircle size={12} /> API Key Required
          </span>
        )}
      </div>

      {/* API Key Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-6 ${hasKey ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-red-500/20 bg-red-500/[0.04]"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${hasKey ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              <Key size={20} className={hasKey ? "text-emerald-400" : "text-red-400"} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Anthropic API Key</h2>
              <p className="text-sm text-slate-400">
                {hasKey ? (
                  <><span className="text-emerald-400 font-semibold">Active</span> — {anth.key_prefix}</>
                ) : (
                  <span className="text-red-400">Not configured — set ANTHROPIC_API_KEY in Render environment</span>
                )}
              </p>
            </div>
          </div>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
            Anthropic Console <ExternalLink size={12} />
          </a>
        </div>
      </motion.div>

      {/* Engine Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {AI_ENGINES.map((engine, i) => {
          const Icon = engine.icon;
          return (
            <motion.div key={engine.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-6 ${
                hasKey ? "border-violet-500/20 bg-violet-500/[0.04] hover:bg-violet-500/[0.08]" : "border-slate-700/50 bg-slate-800/30 opacity-60"
              } transition`}>
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${hasKey ? "bg-violet-500/20" : "bg-slate-700/50"}`}>
                  <Icon size={18} className={hasKey ? "text-violet-400" : "text-slate-500"} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{engine.name}</h3>
                  <p className="text-2xs text-slate-500">Model: {engine.model}</p>
                </div>
                {hasKey ? (
                  <CheckCircle2 size={14} className="ml-auto text-emerald-400" />
                ) : (
                  <XCircle size={14} className="ml-auto text-red-400" />
                )}
              </div>
              <p className="mb-3 text-xs text-slate-400 leading-relaxed">{engine.description}</p>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-2xs font-bold text-violet-400 ring-1 ring-violet-500/20">
                  AI-Powered
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-2xs font-bold text-amber-400 ring-1 ring-amber-500/20">
                  {engine.tokensPerCall} tokens/call
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pricing Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="mb-3 text-lg font-bold text-white">Claude API Pricing</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Input Tokens</p>
            <p className="text-lg font-bold text-white">$3 <span className="text-xs text-slate-500">/ 1M tokens</span></p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Output Tokens</p>
            <p className="text-lg font-bold text-white">$15 <span className="text-xs text-slate-500">/ 1M tokens</span></p>
          </div>
          <div className="rounded-xl bg-slate-700/30 p-4">
            <p className="text-xs text-slate-500">Avg Cost (blended)</p>
            <p className="text-lg font-bold text-white">~$9 <span className="text-xs text-slate-500">/ 1M tokens</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
