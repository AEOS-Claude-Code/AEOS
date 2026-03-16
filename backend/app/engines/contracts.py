"""
AEOS – Shared engine contracts.

Canonical data shapes that flow between engines and into the copilot/dashboard.
All engines should emit these types. Consumers should depend only on these.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Company Scan ─────────────────────────────────────────────────────

class CompanyScanResult(BaseModel):
    """Canonical company scan output consumed by SIE and Copilot."""
    workspace_id: str
    website_url: str
    status: str
    seo_score: int = 0
    social_presence: dict[str, bool] = Field(default_factory=dict)
    tech_stack: list[str] = Field(default_factory=list)
    pages_detected: int = 0
    internal_links_count: int = 0
    detected_keywords: list[str] = Field(default_factory=list)
    scan_summary: str = ""
    share_token: str = ""


# ── Lead Summary ─────────────────────────────────────────────────────

class LeadSourceStat(BaseModel):
    source: str
    count: int
    avg_score: float = 0.0


class LeadSummaryResult(BaseModel):
    """Canonical lead summary consumed by SIE and Copilot."""
    workspace_id: str
    total_leads_30d: int = 0
    qualified_leads_30d: int = 0
    conversion_rate: float = 0.0
    top_source: str = "none"
    trend: str = "stable"
    by_source: list[LeadSourceStat] = Field(default_factory=list)
    by_status: dict[str, int] = Field(default_factory=dict)
    by_classification: dict[str, int] = Field(default_factory=dict)


# ── Opportunity Item ─────────────────────────────────────────────────

class OpportunityItem(BaseModel):
    """Canonical opportunity consumed by SIE and Copilot."""
    id: str
    title: str
    description: str = ""
    category: str
    impact: str  # high | medium | low
    impact_score: int = 50
    effort_score: int = 50
    recommended_action: str = ""
    status: str = "detected"


class OpportunityRadarResult(BaseModel):
    """Canonical opportunity radar output."""
    workspace_id: str
    total_detected: int = 0
    high_impact_count: int = 0
    opportunities: list[OpportunityItem] = Field(default_factory=list)


# ── Strategy Summary ─────────────────────────────────────────────────

class HealthScoreResult(BaseModel):
    """Canonical health score."""
    overall: float = 0.0
    digital_presence: float = 0.0
    lead_generation: float = 0.0
    competitive_position: float = 0.0
    integration_coverage: float = 0.0
    setup_completeness: float = 0.0


class StrategySummaryResult(BaseModel):
    """Canonical strategy summary consumed by dashboard and copilot."""
    workspace_id: str
    company_name: str = ""
    health_score: HealthScoreResult = Field(default_factory=HealthScoreResult)
    headline: str = ""
    key_insight: str = ""


# ── Domain Event ─────────────────────────────────────────────────────

class EngineEvent(BaseModel):
    """
    Lightweight domain event emitted when an engine completes work.

    event_type values should use constants from app.core.events.EventType:
      EventType.COMPANY_SCAN_COMPLETED, EventType.LEAD_CREATED,
      EventType.OPPORTUNITY_DETECTED, EventType.STRATEGY_GENERATED,
      EventType.COPILOT_ANSWERED, etc.

    Legacy string values (scan_completed, leads_seeded, copilot_answered)
    are still supported during transition.
    """
    event_type: str  # scan_completed | leads_seeded | opportunities_detected | strategy_computed | copilot_answered
    workspace_id: str
    engine: str
    payload: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
