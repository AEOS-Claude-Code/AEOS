"""
AEOS – Gap Analysis Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class GapDepartmentDetail(BaseModel):
    department_id: str
    department_name: str
    icon: str = ""
    status: str  # "fully_staffed" | "partially_staffed" | "ai_only" | "missing"
    gap_severity: str  # "none" | "low" | "medium" | "high" | "critical"
    has_human_head: bool = False
    total_ideal_roles: int = 0
    human_filled_roles: int = 0
    ai_filled_roles: int = 0
    missing_roles: list[str] = []
    human_roles: list[str] = []
    ai_roles: list[str] = []


class GapRecommendation(BaseModel):
    priority: int
    category: str  # department_id or "general"
    title: str
    description: str
    impact: str  # "high" | "medium" | "low"
    effort: str  # "easy" | "medium" | "hard"


class OrgGapAnalysisResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    overall_gap_score: float
    department_coverage_score: float
    role_coverage_score: float
    leadership_gap_score: float
    critical_function_score: float
    operational_maturity_score: float
    gap_breakdown: list[GapDepartmentDetail]
    recommendations: list[GapRecommendation]
    ideal_org_summary: dict = {}
    computed_at: Optional[str] = None
    created_at: str = ""


class GapAnalysisTriggerResponse(BaseModel):
    report_id: str
    status: str
    message: str


class RoleAssignmentPayload(BaseModel):
    role_map: dict[str, bool] = {}
