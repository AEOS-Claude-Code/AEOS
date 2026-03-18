"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface YearlyProjection {
  year: number; revenue: number; cogs: number; gross_profit: number;
  operating_expenses: number; ebitda: number; ebitda_margin: number;
  net_income: number; headcount: number; revenue_growth: number;
}
export interface ScenarioProjection {
  label: string; year3_revenue: number; year3_ebitda: number;
  year5_revenue: number; year5_ebitda: number;
}
export interface FinancialModelReport {
  id: string; workspace_id: string; status: string; version: number;
  year1_revenue: number; year5_revenue: number; break_even_month: number;
  year3_ebitda_margin: number;
  yearly_projections: YearlyProjection[];
  revenue_streams: { name: string; year1: number; year3: number; year5: number; pct_of_total: number }[];
  cost_breakdown: { name: string; year1: number; pct_of_revenue: number }[];
  ebitda_analysis: { year1_ebitda: number; year3_ebitda: number; year5_ebitda: number; year1_margin: number; year3_margin: number; year5_margin: number; trend: string };
  break_even_analysis: { break_even_month: number; break_even_revenue: number; contribution_margin: number; status: string };
  funding_requirements: { total_needed: number; runway_months: number; use_of_funds: { category: string; amount: number; pct: number }[]; recommended_round: string; valuation_range: string };
  assumptions: { base_growth_rate: number; cost_reduction_from_ai: number; industry_growth_rate: number };
  scenarios: ScenarioProjection[];
  computed_at: string | null;
}

export function useFinancialModel() {
  const [model, setModel] = useState<FinancialModelReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/api/v1/financial-model/latest"); setModel(res.data); setError(null); }
    catch (err: any) { if (err?.response?.status !== 404) setError(err?.response?.data?.detail || "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function generate() {
    setGenerating(true);
    try { await api.post("/api/v1/financial-model/generate"); await fetch(); }
    catch { setError("Generation failed"); }
    finally { setGenerating(false); }
  }

  return { model, loading, error, generating, generate, refresh: fetch };
}
