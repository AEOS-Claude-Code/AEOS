"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

/* ── Types matching backend schemas ────────────────────────────── */

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

/* ── Extracted card data types ─────────────────────────────────── */

export interface LeadData {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  topSource: string;
  trend: string;
}

export interface OpportunityData {
  totalDetected: number;
  highImpactCount: number;
  categories: string[];
  topOpportunity: string;
}

export interface IntegrationItem {
  name: string;
  status: "connected" | "disconnected" | "recommended";
}

export interface IntegrationData {
  totalAvailable: number;
  totalConnected: number;
  criticalMissing: string[];
  items: IntegrationItem[];
}

export interface StrategicSummary {
  workspace_id: string;
  company_name: string;
  health_score: HealthScore;
  headline: string;
  key_insight: string;
  generated_at: string;
  /* raw signal_map from backend – we extract card data from it */
  signal_map?: Record<string, unknown>;
}

/* ── Connection status for each data source ────────────────────── */

export interface ConnectionStatus {
  backend: "loading" | "connected" | "error";
  strategy: "loading" | "connected" | "error";
  leads: "live" | "mock";
  opportunities: "live" | "mock";
  integrations: "live" | "mock";
}

/* ── Fallback mock data ────────────────────────────────────────── */

const MOCK_SUMMARY: StrategicSummary = {
  workspace_id: "ws-demo-001",
  company_name: "Demo Company",
  health_score: {
    overall: 48.5,
    digital_presence: 52,
    lead_generation: 45,
    competitive_position: 30,
    integration_coverage: 17.5,
    setup_completeness: 100,
  },
  headline:
    "Demo Company has a solid foundation with clear areas for improvement.",
  key_insight:
    "Top priority: Improve digital presence score (impact: 96/100).",
  generated_at: new Date().toISOString(),
};

const MOCK_PRIORITIES: PriorityList = {
  workspace_id: "ws-demo-001",
  priorities: [
    {
      rank: 1,
      category: "growth",
      title: "Reverse declining lead trend",
      description: "Lead volume is declining over the last 30 days.",
      impact_score: 85,
      effort_score: 50,
      source_engine: "lead_intelligence_engine",
      status: "suggested",
    },
    {
      rank: 2,
      category: "marketing",
      title: "Improve digital presence score",
      description: "Digital presence is at 52/100.",
      impact_score: 76,
      effort_score: 40,
      source_engine: "digital_presence_engine",
      status: "suggested",
    },
    {
      rank: 3,
      category: "marketing",
      title: "Close competitive gap",
      description: "Positioned behind 3 tracked competitors.",
      impact_score: 75,
      effort_score: 60,
      source_engine: "competitor_intelligence_engine",
      status: "suggested",
    },
  ],
  generated_at: new Date().toISOString(),
};

const MOCK_ROADMAP: RoadmapResponse = {
  workspace_id: "ws-demo-001",
  roadmaps: {
    "30": {
      workspace_id: "ws-demo-001",
      horizon_days: 30,
      goals: ["Strengthen digital presence and marketing effectiveness"],
      actions: [
        {
          week: 1,
          action: "Connect critical integrations",
          department: "IT / Engineering",
          expected_outcome: "Improved data quality and engine accuracy.",
          priority_rank: 1,
        },
        {
          week: 2,
          action: "Improve digital presence score",
          department: "Marketing",
          expected_outcome: "Target 60/100 digital presence.",
          priority_rank: 2,
        },
        {
          week: 3,
          action: "Increase lead conversion rate",
          department: "Marketing",
          expected_outcome: "Move toward industry benchmark.",
          priority_rank: 3,
        },
      ],
      generated_at: new Date().toISOString(),
    },
  },
  generated_at: new Date().toISOString(),
};

const MOCK_LEADS: LeadData = {
  totalLeads: 87,
  qualifiedLeads: 23,
  conversionRate: 2.1,
  topSource: "Organic search",
  trend: "stable",
};

const MOCK_OPPORTUNITIES: OpportunityData = {
  totalDetected: 14,
  highImpactCount: 4,
  categories: ["keyword_gaps", "local_market", "conversion_optimization"],
  topOpportunity: "Untapped local SEO keywords with high purchase intent",
};

const MOCK_RISKS: RiskList = {
  workspace_id: "ws-demo-001",
  risks: [
    {
      id: "risk-0001",
      severity: "critical",
      category: "digital_presence",
      title: "Digital presence critically low",
      description: "Score is 52/100, below critical threshold of 40.",
      recommended_action: "Immediate website and SEO audit required.",
      acknowledged: false,
    },
    {
      id: "risk-0002",
      severity: "high",
      category: "lead_generation",
      title: "Lead conversion rate critically low",
      description: "Conversion at 2.1% vs warning threshold of 2.0%.",
      recommended_action: "Review conversion funnel and landing page UX.",
      acknowledged: false,
    },
    {
      id: "risk-0003",
      severity: "medium",
      category: "integrations",
      title: "Insufficient platform integrations",
      description: "Only 3 integrations connected (minimum recommended: 3).",
      recommended_action: "Connect Google Analytics, Search Console, and social platforms.",
      acknowledged: false,
    },
  ],
  generated_at: new Date().toISOString(),
};

const MOCK_INTEGRATIONS: IntegrationData = {
  totalAvailable: 8,
  totalConnected: 3,
  criticalMissing: ["Google Analytics", "Google Search Console"],
  items: [
    { name: "Google Analytics", status: "disconnected" },
    { name: "Google Search Console", status: "disconnected" },
    { name: "Google Business", status: "connected" },
    { name: "Facebook", status: "connected" },
    { name: "Instagram", status: "connected" },
    { name: "WordPress", status: "recommended" },
    { name: "Shopify", status: "recommended" },
  ],
};

/* ── Extraction helpers (parse signal_map from backend) ────────── */

function extractLeads(signalMap: Record<string, unknown>): LeadData | null {
  const leads = signalMap?.leads as Record<string, unknown> | undefined;
  if (!leads) return null;

  const SOURCE_LABELS: Record<string, string> = {
    organic_search: "Organic search",
    paid_search: "Paid search",
    social: "Social media",
    referral: "Referral",
    direct: "Direct",
  };

  return {
    totalLeads: (leads.total_leads_30d as number) ?? 0,
    qualifiedLeads: (leads.qualified_leads_30d as number) ?? 0,
    conversionRate: (leads.conversion_rate as number) ?? 0,
    topSource:
      SOURCE_LABELS[(leads.top_source as string) ?? ""] ??
      ((leads.top_source as string) ?? "Unknown"),
    trend: (leads.trend as string) ?? "stable",
  };
}

function extractOpportunities(
  signalMap: Record<string, unknown>
): OpportunityData | null {
  const opp = signalMap?.opportunities as Record<string, unknown> | undefined;
  if (!opp) return null;

  return {
    totalDetected: (opp.total_detected as number) ?? 0,
    highImpactCount: (opp.high_impact_count as number) ?? 0,
    categories: (opp.categories as string[]) ?? [],
    topOpportunity: (opp.top_opportunity as string) ?? "",
  };
}

function extractIntegrations(
  signalMap: Record<string, unknown>
): IntegrationData | null {
  const integ = signalMap?.integrations as Record<string, unknown> | undefined;
  if (!integ) return null;

  const totalAvailable = (integ.total_available as number) ?? 0;
  const totalConnected = (integ.total_connected as number) ?? 0;
  const criticalMissing = (integ.critical_missing as string[]) ?? [];

  /* Build integration item list from known platforms */
  const ALL_PLATFORMS = [
    "Google Analytics",
    "Google Search Console",
    "Google Business",
    "Facebook",
    "Instagram",
    "WordPress",
    "Shopify",
    "WhatsApp",
  ];

  const missingSet = new Set(criticalMissing.map((s) => s.toLowerCase()));

  const items: IntegrationItem[] = ALL_PLATFORMS.slice(
    0,
    totalAvailable
  ).map((name) => {
    if (missingSet.has(name.toLowerCase())) {
      return { name, status: "disconnected" as const };
    }
    return { name, status: "connected" as const };
  });

  /* Mark extras as recommended if totalAvailable > items built */
  const remaining = totalAvailable - items.length;
  for (let i = 0; i < remaining; i++) {
    items.push({ name: `Platform ${items.length + 1}`, status: "recommended" });
  }

  /* Reconcile connected count: mark items as connected until we reach totalConnected */
  let connectedSoFar = items.filter((x) => x.status === "connected").length;
  if (connectedSoFar < totalConnected) {
    for (const item of items) {
      if (connectedSoFar >= totalConnected) break;
      if (item.status !== "connected") {
        /* only promote recommended, not disconnected (critical missing) */
        if (item.status === "recommended") {
          item.status = "connected";
          connectedSoFar++;
        }
      }
    }
  }

  return { totalAvailable, totalConnected, criticalMissing, items };
}

/* ── Main hook ─────────────────────────────────────────────────── */

export interface StrategyData {
  summary: StrategicSummary;
  priorities: PriorityList;
  roadmap: RoadmapResponse;
  risks: RiskList;
  leads: LeadData;
  opportunities: OpportunityData;
  integrations: IntegrationData;
  connection: ConnectionStatus;
  loading: boolean;
  /** Per-module error messages (null = no error) */
  errors: {
    strategy: string | null;
    leads: string | null;
    opportunities: string | null;
    integrations: string | null;
  };
  /** Re-fetch all data */
  refresh: () => void;
}

export function useStrategyData(): StrategyData {
  const [summary, setSummary] = useState<StrategicSummary>(MOCK_SUMMARY);
  const [priorities, setPriorities] =
    useState<PriorityList>(MOCK_PRIORITIES);
  const [roadmap, setRoadmap] = useState<RoadmapResponse>(MOCK_ROADMAP);
  const [risks, setRisks] = useState<RiskList>(MOCK_RISKS);
  const [leads, setLeads] = useState<LeadData>(MOCK_LEADS);
  const [opportunities, setOpportunities] =
    useState<OpportunityData>(MOCK_OPPORTUNITIES);
  const [integrations, setIntegrations] =
    useState<IntegrationData>(MOCK_INTEGRATIONS);
  const [connection, setConnection] = useState<ConnectionStatus>({
    backend: "loading",
    strategy: "loading",
    leads: "mock",
    opportunities: "mock",
    integrations: "mock",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<StrategyData["errors"]>({
    strategy: null,
    leads: null,
    opportunities: null,
    integrations: null,
  });
  const [fetchCount, setFetchCount] = useState(0);

  function refresh() {
    setLoading(true);
    setFetchCount((c) => c + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const status: ConnectionStatus = {
        backend: "loading",
        strategy: "loading",
        leads: "mock",
        opportunities: "mock",
        integrations: "mock",
      };
      const moduleErrors: StrategyData["errors"] = {
        strategy: null,
        leads: null,
        opportunities: null,
        integrations: null,
      };

      /* Step 1: Check backend health */
      try {
        await api.get("/api/health");
        status.backend = "connected";
      } catch {
        status.backend = "error";
        moduleErrors.strategy = "Backend unreachable";
      }

      /* Step 2: Fetch strategy data (contains signal_map with card data) */
      if (status.backend === "connected") {
        try {
          const [sumRes, priRes, roadRes, riskRes] = await Promise.all([
            api.get("/api/v1/strategy/summary"),
            api.get("/api/v1/strategy/priorities"),
            api.get("/api/v1/strategy/roadmap"),
            api.get("/api/v1/strategy/risks"),
          ]);

          if (!cancelled) {
            const sumData = sumRes.data as StrategicSummary;
            setSummary(sumData);
            setPriorities(priRes.data);
            setRoadmap(roadRes.data);
            setRisks(riskRes.data);
            status.strategy = "connected";

            /* Step 3: Extract card data from signal_map */
            const sm = sumData.signal_map as
              | Record<string, unknown>
              | undefined;

            if (sm) {
              const liveLeads = extractLeads(sm);
              if (liveLeads) {
                setLeads(liveLeads);
                status.leads = "live";
              }

              const liveOpps = extractOpportunities(sm);
              if (liveOpps) {
                setOpportunities(liveOpps);
                status.opportunities = "live";
              }

              const liveInteg = extractIntegrations(sm);
              if (liveInteg) {
                setIntegrations(liveInteg);
                status.integrations = "live";
              }
            }

            /* Step 3b: Try seed entity endpoints for richer data */
            try {
              const [leadRes, oppRes, integRes] = await Promise.allSettled([
                api.get("/api/v1/leads"),
                api.get("/api/v1/opportunities"),
                api.get("/api/v1/integrations/status"),
              ]);

              if (!cancelled) {
                if (leadRes.status === "fulfilled" && leadRes.value.data?.summary) {
                  const ls = leadRes.value.data.summary;
                  const SOURCE_LABELS: Record<string, string> = {
                    organic_search: "Organic search",
                    paid_search: "Paid search",
                    social: "Social media",
                    referral: "Referral",
                    direct: "Direct",
                  };
                  setLeads({
                    totalLeads: ls.total_leads_30d ?? 0,
                    qualifiedLeads: ls.qualified_leads_30d ?? 0,
                    conversionRate: ls.conversion_rate ?? 0,
                    topSource: SOURCE_LABELS[ls.top_source] ?? ls.top_source ?? "Unknown",
                    trend: ls.trend ?? "stable",
                  });
                  status.leads = "live";
                }

                if (oppRes.status === "fulfilled" && oppRes.value.data?.summary) {
                  const os = oppRes.value.data.summary;
                  setOpportunities({
                    totalDetected: os.total_detected ?? 0,
                    highImpactCount: os.high_impact_count ?? 0,
                    categories: os.categories ?? [],
                    topOpportunity: os.top_opportunity ?? "",
                  });
                  status.opportunities = "live";
                }

                if (integRes.status === "fulfilled" && integRes.value.data?.integrations) {
                  const id = integRes.value.data;
                  const items: IntegrationItem[] = (id.integrations ?? []).map(
                    (i: Record<string, string>) => ({
                      name: i.platform,
                      status: i.status === "connected" ? "connected" as const : "disconnected" as const,
                    })
                  );
                  for (const rec of id.recommended ?? []) {
                    items.push({ name: rec, status: "recommended" as const });
                  }
                  const is = id.summary ?? {};
                  setIntegrations({
                    totalAvailable: is.total_available ?? items.length,
                    totalConnected: is.total_connected ?? 0,
                    criticalMissing: is.critical_missing ?? [],
                    items,
                  });
                  status.integrations = "live";
                }
              }
            } catch {
              /* Seed endpoints not available – keep signal_map data */
            }
          }
        } catch (e) {
          status.strategy = "error";
          if (!cancelled) {
            const msg = e instanceof Error ? e.message : "Strategy API unavailable";
            moduleErrors.strategy = msg;
          }
        }
      }

      if (!cancelled) {
        setConnection(status);
        setErrors(moduleErrors);
        setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [fetchCount]);

  return {
    summary,
    priorities,
    roadmap,
    risks,
    leads,
    opportunities,
    integrations,
    connection,
    loading,
    errors,
    refresh,
  };
}
