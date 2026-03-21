"""
AEOS – Strategic Intelligence Engine: API Router.

Phase 3.5: Authenticated, workspace-scoped, queries real DB.
Returns sensible defaults when no strategy data exists for new workspaces.

Prefix: /api/v1/strategy
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace

from app.engines.strategic_intelligence_engine.schemas import (
    ContextPack,
    HealthScore,
    PriorityCategory,
    PriorityList,
    RiskList,
    RoadmapResponse,
    Severity,
    SignalMap,
    StrategicSummary,
)
from app.engines.strategic_intelligence_engine import service

logger = logging.getLogger("aeos.engine.strategy.router")

router = APIRouter(prefix="/v1/strategy", tags=["Strategic Intelligence"])


def _default_summary(workspace: Workspace) -> StrategicSummary:
    """Return a safe default summary for new/empty workspaces."""
    return StrategicSummary(
        workspace_id=workspace.id,
        company_name=workspace.name or "Workspace",
        health_score=HealthScore(
            overall=0, digital_presence=0, lead_generation=0,
            competitive_position=0, integration_coverage=0, setup_completeness=0,
        ),
        headline="Getting ready — complete setup to unlock strategic intelligence.",
        key_insight="Complete the AEOS Setup Wizard to unlock strategic insights.",
        signal_map=SignalMap(),
        generated_at=datetime.utcnow(),
    )


def _default_priorities(workspace: Workspace) -> PriorityList:
    return PriorityList(
        workspace_id=workspace.id, priorities=[], generated_at=datetime.utcnow(),
    )


def _default_roadmap(workspace: Workspace) -> RoadmapResponse:
    return RoadmapResponse(
        workspace_id=workspace.id, roadmaps={}, generated_at=datetime.utcnow(),
    )


def _default_risks(workspace: Workspace) -> RiskList:
    return RiskList(
        workspace_id=workspace.id, risks=[], generated_at=datetime.utcnow(),
    )


@router.get(
    "/summary",
    response_model=StrategicSummary,
    summary="Strategic summary",
)
async def strategic_summary(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_strategic_summary(db, workspace)
    except Exception:
        logger.warning("Strategy summary failed for workspace=%s — returning defaults", workspace.id, exc_info=True)
        return _default_summary(workspace)


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
    try:
        return await service.get_priorities(db, workspace, category=category)
    except Exception:
        logger.warning("Strategy priorities failed for workspace=%s — returning defaults", workspace.id, exc_info=True)
        return _default_priorities(workspace)


@router.get(
    "/roadmap",
    response_model=RoadmapResponse,
    summary="30/60/90 day roadmaps",
)
async def strategic_roadmap(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_roadmaps(db, workspace)
    except Exception:
        logger.warning("Strategy roadmap failed for workspace=%s — returning defaults", workspace.id, exc_info=True)
        return _default_roadmap(workspace)


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
    try:
        risk_list = await service.get_risks(db, workspace)
        if severity is not None:
            risk_list.risks = [r for r in risk_list.risks if r.severity == severity]
        return risk_list
    except Exception:
        logger.warning("Strategy risks failed for workspace=%s — returning defaults", workspace.id, exc_info=True)
        return _default_risks(workspace)


@router.get(
    "/context-pack",
    response_model=ContextPack,
    summary="Compressed context pack",
)
async def context_pack(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await service.get_context_pack(db, workspace)
    except Exception:
        logger.warning("Strategy context-pack failed for workspace=%s — returning defaults", workspace.id, exc_info=True)
        return ContextPack(
            workspace_id=workspace.id,
            company_name=workspace.name or "Workspace",
            industry="general",
            health_score=0,
            top_priorities=[],
            active_risks=[],
            key_metrics={},
            generated_at=datetime.utcnow(),
        )
