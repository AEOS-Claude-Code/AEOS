"""
AEOS – KPI Framework Engine: Service layer.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import KPIFramework
from .calculator import (
    build_company_kpis, build_digital_kpis, build_financial_kpis,
    build_department_kpis, calculate_kpi_score, build_review_cadence,
)

logger = logging.getLogger("aeos.engine.kpi_framework")


async def compute_kpi_framework(db: AsyncSession, workspace_id: str) -> KPIFramework:
    """Generate a complete KPI framework."""
    from app.auth.models import WorkspaceProfile

    prof_result = await db.execute(
        select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id)
    )
    profile = prof_result.scalar_one_or_none()
    industry = profile.industry if profile else "other"

    # Gather data from other engines
    data: dict = {}

    # Digital presence
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        dp = await get_latest_report(db, workspace_id)
        if dp:
            data["digital_presence_score"] = dp.overall_score or 0
            data["seo_score"] = dp.search_visibility or 0
            data["website_performance_score"] = dp.website_performance or 0
            data["social_platforms"] = int((dp.social_presence or 0) / 20)
    except Exception:
        pass

    # Financial health
    try:
        from app.engines.financial_health_engine.service import get_latest_report as get_fin
        fin = await get_fin(db, workspace_id)
        if fin:
            data["revenue_per_employee"] = (fin.revenue_model or {}).get("revenue_per_employee", 0)
            data["industry_avg_revenue_per_employee"] = (fin.revenue_model or {}).get("industry_avg_revenue_per_employee", 0)
            data["cost_to_revenue_ratio"] = (fin.cost_structure or {}).get("cost_to_revenue_ratio", 0)
            data["ai_optimization_potential"] = (fin.cost_structure or {}).get("optimization_potential", 0)
    except Exception:
        pass

    # Market research
    try:
        from app.engines.market_research_engine.service import get_latest_report as get_market
        market = await get_market(db, workspace_id)
        if market:
            data["market_growth_rate"] = market.market_growth_rate or 0
    except Exception:
        pass

    # Competitor positioning
    try:
        from app.engines.competitor_intelligence_engine.service import get_latest_report as get_comp
        comp = await get_comp(db, workspace_id)
        if comp:
            data["competitive_positioning"] = comp.overall_positioning or 0
    except Exception:
        pass

    # Org chart departments
    departments = []
    try:
        from app.engines.smart_intake_engine.org_chart_engine import generate_org_chart
        org = generate_org_chart(industry=industry)
        departments = org.get("departments", [])
    except Exception:
        pass

    # Build all KPI categories
    company_kpis = build_company_kpis(data)
    digital_kpis = build_digital_kpis(data)
    financial_kpis = build_financial_kpis(data)
    department_kpis = build_department_kpis(departments)

    # Calculate score
    score_data = calculate_kpi_score(company_kpis, digital_kpis, financial_kpis, department_kpis)

    # Build review cadence
    cadence = build_review_cadence()

    framework = KPIFramework(
        workspace_id=workspace_id,
        status="completed",
        overall_kpi_score=score_data["score"],
        total_kpis=score_data["total"],
        tracked_kpis=score_data["tracked"],
        company_kpis=company_kpis,
        department_kpis=department_kpis,
        digital_kpis=digital_kpis,
        financial_kpis=financial_kpis,
        review_cadence=cadence,
        computed_at=datetime.utcnow(),
    )
    db.add(framework)
    await db.flush()

    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "kpi_framework_compute")
    except Exception:
        pass

    logger.info("KPI framework: workspace=%s, total=%d, tracked=%d", workspace_id, score_data["total"], score_data["tracked"])
    return framework


async def get_latest(db: AsyncSession, workspace_id: str) -> Optional[KPIFramework]:
    result = await db.execute(
        select(KPIFramework)
        .where(KPIFramework.workspace_id == workspace_id, KPIFramework.status == "completed")
        .order_by(KPIFramework.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_compute(db: AsyncSession, workspace_id: str) -> KPIFramework:
    fw = await get_latest(db, workspace_id)
    if fw:
        return fw
    return await compute_kpi_framework(db, workspace_id)
