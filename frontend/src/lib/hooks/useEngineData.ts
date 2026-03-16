"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────── */

export interface LeadSummary {
  total_leads_30d: number;
  qualified_leads_30d: number;
  conversion_rate: number;
  top_source: string;
  trend: string;
  by_source: { source: string; count: number; avg_score: number }[];
  by_status: Record<string, number>;
  by_classification: Record<string, number>;
}

export interface LeadItem {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  channel: string;
  status: string;
  score: number;
  classification: string;
  landing_page: string;
  created_at: string;
}

export interface OpportunityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  impact_score: number;
  effort_score: number;
  recommended_action: string;
  status: string;
  detected_at: string;
}

export interface OpportunityRadar {
  total_detected: number;
  high_impact_count: number;
  opportunities: OpportunityItem[];
}

export interface CompanyScan {
  id: string;
  workspace_id: string;
  website_url: string;
  status: string;
  page_title: string;
  meta_description: string;
  headings: { level: string; text: string }[];
  detected_keywords: string[];
  internal_links_count: number;
  pages_detected: number;
  seo_score: number;
  seo_details: Record<string, any>;
  social_presence: Record<string, boolean>;
  tech_stack: string[];
  scan_summary: string;
  scan_started_at: string | null;
  scan_completed_at: string | null;
  created_at: string;
}

/* ── Hook ──────────────────────────────────────────────────────── */

interface EngineData {
  leadSummary: LeadSummary | null;
  leads: LeadItem[];
  opportunityRadar: OpportunityRadar | null;
  companyScan: CompanyScan | null;
  loading: boolean;
  errors: {
    leads: string | null;
    opportunities: string | null;
    scan: string | null;
  };
  refresh: () => void;
}

export function useEngineData(): EngineData {
  const [leadSummary, setLeadSummary] = useState<LeadSummary | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [opportunityRadar, setOpportunityRadar] = useState<OpportunityRadar | null>(null);
  const [companyScan, setCompanyScan] = useState<CompanyScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<EngineData["errors"]>({
    leads: null,
    opportunities: null,
    scan: null,
  });
  const [fetchCount, setFetchCount] = useState(0);

  function refresh() {
    setLoading(true);
    setFetchCount((c) => c + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const errs: EngineData["errors"] = { leads: null, opportunities: null, scan: null };

      // Leads
      try {
        const [sumRes, listRes] = await Promise.all([
          api.get("/api/v1/leads/summary"),
          api.get("/api/v1/leads/list?limit=20"),
        ]);
        if (!cancelled) {
          setLeadSummary(sumRes.data);
          setLeads(listRes.data.leads ?? []);
        }
      } catch (e: any) {
        errs.leads = e?.message || "Failed to load leads";
      }

      // Opportunities
      try {
        const radarRes = await api.get("/api/v1/opportunities/radar");
        if (!cancelled) {
          setOpportunityRadar(radarRes.data);
        }
      } catch (e: any) {
        errs.opportunities = e?.message || "Failed to load opportunities";
      }

      // Company scan
      try {
        const scanRes = await api.get("/api/v1/company-scan/latest");
        if (!cancelled) {
          setCompanyScan(scanRes.data);
        }
      } catch (e: any) {
        // 404 or null is fine — means no scan yet
        if (!cancelled) {
          setCompanyScan(null);
        }
      }

      if (!cancelled) {
        setErrors(errs);
        setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [fetchCount]);

  return { leadSummary, leads, opportunityRadar, companyScan, loading, errors, refresh };
}
