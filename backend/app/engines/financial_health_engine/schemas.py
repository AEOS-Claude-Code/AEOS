"""
AEOS – Financial Health Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class RevenueModel(BaseModel):
    estimated_annual_revenue: float = 0
    revenue_per_employee: float = 0
    industry_avg_revenue_per_employee: float = 0
    revenue_label: str = ""
    revenue_trend: str = "stable"  # growing | stable | declining


class CostStructure(BaseModel):
    estimated_annual_costs: float = 0
    cost_to_revenue_ratio: float = 0
    major_cost_categories: list[dict] = []
    optimization_potential: float = 0


class GrowthLever(BaseModel):
    title: str
    description: str
    estimated_impact_pct: float = 0
    effort: str = "medium"  # easy | medium | hard
    category: str = ""


class FinancialRisk(BaseModel):
    title: str
    description: str
    severity: str = "medium"  # high | medium | low
    likelihood: str = "medium"
    mitigation: str = ""


class YearProjection(BaseModel):
    year: int
    revenue: float
    costs: float
    profit: float
    growth_rate: float


class FinancialHealthResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    overall_score: float
    revenue_potential_score: float
    cost_efficiency_score: float
    growth_readiness_score: float
    risk_exposure_score: float
    investment_readiness_score: float
    revenue_model: RevenueModel
    cost_structure: CostStructure
    growth_levers: list[GrowthLever]
    financial_risks: list[FinancialRisk]
    recommendations: list[dict]
    projections: list[YearProjection]
    computed_at: Optional[str] = None


class ComputeResponse(BaseModel):
    report_id: str
    status: str
    message: str
