"""
AEOS – Reports Engine: API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .models import REPORT_TYPES, REPORT_TITLES
from .schemas import *
from .service import generate_report, get_report, get_report_by_token, list_reports, update_sharing

router = APIRouter(tags=["Reports Engine"])


def _fmt(dt) -> str | None:
    return dt.isoformat() if dt else None


def _to_response(r) -> ReportResponse:
    return ReportResponse(
        id=r.id, workspace_id=r.workspace_id, report_type=r.report_type,
        title=r.title or "", status=r.status,
        sections=[ReportSection(**s) for s in (r.sections or [])],
        summary=r.summary or "", share_token=r.share_token or "",
        is_public=r.is_public == "true", metadata=r.metadata_json or {},
        generated_at=_fmt(r.generated_at), created_at=_fmt(r.created_at) or "",
    )


@router.get("/v1/reports/types")
async def get_report_types():
    """List available report types."""
    return [
        {"type": t, "title": REPORT_TITLES.get(t, t)}
        for t in REPORT_TYPES
    ]


@router.post("/v1/reports/generate", response_model=GenerateResponse)
async def trigger_generate(
    body: GenerateRequest,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new executive report."""
    try:
        report = await generate_report(db, membership.workspace_id, body.report_type, user.id)
        await db.commit()
        return GenerateResponse(report_id=report.id, status=report.status, message=f"Report generated: {report.title}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/v1/reports/list", response_model=list[ReportListItem])
async def get_reports(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """List all reports for this workspace."""
    reports = await list_reports(db, membership.workspace_id)
    return [
        ReportListItem(
            id=r.id, report_type=r.report_type, title=r.title or "",
            status=r.status, share_token=r.share_token or "",
            is_public=r.is_public == "true",
            generated_at=_fmt(r.generated_at), created_at=_fmt(r.created_at) or "",
        )
        for r in reports
    ]


@router.get("/v1/reports/{report_id}", response_model=ReportResponse)
async def get_report_detail(
    report_id: str,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific report."""
    report = await get_report(db, report_id)
    if not report or report.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_response(report)


@router.put("/v1/reports/{report_id}/share")
async def toggle_sharing(
    report_id: str,
    body: ShareRequest,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Toggle public sharing for a report."""
    report = await get_report(db, report_id)
    if not report or report.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=404, detail="Report not found")
    await update_sharing(db, report_id, body.is_public)
    await db.commit()
    return {"status": "updated", "is_public": body.is_public, "share_url": f"/report/{report.share_token}" if body.is_public else None}


@router.get("/v1/public/report/{share_token}", response_model=ReportResponse)
async def get_public_report(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a publicly shared report (no auth required)."""
    report = await get_report_by_token(db, share_token)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or not public")
    return _to_response(report)
