"""
AEOS – AI Agent Framework: API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .schemas import *
from .service import deploy_agents, get_agents, assign_task, get_tasks, get_department_summary

router = APIRouter(prefix="/v1/agents", tags=["AI Agent Framework"])


def _fmt(dt) -> str | None:
    return dt.isoformat() if dt else None


@router.post("/deploy", response_model=DeployResponse)
async def trigger_deploy(
    body: DeployRequest = DeployRequest(),
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Deploy AI agents for the workspace."""
    result = await deploy_agents(db, membership.workspace_id, body.industry)
    await db.commit()
    return DeployResponse(
        agents_deployed=result["agents_deployed"],
        departments=result["departments"],
        message=f"Deployed {result['agents_deployed']} new agents ({result['total_agents']} total across {result['departments']} departments)",
    )


@router.get("/list", response_model=AgentListResponse)
async def list_agents(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """List all AI agents in the workspace."""
    agents = await get_agents(db, membership.workspace_id)
    active = sum(1 for a in agents if a.status == "active")
    depts = len(set(a.department for a in agents))

    return AgentListResponse(
        agents=[AgentResponse(
            id=a.id, name=a.name, role=a.role, department=a.department,
            agent_type=a.agent_type, description=a.description or "",
            capabilities=a.capabilities or [], status=a.status,
            tasks_completed=a.tasks_completed or 0,
            last_active_at=_fmt(a.last_active_at),
        ) for a in agents],
        total_agents=len(agents),
        active_agents=active,
        departments=depts,
    )


@router.get("/departments")
async def get_departments(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get agents grouped by department."""
    return await get_department_summary(db, membership.workspace_id)


@router.post("/task", response_model=TaskResult)
async def create_task(
    body: TaskRequest,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Assign a task to an AI agent."""
    try:
        task = await assign_task(
            db, membership.workspace_id, body.agent_id,
            body.task_type, body.title, body.description,
            body.input_data, body.priority,
        )
        await db.commit()
        return TaskResult(
            task_id=task.id, status=task.status,
            result_summary=task.result_summary or "",
            output_data=task.output_data or {},
            tokens_used=task.tokens_used or 0,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    agent_id: str = None,
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """List recent tasks."""
    tasks = await get_tasks(db, membership.workspace_id, agent_id)
    return [TaskResponse(
        id=t.id, agent_id=t.agent_id, task_type=t.task_type,
        title=t.title or "", description=t.description or "",
        status=t.status, priority=t.priority or "normal",
        result_summary=t.result_summary or "",
        tokens_used=t.tokens_used or 0,
        execution_time_ms=t.execution_time_ms or 0,
        started_at=_fmt(t.started_at), completed_at=_fmt(t.completed_at),
        created_at=_fmt(t.created_at) or "",
    ) for t in tasks]
