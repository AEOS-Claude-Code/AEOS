"""
AEOS – Strategy Agent Engine: API router.

POST /v1/business-plan/generate
GET  /v1/business-plan/latest
GET  /v1/business-plan/{plan_id}
GET  /v1/business-plan/{plan_id}/progress
POST /v1/business-plan/{plan_id}/regenerate/{section_key}
GET  /v1/business-plan/history
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .models import SECTION_KEYS, SECTION_TITLES
from .schemas import (
    BusinessPlanResponse,
    BusinessPlanSection,
    BusinessPlanProgress,
    BusinessPlanListItem,
    GenerateRequest,
    GenerateResponse,
)
from .service import (
    generate_business_plan,
    get_latest_plan,
    get_plan_by_id,
    list_plans,
    regenerate_section,
)

logger = logging.getLogger("aeos.engine.strategy_agent.router")

router = APIRouter(prefix="/v1/business-plan", tags=["Strategy Agent Engine"])


def _format_dt(dt) -> str | None:
    return dt.isoformat() if dt else None


def _plan_to_response(plan) -> BusinessPlanResponse:
    """Convert DB model to response schema."""
    sections_data = plan.sections or {}
    sections = []
    for key in SECTION_KEYS:
        sec = sections_data.get(key, {})
        sections.append(BusinessPlanSection(
            key=key,
            title=SECTION_TITLES.get(key, key.replace("_", " ").title()),
            status=sec.get("status", "pending"),
            content=sec.get("content", ""),
            word_count=sec.get("word_count", 0),
            generated_at=sec.get("generated_at"),
        ))

    return BusinessPlanResponse(
        id=plan.id,
        workspace_id=plan.workspace_id,
        status=plan.status,
        title=plan.title or "",
        version=plan.version or 1,
        sections=sections,
        current_section=plan.current_section,
        sections_completed=plan.sections_completed or 0,
        sections_total=plan.sections_total or 10,
        metadata=plan.metadata_json or {},
        started_at=_format_dt(plan.started_at),
        completed_at=_format_dt(plan.completed_at),
        created_at=_format_dt(plan.created_at),
    )


@router.post("/generate", response_model=GenerateResponse)
async def trigger_generate(
    body: GenerateRequest = GenerateRequest(),
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new AI-powered business plan."""
    try:
        plan = await generate_business_plan(
            db, membership.workspace_id, user.id,
        )
        await db.commit()

        return GenerateResponse(
            plan_id=plan.id,
            status=plan.status,
            message=f"Business plan v{plan.version} generated successfully.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.exception("Business plan generation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Business plan generation failed. Please try again.",
        )


@router.get("/latest", response_model=BusinessPlanResponse)
async def get_latest(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest business plan for this workspace."""
    plan = await get_latest_plan(db, membership.workspace_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business plan found. Generate one first.",
        )
    return _plan_to_response(plan)


@router.get("/history", response_model=list[BusinessPlanListItem])
async def get_history(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """List all business plans for this workspace."""
    plans = await list_plans(db, membership.workspace_id)
    return [
        BusinessPlanListItem(
            id=p.id,
            title=p.title or "",
            status=p.status,
            version=p.version or 1,
            sections_completed=p.sections_completed or 0,
            sections_total=p.sections_total or 10,
            created_at=_format_dt(p.created_at) or "",
        )
        for p in plans
    ]


@router.get("/{plan_id}", response_model=BusinessPlanResponse)
async def get_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific business plan by ID."""
    plan = await get_plan_by_id(db, plan_id)
    if not plan or plan.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return _plan_to_response(plan)


@router.get("/{plan_id}/progress", response_model=BusinessPlanProgress)
async def get_progress(
    plan_id: str,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Lightweight progress poll for a generating plan."""
    plan = await get_plan_by_id(db, plan_id)
    if not plan or plan.workspace_id != membership.workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    return BusinessPlanProgress(
        id=plan.id,
        status=plan.status,
        current_section=plan.current_section,
        sections_completed=plan.sections_completed or 0,
        sections_total=plan.sections_total or 10,
    )


@router.post("/{plan_id}/regenerate/{section_key}")
async def regenerate(
    plan_id: str,
    section_key: str,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate a single section of an existing plan."""
    try:
        plan = await regenerate_section(db, plan_id, section_key)
        await db.commit()
        return {"status": "regenerated", "section": section_key}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
