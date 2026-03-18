"""
AEOS – Financial Model Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class YearlyProjection(BaseModel):
    year: int
    revenue: float
    cogs: float  # Cost of goods sold
    gross_profit: float
    operating_expenses: float
    ebitda: float
    ebitda_margin: float  # %
    net_income: float
    headcount: int
    revenue_growth: float  # % YoY


class MonthlyCashflow(BaseModel):
    month: int
    revenue: float
    expenses: float
    net_cashflow: float
    cumulative_cashflow: float


class RevenueStream(BaseModel):
    name: str
    year1: float
    year3: float
    year5: float
    growth_rate: float
    pct_of_total: float


class CostCategory(BaseModel):
    name: str
    year1: float
    year3: float
    year5: float
    pct_of_revenue: float


class EBITDAAnalysis(BaseModel):
    year1_ebitda: float
    year3_ebitda: float
    year5_ebitda: float
    year1_margin: float
    year3_margin: float
    year5_margin: float
    trend: str  # improving | stable | declining


class BreakEvenAnalysis(BaseModel):
    break_even_month: int
    break_even_revenue: float
    monthly_fixed_costs: float
    contribution_margin: float
    status: str  # achieved | projected | not_projected


class FundingRequirements(BaseModel):
    total_needed: float
    runway_months: int
    use_of_funds: list[dict]
    recommended_round: str  # seed | series_a | series_b | bootstrapped
    valuation_range: str


class ScenarioProjection(BaseModel):
    label: str  # Base | Optimistic | Pessimistic
    year3_revenue: float
    year3_ebitda: float
    year5_revenue: float
    year5_ebitda: float


class ModelAssumptions(BaseModel):
    base_growth_rate: float
    cost_reduction_from_ai: float
    headcount_growth_rate: float
    avg_revenue_per_employee: float
    industry_growth_rate: float


class FinancialModelResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    version: int
    year1_revenue: float
    year5_revenue: float
    break_even_month: int
    year3_ebitda_margin: float
    yearly_projections: list[YearlyProjection]
    monthly_cashflow: list[MonthlyCashflow]
    revenue_streams: list[RevenueStream]
    cost_breakdown: list[CostCategory]
    ebitda_analysis: EBITDAAnalysis
    break_even_analysis: BreakEvenAnalysis
    funding_requirements: FundingRequirements
    assumptions: ModelAssumptions
    scenarios: list[ScenarioProjection]
    computed_at: Optional[str] = None


class ComputeResponse(BaseModel):
    model_id: str
    status: str
    message: str
