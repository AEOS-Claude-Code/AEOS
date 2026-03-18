"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface RevenueModel {
  estimated_annual_revenue: number; revenue_per_employee: number;
  industry_avg_revenue_per_employee: number; revenue_label: string; revenue_trend: string;
}
export interface CostStructure {
  estimated_annual_costs: number; cost_to_revenue_ratio: number;
  major_cost_categories: { name: string; pct: number; amount: number }[];
  optimization_potential: number;
}
export interface GrowthLever {
  title: string; description: string; estimated_impact_pct: number; effort: string; category: string;
}
export interface FinancialRisk {
  title: string; description: string; severity: string; likelihood: string; mitigation: string;
}
export interface YearProjection {
  year: number; revenue: number; costs: number; profit: number; growth_rate: number;
}
export interface FinancialHealthReport {
  id: string; workspace_id: string; status: string; overall_score: number;
  revenue_potential_score: number; cost_efficiency_score: number;
  growth_readiness_score: number; risk_exposure_score: number; investment_readiness_score: number;
  revenue_model: RevenueModel; cost_structure: CostStructure;
  growth_levers: GrowthLever[]; financial_risks: FinancialRisk[];
  recommendations: any[]; projections: YearProjection[]; computed_at: string | null;
}

export function useFinancialHealth() {
  const [report, setReport] = useState<FinancialHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/financial-health/latest");
      setReport(res.data); setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load financial health");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function recompute() {
    setRecomputing(true);
    try { await api.post("/api/v1/financial-health/compute"); await fetch(); }
    catch { setError("Recomputation failed"); }
    finally { setRecomputing(false); }
  }

  return { report, loading, error, recomputing, recompute, refresh: fetch };
}
