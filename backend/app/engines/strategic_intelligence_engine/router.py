"""
AEOS – Strategic Intelligence Engine: API Router.

Phase 3.5: Authenticated, workspace-scoped, queries real DB.

Prefix: /api/v1/strategy
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace

from app.engines.strategic_intelligence_engine.schemas import (
    ContextPack,
    PriorityCategory,
    PriorityList,
    RiskList,
    RoadmapResponse,
    Severity,
    StrategicSummary,
)
from app.engines.strategic_intelligence_engine import service

router = APIRouter(prefix="/v1/strategy", tags=["Strategic Intelligence"])


@router.get(
    "/summary",
    response_model=StrategicSummary,
    summary="Strategic summary",
)
async def strategic_summary(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_strategic_summary(db, workspace)


@router.get(
    "/priorities",
    response_model=PriorityList,
    summary="Strategic priorities",
)
async def strategic_priorities(
    category: Optional[PriorityCategory] = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_priorities(db, workspace, category=category)


@router.get(
    "/roadmap",
    response_model=RoadmapResponse,
    summary="30/60/90 day roadmaps",
)
async def strategic_roadmap(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_roadmaps(db, workspace)


@router.get(
    "/risks",
    response_model=RiskList,
    summary="Strategic risk alerts",
)
async def strategic_risks(
    severity: Optional[Severity] = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    risk_list = await service.get_risks(db, workspace)
    if severity is not None:
        risk_list.risks = [r for r in risk_list.risks if r.severity == severity]
    return risk_list


@router.get(
    "/context-pack",
    response_model=ContextPack,
    summary="Compressed context pack",
)
async def context_pack(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_context_pack(db, workspace)
