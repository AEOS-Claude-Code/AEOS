"""
AEOS – Competitor Intelligence Engine: API router.

POST /v1/competitors/scan
GET  /v1/competitors/list
GET  /v1/competitors/report
POST /v1/competitors/add
GET  /v1/competitors/{competitor_id}
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import (
    CompetitorItem,
    CompetitorReportResponse,
    DimensionScore,
    StrategicInsight,
    CompetitorSummary,
    ScanResponse,
    AddCompetitorRequest,
)
from .service import (
    get_competitors,
    add_competitor,
    scan_and_report,
    get_latest_report,
    scan_all_competitors,
)

logger = logging.getLogger("aeos.engine.competitor.router")

router = APIRouter(prefix="/v1/competitors", tags=["Competitor Intelligence Engine"])


def _format_dt(dt) -> str | None:
    return dt.isoformat() if dt else None


@router.post("/scan", response_model=ScanResponse)
async def trigger_scan(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Scan all competitors and generate a positioning report."""
    try:
        report = await scan_and_report(db, membership.workspace_id)
        await db.commit()
        return ScanResponse(
            status="completed",
            competitors_queued=report.competitors_scanned,
            message=f"Scanned {report.competitors_scanned} competitors. Positioning: {report.overall_positioning:.0f}/100",
        )
    except Exception as e:
        logger.exception("Competitor scan failed: %s", e)
        raise HTTPException(status_code=500, detail="Competitor scan failed")


@router.get("/list", response_model=list[CompetitorItem])
async def list_competitors(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """List all tracked competitors with their scores."""
    comps = await get_competitors(db, membership.workspace_id)
    return [
        CompetitorItem(
            id=c.id,
            url=c.url,
            name=c.name or "",
            status=c.status,
            seo_score=c.seo_score or 0,
            performance_score=c.performance_score or 0,
            security_score=c.security_score or 0,
            overall_score=c.overall_score or 0,
            tech_stack=c.tech_stack or [],
            social_presence=c.social_presence or {},
            keywords=c.keywords or [],
            last_scanned_at=_format_dt(c.last_scanned_at),
        )
        for c in comps
    ]


@router.get("/report", response_model=CompetitorReportResponse)
async def get_report(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest competitive positioning report."""
    report = await get_latest_report(db, membership.workspace_id)
    if not report:
        raise HTTPException(status_code=404, detail="No competitor report. Run a scan first.")

    return CompetitorReportResponse(
        id=report.id,
        workspace_id=report.workspace_id,
        status=report.status,
        overall_positioning=report.overall_positioning,
        dimension_scores=[DimensionScore(**d) for d in (report.dimension_scores or [])],
        strengths=[StrategicInsight(**s) for s in (report.strengths or [])],
        weaknesses=[StrategicInsight(**w) for w in (report.weaknesses or [])],
        opportunities=[StrategicInsight(**o) for o in (report.opportunities or [])],
        competitor_summary=[CompetitorSummary(**c) for c in (report.competitor_summary or [])],
        competitors_scanned=report.competitors_scanned or 0,
        computed_at=_format_dt(report.computed_at),
    )


@router.post("/add", response_model=CompetitorItem)
async def add_new_competitor(
    body: AddCompetitorRequest,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Add a new competitor URL to track."""
    try:
        comp = await add_competitor(db, membership.workspace_id, body.url)
        await db.commit()
        return CompetitorItem(
            id=comp.id,
            url=comp.url,
            name=comp.name or "",
            status=comp.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{competitor_id}", response_model=CompetitorItem)
async def get_competitor_detail(
    competitor_id: str,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed info for a single competitor."""
    from sqlalchemy import select as sa_select
    from .models import Competitor

    result = await db.execute(
        sa_select(Competitor).where(
            Competitor.id == competitor_id,
            Competitor.workspace_id == membership.workspace_id,
        )
    )
    comp = result.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")

    return CompetitorItem(
        id=comp.id,
        url=comp.url,
        name=comp.name or "",
        status=comp.status,
        seo_score=comp.seo_score or 0,
        performance_score=comp.performance_score or 0,
        security_score=comp.security_score or 0,
        overall_score=comp.overall_score or 0,
        tech_stack=comp.tech_stack or [],
        social_presence=comp.social_presence or {},
        keywords=comp.keywords or [],
        last_scanned_at=_format_dt(comp.last_scanned_at),
    )
