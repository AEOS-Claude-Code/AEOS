"""
AEOS – Digital Presence Engine: Service layer.

Phase 8: Computes digital presence scores from scanner data,
tracks history via daily snapshots, generates recommendations.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import DigitalPresenceReport, DigitalPresenceSnapshot
from .scoring import compute_all_scores
from app.engines.contracts import EngineEvent
from app.engines.event_bus import emit

logger = logging.getLogger("aeos.engine.digital_presence")


async def compute_digital_presence(
    db: AsyncSession,
    workspace_id: str,
) -> DigitalPresenceReport:
    """Main pipeline: collect data, score, persist, snapshot."""
    from app.modules.billing.service import enforce_token_budget
    await enforce_token_budget(db, workspace_id, "digital_presence_compute")

    logger.info("Computing digital presence workspace=%s", workspace_id)

    report = DigitalPresenceReport(
        workspace_id=workspace_id,
        status="computing",
    )
    db.add(report)
    await db.flush()

    try:
        # ── 1. Get latest scan data ──
        scan_data = await _get_scan_data(db, workspace_id)
        data_sources = []
        if scan_data:
            data_sources.append("company_scanner")

        # ── 2. Get social links from workspace profile ──
        profile_social = await _get_profile_social(db, workspace_id)
        if profile_social:
            data_sources.append("workspace_profile")

        # ── 3. Compute scores ──
        result = compute_all_scores(scan_data, profile_social)

        report.overall_score = result["overall_score"]
        report.website_performance = result["scores"]["website_performance"]
        report.search_visibility = result["scores"]["search_visibility"]
        report.social_presence = result["scores"]["social_presence"]
        report.reputation = result["scores"]["reputation"]
        report.conversion_readiness = result["scores"]["conversion_readiness"]
        report.score_breakdown = result["breakdown"]
        report.recommendations = result["recommendations"]
        report.data_sources = data_sources
        report.status = "completed"
        report.computed_at = datetime.utcnow()

        logger.info(
            "Digital presence computed workspace=%s overall=%.1f",
            workspace_id, report.overall_score,
        )

        # ── 4. Upsert daily snapshot ──
        await _upsert_snapshot(db, report)

        # ── 5. Token usage (best-effort) ──
        try:
            from app.modules.billing.service import consume_tokens, get_operation_cost
            cost = get_operation_cost("digital_presence_compute")
            await consume_tokens(
                db, workspace_id, "digital_presence_compute", cost,
                engine="digital_presence", detail=f"score={report.overall_score:.0f}",
            )
        except Exception:
            logger.warning("Token tracking failed for DP workspace=%s (non-fatal)", workspace_id)

        # ── 6. Emit event ──
        await emit(EngineEvent(
            event_type="digital_presence_computed",
            workspace_id=workspace_id,
            engine="digital_presence",
            payload={
                "overall_score": report.overall_score,
                "report_id": report.id,
            },
        ))

    except Exception as e:
        report.status = "failed"
        report.computed_at = datetime.utcnow()
        logger.error("DP computation failed workspace=%s: %s", workspace_id, str(e)[:200])

    return report


async def get_latest_report(
    db: AsyncSession, workspace_id: str,
) -> Optional[DigitalPresenceReport]:
    """Get the most recent completed report."""
    result = await db.execute(
        select(DigitalPresenceReport)
        .where(
            DigitalPresenceReport.workspace_id == workspace_id,
            DigitalPresenceReport.status == "completed",
        )
        .order_by(DigitalPresenceReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_compute(
    db: AsyncSession, workspace_id: str,
) -> DigitalPresenceReport:
    """Get existing completed report or compute a new one."""
    existing = await get_latest_report(db, workspace_id)
    if existing:
        return existing
    return await compute_digital_presence(db, workspace_id)


async def get_history(
    db: AsyncSession, workspace_id: str, days: int = 90,
) -> dict:
    """Get score history snapshots and trend analysis."""
    cutoff = date.today() - timedelta(days=days)
    result = await db.execute(
        select(DigitalPresenceSnapshot)
        .where(
            DigitalPresenceSnapshot.workspace_id == workspace_id,
            DigitalPresenceSnapshot.snapshot_date >= cutoff,
        )
        .order_by(DigitalPresenceSnapshot.snapshot_date.asc())
    )
    snapshots = list(result.scalars().all())

    items = [
        {
            "date": s.snapshot_date.isoformat(),
            "overall_score": s.overall_score,
            "website_performance": s.website_performance,
            "search_visibility": s.search_visibility,
            "social_presence": s.social_presence,
            "reputation": s.reputation,
            "conversion_readiness": s.conversion_readiness,
        }
        for s in snapshots
    ]

    # Trend analysis
    trend = "insufficient_data"
    change_30d = None
    if len(snapshots) >= 2:
        latest = snapshots[-1].overall_score
        earliest = snapshots[0].overall_score
        change_30d = round(latest - earliest, 1)
        if change_30d > 3:
            trend = "improving"
        elif change_30d < -3:
            trend = "declining"
        else:
            trend = "stable"

    return {
        "snapshots": items,
        "trend": trend,
        "change_30d": change_30d,
    }


# ── Private helpers ──────────────────────────────────────────────


async def _get_scan_data(db: AsyncSession, workspace_id: str) -> Optional[dict]:
    """Fetch latest completed scan as a dict for scoring."""
    from app.engines.company_scanner_engine.models import CompanyScanReport

    result = await db.execute(
        select(CompanyScanReport)
        .where(
            CompanyScanReport.workspace_id == workspace_id,
            CompanyScanReport.status == "completed",
        )
        .order_by(CompanyScanReport.created_at.desc())
        .limit(1)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        return None

    return {
        "overall_score": scan.overall_score,
        "seo_score": scan.seo_score,
        "seo_details": scan.seo_details or {},
        "meta_description": scan.meta_description,
        "social_presence": scan.social_presence or {},
        "tech_stack": scan.tech_stack or [],
        "performance": scan.performance or {},
        "security": scan.security or {},
        "accessibility": scan.accessibility or {},
        "structured_data": scan.structured_data or {},
        "crawl_info": scan.crawl_info or {},
        "pages_crawled": scan.pages_crawled or 0,
        "crawled_pages": scan.crawled_pages or [],
    }


async def _get_profile_social(db: AsyncSession, workspace_id: str) -> Optional[dict]:
    """Get social links from workspace company profile."""
    try:
        from app.auth.models import CompanyProfile
        result = await db.execute(
            select(CompanyProfile).where(CompanyProfile.workspace_id == workspace_id)
        )
        profile = result.scalar_one_or_none()
        if profile and profile.social_links:
            return profile.social_links
    except Exception:
        logger.debug("Could not fetch profile social links for workspace=%s", workspace_id)
    return None


async def _upsert_snapshot(db: AsyncSession, report: DigitalPresenceReport) -> None:
    """Create or update today's snapshot."""
    today = date.today()

    existing = await db.execute(
        select(DigitalPresenceSnapshot).where(
            DigitalPresenceSnapshot.workspace_id == report.workspace_id,
            DigitalPresenceSnapshot.snapshot_date == today,
        )
    )
    snap = existing.scalar_one_or_none()

    if snap:
        snap.report_id = report.id
        snap.overall_score = report.overall_score
        snap.website_performance = report.website_performance
        snap.search_visibility = report.search_visibility
        snap.social_presence = report.social_presence
        snap.reputation = report.reputation
        snap.conversion_readiness = report.conversion_readiness
    else:
        snap = DigitalPresenceSnapshot(
            workspace_id=report.workspace_id,
            report_id=report.id,
            overall_score=report.overall_score,
            website_performance=report.website_performance,
            search_visibility=report.search_visibility,
            social_presence=report.social_presence,
            reputation=report.reputation,
            conversion_readiness=report.conversion_readiness,
            snapshot_date=today,
        )
        db.add(snap)
