"""
AEOS – AI Agent Framework Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    department: str
    agent_type: str
    description: str
    capabilities: list[str] = []
    status: str
    tasks_completed: int
    last_active_at: Optional[str] = None


class AgentListResponse(BaseModel):
    agents: list[AgentResponse]
    total_agents: int
    active_agents: int
    departments: int


class TaskResponse(BaseModel):
    id: str
    agent_id: str
    task_type: str
    title: str
    description: str
    status: str
    priority: str
    result_summary: str = ""
    tokens_used: int = 0
    execution_time_ms: int = 0
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str


class TaskRequest(BaseModel):
    agent_id: str
    task_type: str
    title: str = ""
    description: str = ""
    input_data: dict = {}
    priority: str = "normal"


class TaskResult(BaseModel):
    task_id: str
    status: str
    result_summary: str
    output_data: dict = {}
    tokens_used: int = 0


class DeployRequest(BaseModel):
    industry: str = ""  # Override industry for deployment


class DeployResponse(BaseModel):
    agents_deployed: int
    departments: int
    message: str


class DepartmentAgentsResponse(BaseModel):
    department: str
    department_name: str
    director: Optional[AgentResponse] = None
    specialists: list[AgentResponse] = []
    total_tasks: int = 0
