"use client";

import { motion } from "framer-motion";
import {
  Calculator, Loader2, RefreshCw, AlertTriangle, TrendingUp, ArrowUp,
  DollarSign, Target, BarChart3, Wallet, PieChart, Rocket,
} from "lucide-react";
import { useFinancialModel } from "@/lib/hooks/useFinancialModel";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function FinancialModelPage() {
  const { model, loading, error, generating, generate } = useFinancialModel();

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  if (!model) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center py-16">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-200/40">
          <Calculator size={40} className="text-white" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900">Financial Model Generator</h2>
        <p className="mb-8 max-w-md text-center text-sm text-slate-500">
          Generate 5-year P&L projections, EBITDA analysis, break-even, and funding requirements.
        </p>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-200/40 disabled:opacity-50">
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
          Generate Financial Model
        </button>
      </motion.div>
    );
  }

  const yp = model.yearly_projections;
  const ea = model.ebitda_analysis;
  const be = model.break_even_analysis;
  const fr = model.funding_requirements;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200/40">
            <Calculator size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Financial Model v{model.version}</h1>
            <p className="text-xs text-slate-500">5-year projections with AI optimization</p>
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} New version
        </button>
      </div>

      {/* Key metrics */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Year 1 Revenue", value: fmt(model.year1_revenue), icon: DollarSign, color: "from-emerald-500 to-green-600" },
          { label: "Year 5 Revenue", value: fmt(model.year5_revenue), icon: TrendingUp, color: "from-blue-500 to-indigo-600" },
          { label: "Break-even", value: be.status === "achieved" ? `Month ${be.break_even_month}` : "Projected", icon: Target, color: "from-amber-500 to-orange-600" },
          { label: "Y3 EBITDA Margin", value: `${model.year3_ebitda_margin.toFixed(1)}%`, icon: BarChart3, color: "from-violet-500 to-purple-600" },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-slate-100/50">
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${m.color}`}>
              <m.icon size={14} className="text-white" />
            </div>
            <p className="text-xl font-bold text-slate-900">{m.value}</p>
            <p className="text-2xs text-slate-500">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* 5-Year P&L Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-100/50">
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-bold text-slate-900">5-Year Profit & Loss</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Metric</th>
                {yp.map(y => <th key={y.year} className="px-4 py-2.5 text-right font-semibold text-slate-600">Year {y.year}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Revenue", key: "revenue", bold: true },
                { label: "COGS", key: "cogs" },
                { label: "Gross Profit", key: "gross_profit", bold: true },
                { label: "Operating Expenses", key: "operating_expenses" },
                { label: "EBITDA", key: "ebitda", bold: true, highlight: true },
                { label: "Net Income", key: "net_income", bold: true },
                { label: "Headcount", key: "headcount" },
                { label: "Growth %", key: "revenue_growth", pct: true },
                { label: "EBITDA Margin", key: "ebitda_margin", pct: true, highlight: true },
              ].map(row => (
                <tr key={row.label} className={`border-b border-slate-50 ${row.highlight ? "bg-emerald-50/30" : ""}`}>
                  <td className={`px-4 py-2 ${row.bold ? "font-bold text-slate-900" : "text-slate-600"}`}>{row.label}</td>
                  {yp.map(y => (
                    <td key={y.year} className={`px-4 py-2 text-right ${row.bold ? "font-bold text-slate-900" : "text-slate-600"}`}>
                      {row.pct ? `${(y as any)[row.key]}%` : row.key === "headcount" ? (y as any)[row.key] : fmt((y as any)[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Revenue Streams + EBITDA + Scenarios */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Streams */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Revenue Streams</p>
          <div className="space-y-2.5">
            {model.revenue_streams.map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{s.name}</span>
                  <span className="text-2xs text-slate-500">{s.pct_of_total}%</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-2xs">
                  <span className="text-slate-400">Y1: {fmt(s.year1)}</span>
                  <ArrowUp size={8} className="text-emerald-500" />
                  <span className="font-semibold text-emerald-600">Y5: {fmt(s.year5)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* EBITDA Progression */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">EBITDA Progression</p>
          <div className="space-y-3">
            {[
              { label: "Year 1", value: ea.year1_ebitda, margin: ea.year1_margin },
              { label: "Year 3", value: ea.year3_ebitda, margin: ea.year3_margin },
              { label: "Year 5", value: ea.year5_ebitda, margin: ea.year5_margin },
            ].map(e => (
              <div key={e.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">{e.label}</span>
                  <span className="text-xs font-bold text-emerald-600">{e.margin.toFixed(1)}% margin</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{fmt(e.value)}</p>
              </div>
            ))}
            <p className="text-2xs text-slate-400">Trend: <span className="font-semibold text-emerald-600 capitalize">{ea.trend}</span></p>
          </div>
        </motion.div>

        {/* Scenarios */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Scenario Analysis</p>
          <div className="space-y-2.5">
            {model.scenarios.map(s => {
              const color = s.label === "Optimistic" ? "ring-emerald-200 bg-emerald-50/50" :
                s.label === "Pessimistic" ? "ring-red-200 bg-red-50/50" : "ring-blue-200 bg-blue-50/50";
              return (
                <div key={s.label} className={`rounded-xl p-3 ring-1 ${color}`}>
                  <p className="text-xs font-bold text-slate-900">{s.label}</p>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-2xs">
                    <div><span className="text-slate-500">Y3 Rev:</span> <span className="font-semibold">{fmt(s.year3_revenue)}</span></div>
                    <div><span className="text-slate-500">Y5 Rev:</span> <span className="font-semibold">{fmt(s.year5_revenue)}</span></div>
                    <div><span className="text-slate-500">Y3 EBITDA:</span> <span className="font-semibold">{fmt(s.year3_ebitda)}</span></div>
                    <div><span className="text-slate-500">Y5 EBITDA:</span> <span className="font-semibold">{fmt(s.year5_ebitda)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Break-even + Funding */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Break-Even Analysis</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
              <p className="text-2xs text-emerald-600">Break-Even Point</p>
              <p className="text-xl font-bold text-emerald-700">Month {be.break_even_month}</p>
              <p className={`text-2xs font-semibold ${be.status === "achieved" ? "text-emerald-600" : "text-amber-600"}`}>{be.status}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="text-2xs text-slate-500">Monthly Revenue Needed</p>
              <p className="text-lg font-bold text-slate-900">{fmt(be.break_even_revenue)}</p>
              <p className="text-2xs text-slate-400">{be.contribution_margin}% contribution margin</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Funding & Investment</p>
          {fr.total_needed > 0 ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
                <p className="text-2xs text-blue-600">Funding Needed</p>
                <p className="text-xl font-bold text-blue-700">{fmt(fr.total_needed)}</p>
                <p className="text-2xs text-blue-500">Recommended: <span className="font-bold capitalize">{fr.recommended_round.replace("_", " ")}</span></p>
              </div>
              <p className="text-2xs text-slate-500">Valuation: {fr.valuation_range}</p>
              <div className="flex flex-wrap gap-1">
                {fr.use_of_funds.map(u => (
                  <span key={u.category} className="rounded-full bg-slate-50 px-2 py-0.5 text-2xs text-slate-600 ring-1 ring-slate-100">{u.category} ({u.pct}%)</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
              <Wallet size={24} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700">Bootstrappable</p>
              <p className="text-2xs text-emerald-600">Revenue covers operations. Optional growth funding available.</p>
              <p className="mt-2 text-2xs text-slate-500">{fr.valuation_range}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Assumptions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="rounded-xl bg-slate-50 px-5 py-3 ring-1 ring-slate-100">
        <p className="text-2xs text-slate-500">
          <span className="font-semibold">Assumptions:</span> {model.assumptions.base_growth_rate}% growth rate |
          {model.assumptions.cost_reduction_from_ai}% AI cost reduction |
          {model.assumptions.industry_growth_rate}% industry CAGR
        </p>
      </motion.div>
    </motion.div>
  );
}
