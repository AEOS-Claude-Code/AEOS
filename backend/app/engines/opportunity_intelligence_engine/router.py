"""
AEOS – Opportunity Radar Engine: API router.

GET /api/v1/opportunities/radar
GET /api/v1/opportunities/top
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace
from app.engines.lead_intelligence_engine.service import ensure_seed_leads
from .models import Opportunity
from .detector import ensure_seed_opportunities

router = APIRouter(prefix="/v1/opportunities", tags=["Opportunity Radar"])


@router.get("/radar", summary="Opportunity radar – all detected opportunities")
async def opportunity_radar(
    category: Optional[str] = Query(None, description="Filter by category"),
    impact: Optional[str] = Query(None, description="Filter by impact level"),
    limit: int = Query(20, ge=1, le=100),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    # Ensure seed data exists
    await ensure_seed_leads(db, workspace.id)
    await db.flush()
    await ensure_seed_opportunities(db, workspace)
    await db.flush()

    q = select(Opportunity).where(Opportunity.workspace_id == workspace.id)
    if category:
        q = q.where(Opportunity.category == category)
    if impact:
        q = q.where(Opportunity.impact == impact)
    q = q.order_by(Opportunity.impact_score.desc()).limit(limit)

    result = await db.execute(q)
    opps = list(result.scalars().all())

    # Summary counts
    total_q = select(func.count(Opportunity.id)).where(Opportunity.workspace_id == workspace.id)
    total = (await db.execute(total_q)).scalar_one()

    high_q = select(func.count(Opportunity.id)).where(
        Opportunity.workspace_id == workspace.id,
        Opportunity.impact == "high",
    )
    high_count = (await db.execute(high_q)).scalar_one()

    return {
        "workspace_id": workspace.id,
        "total_detected": total,
        "high_impact_count": high_count,
        "opportunities": [
            {
                "id": o.id,
                "title": o.title,
                "description": o.description,
                "category": o.category,
                "impact": o.impact,
                "impact_score": o.impact_score,
                "effort_score": o.effort_score,
                "recommended_action": o.recommended_action,
                "status": o.status,
                "detected_at": o.detected_at.isoformat(),
            }
            for o in opps
        ],
    }


@router.get("/top", summary="Top opportunities ranked by impact")
async def top_opportunities(
    limit: int = Query(5, ge=1, le=20),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await ensure_seed_leads(db, workspace.id)
    await db.flush()
    await ensure_seed_opportunities(db, workspace)
    await db.flush()

    q = (
        select(Opportunity)
        .where(Opportunity.workspace_id == workspace.id, Opportunity.status == "detected")
        .order_by(Opportunity.impact_score.desc())
        .limit(limit)
    )
    result = await db.execute(q)
    opps = list(result.scalars().all())

    return {
        "workspace_id": workspace.id,
        "opportunities": [
            {
                "id": o.id,
                "title": o.title,
                "category": o.category,
                "impact": o.impact,
                "impact_score": o.impact_score,
                "effort_score": o.effort_score,
                "recommended_action": o.recommended_action,
            }
            for o in opps
        ],
    }


@router.get("/list", summary="List all opportunities (alias for /radar)")
async def opportunity_list(
    category: Optional[str] = Query(None),
    impact: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await opportunity_radar(category=category, impact=impact, limit=limit, workspace=workspace, db=db)
