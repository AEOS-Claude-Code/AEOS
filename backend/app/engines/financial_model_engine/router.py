"""
AEOS – Financial Model Engine: API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import *
from .service import get_or_compute, generate_financial_model

router = APIRouter(prefix="/v1/financial-model", tags=["Financial Model Engine"])


def _fmt(dt) -> str | None:
    return dt.isoformat() if dt else None


def _to_response(m) -> FinancialModelResponse:
    ea = m.ebitda_analysis or {}
    be = m.break_even_analysis or {}
    fr = m.funding_requirements or {}
    ass = m.assumptions or {}

    return FinancialModelResponse(
        id=m.id, workspace_id=m.workspace_id, status=m.status, version=m.version or 1,
        year1_revenue=m.year1_revenue or 0, year5_revenue=m.year5_revenue or 0,
        break_even_month=m.break_even_month or 0, year3_ebitda_margin=m.year3_ebitda_margin or 0,
        yearly_projections=[YearlyProjection(**y) for y in (m.yearly_projections or [])],
        monthly_cashflow=[MonthlyCashflow(**c) for c in (m.monthly_cashflow or [])[:24]],
        revenue_streams=[RevenueStream(**r) for r in (m.revenue_streams or [])],
        cost_breakdown=[CostCategory(**c) for c in (m.cost_breakdown or [])],
        ebitda_analysis=EBITDAAnalysis(**ea) if ea else EBITDAAnalysis(year1_ebitda=0, year3_ebitda=0, year5_ebitda=0, year1_margin=0, year3_margin=0, year5_margin=0, trend="stable"),
        break_even_analysis=BreakEvenAnalysis(**be) if be else BreakEvenAnalysis(break_even_month=0, break_even_revenue=0, monthly_fixed_costs=0, contribution_margin=0, status="not_projected"),
        funding_requirements=FundingRequirements(**fr) if fr else FundingRequirements(total_needed=0, runway_months=0, use_of_funds=[], recommended_round="bootstrapped", valuation_range=""),
        assumptions=ModelAssumptions(**ass) if ass else ModelAssumptions(base_growth_rate=0, cost_reduction_from_ai=0, headcount_growth_rate=0, avg_revenue_per_employee=0, industry_growth_rate=0),
        scenarios=[ScenarioProjection(**s) for s in (m.scenarios or [])],
        computed_at=_fmt(m.computed_at),
    )


@router.get("/latest", response_model=FinancialModelResponse)
async def get_latest(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    model = await get_or_compute(db, membership.workspace_id)
    await db.commit()
    return _to_response(model)


@router.post("/generate", response_model=ComputeResponse)
async def regenerate(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    model = await generate_financial_model(db, membership.workspace_id)
    await db.commit()
    return ComputeResponse(
        model_id=model.id, status=model.status,
        message=f"Financial model v{model.version}: Y1 ${model.year1_revenue:,.0f} → Y5 ${model.year5_revenue:,.0f}",
    )
