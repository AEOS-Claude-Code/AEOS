"""
AEOS – Digital Presence Engine: API router.

Phase 8: Endpoints for digital presence scoring, history, and recommendations.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_workspace
from .schemas import (
    DigitalPresenceReportResponse,
    DigitalPresenceHistoryResponse,
    DigitalPresenceTriggerResponse,
)
from . import service

router = APIRouter(prefix="/v1/digital-presence", tags=["Digital Presence Engine"])


def _build_report_response(report) -> dict:
    return {
        "id": report.id,
        "workspace_id": report.workspace_id,
        "status": report.status,
        "overall_score": report.overall_score,
        "website_performance": report.website_performance,
        "search_visibility": report.search_visibility,
        "social_presence": report.social_presence,
        "reputation": report.reputation,
        "conversion_readiness": report.conversion_readiness,
        "score_breakdown": report.score_breakdown or [],
        "recommendations": report.recommendations or [],
        "data_sources": report.data_sources or [],
        "computed_at": report.computed_at.isoformat() if report.computed_at else None,
        "created_at": report.created_at.isoformat(),
    }


@router.get("/latest", response_model=DigitalPresenceReportResponse)
async def get_latest(
    user=Depends(get_current_user),
    workspace=Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Get latest digital presence report, computing one if none exists."""
    report = await service.get_or_compute(db, workspace.id)
    await db.commit()
    return _build_report_response(report)


@router.post("/compute", response_model=DigitalPresenceTriggerResponse)
async def trigger_compute(
    user=Depends(get_current_user),
    workspace=Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Force a new digital presence computation."""
    report = await service.compute_digital_presence(db, workspace.id)
    await db.commit()
    return {
        "report_id": report.id,
        "status": report.status,
        "message": "Digital presence score computed successfully."
        if report.status == "completed"
        else "Computation failed. Please try again.",
    }


@router.get("/history", response_model=DigitalPresenceHistoryResponse)
async def get_history(
    days: int = Query(default=90, ge=7, le=365),
    user=Depends(get_current_user),
    workspace=Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Get score history snapshots for trend analysis."""
    return await service.get_history(db, workspace.id, days)


@router.get("/recommendations")
async def get_recommendations(
    user=Depends(get_current_user),
    workspace=Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Get recommendations from the latest report."""
    report = await service.get_latest_report(db, workspace.id)
    if not report:
        return {"recommendations": [], "overall_score": 0}
    return {
        "recommendations": report.recommendations or [],
        "overall_score": report.overall_score,
    }
