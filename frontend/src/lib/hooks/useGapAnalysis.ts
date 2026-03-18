"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface GapDepartmentDetail {
  department_id: string;
  department_name: string;
  icon: string;
  status: "fully_staffed" | "partially_staffed" | "ai_only" | "missing";
  gap_severity: "none" | "low" | "medium" | "high" | "critical";
  has_human_head: boolean;
  total_ideal_roles: number;
  human_filled_roles: number;
  ai_filled_roles: number;
  missing_roles: string[];
  human_roles: string[];
  ai_roles: string[];
}

export interface GapRecommendation {
  priority: number;
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
}

export interface GapAnalysisReport {
  id: string;
  workspace_id: string;
  status: string;
  overall_gap_score: number;
  department_coverage_score: number;
  role_coverage_score: number;
  leadership_gap_score: number;
  critical_function_score: number;
  operational_maturity_score: number;
  gap_breakdown: GapDepartmentDetail[];
  recommendations: GapRecommendation[];
  ideal_org_summary: { industry?: string; total_departments?: number; total_ai_agents?: number };
  computed_at: string | null;
  created_at: string;
}

export function useGapAnalysis() {
  const [report, setReport] = useState<GapAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  const fetchReport = useCallback(async () => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/api/v1/gap-analysis/latest");
      if (!cancelled) setReport(res.data);
    } catch (err: any) {
      if (!cancelled) {
        const msg = err?.response?.data?.detail || "Failed to load gap analysis";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => { cancelled = true; };
  }, [fetchCount]); // eslint-disable-line

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function refresh() {
    setFetchCount((c) => c + 1);
  }

  async function recompute() {
    setRecomputing(true);
    try {
      await api.post("/api/v1/gap-analysis/compute");
      refresh();
    } catch {
      setError("Recomputation failed");
    } finally {
      setRecomputing(false);
    }
  }

  return { report, loading, error, recomputing, refresh, recompute };
}
