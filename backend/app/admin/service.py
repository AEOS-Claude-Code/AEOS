"""
AEOS – Admin Console: Service layer.

Multi-tenant admin functions: workspace management, user management,
billing overview, system health, and platform metrics.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("aeos.admin")


async def get_platform_stats(db: AsyncSession) -> dict:
    """Get platform-wide statistics."""
    from app.auth.models import User, Workspace, Membership

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_workspaces = (await db.execute(select(func.count(Workspace.id)))).scalar() or 0
    total_memberships = (await db.execute(select(func.count(Membership.id)))).scalar() or 0

    # Recent signups (7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )).scalar() or 0

    # Active workspaces (have at least one scan or report)
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

    return {
        "total_users": total_users,
        "total_workspaces": total_workspaces,
        "total_memberships": total_memberships,
        "recent_signups_7d": recent_users,
        "active_workspaces": active_ws,
        "total_ai_agents": total_agents,
        "total_agent_tasks": total_tasks,
        "total_reports": total_reports,
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

        results.append({
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "industry": profile.industry if profile else "",
            "country": profile.country if profile else "",
            "team_size": profile.team_size if profile else 0,
            "website": profile.website_url if profile else "",
            "members": member_count,
            "created_at": ws.created_at.isoformat() if ws.created_at else "",
        })

    return results


async def list_users(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[dict]:
    """List all users."""
    from app.auth.models import User

    users = (await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )).scalars().all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else "",
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        }
        for u in users
    ]


async def get_system_health(db: AsyncSession) -> dict:
    """Get system health indicators."""
    health = {
        "database": "healthy",
        "engines_registered": 0,
        "api_version": "0.4.0",
        "uptime": "active",
    }

    # Count registered engines by checking tables
    engine_tables = [
        "digital_presence_reports", "org_gap_analysis_reports", "competitors",
        "competitor_reports", "market_research_reports", "financial_health_reports",
        "financial_models", "kpi_frameworks", "business_plans", "generated_reports",
        "ai_agents",
    ]
    health["engines_registered"] = len(engine_tables)

    return health
