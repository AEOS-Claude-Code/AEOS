"""
AEOS – AI Agent Framework Engine: Database models.

Agent registry, task queue, and execution history.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class AIAgent(Base):
    """An AI agent deployed in a workspace."""
    __tablename__ = "ai_agents"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    # Identity
    name = Column(String(255), nullable=False)
    role = Column(String(255), default="")  # e.g. "Sales Director AI"
    department = Column(String(100), default="")  # e.g. "sales"
    agent_type = Column(String(50), default="specialist")  # director | specialist
    description = Column(Text, default="")

    # Configuration
    system_prompt = Column(Text, default="")
    capabilities = Column(JSON, default=list)  # List of capability strings
    tools = Column(JSON, default=list)  # Available tool names

    # Status
    status = Column(String(50), default="active")  # active | paused | disabled
    tasks_completed = Column(Integer, default=0)
    last_active_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_agent_ws_dept", "workspace_id", "department"),
        Index("ix_agent_ws_status", "workspace_id", "status"),
    )


class AgentTask(Base):
    """A task assigned to or completed by an AI agent."""
    __tablename__ = "agent_tasks"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    agent_id = Column(String(36), ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)

    # Task details
    task_type = Column(String(100), nullable=False)  # e.g. "generate_content", "analyze_data"
    title = Column(String(500), default="")
    description = Column(Text, default="")
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)

    # Status
    status = Column(String(50), default="pending")  # pending | running | completed | failed
    priority = Column(String(20), default="normal")  # urgent | high | normal | low

    # Result
    result_summary = Column(Text, default="")
    tokens_used = Column(Integer, default=0)
    execution_time_ms = Column(Integer, default=0)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_task_ws_status", "workspace_id", "status"),
        Index("ix_task_agent", "agent_id", "status"),
    )
