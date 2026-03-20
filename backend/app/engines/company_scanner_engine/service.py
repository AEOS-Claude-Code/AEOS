"""
AEOS – Company Scanner Engine: Service layer.

Phase 7: Enhanced with multi-page crawling, performance, security,
accessibility, structured data, and robots/sitemap analysis.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import CompanyScanReport
from .collectors.website_collector import collect_website
from .collectors.seo_collector import analyze_seo
from .collectors.social_collector import detect_social_from_html, detect_social_from_profile, merge_social
from .collectors.tech_stack_collector import detect_tech_from_html, detect_tech_from_url, merge_tech
from .collectors.performance_collector import analyze_performance
from .collectors.security_collector import analyze_security
from .collectors.accessibility_collector import analyze_accessibility
from .collectors.structured_data_collector import detect_structured_data
from .collectors.crawl_collector import analyze_crawl_info, crawl_internal_pages
from app.engines.contracts import EngineEvent
from app.engines.event_bus import emit

logger = logging.getLogger("aeos.engine.scanner")


def _compute_overall_score(
    seo_score: int,
    perf: dict,
    sec: dict,
    access: dict,
    struct: dict,
    crawl: dict,
) -> int:
    """Weighted composite score across all analysis categories."""
    weights = {
        "seo": 0.30,
        "performance": 0.20,
        "security": 0.15,
        "accessibility": 0.15,
        "structured_data": 0.10,
        "crawl_info": 0.10,
    }
    weighted = (
        seo_score * weights["seo"]
        + perf.get("score", 0) * weights["performance"]
        + sec.get("score", 0) * weights["security"]
        + access.get("score", 0) * weights["accessibility"]
        + struct.get("score", 0) * weights["structured_data"]
        + crawl.get("score", 0) * weights["crawl_info"]
    )
    return min(100, round(weighted))


async def run_scan(
    db: AsyncSession,
    workspace_id: str,
    website_url: str,
    social_links: dict | None = None,
) -> CompanyScanReport:
    """Execute the full scan pipeline and persist to DB."""
    from app.modules.billing.service import enforce_token_budget
    await enforce_token_budget(db, workspace_id, "company_scan")

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
        # 1. Website collection (homepage)
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
        html_social = detect_social_from_html(website_data.get("_html", ""))
        profile_social = detect_social_from_profile(social_links)
        report.social_presence = merge_social(html_social, profile_social)

        # 4. Tech stack detection
        html_tech = detect_tech_from_html(website_data.get("_html", ""))
        url_tech = detect_tech_from_url(website_url)
        report.tech_stack = merge_tech(html_tech, url_tech)
        logger.info("Tech stack: %s", report.tech_stack)

        # 5. Performance analysis
        perf_data = await analyze_performance(website_url)
        report.performance = perf_data
        logger.info("Performance score: %d/100 (%dms)", perf_data.get("score", 0), perf_data.get("response_time_ms", 0))

        # 6. Security analysis
        sec_data = await analyze_security(website_url)
        report.security = sec_data
        logger.info("Security score: %d/100 (HTTPS: %s)", sec_data.get("score", 0), sec_data.get("https", False))

        # 7. Accessibility analysis
        access_data = analyze_accessibility(website_data.get("_html", ""))
        report.accessibility = access_data
        logger.info("Accessibility score: %d/100", access_data.get("score", 0))

        # 8. Structured data detection
        struct_data = detect_structured_data(website_data.get("_html", ""))
        report.structured_data = struct_data
        logger.info("Structured data score: %d/100", struct_data.get("score", 0))

        # 9. Robots.txt & sitemap
        crawl_data = await analyze_crawl_info(website_url)
        report.crawl_info = crawl_data
        logger.info("Crawl info score: %d/100", crawl_data.get("score", 0))

        # 10. Multi-page crawl
        crawled = await crawl_internal_pages(website_url, website_data.get("_html", ""))
        report.crawled_pages = crawled
        report.pages_crawled = len(crawled)
        logger.info("Crawled %d internal pages", len(crawled))

        # 11. Overall score
        report.overall_score = _compute_overall_score(
            report.seo_score, perf_data, sec_data, access_data, struct_data, crawl_data,
        )

        # 12. Summary
        social_count = sum(1 for v in report.social_presence.values() if v)
        tech_names = ", ".join(report.tech_stack[:5]) if report.tech_stack else "not detected"
        report.scan_summary = (
            f"Website analysis for {report.page_title or website_url}. "
            f"Overall score: {report.overall_score}/100. "
            f"SEO: {report.seo_score}/100. "
            f"Performance: {perf_data.get('score', 0)}/100 ({perf_data.get('response_time_ms', 0)}ms). "
            f"Security: {sec_data.get('score', 0)}/100{' (HTTPS)' if sec_data.get('https') else ' (no HTTPS)'}. "
            f"Accessibility: {access_data.get('score', 0)}/100. "
            f"{social_count} social platforms detected. "
            f"Tech stack: {tech_names}. "
            f"{report.pages_crawled} pages crawled of {report.pages_detected} detected."
        )

        report.status = "completed"
        report.scan_completed_at = datetime.utcnow()
        logger.info("Scan completed workspace=%s overall=%d seo=%d", workspace_id, report.overall_score, report.seo_score)

        # Record token usage (best-effort)
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
            payload={
                "seo_score": report.seo_score,
                "overall_score": report.overall_score,
                "scan_id": report.id,
            },
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


async def get_scan_history(
    db: AsyncSession, workspace_id: str, limit: int = 10, offset: int = 0,
) -> tuple[list[CompanyScanReport], int]:
    """Get scan history for a workspace with pagination."""
    count_q = select(func.count(CompanyScanReport.id)).where(
        CompanyScanReport.workspace_id == workspace_id,
    )
    total = (await db.execute(count_q)).scalar_one()

    result = await db.execute(
        select(CompanyScanReport)
        .where(CompanyScanReport.workspace_id == workspace_id)
        .order_by(CompanyScanReport.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all()), total
