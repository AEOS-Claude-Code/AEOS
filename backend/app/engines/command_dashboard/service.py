"""
AEOS – Command Dashboard: Service layer.

Aggregates real-time status from ALL AEOS engines into a single view.
"""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("aeos.command_dashboard")


async def get_command_dashboard(db: AsyncSession, workspace_id: str) -> dict:
    """Aggregate all engine statuses into a single dashboard payload."""
    data = {
        "timestamp": datetime.utcnow().isoformat(),
        "workspace_id": workspace_id,
        "company": {},
        "agents": {"total": 0, "active": 0, "departments": 0, "recent_tasks": []},
        "scores": {},
        "engines": [],
        "activity_feed": [],
    }

    # Company profile
    try:
        from app.auth.models import Workspace, WorkspaceProfile
        ws = (await db.execute(select(Workspace).where(Workspace.id == workspace_id))).scalar_one_or_none()
        prof = (await db.execute(select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id))).scalar_one_or_none()
        if ws and prof:
            data["company"] = {"name": ws.name, "industry": prof.industry or "", "team_size": prof.team_size or 1, "website": prof.website_url or ""}
    except Exception:
        pass

    # Agent stats
    try:
        from app.engines.agent_framework_engine.models import AIAgent, AgentTask
        total = (await db.execute(select(func.count(AIAgent.id)).where(AIAgent.workspace_id == workspace_id))).scalar() or 0
        active = (await db.execute(select(func.count(AIAgent.id)).where(AIAgent.workspace_id == workspace_id, AIAgent.status == "active"))).scalar() or 0
        depts = (await db.execute(select(func.count(func.distinct(AIAgent.department))).where(AIAgent.workspace_id == workspace_id))).scalar() or 0
        data["agents"]["total"] = total
        data["agents"]["active"] = active
        data["agents"]["departments"] = depts

        # Recent tasks
        tasks = (await db.execute(
            select(AgentTask).where(AgentTask.workspace_id == workspace_id)
            .order_by(AgentTask.created_at.desc()).limit(10)
        )).scalars().all()
        for t in tasks:
            agent = (await db.execute(select(AIAgent).where(AIAgent.id == t.agent_id))).scalar_one_or_none()
            data["agents"]["recent_tasks"].append({
                "id": t.id, "agent_name": agent.name if agent else "Unknown",
                "department": agent.department if agent else "",
                "task_type": t.task_type, "title": t.title or "",
                "status": t.status, "tokens_used": t.tokens_used or 0,
                "created_at": t.created_at.isoformat() if t.created_at else "",
            })
    except Exception:
        pass

    # Engine scores
    engines = []

    # Digital Presence
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        dp = await get_latest_report(db, workspace_id)
        if dp:
            data["scores"]["digital_presence"] = dp.overall_score or 0
            engines.append({"name": "Digital Presence", "status": "active", "score": dp.overall_score or 0, "last_run": dp.computed_at.isoformat() if dp.computed_at else ""})
    except Exception:
        engines.append({"name": "Digital Presence", "status": "inactive", "score": 0, "last_run": ""})

    # Gap Analysis
    try:
        from app.engines.gap_analysis_engine.service import get_latest_report as get_gap
        gap = await get_gap(db, workspace_id)
        if gap:
            data["scores"]["gap_analysis"] = gap.overall_gap_score or 0
            engines.append({"name": "Gap Analysis", "status": "active", "score": 100 - (gap.overall_gap_score or 0), "last_run": gap.computed_at.isoformat() if gap.computed_at else ""})
    except Exception:
        engines.append({"name": "Gap Analysis", "status": "inactive", "score": 0, "last_run": ""})

    # Competitor Intelligence
    try:
        from app.engines.competitor_intelligence_engine.service import get_latest_report as get_comp
        comp = await get_comp(db, workspace_id)
        if comp:
            data["scores"]["competitive_position"] = comp.overall_positioning or 0
            engines.append({"name": "Competitor Intelligence", "status": "active", "score": comp.overall_positioning or 0, "last_run": comp.computed_at.isoformat() if comp.computed_at else ""})
    except Exception:
        engines.append({"name": "Competitor Intelligence", "status": "inactive", "score": 0, "last_run": ""})

    # Market Research
    try:
        from app.engines.market_research_engine.service import get_latest_report as get_market
        market = await get_market(db, workspace_id)
        if market:
            pos = (market.market_positioning or {}).get("score", 0)
            data["scores"]["market_position"] = pos
            engines.append({"name": "Market Research", "status": "active", "score": pos, "last_run": market.computed_at.isoformat() if market.computed_at else ""})
    except Exception:
        engines.append({"name": "Market Research", "status": "inactive", "score": 0, "last_run": ""})

    # Financial Health
    try:
        from app.engines.financial_health_engine.service import get_latest_report as get_fin
        fin = await get_fin(db, workspace_id)
        if fin:
            data["scores"]["financial_health"] = fin.overall_score or 0
            engines.append({"name": "Financial Health", "status": "active", "score": fin.overall_score or 0, "last_run": fin.computed_at.isoformat() if fin.computed_at else ""})
    except Exception:
        engines.append({"name": "Financial Health", "status": "inactive", "score": 0, "last_run": ""})

    # KPI Framework
    try:
        from app.engines.kpi_framework_engine.service import get_latest as get_kpi
        kpi = await get_kpi(db, workspace_id)
        if kpi:
            data["scores"]["kpi_health"] = kpi.overall_kpi_score or 0
            engines.append({"name": "KPI Framework", "status": "active", "score": kpi.overall_kpi_score or 0, "last_run": kpi.computed_at.isoformat() if kpi.computed_at else ""})
    except Exception:
        engines.append({"name": "KPI Framework", "status": "inactive", "score": 0, "last_run": ""})

    # Business Plan
    try:
        from app.engines.strategy_agent_engine.service import get_latest_plan
        plan = await get_latest_plan(db, workspace_id)
        if plan:
            pct = ((plan.sections_completed or 0) / max(plan.sections_total or 10, 1)) * 100
            engines.append({"name": "Business Plan", "status": "active" if plan.status == "completed" else "generating", "score": pct, "last_run": plan.completed_at.isoformat() if plan.completed_at else ""})
    except Exception:
        engines.append({"name": "Business Plan", "status": "inactive", "score": 0, "last_run": ""})

    data["engines"] = engines

    # Build activity feed from recent tasks + engine runs
    feed = []
    for task in data["agents"]["recent_tasks"][:5]:
        feed.append({"type": "task", "title": f"{task['agent_name']} completed: {task['title'] or task['task_type']}", "time": task["created_at"], "department": task["department"]})

    for eng in engines:
        if eng["status"] == "active" and eng["last_run"]:
            feed.append({"type": "engine", "title": f"{eng['name']} score: {eng['score']:.0f}/100", "time": eng["last_run"], "department": ""})

    feed.sort(key=lambda x: x.get("time", ""), reverse=True)
    data["activity_feed"] = feed[:15]

    return data
