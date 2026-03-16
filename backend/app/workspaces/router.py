"""
AEOS – Workspace API router.

GET /api/v1/workspaces/current
GET /api/v1/workspaces/current/readiness
"""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace, get_current_membership
from app.auth.models import Workspace, Membership
from app.auth.schemas import (
    WorkspaceResponse,
    WorkspacePlanResponse,
    TokenUsageResponse as TokenUsageSchemaResponse,
    WorkspaceSetupResponse,
    ReadinessResponse,
)
from app.modules.billing.service import get_or_create_subscription, get_or_create_wallet
from app.modules.billing.models import PLANS

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces"])


async def _build_workspace_response(
    workspace: Workspace, membership: Membership, db: AsyncSession,
) -> WorkspaceResponse:
    """Build the full workspace response from ORM models + billing tables."""
    profile = workspace.profile
    onboarding = workspace.onboarding

    # Find owner
    owner_member = next((m for m in workspace.memberships if m.role == "owner"), None)
    owner_info = {}
    if owner_member and owner_member.user:
        owner_info = {
            "id": owner_member.user.id,
            "email": owner_member.user.email,
            "full_name": owner_member.user.full_name,
        }

    # Real billing data
    sub = await get_or_create_subscription(db, workspace.id)
    wallet = await get_or_create_wallet(db, workspace.id)
    plan = PLANS.get(sub.plan_tier, PLANS["starter"])

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        industry=profile.industry if profile else "general",
        country=profile.country if profile else "",
        city=profile.city if profile else "",
        team_size=profile.team_size if profile else 1,
        website_url=profile.website_url if profile else "",
        logo_url=None,
        plan=WorkspacePlanResponse(
            id=plan["id"],
            name=plan["name"],
            tier=plan["tier"],
            price_monthly=plan["price_monthly"],
            max_workspaces=plan["max_workspaces"],
            max_users=plan["max_users"],
            included_tokens=plan["included_tokens"],
            is_active=sub.status in ("trialing", "active"),
            current_period_start=sub.current_period_start.isoformat(),
            current_period_end=sub.current_period_end.isoformat(),
        ),
        token_usage=TokenUsageSchemaResponse(
            included=wallet.included_tokens,
            used=wallet.used_tokens,
            purchased=wallet.purchased_tokens,
            remaining=wallet.available,
            purchased_expires_at=wallet.purchased_expires_at.isoformat() if wallet.purchased_expires_at else None,
            reset_at=wallet.reset_at.isoformat(),
        ),
        setup=WorkspaceSetupResponse(
            completed=onboarding.completed if onboarding else False,
            current_step=onboarding.current_step if onboarding else 1,
            steps={
                "company_profile": onboarding.step_company if onboarding else False,
                "website_and_social": onboarding.step_presence if onboarding else False,
                "competitors": onboarding.step_competitors if onboarding else False,
                "connect_platforms": onboarding.step_integrations if onboarding else False,
                "dashboard_ready": onboarding.step_complete if onboarding else False,
            },
        ),
        owner=owner_info,
        created_at=workspace.created_at.isoformat(),
    )


@router.get(
    "/current",
    response_model=WorkspaceResponse,
    summary="Get current workspace",
)
async def current_workspace(
    workspace: Workspace = Depends(get_current_workspace),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    return await _build_workspace_response(workspace, membership, db)


@router.get(
    "/current/readiness",
    response_model=ReadinessResponse,
    summary="Get workspace onboarding readiness",
)
async def workspace_readiness(
    workspace: Workspace = Depends(get_current_workspace),
):
    onboarding = workspace.onboarding
    if not onboarding:
        return ReadinessResponse(
            workspace_id=workspace.id,
            percentage=0,
            status="new",
            steps={
                "company_profile": False,
                "website_and_social": False,
                "competitors": False,
                "connect_platforms": False,
                "dashboard_ready": False,
            },
        )

    return ReadinessResponse(
        workspace_id=workspace.id,
        percentage=onboarding.readiness_pct,
        status=onboarding.readiness_status,
        steps={
            "company_profile": onboarding.step_company,
            "website_and_social": onboarding.step_presence,
            "competitors": onboarding.step_competitors,
            "connect_platforms": onboarding.step_integrations,
            "dashboard_ready": onboarding.step_complete,
        },
    )
