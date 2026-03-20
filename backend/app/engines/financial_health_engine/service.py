"""
AEOS – Financial Health Engine: Service layer.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import FinancialHealthReport
from .calculator import (
    estimate_revenue_model, estimate_cost_structure, calculate_projections,
    compute_all_scores, generate_growth_levers, generate_financial_risks,
    generate_recommendations,
)
from app.engines.market_research_engine.industry_data import get_industry_data

logger = logging.getLogger("aeos.engine.financial_health")


async def compute_financial_health(
    db: AsyncSession, workspace_id: str
) -> FinancialHealthReport:
    """Generate a full financial health assessment."""
    from app.modules.billing.service import enforce_token_budget
    await enforce_token_budget(db, workspace_id, "financial_health_compute")

    from app.auth.models import WorkspaceProfile

    prof_result = await db.execute(
        select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id)
    )
    profile = prof_result.scalar_one_or_none()

    industry = profile.industry if profile else "other"
    team_size = profile.team_size if profile else 1

    # Get digital score
    digital_score = 50.0
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        dp = await get_latest_report(db, workspace_id)
        if dp:
            digital_score = dp.overall_score or 50.0
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

    # Calculate everything
    industry_data = get_industry_data(industry)
    growth_rate = industry_data["annual_growth_rate"]

    revenue_model = estimate_revenue_model(industry, team_size, digital_score)
    cost_structure = estimate_cost_structure(industry, team_size, revenue_model["estimated_annual_revenue"])
    projections = calculate_projections(
        revenue_model["estimated_annual_revenue"],
        cost_structure["estimated_annual_costs"],
        growth_rate,
        cost_structure["optimization_potential"],
    )
    scores = compute_all_scores(
        revenue_model, cost_structure, growth_rate, digital_score, gap_score, team_size,
    )
    growth_levers = generate_growth_levers(industry, digital_score, gap_score, cost_structure["cost_to_revenue_ratio"])
    risks = generate_financial_risks(industry, cost_structure["cost_to_revenue_ratio"], gap_score, team_size)
    recommendations = generate_recommendations(scores, revenue_model, cost_structure, growth_levers)

    report = FinancialHealthReport(
        workspace_id=workspace_id,
        status="completed",
        overall_score=scores["overall_score"],
        revenue_potential_score=scores["revenue_potential_score"],
        cost_efficiency_score=scores["cost_efficiency_score"],
        growth_readiness_score=scores["growth_readiness_score"],
        risk_exposure_score=scores["risk_exposure_score"],
        investment_readiness_score=scores["investment_readiness_score"],
        revenue_model=revenue_model,
        cost_structure=cost_structure,
        growth_levers=growth_levers,
        financial_risks=risks,
        recommendations=recommendations,
        benchmarks={"industry": industry, "growth_rate": growth_rate},
        projections=projections,
        computed_at=datetime.utcnow(),
    )
    db.add(report)
    await db.flush()

    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "financial_health_compute")
    except Exception:
        pass

    logger.info("Financial health: workspace=%s, score=%.1f", workspace_id, scores["overall_score"])
    return report


async def get_latest_report(db: AsyncSession, workspace_id: str) -> Optional[FinancialHealthReport]:
    result = await db.execute(
        select(FinancialHealthReport)
        .where(FinancialHealthReport.workspace_id == workspace_id, FinancialHealthReport.status == "completed")
        .order_by(FinancialHealthReport.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_compute(db: AsyncSession, workspace_id: str) -> FinancialHealthReport:
    report = await get_latest_report(db, workspace_id)
    if report:
        return report
    return await compute_financial_health(db, workspace_id)
