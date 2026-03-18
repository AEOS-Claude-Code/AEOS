"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface KPIItem {
  id: string; name: string; description: string; category: string;
  department: string; target: string; current_value: string; unit: string;
  frequency: string; priority: string; status: string; data_source: string;
}
export interface ReviewCadence {
  daily: string[]; weekly: string[]; monthly: string[]; quarterly: string[];
}
export interface KPIFrameworkReport {
  id: string; workspace_id: string; status: string;
  overall_kpi_score: number; total_kpis: number; tracked_kpis: number;
  company_kpis: KPIItem[]; department_kpis: KPIItem[];
  digital_kpis: KPIItem[]; financial_kpis: KPIItem[];
  review_cadence: ReviewCadence; computed_at: string | null;
}

export function useKPIFramework() {
  const [report, setReport] = useState<KPIFrameworkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/api/v1/kpi-framework/latest"); setReport(res.data); setError(null); }
    catch (err: any) { setError(err?.response?.data?.detail || "Failed to load KPIs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function recompute() {
    setRecomputing(true);
    try { await api.post("/api/v1/kpi-framework/compute"); await fetch(); }
    catch { setError("Recomputation failed"); }
    finally { setRecomputing(false); }
  }

  return { report, loading, error, recomputing, recompute, refresh: fetch };
}
