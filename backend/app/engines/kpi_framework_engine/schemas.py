"""
AEOS – KPI Framework Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class KPIItem(BaseModel):
    id: str
    name: str
    description: str
    category: str  # company | department | digital | financial
    department: str = ""  # Which department this belongs to
    target: str = ""  # Target value description
    current_value: str = ""  # Current estimated value
    unit: str = ""  # %, $, count, score, days
    frequency: str = "monthly"  # daily | weekly | monthly | quarterly
    priority: str = "medium"  # critical | high | medium | low
    status: str = "not_tracked"  # on_track | at_risk | off_track | not_tracked
    data_source: str = ""  # Where this data comes from


class ReviewCadence(BaseModel):
    daily: list[str] = []
    weekly: list[str] = []
    monthly: list[str] = []
    quarterly: list[str] = []


class KPIFrameworkResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    overall_kpi_score: float
    total_kpis: int
    tracked_kpis: int
    company_kpis: list[KPIItem]
    department_kpis: list[KPIItem]
    digital_kpis: list[KPIItem]
    financial_kpis: list[KPIItem]
    review_cadence: ReviewCadence
    computed_at: Optional[str] = None


class ComputeResponse(BaseModel):
    report_id: str
    status: str
    message: str
