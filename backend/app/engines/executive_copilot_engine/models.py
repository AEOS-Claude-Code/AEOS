"""
AEOS – Executive Copilot Engine: Database models.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, JSON, String, Text
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class CopilotConversation(Base):
    __tablename__ = "copilot_conversations"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False, default="")
    sources = Column(JSON, default=list)
    confidence = Column(Float, default=0.0)

    created_at = Column(DateTime, default=_now, nullable=False)
