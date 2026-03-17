"""
AEOS – Digital Presence Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ScoreBreakdownItem(BaseModel):
    category: str
    score: float
    weight: float
    label: str
    explanation: str
    items: list[dict] = []


class Recommendation(BaseModel):
    priority: int
    category: str
    title: str
    description: str
    impact: str  # high / medium / low
    effort: str  # easy / medium / hard


class DigitalPresenceReportResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    overall_score: float
    website_performance: float
    search_visibility: float
    social_presence: float
    reputation: float
    conversion_readiness: float
    score_breakdown: list[ScoreBreakdownItem] = []
    recommendations: list[Recommendation] = []
    data_sources: list[str] = []
    computed_at: Optional[str] = None
    created_at: str


class DigitalPresenceHistoryItem(BaseModel):
    date: str
    overall_score: float
    website_performance: float
    search_visibility: float
    social_presence: float
    reputation: float
    conversion_readiness: float


class DigitalPresenceHistoryResponse(BaseModel):
    snapshots: list[DigitalPresenceHistoryItem] = []
    trend: str  # "improving" / "declining" / "stable" / "insufficient_data"
    change_30d: Optional[float] = None


class DigitalPresenceTriggerResponse(BaseModel):
    report_id: str
    status: str
    message: str
