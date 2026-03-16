"""
AEOS – Strategic Intelligence Engine: Context pack builder.

Compresses the full signal map + priorities + risks into a compact
representation suitable for AI consumption.

Design goals:
  - Stay under ~1200 tokens when JSON-serialized
  - Include only what an AI narrator or Ask AEOS needs
  - Never send raw large datasets
  - Deterministic: same inputs → same pack
"""

from __future__ import annotations

from datetime import datetime

from .schemas import (
    ContextPack,
    HealthScore,
    Priority,
    RiskAlert,
    SignalMap,
)


def build_context_pack(
    workspace_id: str,
    signals: SignalMap,
    health: HealthScore,
    priorities: list[Priority],
    risks: list[RiskAlert],
) -> ContextPack:
    """
    Build a compressed context pack for the AI layer.

    This is the ONLY object that should be sent to Claude.
    Everything upstream is deterministic aggregation.
    """
    # Top 5 priority titles (no descriptions – those are verbose)
    top_priorities = [p.title for p in priorities[:5]]

    # Top 3 risk titles
    active_risks = [r.title for r in risks[:3]]

    # Flat key metrics dict — compact, no nesting
    key_metrics: dict[str, float] = {
        "health_score": health.overall,
        "digital_presence_score": health.digital_presence,
        "lead_generation_score": health.lead_generation,
        "competitive_position_score": health.competitive_position,
        "integration_coverage_score": health.integration_coverage,
        "setup_completeness_score": health.setup_completeness,
        "leads_30d": float(signals.leads.total_leads_30d),
        "qualified_leads_30d": float(signals.leads.qualified_leads_30d),
        "conversion_rate_pct": signals.leads.conversion_rate,
        "opportunities_detected": float(signals.opportunities.total_detected),
        "high_impact_opportunities": float(signals.opportunities.high_impact_count),
        "competitors_tracked": float(signals.competitors.tracked_count),
        "integrations_connected": float(signals.integrations.total_connected),
    }

    return ContextPack(
        workspace_id=workspace_id,
        company_name=signals.workspace.company_name or "Unknown",
        industry=signals.workspace.industry,
        health_score=health.overall,
        top_priorities=top_priorities,
        active_risks=active_risks,
        key_metrics=key_metrics,
        generated_at=datetime.utcnow(),
    )
