"""
AEOS – Gap Analysis Engine: API router.

GET  /v1/gap-analysis/latest
POST /v1/gap-analysis/compute
GET  /v1/gap-analysis/recommendations
PUT  /v1/workspace/role-assignments
GET  /v1/workspace/role-assignments
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import (
    OrgGapAnalysisResponse,
    GapAnalysisTriggerResponse,
    RoleAssignmentPayload,
)
from .service import (
    get_or_compute,
    compute_gap_analysis,
    get_latest_report,
    get_role_assignments,
    save_role_assignments,
)

logger = logging.getLogger("aeos.engine.gap_analysis.router")

router = APIRouter(tags=["Gap Analysis Engine"])


def _format_dt(dt) -> str | None:
    return dt.isoformat() if dt else None


# ── Gap Analysis endpoints ───────────────────────────────────────

@router.get("/v1/gap-analysis/latest", response_model=OrgGapAnalysisResponse)
async def get_gap_analysis_latest(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get latest gap analysis report (auto-computes if none exists)."""
    report = await get_or_compute(db, membership.workspace_id)
    await db.commit()

    return OrgGapAnalysisResponse(
        id=report.id,
        workspace_id=report.workspace_id,
        status=report.status,
        overall_gap_score=report.overall_gap_score,
        department_coverage_score=report.department_coverage_score,
        role_coverage_score=report.role_coverage_score,
        leadership_gap_score=report.leadership_gap_score,
        critical_function_score=report.critical_function_score,
        operational_maturity_score=report.operational_maturity_score,
        gap_breakdown=report.gap_breakdown or [],
        recommendations=report.recommendations or [],
        ideal_org_summary=report.ideal_org_summary or {},
        computed_at=_format_dt(report.computed_at),
        created_at=_format_dt(report.created_at),
    )


@router.post("/v1/gap-analysis/compute", response_model=GapAnalysisTriggerResponse)
async def trigger_gap_analysis(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Force recomputation of gap analysis."""
    report = await compute_gap_analysis(db, membership.workspace_id)
    await db.commit()

    return GapAnalysisTriggerResponse(
        report_id=report.id,
        status=report.status,
        message=f"Gap analysis computed. Score: {report.overall_gap_score:.1f}/100",
    )


@router.get("/v1/gap-analysis/recommendations")
async def get_gap_recommendations(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get recommendations from latest gap analysis."""
    report = await get_latest_report(db, membership.workspace_id)
    if not report:
        return {"recommendations": [], "overall_gap_score": 0}

    return {
        "recommendations": report.recommendations or [],
        "overall_gap_score": report.overall_gap_score,
    }


# ── Role Assignments endpoints ───────────────────────────────────

@router.put("/v1/workspace/role-assignments")
async def update_role_assignments(
    body: RoleAssignmentPayload,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Save human/AI role assignments for the workspace."""
    assignment = await save_role_assignments(db, membership.workspace_id, body.role_map)
    await db.commit()
    return {"status": "saved", "roles_count": len(body.role_map)}


@router.get("/v1/workspace/role-assignments")
async def get_role_assignments_endpoint(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get stored role assignments."""
    role_map = await get_role_assignments(db, membership.workspace_id)
    return {"role_map": role_map}
