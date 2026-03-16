"""
AEOS – Company Scanner Engine: API Router.

GET  /api/v1/company-scan/latest                → latest scan (auth required)
POST /api/v1/company-scan/trigger               → enqueue scan (auth required)
GET  /api/v1/company-scan/report/{share_token}  → PUBLIC shareable report (no auth)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger("aeos.engine.scanner.router")

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace, Membership
from .models import CompanyScanReport
from .schemas import ScanReportResponse, ScanTriggerResponse
from .service import get_latest_scan, get_or_create_scan

router = APIRouter(prefix="/v1/company-scan", tags=["Company Scanner"])


def _build_response(report: CompanyScanReport, company_name: str = "") -> ScanReportResponse:
    """Build a ScanReportResponse from an ORM model."""
    share_url = f"/report/{report.share_token}" if report.share_token else ""
    return ScanReportResponse(
        id=report.id,
        workspace_id=report.workspace_id,
        website_url=report.website_url,
        status=report.status,
        share_token=report.share_token or "",
        share_url=share_url,
        company_name=company_name,
        page_title=report.page_title or "",
        meta_description=report.meta_description or "",
        headings=report.headings or [],
        detected_keywords=report.detected_keywords or [],
        internal_links_count=report.internal_links_count or 0,
        pages_detected=report.pages_detected or 0,
        seo_score=report.seo_score or 0,
        seo_details=report.seo_details or {},
        social_presence=report.social_presence or {},
        tech_stack=report.tech_stack or [],
        scan_summary=report.scan_summary or "",
        scan_started_at=report.scan_started_at.isoformat() if report.scan_started_at else None,
        scan_completed_at=report.scan_completed_at.isoformat() if report.scan_completed_at else None,
        created_at=report.created_at.isoformat(),
    )


@router.get(
    "/latest",
    response_model=ScanReportResponse | None,
    summary="Get latest company scan report",
)
async def latest_scan(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    report = await get_latest_scan(db, workspace.id)
    if not report:
        profile = workspace.profile
        url = profile.website_url if profile else ""
        if url:
            social = profile.social_links if profile else None
            report = await get_or_create_scan(db, workspace.id, url, social)
        else:
            return None

    return _build_response(report, company_name=workspace.name)


@router.post(
    "/trigger",
    response_model=ScanTriggerResponse,
    summary="Trigger a new company scan",
)
async def trigger_scan(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    profile = workspace.profile
    url = profile.website_url if profile else ""
    if not url:
        raise HTTPException(status_code=400, detail="No website URL configured. Complete onboarding first.")

    social = profile.social_links if profile else None

    try:
        from .tasks import scan_company_website
        task = scan_company_website.delay(workspace.id, url, social)
        return ScanTriggerResponse(
            scan_id=task.id,
            status="queued",
            message="Scan queued. Results will appear shortly.",
        )
    except Exception:
        logger.warning("Celery unavailable for workspace=%s, running scan inline", workspace.id)
        report = await get_or_create_scan(db, workspace.id, url, social)
        return ScanTriggerResponse(
            scan_id=report.id,
            status=report.status,
            message="Scan completed inline (background worker unavailable).",
        )


# ── PUBLIC report endpoint (no authentication) ──────────────────────

@router.get(
    "/report/{share_token}",
    response_model=ScanReportResponse,
    summary="Public shareable company intelligence report",
    description="No authentication required. Anyone with the share link can view.",
)
async def public_report(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyScanReport).where(
            CompanyScanReport.share_token == share_token,
            CompanyScanReport.is_public == True,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or not public")

    # Get company name from workspace
    from app.auth.models import Workspace as WS
    ws_result = await db.execute(select(WS).where(WS.id == report.workspace_id))
    ws = ws_result.scalar_one_or_none()
    company_name = ws.name if ws else ""

    return _build_response(report, company_name=company_name)
