"""
AEOS – KPI Framework Engine: API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import KPIFrameworkResponse, KPIItem, ReviewCadence, ComputeResponse
from .service import get_or_compute, compute_kpi_framework

router = APIRouter(prefix="/v1/kpi-framework", tags=["KPI Framework Engine"])


def _fmt(dt) -> str | None:
    return dt.isoformat() if dt else None


def _to_response(fw) -> KPIFrameworkResponse:
    cadence = fw.review_cadence or {}
    return KPIFrameworkResponse(
        id=fw.id, workspace_id=fw.workspace_id, status=fw.status,
        overall_kpi_score=fw.overall_kpi_score or 0,
        total_kpis=int(fw.total_kpis or 0),
        tracked_kpis=int(fw.tracked_kpis or 0),
        company_kpis=[KPIItem(**k) for k in (fw.company_kpis or [])],
        department_kpis=[KPIItem(**k) for k in (fw.department_kpis or [])],
        digital_kpis=[KPIItem(**k) for k in (fw.digital_kpis or [])],
        financial_kpis=[KPIItem(**k) for k in (fw.financial_kpis or [])],
        review_cadence=ReviewCadence(**cadence) if cadence else ReviewCadence(),
        computed_at=_fmt(fw.computed_at),
    )


@router.get("/latest", response_model=KPIFrameworkResponse)
async def get_latest(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    fw = await get_or_compute(db, membership.workspace_id)
    await db.commit()
    return _to_response(fw)


@router.post("/compute", response_model=ComputeResponse)
async def recompute(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    fw = await compute_kpi_framework(db, membership.workspace_id)
    await db.commit()
    return ComputeResponse(
        report_id=fw.id, status=fw.status,
        message=f"KPI framework: {int(fw.total_kpis)} KPIs, {int(fw.tracked_kpis)} tracked",
    )
