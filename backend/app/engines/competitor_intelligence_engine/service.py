"""
AEOS – Competitor Intelligence Engine: Service layer.

Orchestrates competitor scanning, comparison, and report generation.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Competitor, CompetitorReport
from .scanner import scan_competitor_website
from .comparison import compute_comparison

logger = logging.getLogger("aeos.engine.competitor")


async def get_competitors(db: AsyncSession, workspace_id: str) -> list[Competitor]:
    """Get all competitors for a workspace."""
    result = await db.execute(
        select(Competitor)
        .where(Competitor.workspace_id == workspace_id)
        .order_by(Competitor.created_at)
    )
    return list(result.scalars().all())


async def add_competitor(db: AsyncSession, workspace_id: str, url: str) -> Competitor:
    """Add a new competitor URL."""
    if not url.startswith("http"):
        url = "https://" + url

    # Check if already exists
    existing = await db.execute(
        select(Competitor).where(
            Competitor.workspace_id == workspace_id,
            Competitor.url == url,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Competitor already tracked")

    comp = Competitor(workspace_id=workspace_id, url=url)
    db.add(comp)
    await db.flush()
    return comp


async def scan_all_competitors(db: AsyncSession, workspace_id: str) -> int:
    """Scan all competitors for a workspace. Returns count scanned."""
    from app.modules.billing.service import enforce_token_budget
    await enforce_token_budget(db, workspace_id, "competitor_scan")

    # Load competitor URLs from workspace profile
    from app.auth.models import WorkspaceProfile
    prof_result = await db.execute(
        select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id)
    )
    profile = prof_result.scalar_one_or_none()
    competitor_urls = (profile.competitor_urls or []) if profile else []

    # Also load any manually added competitors
    existing = await get_competitors(db, workspace_id)
    existing_urls = {c.url for c in existing}

    # Ensure all URLs from profile exist as Competitor records
    for url in competitor_urls:
        if not url.startswith("http"):
            url = "https://" + url
        if url not in existing_urls:
            comp = Competitor(workspace_id=workspace_id, url=url)
            db.add(comp)
    await db.flush()

    # Reload all competitors
    competitors = await get_competitors(db, workspace_id)

    # Scan each competitor
    scanned = 0
    for comp in competitors:
        try:
            comp.status = "scanning"
            await db.flush()

            scan_data = await scan_competitor_website(comp.url)

            comp.name = scan_data.get("name", "") or comp.name
            comp.seo_score = scan_data.get("seo_score", 0)
            comp.performance_score = scan_data.get("performance_score", 0)
            comp.security_score = scan_data.get("security_score", 0)
            comp.overall_score = scan_data.get("overall_score", 0)
            comp.tech_stack = scan_data.get("tech_stack", [])
            comp.social_presence = scan_data.get("social_presence", {})
            comp.keywords = scan_data.get("keywords", [])
            comp.scan_data = scan_data
            comp.status = "scanned"
            comp.last_scanned_at = datetime.utcnow()
            scanned += 1

            logger.info("Scanned competitor %s: overall=%d", comp.url, comp.overall_score)
        except Exception as e:
            comp.status = "failed"
            logger.warning("Failed to scan competitor %s: %s", comp.url, str(e)[:100])

        await db.flush()

    # Bill tokens
    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "competitor_scan")
    except Exception:
        logger.warning("Token billing skipped for competitor scan (non-fatal)")

    return scanned


async def generate_report(db: AsyncSession, workspace_id: str) -> CompetitorReport:
    """Generate a competitive positioning report."""
    # Get client's scan data
    from app.engines.company_scanner_engine.models import CompanyScanReport

    client_result = await db.execute(
        select(CompanyScanReport)
        .where(
            CompanyScanReport.workspace_id == workspace_id,
            CompanyScanReport.status == "completed",
        )
        .order_by(CompanyScanReport.created_at.desc())
        .limit(1)
    )
    client_scan = client_result.scalar_one_or_none()
    client_data = {}
    if client_scan:
        client_data = {
            "seo_score": client_scan.seo_score,
            "performance_score": getattr(client_scan, "performance", {}).get("score", 0) if isinstance(getattr(client_scan, "performance", None), dict) else 0,
            "security_score": getattr(client_scan, "security", {}).get("score", 0) if isinstance(getattr(client_scan, "security", None), dict) else 0,
            "overall_score": getattr(client_scan, "overall_score", 0) or 0,
            "social_presence": client_scan.social_presence or {},
            "tech_stack": client_scan.tech_stack or [],
            "keywords": getattr(client_scan, "detected_keywords", []) or [],
        }

    # Get scanned competitors
    competitors = await get_competitors(db, workspace_id)
    scanned_comps = [
        {
            "id": c.id,
            "name": c.name,
            "url": c.url,
            "seo_score": c.seo_score,
            "performance_score": c.performance_score,
            "security_score": c.security_score,
            "overall_score": c.overall_score,
            "social_presence": c.social_presence or {},
            "tech_stack": c.tech_stack or [],
            "keywords": c.keywords or [],
        }
        for c in competitors if c.status == "scanned"
    ]

    # Run comparison
    comparison = compute_comparison(client_data, scanned_comps)

    # Create report
    report = CompetitorReport(
        workspace_id=workspace_id,
        status="completed",
        overall_positioning=comparison["overall_positioning"],
        dimension_scores=comparison["dimension_scores"],
        strengths=comparison["strengths"],
        weaknesses=comparison["weaknesses"],
        opportunities=comparison["opportunities"],
        competitor_summary=comparison["competitor_summary"],
        competitors_scanned=len(scanned_comps),
        computed_at=datetime.utcnow(),
    )
    db.add(report)
    await db.flush()

    logger.info(
        "Competitor report generated: workspace=%s, positioning=%.1f, competitors=%d",
        workspace_id, comparison["overall_positioning"], len(scanned_comps),
    )

    return report


async def get_latest_report(db: AsyncSession, workspace_id: str) -> Optional[CompetitorReport]:
    """Get latest completed competitor report."""
    result = await db.execute(
        select(CompetitorReport)
        .where(
            CompetitorReport.workspace_id == workspace_id,
            CompetitorReport.status == "completed",
        )
        .order_by(CompetitorReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def scan_and_report(db: AsyncSession, workspace_id: str) -> CompetitorReport:
    """Scan all competitors then generate a comparison report."""
    await scan_all_competitors(db, workspace_id)
    return await generate_report(db, workspace_id)
