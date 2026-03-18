"""
AEOS – Market Research Engine: API router.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import (
    MarketResearchResponse, MarketSizing, BenchmarkItem,
    GrowthDriver, MarketThreat, MarketPositioning, ComputeResponse,
)
from .service import get_or_compute, compute_market_research, get_latest_report
from .industry_data import get_industry_data

logger = logging.getLogger("aeos.engine.market_research.router")

router = APIRouter(prefix="/v1/market-research", tags=["Market Research Engine"])


def _format_dt(dt) -> str | None:
    return dt.isoformat() if dt else None


def _report_to_response(report) -> MarketResearchResponse:
    sizing = report.regional_data.get("sizing", {}) if report.regional_data else {}
    pos = report.market_positioning or {}

    return MarketResearchResponse(
        id=report.id,
        workspace_id=report.workspace_id,
        status=report.status,
        industry=report.industry or "",
        market_sizing=MarketSizing(
            tam=report.tam or 0,
            sam=report.sam or 0,
            som=report.som or 0,
            tam_label=sizing.get("tam_label", ""),
            sam_label=sizing.get("sam_label", ""),
            som_label=sizing.get("som_label", ""),
        ),
        benchmarks=[BenchmarkItem(**b) for b in (report.benchmarks or [])],
        growth_drivers=[GrowthDriver(**g) for g in (report.growth_drivers or [])],
        threats=[MarketThreat(**t) for t in (report.threats or [])],
        opportunities=[GrowthDriver(**o) for o in (report.opportunities or [])],
        market_positioning=MarketPositioning(
            score=pos.get("score", 50),
            label=pos.get("label", ""),
            strengths=pos.get("strengths", []),
            growth_areas=pos.get("growth_areas", []),
        ),
        market_growth_rate=report.market_growth_rate or 0,
        computed_at=_format_dt(report.computed_at),
    )


@router.get("/latest", response_model=MarketResearchResponse)
async def get_market_research(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get or compute market research report."""
    report = await get_or_compute(db, membership.workspace_id)
    await db.commit()
    return _report_to_response(report)


@router.post("/compute", response_model=ComputeResponse)
async def recompute(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Force recomputation of market research."""
    report = await compute_market_research(db, membership.workspace_id)
    await db.commit()
    return ComputeResponse(
        report_id=report.id,
        status=report.status,
        message=f"Market research computed for {report.industry}. TAM: ${report.tam:.1f}B",
    )


@router.get("/benchmarks")
async def get_benchmarks(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get industry benchmarks only."""
    report = await get_latest_report(db, membership.workspace_id)
    if not report:
        return {"benchmarks": [], "industry": ""}
    return {
        "benchmarks": report.benchmarks or [],
        "industry": report.industry,
        "growth_rate": report.market_growth_rate,
    }
