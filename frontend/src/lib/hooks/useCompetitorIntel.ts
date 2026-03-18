"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface CompetitorItem {
  id: string;
  url: string;
  name: string;
  status: string;
  seo_score: number;
  performance_score: number;
  security_score: number;
  overall_score: number;
  tech_stack: string[];
  social_presence: Record<string, boolean>;
  keywords: string[];
  last_scanned_at: string | null;
}

export interface DimensionScore {
  dimension: string;
  label: string;
  weight: number;
  client_score: number;
  competitor_avg: number;
  gap: number;
}

export interface StrategicInsight {
  category: string;
  title: string;
  description: string;
  impact: string;
}

export interface CompetitorSummary {
  id: string;
  name: string;
  url: string;
  overall_score: number;
  vs_client: number;
}

export interface CompetitorReport {
  id: string;
  overall_positioning: number;
  dimension_scores: DimensionScore[];
  strengths: StrategicInsight[];
  weaknesses: StrategicInsight[];
  opportunities: StrategicInsight[];
  competitor_summary: CompetitorSummary[];
  competitors_scanned: number;
  computed_at: string | null;
}

export function useCompetitorIntel() {
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, reportRes] = await Promise.allSettled([
        api.get("/api/v1/competitors/list"),
        api.get("/api/v1/competitors/report"),
      ]);
      if (compRes.status === "fulfilled") setCompetitors(compRes.value.data);
      if (reportRes.status === "fulfilled") setReport(reportRes.value.data);
      setError(null);
    } catch {
      setError("Failed to load competitor data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function scan() {
    setScanning(true);
    setError(null);
    try {
      await api.post("/api/v1/competitors/scan");
      await fetch();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function addCompetitor(url: string) {
    try {
      await api.post("/api/v1/competitors/add", { url });
      await fetch();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to add competitor");
    }
  }

  return { competitors, report, loading, scanning, error, scan, addCompetitor, refresh: fetch };
}
