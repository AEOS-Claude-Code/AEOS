"""
AEOS – Financial Health Engine: API router.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import (
    FinancialHealthResponse, RevenueModel, CostStructure,
    GrowthLever, FinancialRisk, YearProjection, ComputeResponse,
)
from .service import get_or_compute, compute_financial_health

logger = logging.getLogger("aeos.engine.financial_health.router")

router = APIRouter(prefix="/v1/financial-health", tags=["Financial Health Engine"])


def _fmt(dt) -> str | None:
    return dt.isoformat() if dt else None


def _to_response(r) -> FinancialHealthResponse:
    rev = r.revenue_model or {}
    cost = r.cost_structure or {}
    return FinancialHealthResponse(
        id=r.id, workspace_id=r.workspace_id, status=r.status,
        overall_score=r.overall_score,
        revenue_potential_score=r.revenue_potential_score,
        cost_efficiency_score=r.cost_efficiency_score,
        growth_readiness_score=r.growth_readiness_score,
        risk_exposure_score=r.risk_exposure_score,
        investment_readiness_score=r.investment_readiness_score,
        revenue_model=RevenueModel(**rev) if rev else RevenueModel(),
        cost_structure=CostStructure(**cost) if cost else CostStructure(),
        growth_levers=[GrowthLever(**g) for g in (r.growth_levers or [])],
        financial_risks=[FinancialRisk(**f) for f in (r.financial_risks or [])],
        recommendations=r.recommendations or [],
        projections=[YearProjection(**p) for p in (r.projections or [])],
        computed_at=_fmt(r.computed_at),
    )


@router.get("/latest", response_model=FinancialHealthResponse)
async def get_latest(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    report = await get_or_compute(db, membership.workspace_id)
    await db.commit()
    return _to_response(report)


@router.post("/compute", response_model=ComputeResponse)
async def recompute(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    report = await compute_financial_health(db, membership.workspace_id)
    await db.commit()
    return ComputeResponse(
        report_id=report.id, status=report.status,
        message=f"Financial health score: {report.overall_score:.0f}/100",
    )
