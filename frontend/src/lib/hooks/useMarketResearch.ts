"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface MarketSizing {
  tam: number; sam: number; som: number;
  tam_label: string; sam_label: string; som_label: string;
}
export interface BenchmarkItem {
  metric: string; your_value: number; industry_avg: number;
  unit: string; status: "above" | "below" | "neutral";
}
export interface GrowthDriver {
  title: string; description: string; impact: string; category: string;
}
export interface MarketThreat {
  title: string; description: string; severity: string;
}
export interface MarketPositioning {
  score: number; label: string; strengths: string[]; growth_areas: string[];
}
export interface MarketResearchReport {
  id: string; workspace_id: string; status: string; industry: string;
  market_sizing: MarketSizing; benchmarks: BenchmarkItem[];
  growth_drivers: GrowthDriver[]; threats: MarketThreat[];
  opportunities: GrowthDriver[]; market_positioning: MarketPositioning;
  market_growth_rate: number; computed_at: string | null;
}

export function useMarketResearch() {
  const [report, setReport] = useState<MarketResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/market-research/latest");
      setReport(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load market research");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function recompute() {
    setRecomputing(true);
    try { await api.post("/api/v1/market-research/compute"); await fetch(); }
    catch { setError("Recomputation failed"); }
    finally { setRecomputing(false); }
  }

  return { report, loading, error, recomputing, recompute, refresh: fetch };
}
