"""
AEOS – Strategic Intelligence Engine: API Router.

Exposes the SIE outputs as REST endpoints.
All endpoints are synchronous wrappers around the deterministic service
layer — no async DB queries yet (those come when real engine data lands).

Prefix: /api/v1/strategy
"""

from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Optional

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

# In Phase 2-3, workspace_id will come from the authenticated JWT token.
# For now, we use a default placeholder for local development.
DEFAULT_WORKSPACE = "ws-demo-001"


@router.get(
    "/summary",
    response_model=StrategicSummary,
    summary="Strategic summary",
    description=(
        "Returns the full strategic summary including health scores, "
        "headline, key insight, and the complete signal map."
    ),
)
async def strategic_summary(
    workspace_id: str = Query(DEFAULT_WORKSPACE, description="Workspace ID"),
):
    return service.get_strategic_summary(workspace_id)


@router.get(
    "/priorities",
    response_model=PriorityList,
    summary="Strategic priorities",
    description=(
        "Returns ranked strategic priorities. "
        "Optionally filter by category."
    ),
)
async def strategic_priorities(
    workspace_id: str = Query(DEFAULT_WORKSPACE, description="Workspace ID"),
    category: Optional[PriorityCategory] = Query(
        None, description="Filter by priority category"
    ),
):
    return service.get_priorities(workspace_id, category=category)


@router.get(
    "/roadmap",
    response_model=RoadmapResponse,
    summary="30/60/90 day roadmaps",
    description=(
        "Returns roadmaps for 30, 60, and 90 day horizons "
        "with prioritized actions and department assignments."
    ),
)
async def strategic_roadmap(
    workspace_id: str = Query(DEFAULT_WORKSPACE, description="Workspace ID"),
):
    return service.get_roadmaps(workspace_id)


@router.get(
    "/risks",
    response_model=RiskList,
    summary="Strategic risk alerts",
    description=(
        "Returns active risk alerts sorted by severity. "
        "Optionally filter by severity level."
    ),
)
async def strategic_risks(
    workspace_id: str = Query(DEFAULT_WORKSPACE, description="Workspace ID"),
    severity: Optional[Severity] = Query(
        None, description="Filter by severity level"
    ),
):
    risk_list = service.get_risks(workspace_id)
    if severity is not None:
        risk_list.risks = [r for r in risk_list.risks if r.severity == severity]
    return risk_list


@router.get(
    "/context-pack",
    response_model=ContextPack,
    summary="Compressed context pack",
    description=(
        "Returns a compressed context pack for AI consumption. "
        "Used internally by Ask AEOS and Executive Briefing."
    ),
)
async def context_pack(
    workspace_id: str = Query(DEFAULT_WORKSPACE, description="Workspace ID"),
):
    return service.get_context_pack(workspace_id)
