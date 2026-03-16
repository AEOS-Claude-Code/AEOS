"""
AEOS – Strategic Intelligence Engine: Service orchestrator.

This is the main entry point.  It collects signals, runs the
deterministic pipeline, and returns structured outputs.

In Phase 1 (foundation), signal collection uses seed/demo data.
In later phases, each collector will query its source engine's
database tables or service layer.
"""

from __future__ import annotations

from datetime import datetime

from .schemas import (
    ContextPack,
    CompetitorSignal,
    DigitalPresenceSignal,
    DigitalTwinSignal,
    FinanceSummarySignal,
    HealthScore,
    HRSummarySignal,
    IndustrySignal,
    IntegrationStatusSignal,
    LeadIntelligenceSignal,
    OperationsSummarySignal,
    OpportunitySignal,
    PriorityCategory,
    PriorityList,
    RiskList,
    RoadmapResponse,
    SignalMap,
    StrategicSummary,
    WorkspaceProfileSignal,
)
from .rules import compute_health_score, detect_priorities, generate_headline, generate_key_insight
from .priorities import build_priority_list
from .risks import build_risk_list
from .roadmap import build_roadmaps
from .context_pack import build_context_pack


# ── Signal collection ────────────────────────────────────────────────
# Each function below reads from the seed data store in development.
# In later phases, each collector will query its source engine's
# database tables or service layer.

from app.seed.data import (
    WORKSPACE,
    LEAD_SUMMARY,
    OPPORTUNITY_SUMMARY,
    INTEGRATION_SUMMARY,
)


def _collect_workspace_profile(workspace_id: str) -> WorkspaceProfileSignal:
    """Collect workspace profile from seed store."""
    ws = WORKSPACE
    return WorkspaceProfileSignal(
        company_name=ws["name"],
        industry=ws["industry"],
        country=ws["country"],
        city=ws["city"],
        team_size=ws["team_size"],
        website_url=ws["website_url"],
        goals=ws["goals"],
        setup_completed=ws["setup_completed"],
    )


def _collect_digital_presence(workspace_id: str) -> DigitalPresenceSignal:
    """Collect from Digital Presence Engine. Phase 8 will query real scores."""
    return DigitalPresenceSignal(
        score=52.0,
        website_performance=65.0,
        search_visibility=38.0,
        social_presence=55.0,
        reputation=60.0,
        conversion_readiness=42.0,
    )


def _collect_leads(workspace_id: str) -> LeadIntelligenceSignal:
    """Collect from seed data store."""
    s = LEAD_SUMMARY
    return LeadIntelligenceSignal(
        total_leads_30d=s["total_leads_30d"],
        qualified_leads_30d=s["qualified_leads_30d"],
        conversion_rate=s["conversion_rate"],
        top_source=s["top_source"],
        trend=s["trend"],
    )


def _collect_opportunities(workspace_id: str) -> OpportunitySignal:
    """Collect from seed data store."""
    s = OPPORTUNITY_SUMMARY
    return OpportunitySignal(
        total_detected=s["total_detected"],
        high_impact_count=s["high_impact_count"],
        categories=s["categories"],
        top_opportunity=s["top_opportunity"],
    )


def _collect_competitors(workspace_id: str) -> CompetitorSignal:
    """Collect from Competitor Intelligence Engine. Phase 12 will query real data."""
    return CompetitorSignal(
        tracked_count=len(WORKSPACE.get("competitor_urls", [])),
        avg_competitor_score=61.0,
        our_relative_position="behind",
    )


def _collect_industry(workspace_id: str) -> IndustrySignal:
    """Collect from Industry Intelligence Layer. Phase 8+ will be dynamic."""
    return IndustrySignal(
        industry=WORKSPACE["industry"],
        benchmark_conversion_rate=3.2,
        benchmark_digital_score=65.0,
        benchmark_lead_volume_30d=100,
    )


def _collect_integrations(workspace_id: str) -> IntegrationStatusSignal:
    """Collect from seed data store."""
    s = INTEGRATION_SUMMARY
    return IntegrationStatusSignal(
        total_available=s["total_available"],
        total_connected=s["total_connected"],
        critical_missing=s["critical_missing"],
    )


def _collect_finance(workspace_id: str) -> FinanceSummarySignal:
    """Placeholder – returns unavailable until Phase 16."""
    return FinanceSummarySignal(available=False)


def _collect_hr(workspace_id: str) -> HRSummarySignal:
    """Placeholder – returns unavailable until Phase 16."""
    return HRSummarySignal(available=False)


def _collect_operations(workspace_id: str) -> OperationsSummarySignal:
    """Placeholder – returns unavailable until Phase 16."""
    return OperationsSummarySignal(available=False)


def _collect_digital_twin(workspace_id: str) -> DigitalTwinSignal:
    """Placeholder – returns unavailable until Phase 18."""
    return DigitalTwinSignal(available=False)


# ── Aggregation ──────────────────────────────────────────────────────

def collect_signals(workspace_id: str) -> SignalMap:
    """
    Step 1: Aggregate all signals into a unified map.
    Each collector is independent and never fails the pipeline —
    if a source is unavailable it returns safe defaults.
    """
    return SignalMap(
        workspace=_collect_workspace_profile(workspace_id),
        digital_presence=_collect_digital_presence(workspace_id),
        leads=_collect_leads(workspace_id),
        opportunities=_collect_opportunities(workspace_id),
        competitors=_collect_competitors(workspace_id),
        industry=_collect_industry(workspace_id),
        integrations=_collect_integrations(workspace_id),
        finance=_collect_finance(workspace_id),
        hr=_collect_hr(workspace_id),
        operations=_collect_operations(workspace_id),
        digital_twin=_collect_digital_twin(workspace_id),
        collected_at=datetime.utcnow(),
    )


# ── Public API ───────────────────────────────────────────────────────

def get_strategic_summary(workspace_id: str) -> StrategicSummary:
    """Full strategic summary for the workspace."""
    signals = collect_signals(workspace_id)
    health = compute_health_score(signals)
    priorities = detect_priorities(signals, health)

    return StrategicSummary(
        workspace_id=workspace_id,
        company_name=signals.workspace.company_name,
        health_score=health,
        headline=generate_headline(health, signals),
        key_insight=generate_key_insight(health, priorities, signals),
        signal_map=signals,
        generated_at=datetime.utcnow(),
    )


def get_priorities(
    workspace_id: str,
    category: PriorityCategory | None = None,
) -> PriorityList:
    """Ranked priorities for the workspace."""
    signals = collect_signals(workspace_id)
    health = compute_health_score(signals)
    return build_priority_list(
        workspace_id, signals, health, category_filter=category,
    )


def get_roadmaps(workspace_id: str) -> RoadmapResponse:
    """30/60/90 day roadmaps for the workspace."""
    signals = collect_signals(workspace_id)
    health = compute_health_score(signals)
    priorities = detect_priorities(signals, health)
    return build_roadmaps(workspace_id, priorities, signals, health)


def get_risks(workspace_id: str) -> RiskList:
    """Active risk alerts for the workspace."""
    signals = collect_signals(workspace_id)
    health = compute_health_score(signals)
    return build_risk_list(workspace_id, signals, health)


def get_context_pack(workspace_id: str) -> ContextPack:
    """Compressed context for AI layer (Ask AEOS, Executive Briefing)."""
    signals = collect_signals(workspace_id)
    health = compute_health_score(signals)
    priorities = detect_priorities(signals, health)
    from .rules import detect_risks as _detect_risks
    risks = _detect_risks(signals, health)
    return build_context_pack(workspace_id, signals, health, priorities, risks)
