"""
AEOS – Lead Intelligence Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class LeadResponse(BaseModel):
    id: str
    name: str
    email: str
    company: str
    source: str
    channel: str
    status: str
    score: int
    classification: str
    landing_page: str
    created_at: str


class LeadSourceStat(BaseModel):
    source: str
    count: int
    avg_score: float


class LeadSummaryResponse(BaseModel):
    workspace_id: str
    total_leads_30d: int
    qualified_leads_30d: int
    conversion_rate: float
    top_source: str
    trend: str
    by_source: list[LeadSourceStat]
    by_status: dict[str, int]
    by_classification: dict[str, int]


class LeadListResponse(BaseModel):
    workspace_id: str
    leads: list[LeadResponse]
    total: int
