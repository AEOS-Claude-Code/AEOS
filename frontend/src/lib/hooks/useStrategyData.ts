"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────── */

export interface HealthScore {
  overall: number;
  digital_presence: number;
  lead_generation: number;
  competitive_position: number;
  integration_coverage: number;
  setup_completeness: number;
}

export interface Priority {
  rank: number;
  category: string;
  title: string;
  description: string;
  impact_score: number;
  effort_score: number;
  source_engine: string;
  status: string;
}

export interface PriorityList {
  workspace_id: string;
  priorities: Priority[];
  generated_at: string;
}

export interface RoadmapAction {
  week: number;
  action: string;
  department: string;
  expected_outcome: string;
  priority_rank: number | null;
}

export interface Roadmap {
  workspace_id: string;
  horizon_days: number;
  goals: string[];
  actions: RoadmapAction[];
  generated_at: string;
}

export interface RoadmapResponse {
  workspace_id: string;
  roadmaps: Record<string, Roadmap>;
  generated_at: string;
}

export interface RiskAlert {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  recommended_action: string;
  acknowledged: boolean;
}

export interface RiskList {
  workspace_id: string;
  risks: RiskAlert[];
  generated_at: string;
}

export interface StrategicSummary {
  workspace_id: string;
  company_name: string;
  health_score: HealthScore;
  headline: string;
  key_insight: string;
  generated_at: string;
}

/* ── Fallback data ─────────────────────────────────────────────── */

const EMPTY_SUMMARY: StrategicSummary = {
  workspace_id: "",
  company_name: "Workspace",
  health_score: {
    overall: 0, digital_presence: 0, lead_generation: 0,
    competitive_position: 0, integration_coverage: 0, setup_completeness: 0,
  },
  headline: "Loading strategic intelligence\u2026",
  key_insight: "",
  generated_at: new Date().toISOString(),
};

const EMPTY_PRIORITIES: PriorityList = {
  workspace_id: "", priorities: [], generated_at: new Date().toISOString(),
};

const EMPTY_ROADMAP: RoadmapResponse = {
  workspace_id: "", roadmaps: {}, generated_at: new Date().toISOString(),
};

const EMPTY_RISKS: RiskList = {
  workspace_id: "", risks: [], generated_at: new Date().toISOString(),
};

/* ── Hook ──────────────────────────────────────────────────────── */

export interface StrategyData {
  summary: StrategicSummary;
  priorities: PriorityList;
  roadmap: RoadmapResponse;
  risks: RiskList;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => void;
}

export function useStrategyData(): StrategyData {
  const [summary, setSummary] = useState<StrategicSummary>(EMPTY_SUMMARY);
  const [priorities, setPriorities] = useState<PriorityList>(EMPTY_PRIORITIES);
  const [roadmap, setRoadmap] = useState<RoadmapResponse>(EMPTY_ROADMAP);
  const [risks, setRisks] = useState<RiskList>(EMPTY_RISKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  function refresh() {
    setLoading(true);
    setFetchCount((c) => c + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [sumRes, priRes, roadRes, riskRes] = await Promise.all([
          api.get("/api/v1/strategy/summary"),
          api.get("/api/v1/strategy/priorities"),
          api.get("/api/v1/strategy/roadmap"),
          api.get("/api/v1/strategy/risks"),
        ]);

        if (!cancelled) {
          setSummary(sumRes.data);
          setPriorities(priRes.data);
          setRoadmap(roadRes.data);
          setRisks(riskRes.data);
          setConnected(true);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Strategy API unavailable");
          setConnected(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [fetchCount]);

  return { summary, priorities, roadmap, risks, loading, error, connected, refresh };
}
