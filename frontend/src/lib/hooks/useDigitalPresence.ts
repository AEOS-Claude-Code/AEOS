"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface ScoreBreakdownItem {
  category: string;
  score: number;
  weight: number;
  label: string;
  explanation: string;
  items: { check: string; passed: boolean }[];
}

export interface Recommendation {
  priority: number;
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
}

export interface DigitalPresenceReport {
  id: string;
  workspace_id: string;
  status: string;
  overall_score: number;
  website_performance: number;
  search_visibility: number;
  social_presence: number;
  reputation: number;
  conversion_readiness: number;
  score_breakdown: ScoreBreakdownItem[];
  recommendations: Recommendation[];
  data_sources: string[];
  computed_at: string | null;
  created_at: string;
}

export interface HistoryItem {
  date: string;
  overall_score: number;
  website_performance: number;
  search_visibility: number;
  social_presence: number;
  reputation: number;
  conversion_readiness: number;
}

export interface DigitalPresenceHistory {
  snapshots: HistoryItem[];
  trend: string;
  change_30d: number | null;
}

interface UseDigitalPresenceReturn {
  report: DigitalPresenceReport | null;
  history: DigitalPresenceHistory | null;
  loading: boolean;
  error: string | null;
  recomputing: boolean;
  refresh: () => void;
  recompute: () => Promise<void>;
}

export function useDigitalPresence(): UseDigitalPresenceReturn {
  const [report, setReport] = useState<DigitalPresenceReport | null>(null);
  const [history, setHistory] = useState<DigitalPresenceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);

  function refresh() {
    setLoading(true);
    setFetchCount((c) => c + 1);
  }

  async function recompute() {
    setRecomputing(true);
    try {
      await api.post("/api/v1/digital-presence/compute");
      refresh();
    } catch (e: any) {
      setError(e?.message || "Recompute failed");
    } finally {
      setRecomputing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setError(null);
      try {
        const [reportRes, historyRes] = await Promise.all([
          api.get("/api/v1/digital-presence/latest"),
          api.get("/api/v1/digital-presence/history?days=90"),
        ]);
        if (!cancelled) {
          setReport(reportRes.data);
          setHistory(historyRes.data);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load digital presence data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [fetchCount]);

  return { report, history, loading, error, recomputing, refresh, recompute };
}
