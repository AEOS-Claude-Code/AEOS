"""
AEOS – Financial Model Engine: Service layer.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import FinancialModel
from .calculator import (
    build_assumptions, build_yearly_projections, build_monthly_cashflow,
    build_revenue_streams, build_cost_breakdown, build_ebitda_analysis,
    build_break_even, build_funding_requirements, build_scenarios,
)

logger = logging.getLogger("aeos.engine.financial_model")


async def generate_financial_model(db: AsyncSession, workspace_id: str) -> FinancialModel:
    """Generate a complete 5-year financial model."""
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

    # Get base financials from financial health engine
    base_revenue = 0
    base_costs = 0
    try:
        from app.engines.financial_health_engine.service import get_latest_report as get_fin
        fin = await get_fin(db, workspace_id)
        if fin:
            base_revenue = (fin.revenue_model or {}).get("estimated_annual_revenue", 0)
            base_costs = (fin.cost_structure or {}).get("estimated_annual_costs", 0)
    except Exception:
        pass

    # Fallback estimates if no financial health data
    if base_revenue <= 0:
        from app.engines.market_research_engine.industry_data import get_industry_data
        data = get_industry_data(industry)
        base_revenue = data["avg_revenue_per_employee"] * team_size
        base_costs = base_revenue * 0.80

    # Version tracking
    ver_result = await db.execute(
        select(FinancialModel).where(FinancialModel.workspace_id == workspace_id)
        .order_by(FinancialModel.version.desc()).limit(1)
    )
    prev = ver_result.scalar_one_or_none()
    version = (prev.version + 1) if prev else 1

    # Build everything
    assumptions = build_assumptions(industry, team_size, digital_score)
    yearly = build_yearly_projections(base_revenue, base_costs, team_size, assumptions)
    monthly = build_monthly_cashflow(base_revenue, base_costs, assumptions["base_growth_rate"])
    streams = build_revenue_streams(base_revenue, industry, assumptions["base_growth_rate"])
    costs = build_cost_breakdown(base_costs, team_size, assumptions["base_growth_rate"])
    ebitda = build_ebitda_analysis(yearly)
    breakeven = build_break_even(monthly, base_costs)
    funding = build_funding_requirements(base_revenue, base_costs, team_size, breakeven["break_even_month"])
    scenarios = build_scenarios(base_revenue, assumptions)

    model = FinancialModel(
        workspace_id=workspace_id,
        status="completed",
        version=version,
        year1_revenue=yearly[0]["revenue"] if yearly else 0,
        year5_revenue=yearly[4]["revenue"] if len(yearly) > 4 else 0,
        break_even_month=breakeven["break_even_month"],
        year3_ebitda_margin=ebitda["year3_margin"],
        yearly_projections=yearly,
        monthly_cashflow=monthly,
        revenue_streams=streams,
        cost_breakdown=costs,
        ebitda_analysis=ebitda,
        break_even_analysis=breakeven,
        funding_requirements=funding,
        assumptions=assumptions,
        scenarios=scenarios,
        computed_at=datetime.utcnow(),
    )
    db.add(model)
    await db.flush()

    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "financial_model_compute")
    except Exception:
        pass

    logger.info("Financial model v%d: workspace=%s, Y1=%d, Y5=%d", version, workspace_id, model.year1_revenue, model.year5_revenue)
    return model


async def get_latest(db: AsyncSession, workspace_id: str) -> Optional[FinancialModel]:
    result = await db.execute(
        select(FinancialModel)
        .where(FinancialModel.workspace_id == workspace_id, FinancialModel.status == "completed")
        .order_by(FinancialModel.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_compute(db: AsyncSession, workspace_id: str) -> FinancialModel:
    model = await get_latest(db, workspace_id)
    if model:
        return model
    return await generate_financial_model(db, workspace_id)
