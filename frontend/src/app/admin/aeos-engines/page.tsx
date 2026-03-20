"use client";

import { motion } from "framer-motion";
import {
  Cpu, CheckCircle2, Globe, Search, BarChart3, Target, FileBarChart,
  Activity, Layers, DollarSign, PieChart, Zap, Rocket,
} from "lucide-react";

const ENGINES = [
  { name: "Company Scanner", icon: Search, category: "Intake", description: "Website crawling, tech stack detection, metadata extraction via Playwright headless browser" },
  { name: "Smart Intake", icon: Zap, category: "Intake", description: "URL-first onboarding — auto-detects company info, contacts, social profiles, industry" },
  { name: "Org Chart Generator", icon: Layers, category: "Intake", description: "Industry-specific AI organizational structure with department/role recommendations" },
  { name: "Digital Presence", icon: Globe, category: "Analysis", description: "5-category weighted scoring: website performance, search visibility, social, reputation, conversion" },
  { name: "Gap Analysis", icon: Target, category: "Analysis", description: "Organizational gap scoring across departments with prioritized recommendations" },
  { name: "Market Research", icon: BarChart3, category: "Intelligence", description: "TAM/SAM/SOM sizing, industry trends, growth trajectory, regional benchmarks" },
  { name: "Financial Health", icon: DollarSign, category: "Intelligence", description: "Revenue modeling, cost structure analysis, industry benchmarks, health scoring" },
  { name: "Financial Model", icon: PieChart, category: "Intelligence", description: "3-5yr projections, EBITDA, break-even analysis, funding requirements" },
  { name: "KPI Framework", icon: Target, category: "Strategy", description: "Department-level KPIs, cascade alignment, tracking dashboards" },
  { name: "Reports & PDF", icon: FileBarChart, category: "Output", description: "Board-ready PDF generation, shareable intelligence reports" },
  { name: "Command Dashboard", icon: Activity, category: "Execution", description: "Real-time ops dashboard, agent activity feed, engine status monitoring" },
];

const CATEGORIES = ["Intake", "Analysis", "Intelligence", "Strategy", "Output", "Execution"];
const CAT_COLORS: Record<string, string> = {
  Intake: "from-blue-500 to-cyan-500", Analysis: "from-emerald-500 to-green-500",
  Intelligence: "from-violet-500 to-purple-500", Strategy: "from-amber-500 to-orange-500",
  Output: "from-pink-500 to-rose-500", Execution: "from-red-500 to-red-600",
};

export default function AeosEnginesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AEOS Engines</h1>
          <p className="text-sm text-slate-400">{ENGINES.length} built-in engines — no external API required, always active</p>
        </div>
        <span className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          <CheckCircle2 size={12} /> All {ENGINES.length} Active
        </span>
      </div>

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
              <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-2xs font-bold text-slate-400">{catEngines.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catEngines.map((engine, i) => {
                const Icon = engine.icon;
                return (
                  <motion.div key={engine.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 hover:bg-emerald-500/[0.08] transition">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Icon size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold text-white">{engine.name}</span>
                      <CheckCircle2 size={14} className="ml-auto text-emerald-400" />
                    </div>
                    <p className="text-2xs text-slate-500 leading-relaxed">{engine.description}</p>
                    <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-bold text-emerald-400">Free — No API Cost</span>
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
