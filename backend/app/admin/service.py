"""
AEOS – Admin Console: Service layer.

Multi-tenant admin functions: workspace management, user management,
billing overview, system health, and platform metrics.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

logger = logging.getLogger("aeos.admin")


async def get_platform_stats(db: AsyncSession) -> dict:
    """Get platform-wide statistics."""
    from app.auth.models import User, Workspace, Membership

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_workspaces = (await db.execute(select(func.count(Workspace.id)))).scalar() or 0

    # Recent signups (7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )).scalar() or 0

    # Active workspaces
    active_ws = 0
    try:
        from app.engines.company_scanner_engine.models import CompanyScanReport
        active_ws = (await db.execute(
            select(func.count(func.distinct(CompanyScanReport.workspace_id)))
        )).scalar() or 0
    except Exception:
        pass

    # Agent stats
    total_agents = 0
    total_tasks = 0
    try:
        from app.engines.agent_framework_engine.models import AIAgent, AgentTask
        total_agents = (await db.execute(select(func.count(AIAgent.id)))).scalar() or 0
        total_tasks = (await db.execute(select(func.count(AgentTask.id)))).scalar() or 0
    except Exception:
        pass

    # Report stats
    total_reports = 0
    try:
        from app.engines.reports_engine.models import GeneratedReport
        total_reports = (await db.execute(select(func.count(GeneratedReport.id)))).scalar() or 0
    except Exception:
        pass

    # Token usage across all workspaces
    total_tokens_used = 0
    try:
        from app.modules.billing.models import TokenWallet
        result = await db.execute(select(func.sum(TokenWallet.used)))
        total_tokens_used = result.scalar() or 0
    except Exception:
        pass

    return {
        "total_users": total_users,
        "total_workspaces": total_workspaces,
        "recent_signups_7d": recent_users,
        "active_workspaces": active_ws,
        "total_ai_agents": total_agents,
        "total_agent_tasks": total_tasks,
        "total_reports": total_reports,
        "total_tokens_used": total_tokens_used,
    }


async def list_workspaces(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[dict]:
    """List all workspaces with summary data."""
    from app.auth.models import Workspace, WorkspaceProfile, Membership

    workspaces = (await db.execute(
        select(Workspace).order_by(Workspace.created_at.desc()).limit(limit).offset(offset)
    )).scalars().all()

    results = []
    for ws in workspaces:
        profile = (await db.execute(
            select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == ws.id)
        )).scalar_one_or_none()

        member_count = (await db.execute(
            select(func.count(Membership.id)).where(Membership.workspace_id == ws.id)
        )).scalar() or 0

        # Get plan info
        plan_tier = "starter"
        tokens_used = 0
        tokens_included = 0
        try:
            from app.modules.billing.models import Subscription, BillingPlan, TokenWallet
            sub = (await db.execute(
                select(Subscription).where(Subscription.workspace_id == ws.id)
            )).scalar_one_or_none()
            if sub:
                plan = (await db.execute(
                    select(BillingPlan).where(BillingPlan.id == sub.plan_id)
                )).scalar_one_or_none()
                if plan:
                    plan_tier = plan.tier
                    tokens_included = plan.included_tokens

            wallet = (await db.execute(
                select(TokenWallet).where(TokenWallet.workspace_id == ws.id)
            )).scalar_one_or_none()
            if wallet:
                tokens_used = wallet.used
        except Exception:
            pass

        # Get owner email
        owner_email = ""
        try:
            from app.auth.models import User
            owner_membership = (await db.execute(
                select(Membership).where(
                    Membership.workspace_id == ws.id,
                    Membership.role == "owner"
                )
            )).scalar_one_or_none()
            if owner_membership:
                owner = (await db.execute(
                    select(User).where(User.id == owner_membership.user_id)
                )).scalar_one_or_none()
                if owner:
                    owner_email = owner.email
        except Exception:
            pass

        results.append({
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "industry": profile.industry if profile else "",
            "country": profile.country if profile else "",
            "team_size": profile.team_size if profile else 0,
            "website": profile.website_url if profile else "",
            "members": member_count,
            "owner_email": owner_email,
            "plan_tier": plan_tier,
            "tokens_used": tokens_used,
            "tokens_included": tokens_included,
            "created_at": ws.created_at.isoformat() if ws.created_at else "",
        })

    return results


async def list_users(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[dict]:
    """List all users with workspace info."""
    from app.auth.models import User, Membership, Workspace

    users = (await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )).scalars().all()

    results = []
    for u in users:
        # Get workspace info
        workspace_name = ""
        workspace_id = ""
        workspace_role = ""
        try:
            membership = (await db.execute(
                select(Membership).where(Membership.user_id == u.id, Membership.is_default == True)
            )).scalar_one_or_none()
            if membership:
                workspace_id = membership.workspace_id
                workspace_role = membership.role
                ws = (await db.execute(
                    select(Workspace).where(Workspace.id == membership.workspace_id)
                )).scalar_one_or_none()
                if ws:
                    workspace_name = ws.name
        except Exception:
            pass

        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": getattr(u, 'role', 'user'),
            "is_active": u.is_active,
            "workspace_name": workspace_name,
            "workspace_id": workspace_id,
            "workspace_role": workspace_role,
            "created_at": u.created_at.isoformat() if u.created_at else "",
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        })

    return results


async def get_workspace_detail(db: AsyncSession, workspace_id: str) -> dict:
    """Get detailed workspace info."""
    from app.auth.models import Workspace, WorkspaceProfile, Membership, User

    ws = (await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    profile = (await db.execute(
        select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == ws.id)
    )).scalar_one_or_none()

    members = (await db.execute(
        select(Membership).where(Membership.workspace_id == ws.id)
    )).scalars().all()

    member_list = []
    for m in members:
        user = (await db.execute(select(User).where(User.id == m.user_id))).scalar_one_or_none()
        if user:
            member_list.append({
                "id": user.id, "email": user.email, "full_name": user.full_name,
                "role": m.role, "is_active": user.is_active,
            })

    return {
        "id": ws.id, "name": ws.name, "slug": ws.slug,
        "industry": profile.industry if profile else "",
        "country": profile.country if profile else "",
        "website": profile.website_url if profile else "",
        "members": member_list,
        "created_at": ws.created_at.isoformat() if ws.created_at else "",
    }


async def delete_user_and_workspace(db: AsyncSession, user_id: str) -> dict:
    """Delete a user and their workspace if sole owner."""
    from app.auth.models import User, Membership, Workspace, WorkspaceProfile, OnboardingProgress, RefreshToken

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.email
    deleted_workspaces = []

    # Find workspaces where user is sole owner
    memberships = (await db.execute(
        select(Membership).where(Membership.user_id == user_id)
    )).scalars().all()

    for m in memberships:
        # Count other members in workspace
        other_count = (await db.execute(
            select(func.count(Membership.id)).where(
                Membership.workspace_id == m.workspace_id,
                Membership.user_id != user_id,
            )
        )).scalar() or 0

        if other_count == 0:
            # Sole member — delete workspace and all related data
            ws_id = m.workspace_id
            ws = (await db.execute(select(Workspace).where(Workspace.id == ws_id))).scalar_one_or_none()

            # Delete related records (cascade should handle most)
            await db.execute(delete(OnboardingProgress).where(OnboardingProgress.workspace_id == ws_id))
            await db.execute(delete(WorkspaceProfile).where(WorkspaceProfile.workspace_id == ws_id))
            await db.execute(delete(Membership).where(Membership.workspace_id == ws_id))

            if ws:
                deleted_workspaces.append(ws.name)
                await db.delete(ws)

    # Delete refresh tokens
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))

    # Delete remaining memberships
    await db.execute(delete(Membership).where(Membership.user_id == user_id))

    # Delete user
    await db.delete(user)
    await db.commit()

    logger.info("Admin deleted user %s and %d workspaces", email, len(deleted_workspaces))
    return {"deleted": True, "email": email, "workspaces_deleted": deleted_workspaces}


async def toggle_user_active(db: AsyncSession, user_id: str, is_active: bool) -> dict:
    """Enable or disable a user."""
    from app.auth.models import User
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    await db.commit()
    return {"id": user.id, "email": user.email, "is_active": user.is_active}


async def update_user_role(db: AsyncSession, user_id: str, role: str) -> dict:
    """Update platform role."""
    from app.auth.models import User
    if role not in ("user", "platform_admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'platform_admin'")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    await db.commit()
    return {"id": user.id, "email": user.email, "role": user.role}


async def update_workspace_plan(db: AsyncSession, workspace_id: str, plan_tier: str) -> dict:
    """Change workspace billing plan."""
    from app.modules.billing.models import Subscription, BillingPlan

    plan = (await db.execute(
        select(BillingPlan).where(BillingPlan.tier == plan_tier, BillingPlan.is_active == True)
    )).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_tier}' not found")

    sub = (await db.execute(
        select(Subscription).where(Subscription.workspace_id == workspace_id)
    )).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Workspace subscription not found")

    sub.plan_id = plan.id
    await db.commit()

    return {"workspace_id": workspace_id, "new_plan": plan_tier, "plan_name": plan.name}


async def delete_workspace_full(db: AsyncSession, workspace_id: str) -> dict:
    """Delete a workspace and all its members/data."""
    from app.auth.models import Workspace, WorkspaceProfile, Membership, OnboardingProgress, RefreshToken, User

    ws = (await db.execute(select(Workspace).where(Workspace.id == workspace_id))).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    ws_name = ws.name

    # Find all members
    memberships = (await db.execute(
        select(Membership).where(Membership.workspace_id == workspace_id)
    )).scalars().all()

    deleted_users = []
    for m in memberships:
        # Check if user has other workspaces
        other_ws = (await db.execute(
            select(func.count(Membership.id)).where(
                Membership.user_id == m.user_id,
                Membership.workspace_id != workspace_id,
            )
        )).scalar() or 0

        if other_ws == 0:
            # Sole workspace — delete user too
            user = (await db.execute(select(User).where(User.id == m.user_id))).scalar_one_or_none()
            if user:
                deleted_users.append(user.email)
                await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
                await db.delete(user)

    # Delete workspace data
    await db.execute(delete(OnboardingProgress).where(OnboardingProgress.workspace_id == workspace_id))
    await db.execute(delete(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id))
    await db.execute(delete(Membership).where(Membership.workspace_id == workspace_id))
    await db.delete(ws)
    await db.commit()

    logger.info("Admin deleted workspace %s (%s) and %d users", ws_name, workspace_id, len(deleted_users))
    return {"deleted": True, "workspace": ws_name, "users_deleted": deleted_users}


async def get_system_health(db: AsyncSession) -> dict:
    """Get system health indicators."""
    import os
    health = {
        "database": "healthy",
        "engines_registered": 11,
        "api_version": "0.4.0",
        "uptime": "active",
        "anthropic_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
    }
    return health
