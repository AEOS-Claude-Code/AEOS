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
            from app.modules.billing.models import Subscription, PLANS as ALL_PLANS, TokenWallet
            sub = (await db.execute(
                select(Subscription).where(Subscription.workspace_id == ws.id)
            )).scalar_one_or_none()
            if sub:
                plan_tier = sub.plan_tier or "starter"
                plan_info = ALL_PLANS.get(plan_tier, {})
                tokens_included = plan_info.get("included_tokens", 5000)

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
    from app.modules.billing.models import Subscription, PLANS as BILLING_PLANS, TokenWallet

    valid_tiers = list(BILLING_PLANS.keys())
    if plan_tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {', '.join(valid_tiers)}")

    sub = (await db.execute(
        select(Subscription).where(Subscription.workspace_id == workspace_id)
    )).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Workspace subscription not found")

    old_tier = sub.plan_tier
    sub.plan_tier = plan_tier

    # Update token wallet included tokens to match new plan
    plan_info = BILLING_PLANS[plan_tier]
    wallet = (await db.execute(
        select(TokenWallet).where(TokenWallet.workspace_id == workspace_id)
    )).scalar_one_or_none()
    if wallet:
        wallet.included_tokens = plan_info["included_tokens"]

    await db.commit()

    logger.info("Admin changed workspace %s plan: %s -> %s", workspace_id, old_tier, plan_tier)
    return {"workspace_id": workspace_id, "old_plan": old_tier, "new_plan": plan_tier, "plan_name": plan_info["name"]}


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
    """Get comprehensive system health indicators."""
    import os
    import time

    health: dict = {
        "api_version": "0.5.0",
        "engines_registered": 15,
        "services": {},
        "anthropic": {},
    }

    # Database health
    try:
        from sqlalchemy import text as sa_text
        start = time.time()
        await db.execute(sa_text("SELECT 1"))
        latency = round((time.time() - start) * 1000)
        health["services"]["database"] = {"status": "healthy", "latency_ms": latency}
    except Exception as e:
        health["services"]["database"] = {"status": "unhealthy", "error": str(e)[:100]}

    # Redis health
    try:
        redis_url = os.getenv('REDIS_URL', '')
        if not redis_url:
            try:
                from app.core.config import get_settings
                s = get_settings()
                redis_url = getattr(s, 'REDIS_URL', '')
            except Exception:
                pass
        if redis_url:
            try:
                import redis.asyncio as aioredis
                start = time.time()
                r = aioredis.from_url(redis_url, socket_connect_timeout=3)
                await r.ping()
                latency = round((time.time() - start) * 1000)
                await r.close()
                health["services"]["redis"] = {"status": "healthy", "latency_ms": latency}
            except ImportError:
                health["services"]["redis"] = {"status": "not_installed", "latency_ms": 0, "error": "redis package not installed"}
            except Exception as e:
                health["services"]["redis"] = {"status": "unhealthy", "error": str(e)[:100]}
        else:
            health["services"]["redis"] = {"status": "not_configured", "latency_ms": 0}
    except Exception as e:
        health["services"]["redis"] = {"status": "error", "error": str(e)[:100]}

    # Backend (self)
    health["services"]["backend"] = {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "render_instance": os.getenv("RENDER_INSTANCE_ID", "unknown"),
    }

    # Anthropic API key check + balance
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if api_key:
        health["anthropic"]["key_set"] = True
        health["anthropic"]["key_prefix"] = api_key[:12] + "..."
        # Try to check if key works by making a minimal API call
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                    }
                )
                # 405 = method not allowed (key works, just wrong method)
                # 401 = invalid key
                if resp.status_code == 405:
                    health["anthropic"]["key_valid"] = True
                elif resp.status_code == 401:
                    health["anthropic"]["key_valid"] = False
                    health["anthropic"]["error"] = "Invalid API key"
                else:
                    health["anthropic"]["key_valid"] = True
        except Exception as e:
            health["anthropic"]["key_valid"] = False
            health["anthropic"]["error"] = str(e)[:100]
    else:
        health["anthropic"]["key_set"] = False
        health["anthropic"]["key_valid"] = False

    # Token usage stats + estimated cost
    try:
        from app.modules.billing.models import TokenWallet, TokenUsage
        from app.auth.models import Workspace
        from sqlalchemy import select as sel, func as fn

        total_used = (await db.execute(sel(fn.sum(TokenWallet.used_tokens)))).scalar() or 0
        total_purchased = (await db.execute(sel(fn.sum(TokenWallet.purchased_tokens)))).scalar() or 0
        total_included = (await db.execute(sel(fn.sum(TokenWallet.included_tokens)))).scalar() or 0

        # AI-powered operations that actually call Claude API
        AI_OPERATIONS = {
            "copilot_query", "business_plan_generate", "business_plan_generation",
            "competitor_discover", "competitor_discovery", "strategy_generation",
            "agent_execute_task", "agent_task_execution", "ask_aeos",
        }

        # Per-operation token usage
        op_usage = (await db.execute(
            sel(TokenUsage.operation, fn.sum(TokenUsage.tokens_consumed).label("total"))
            .group_by(TokenUsage.operation)
            .order_by(fn.sum(TokenUsage.tokens_consumed).desc())
        )).all()

        operations = []
        ai_tokens_total = 0
        non_ai_tokens_total = 0
        for row in op_usage:
            op_name = row[0]
            op_tokens = row[1] or 0
            is_ai = op_name in AI_OPERATIONS
            operations.append({
                "operation": op_name,
                "tokens": op_tokens,
                "ai_powered": is_ai,
            })
            if is_ai:
                ai_tokens_total += op_tokens
            else:
                non_ai_tokens_total += op_tokens

        # Per-workspace token usage with AI breakdown
        ws_usage = (await db.execute(
            sel(
                TokenWallet.workspace_id,
                TokenWallet.used_tokens,
                TokenWallet.included_tokens,
                TokenWallet.purchased_tokens,
            )
        )).all()

        workspace_costs = []
        for row in ws_usage:
            ws_id = row[0]
            ws = (await db.execute(sel(Workspace).where(Workspace.id == ws_id))).scalar_one_or_none()

            # Get AI-only token usage for this workspace
            ws_ai_tokens = (await db.execute(
                sel(fn.sum(TokenUsage.tokens_consumed))
                .where(TokenUsage.workspace_id == ws_id)
                .where(TokenUsage.operation.in_(AI_OPERATIONS))
            )).scalar() or 0

            workspace_costs.append({
                "workspace_id": ws_id,
                "workspace_name": ws.name if ws else "Unknown",
                "tokens_used": row[1] or 0,
                "tokens_included": row[2] or 0,
                "tokens_purchased": row[3] or 0,
                "ai_tokens_used": ws_ai_tokens,
            })

        # Estimate USD cost ONLY for AI-powered operations
        # ~$3/million input + ~$15/million output, average ~$9/million tokens
        # Our internal tokens map roughly 1:100 to API tokens
        ai_api_tokens = ai_tokens_total * 100
        estimated_cost_usd = round(ai_api_tokens * 9 / 1_000_000, 2)

        health["token_stats"] = {
            "total_used_platform": total_used,
            "total_purchased_platform": total_purchased,
            "total_included_platform": total_included,
            "ai_tokens_used": ai_tokens_total,
            "non_ai_tokens_used": non_ai_tokens_total,
            "estimated_api_tokens": ai_api_tokens,
            "estimated_cost_usd": estimated_cost_usd,
            "cost_per_1k_tokens": 0.9,
            "operations": operations,
            "workspace_breakdown": workspace_costs,
        }
    except Exception as e:
        logger.warning("Token stats failed: %s", e)
        health["token_stats"] = {
            "total_used_platform": 0, "total_purchased_platform": 0,
            "total_included_platform": 0, "estimated_api_tokens": 0,
            "estimated_cost_usd": 0, "cost_per_1k_tokens": 0,
            "operations": [], "workspace_breakdown": [],
        }

    return health
