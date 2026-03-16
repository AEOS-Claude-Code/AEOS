"""
AEOS – Opportunity Intelligence Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class OpportunityResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    impact: str
    impact_score: int
    effort_score: int
    recommended_action: str
    status: str
    detected_at: str


class OpportunityRadarResponse(BaseModel):
    workspace_id: str
    total_detected: int
    high_impact_count: int
    opportunities: list[OpportunityResponse]


class TopOpportunityResponse(BaseModel):
    id: str
    title: str
    category: str
    impact: str
    impact_score: int
    effort_score: int
    recommended_action: str
