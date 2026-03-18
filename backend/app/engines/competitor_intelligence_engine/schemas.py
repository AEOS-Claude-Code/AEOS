"""
AEOS – Competitor Intelligence Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class CompetitorItem(BaseModel):
    id: str
    url: str
    name: str
    status: str
    seo_score: float = 0
    performance_score: float = 0
    security_score: float = 0
    overall_score: float = 0
    tech_stack: list[str] = []
    social_presence: dict = {}
    keywords: list[str] = []
    last_scanned_at: Optional[str] = None


class DimensionScore(BaseModel):
    dimension: str
    label: str
    weight: float
    client_score: float
    competitor_avg: float
    gap: float  # positive = client ahead


class StrategicInsight(BaseModel):
    category: str
    title: str
    description: str
    impact: str = "medium"  # high | medium | low


class CompetitorSummary(BaseModel):
    id: str
    name: str
    url: str
    overall_score: float
    vs_client: float  # client_score - competitor_score


class CompetitorReportResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    overall_positioning: float
    dimension_scores: list[DimensionScore]
    strengths: list[StrategicInsight]
    weaknesses: list[StrategicInsight]
    opportunities: list[StrategicInsight]
    competitor_summary: list[CompetitorSummary]
    competitors_scanned: int
    computed_at: Optional[str] = None


class ScanResponse(BaseModel):
    status: str
    competitors_queued: int
    message: str


class AddCompetitorRequest(BaseModel):
    url: str
