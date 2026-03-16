"""
AEOS – Strategic Intelligence Engine: Pydantic schemas.

These models define the API contract.  Every field has a concrete type
so the OpenAPI spec is self-documenting.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────

class PriorityCategory(str, Enum):
    marketing = "marketing"
    operations = "operations"
    hr = "hr"
    finance = "finance"
    growth = "growth"
    technology = "technology"


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RoadmapHorizon(int, Enum):
    days_30 = 30
    days_60 = 60
    days_90 = 90


class InitiativeStatus(str, Enum):
    suggested = "suggested"
    approved = "approved"
    scheduled = "scheduled"
    active = "active"
    completed = "completed"
    dismissed = "dismissed"


# ── Signal inputs (what each source engine provides) ─────────────────

class DigitalPresenceSignal(BaseModel):
    score: float = Field(0.0, ge=0, le=100, description="Overall digital presence score 0-100")
    website_performance: float = Field(0.0, ge=0, le=100)
    search_visibility: float = Field(0.0, ge=0, le=100)
    social_presence: float = Field(0.0, ge=0, le=100)
    reputation: float = Field(0.0, ge=0, le=100)
    conversion_readiness: float = Field(0.0, ge=0, le=100)


class LeadIntelligenceSignal(BaseModel):
    total_leads_30d: int = 0
    qualified_leads_30d: int = 0
    conversion_rate: float = Field(0.0, ge=0, le=100, description="Percent")
    top_source: str = "unknown"
    trend: str = Field("stable", description="rising | stable | declining")


class OpportunitySignal(BaseModel):
    total_detected: int = 0
    high_impact_count: int = 0
    categories: list[str] = Field(default_factory=list)
    top_opportunity: str = ""


class CompetitorSignal(BaseModel):
    tracked_count: int = 0
    avg_competitor_score: float = 0.0
    our_relative_position: str = Field("unknown", description="ahead | par | behind")


class IndustrySignal(BaseModel):
    industry: str = "general"
    benchmark_conversion_rate: float = 3.0
    benchmark_digital_score: float = 60.0
    benchmark_lead_volume_30d: int = 50


class IntegrationStatusSignal(BaseModel):
    total_available: int = 0
    total_connected: int = 0
    critical_missing: list[str] = Field(default_factory=list)


class WorkspaceProfileSignal(BaseModel):
    company_name: str = ""
    industry: str = "general"
    country: str = ""
    city: str = ""
    team_size: int = 1
    website_url: str = ""
    goals: list[str] = Field(default_factory=list)
    setup_completed: bool = False


# ── Future placeholder signals ───────────────────────────────────────

class FinanceSummarySignal(BaseModel):
    """Placeholder – Phase 16."""
    available: bool = False
    monthly_revenue: Optional[float] = None
    monthly_expenses: Optional[float] = None
    runway_months: Optional[int] = None


class HRSummarySignal(BaseModel):
    """Placeholder – Phase 16."""
    available: bool = False
    headcount: Optional[int] = None
    open_positions: Optional[int] = None
    attrition_rate: Optional[float] = None


class OperationsSummarySignal(BaseModel):
    """Placeholder – Phase 16."""
    available: bool = False
    active_workflows: Optional[int] = None
    bottleneck_count: Optional[int] = None
    efficiency_score: Optional[float] = None


class DigitalTwinSignal(BaseModel):
    """Placeholder – Phase 18."""
    available: bool = False
    simulation_ready: bool = False


# ── Aggregated signal map ────────────────────────────────────────────

class SignalMap(BaseModel):
    """Everything the SIE knows about a workspace right now."""
    workspace: WorkspaceProfileSignal = Field(default_factory=WorkspaceProfileSignal)
    digital_presence: DigitalPresenceSignal = Field(default_factory=DigitalPresenceSignal)
    leads: LeadIntelligenceSignal = Field(default_factory=LeadIntelligenceSignal)
    opportunities: OpportunitySignal = Field(default_factory=OpportunitySignal)
    competitors: CompetitorSignal = Field(default_factory=CompetitorSignal)
    industry: IndustrySignal = Field(default_factory=IndustrySignal)
    integrations: IntegrationStatusSignal = Field(default_factory=IntegrationStatusSignal)
    # Future
    finance: FinanceSummarySignal = Field(default_factory=FinanceSummarySignal)
    hr: HRSummarySignal = Field(default_factory=HRSummarySignal)
    operations: OperationsSummarySignal = Field(default_factory=OperationsSummarySignal)
    digital_twin: DigitalTwinSignal = Field(default_factory=DigitalTwinSignal)
    collected_at: datetime = Field(default_factory=datetime.utcnow)


# ── Output schemas (API responses) ──────────────────────────────────

class HealthScore(BaseModel):
    overall: float = Field(..., ge=0, le=100)
    digital_presence: float = Field(..., ge=0, le=100)
    lead_generation: float = Field(..., ge=0, le=100)
    competitive_position: float = Field(..., ge=0, le=100)
    integration_coverage: float = Field(..., ge=0, le=100)
    setup_completeness: float = Field(..., ge=0, le=100)


class StrategicSummary(BaseModel):
    workspace_id: str
    company_name: str
    health_score: HealthScore
    headline: str = Field(..., description="One-sentence strategic headline")
    key_insight: str = Field(..., description="Most important finding")
    signal_map: SignalMap
    generated_at: datetime


class Priority(BaseModel):
    rank: int
    category: PriorityCategory
    title: str
    description: str
    impact_score: float = Field(..., ge=0, le=100)
    effort_score: float = Field(..., ge=0, le=100, description="Lower = easier")
    source_engine: str
    status: InitiativeStatus = InitiativeStatus.suggested


class PriorityList(BaseModel):
    workspace_id: str
    priorities: list[Priority]
    generated_at: datetime


class RoadmapAction(BaseModel):
    week: int = Field(..., description="Target week number within horizon")
    action: str
    department: str
    expected_outcome: str
    priority_rank: Optional[int] = None


class Roadmap(BaseModel):
    workspace_id: str
    horizon_days: int
    goals: list[str]
    actions: list[RoadmapAction]
    narrative: str = Field("", description="AI-generated narrative (future)")
    generated_at: datetime


class RoadmapResponse(BaseModel):
    workspace_id: str
    roadmaps: dict[str, Roadmap] = Field(
        ..., description="Keys: '30', '60', '90'"
    )
    generated_at: datetime


class RiskAlert(BaseModel):
    id: str
    severity: Severity
    category: str
    title: str
    description: str
    source_engine: str
    recommended_action: str
    acknowledged: bool = False


class RiskList(BaseModel):
    workspace_id: str
    risks: list[RiskAlert]
    generated_at: datetime


# ── Context pack (for Ask AEOS / AI narrator) ───────────────────────

class ContextPack(BaseModel):
    """
    Compressed business context for AI consumption.
    Designed to stay under ~1200 tokens when serialized.
    """
    workspace_id: str
    company_name: str
    industry: str
    health_score: float
    top_priorities: list[str] = Field(
        ..., max_length=5, description="Top 5 priority titles"
    )
    active_risks: list[str] = Field(
        ..., max_length=3, description="Top 3 risk titles"
    )
    key_metrics: dict[str, float] = Field(
        default_factory=dict,
        description="Flat dict of metric_name: value",
    )
    generated_at: datetime
