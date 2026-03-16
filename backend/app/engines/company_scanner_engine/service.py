"""
AEOS – Company Scanner Engine: Service layer.

Orchestrates the scan pipeline with logging, dedup, and domain events.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import CompanyScanReport
from .collectors.website_collector import collect_website
from .collectors.seo_collector import analyze_seo
from .collectors.social_collector import detect_social_from_html, detect_social_from_profile, merge_social
from .collectors.tech_stack_collector import detect_tech_from_html, detect_tech_from_url, merge_tech
from app.engines.contracts import EngineEvent
from app.engines.event_bus import emit

logger = logging.getLogger("aeos.engine.scanner")


async def run_scan(
    db: AsyncSession,
    workspace_id: str,
    website_url: str,
    social_links: dict | None = None,
) -> CompanyScanReport:
    """Execute the full scan pipeline and persist to DB."""

    # ── Dedup guard: skip if a scan is already in progress ────────
    in_progress = await db.execute(
        select(CompanyScanReport).where(
            CompanyScanReport.workspace_id == workspace_id,
            CompanyScanReport.status.in_(["pending", "scanning"]),
        )
    )
    existing_wip = in_progress.scalar_one_or_none()
    if existing_wip:
        logger.info("Scan already in progress for workspace=%s, skipping", workspace_id)
        return existing_wip

    logger.info("Starting scan workspace=%s url=%s", workspace_id, website_url)

    report = CompanyScanReport(
        workspace_id=workspace_id,
        website_url=website_url,
        status="scanning",
        scan_started_at=datetime.utcnow(),
    )
    db.add(report)
    await db.flush()

    try:
        # 1. Website collection
        website_data = await collect_website(website_url)
        report.page_title = website_data.get("title", "")
        report.meta_description = website_data.get("description", "")
        report.headings = website_data.get("headings", [])
        report.detected_keywords = website_data.get("keywords", [])
        report.internal_links_count = website_data.get("internal_links_count", 0)
        report.pages_detected = website_data.get("pages_detected", 0)
        logger.info("Website collected: %d pages, %d links", report.pages_detected, report.internal_links_count)

        # 2. SEO analysis
        seo_result = analyze_seo(website_data)
        report.seo_score = seo_result["score"]
        report.seo_details = seo_result["details"]
        logger.info("SEO score: %d/100", report.seo_score)

        # 3. Social detection
        profile_social = detect_social_from_profile(social_links)
        report.social_presence = merge_social({}, profile_social)

        # 4. Tech stack detection
        url_tech = detect_tech_from_url(website_url)
        report.tech_stack = merge_tech([], url_tech)
        logger.info("Tech stack: %s", report.tech_stack)

        # 5. Summary
        social_count = sum(1 for v in report.social_presence.values() if v)
        tech_names = ", ".join(report.tech_stack[:5]) if report.tech_stack else "not detected"
        report.scan_summary = (
            f"Website analysis for {report.page_title or website_url}. "
            f"SEO score: {report.seo_score}/100. "
            f"{social_count} social platforms detected. "
            f"Tech stack: {tech_names}. "
            f"{report.pages_detected} pages found with {report.internal_links_count} internal links."
        )

        report.status = "completed"
        report.scan_completed_at = datetime.utcnow()
        logger.info("Scan completed workspace=%s seo=%d", workspace_id, report.seo_score)

        # Record token usage (best-effort — don't fail the scan)
        try:
            from app.modules.billing.service import consume_tokens, get_operation_cost
            cost = get_operation_cost("company_scan")
            await consume_tokens(db, workspace_id, "company_scan", cost, engine="company_scanner", detail=website_url[:100])
        except Exception:
            logger.warning("Token tracking failed for scan workspace=%s (non-fatal)", workspace_id)

        # Emit domain event
        await emit(EngineEvent(
            event_type="scan_completed",
            workspace_id=workspace_id,
            engine="company_scanner",
            payload={"seo_score": report.seo_score, "scan_id": report.id},
        ))

    except Exception as e:
        report.status = "failed"
        report.scan_summary = f"Scan failed: {str(e)[:200]}"
        report.scan_completed_at = datetime.utcnow()
        logger.error("Scan failed workspace=%s: %s", workspace_id, str(e)[:200])

    return report


async def get_latest_scan(db: AsyncSession, workspace_id: str) -> Optional[CompanyScanReport]:
    """Get the most recent completed scan report for a workspace."""
    result = await db.execute(
        select(CompanyScanReport)
        .where(CompanyScanReport.workspace_id == workspace_id)
        .order_by(CompanyScanReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_create_scan(
    db: AsyncSession,
    workspace_id: str,
    website_url: str,
    social_links: dict | None = None,
) -> CompanyScanReport:
    """Get existing completed scan or run a new one (with dedup)."""
    existing = await get_latest_scan(db, workspace_id)
    if existing and existing.status == "completed":
        return existing
    return await run_scan(db, workspace_id, website_url, social_links)
