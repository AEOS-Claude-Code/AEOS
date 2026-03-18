"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

export interface BusinessPlanSection {
  key: string;
  title: string;
  status: "pending" | "generating" | "completed" | "failed";
  content: string;
  word_count: number;
  generated_at: string | null;
}

export interface BusinessPlan {
  id: string;
  workspace_id: string;
  status: "pending" | "generating" | "completed" | "failed";
  title: string;
  version: number;
  sections: BusinessPlanSection[];
  current_section: string | null;
  sections_completed: number;
  sections_total: number;
  metadata: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useBusinessPlan() {
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/business-plan/latest");
      setPlan(res.data);
      setError(null);

      // Start polling if generating
      if (res.data.status === "generating") {
        setGenerating(true);
        startPolling(res.data.id);
      } else {
        setGenerating(false);
        stopPolling();
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setPlan(null); // No plan yet
      } else {
        setError("Failed to load business plan");
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  function startPolling(planId: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/business-plan/${planId}`);
        setPlan(res.data);
        if (res.data.status !== "generating") {
          setGenerating(false);
          stopPolling();
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    fetchLatest();
    return () => stopPolling();
  }, [fetchLatest]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post("/api/v1/business-plan/generate");
      // Immediately fetch the plan to start tracking
      const planRes = await api.get(`/api/v1/business-plan/${res.data.plan_id}`);
      setPlan(planRes.data);
      if (planRes.data.status === "generating") {
        startPolling(planRes.data.id);
      } else {
        setGenerating(false);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Generation failed");
      setGenerating(false);
    }
  }

  async function regenerateSection(sectionKey: string) {
    if (!plan) return;
    try {
      await api.post(`/api/v1/business-plan/${plan.id}/regenerate/${sectionKey}`);
      await fetchLatest();
    } catch {
      setError("Failed to regenerate section");
    }
  }

  return { plan, loading, generating, error, generate, regenerateSection, refresh: fetchLatest };
}
