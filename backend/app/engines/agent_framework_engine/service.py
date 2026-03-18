"""
AEOS – AI Agent Framework: Service layer.

Deploys agents, assigns tasks, and manages the AI organization.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AIAgent, AgentTask
from .agent_templates import DEPARTMENT_AGENTS, build_system_prompt
from .executor import execute_task

logger = logging.getLogger("aeos.engine.agent_framework")


async def deploy_agents(db: AsyncSession, workspace_id: str, industry: str = "") -> dict:
    """Deploy AI agents for all departments. Idempotent — skips existing agents."""
    from app.auth.models import Workspace, WorkspaceProfile

    if not industry:
        prof = (await db.execute(
            select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id)
        )).scalar_one_or_none()
        industry = prof.industry if prof else "other"

    ws = (await db.execute(select(Workspace).where(Workspace.id == workspace_id))).scalar_one_or_none()
    company_name = ws.name if ws else "Company"

    # Get existing agents
    existing = (await db.execute(
        select(AIAgent).where(AIAgent.workspace_id == workspace_id)
    )).scalars().all()
    existing_roles = {a.role for a in existing}

    # Get org chart departments
    from app.engines.smart_intake_engine.org_chart_engine import generate_org_chart
    org = generate_org_chart(industry=industry)

    agents_created = 0
    for dept_data in org["departments"]:
        dept_id = dept_data["id"]
        dept_templates = DEPARTMENT_AGENTS.get(dept_id, {})

        # Deploy director
        director_tpl = dept_templates.get("director")
        if director_tpl and director_tpl["name"] not in existing_roles:
            agent = AIAgent(
                workspace_id=workspace_id,
                name=director_tpl["name"],
                role=director_tpl["name"],
                department=dept_id,
                agent_type="director",
                description=director_tpl["description"],
                system_prompt=build_system_prompt(
                    company_name, industry, director_tpl["name"], dept_id,
                    director_tpl.get("prompt_suffix", ""),
                ),
                capabilities=director_tpl["capabilities"],
                tools=director_tpl["tools"],
                status="active",
            )
            db.add(agent)
            agents_created += 1

        # Deploy specialists
        for spec_tpl in dept_templates.get("specialists", []):
            if spec_tpl["name"] not in existing_roles:
                agent = AIAgent(
                    workspace_id=workspace_id,
                    name=spec_tpl["name"],
                    role=spec_tpl["name"],
                    department=dept_id,
                    agent_type="specialist",
                    description=spec_tpl["description"],
                    system_prompt=build_system_prompt(
                        company_name, industry, spec_tpl["name"], dept_id,
                        spec_tpl.get("prompt_suffix", ""),
                    ),
                    capabilities=spec_tpl["capabilities"],
                    tools=spec_tpl["tools"],
                    status="active",
                )
                db.add(agent)
                agents_created += 1

    await db.flush()

    total = (await db.execute(
        select(func.count(AIAgent.id)).where(AIAgent.workspace_id == workspace_id)
    )).scalar() or 0

    departments = (await db.execute(
        select(func.count(func.distinct(AIAgent.department))).where(AIAgent.workspace_id == workspace_id)
    )).scalar() or 0

    logger.info("Deployed %d new agents for workspace=%s (total: %d)", agents_created, workspace_id, total)

    return {"agents_deployed": agents_created, "total_agents": total, "departments": departments}


async def get_agents(db: AsyncSession, workspace_id: str) -> list[AIAgent]:
    result = await db.execute(
        select(AIAgent).where(AIAgent.workspace_id == workspace_id)
        .order_by(AIAgent.department, AIAgent.agent_type.desc())
    )
    return list(result.scalars().all())


async def get_agent(db: AsyncSession, agent_id: str) -> Optional[AIAgent]:
    result = await db.execute(select(AIAgent).where(AIAgent.id == agent_id))
    return result.scalar_one_or_none()


async def assign_task(
    db: AsyncSession, workspace_id: str, agent_id: str,
    task_type: str, title: str, description: str,
    input_data: dict = None, priority: str = "normal",
) -> AgentTask:
    """Create and execute a task for an agent."""
    agent = await get_agent(db, agent_id)
    if not agent or agent.workspace_id != workspace_id:
        raise ValueError("Agent not found")

    task = AgentTask(
        workspace_id=workspace_id,
        agent_id=agent_id,
        task_type=task_type,
        title=title or f"{agent.name}: {task_type}",
        description=description,
        input_data=input_data or {},
        status="running",
        priority=priority,
        started_at=datetime.utcnow(),
    )
    db.add(task)
    await db.flush()

    # Execute via Claude
    result = await execute_task(
        system_prompt=agent.system_prompt or "",
        task_description=description or title,
        input_data=input_data,
    )

    task.status = "completed"
    task.result_summary = result["result"]
    task.output_data = {"result": result["result"]}
    task.tokens_used = result["tokens_used"]
    task.execution_time_ms = result["execution_time_ms"]
    task.completed_at = datetime.utcnow()

    # Update agent stats
    agent.tasks_completed = (agent.tasks_completed or 0) + 1
    agent.last_active_at = datetime.utcnow()

    # Bill tokens
    if result["tokens_used"] > 0:
        try:
            from app.modules.billing.service import consume_tokens
            await consume_tokens(db, workspace_id, "agent_task_execution")
        except Exception:
            pass

    logger.info("Task completed: agent=%s, type=%s, tokens=%d", agent.name, task_type, result["tokens_used"])

    return task


async def get_tasks(
    db: AsyncSession, workspace_id: str, agent_id: str = None, limit: int = 20,
) -> list[AgentTask]:
    query = select(AgentTask).where(AgentTask.workspace_id == workspace_id)
    if agent_id:
        query = query.where(AgentTask.agent_id == agent_id)
    query = query.order_by(AgentTask.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_department_summary(db: AsyncSession, workspace_id: str) -> list[dict]:
    """Get agents grouped by department."""
    agents = await get_agents(db, workspace_id)
    departments: dict[str, dict] = {}

    for agent in agents:
        dept = agent.department
        if dept not in departments:
            departments[dept] = {"department": dept, "director": None, "specialists": [], "total_tasks": 0}

        agent_data = {
            "id": agent.id, "name": agent.name, "role": agent.role,
            "department": agent.department, "agent_type": agent.agent_type,
            "description": agent.description, "capabilities": agent.capabilities or [],
            "status": agent.status, "tasks_completed": agent.tasks_completed or 0,
            "last_active_at": agent.last_active_at.isoformat() if agent.last_active_at else None,
        }

        if agent.agent_type == "director":
            departments[dept]["director"] = agent_data
        else:
            departments[dept]["specialists"].append(agent_data)

        departments[dept]["total_tasks"] += agent.tasks_completed or 0

    return list(departments.values())
