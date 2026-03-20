"""
AEOS – Market Research Engine: Service layer.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import MarketResearchReport
from .industry_data import get_industry_data
from .calculator import (
    calculate_market_sizing,
    calculate_benchmarks,
    calculate_positioning,
    generate_opportunities,
)

logger = logging.getLogger("aeos.engine.market_research")


async def compute_market_research(
    db: AsyncSession, workspace_id: str
) -> MarketResearchReport:
    """Generate a full market research report."""
    from app.modules.billing.service import enforce_token_budget
    await enforce_token_budget(db, workspace_id, "market_research_compute")

    from app.auth.models import WorkspaceProfile

    # Get workspace data
    prof_result = await db.execute(
        select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id)
    )
    profile = prof_result.scalar_one_or_none()

    industry = profile.industry if profile else "other"
    country = profile.country if profile else ""
    team_size = profile.team_size if profile else 1

    # Get digital presence score
    digital_score = 50.0
    seo_score = 0.0
    social_count = 0
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        dp = await get_latest_report(db, workspace_id)
        if dp:
            digital_score = dp.overall_score or 50.0
            seo_score = dp.search_visibility or 0.0
            social_count = int((dp.social_presence or 0) / 20)  # Rough platform count
    except Exception:
        pass

    # Get gap score
    gap_score = 50.0
    try:
        from app.engines.gap_analysis_engine.service import get_latest_report as get_gap
        gap = await get_gap(db, workspace_id)
        if gap:
            gap_score = gap.overall_gap_score or 50.0
    except Exception:
        pass

    # Get competitor positioning
    comp_positioning = 50.0
    try:
        from app.engines.competitor_intelligence_engine.service import get_latest_report as get_comp
        comp = await get_comp(db, workspace_id)
        if comp:
            comp_positioning = comp.overall_positioning or 50.0
    except Exception:
        pass

    # Calculate everything
    industry_data = get_industry_data(industry)
    sizing = calculate_market_sizing(industry, country, team_size, digital_score)
    benchmarks = calculate_benchmarks(industry, team_size, digital_score, seo_score, social_count)
    positioning = calculate_positioning(team_size, digital_score, gap_score, comp_positioning)
    opportunities = generate_opportunities(industry, country)

    # Create report
    report = MarketResearchReport(
        workspace_id=workspace_id,
        status="completed",
        industry=industry,
        tam=sizing["tam"],
        sam=sizing["sam"],
        som=sizing["som"],
        market_growth_rate=industry_data["annual_growth_rate"],
        avg_revenue_per_employee=industry_data["avg_revenue_per_employee"],
        digital_maturity_benchmark=industry_data["avg_digital_maturity"],
        benchmarks=benchmarks,
        growth_drivers=industry_data.get("key_growth_drivers", []),
        threats=industry_data.get("key_threats", []),
        opportunities=opportunities,
        market_positioning=positioning,
        regional_data={"country": country, "sizing": sizing},
        computed_at=datetime.utcnow(),
    )
    db.add(report)
    await db.flush()

    # Bill tokens
    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "market_research_compute")
    except Exception:
        pass

    logger.info(
        "Market research complete: workspace=%s, industry=%s, TAM=%s",
        workspace_id, industry, sizing["tam_label"],
    )

    return report


async def get_latest_report(
    db: AsyncSession, workspace_id: str
) -> Optional[MarketResearchReport]:
    """Get latest completed market research report."""
    result = await db.execute(
        select(MarketResearchReport)
        .where(
            MarketResearchReport.workspace_id == workspace_id,
            MarketResearchReport.status == "completed",
        )
        .order_by(MarketResearchReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_compute(
    db: AsyncSession, workspace_id: str
) -> MarketResearchReport:
    """Get latest or compute new."""
    report = await get_latest_report(db, workspace_id)
    if report:
        return report
    return await compute_market_research(db, workspace_id)
