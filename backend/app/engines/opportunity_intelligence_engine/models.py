"""
AEOS – Opportunity Radar Engine: Database models.

Phase 3: Detected opportunities with scoring.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), nullable=False)  # keyword_gaps | competitor | local_market | conversion | social | content | technical
    impact = Column(String(20), nullable=False, default="medium")  # high | medium | low
    impact_score = Column(Integer, default=50)  # 0-100
    effort_score = Column(Integer, default=50)  # 0-100 (lower = easier)

    source_engine = Column(String(100), default="opportunity_intelligence_engine")
    source_data = Column(JSON, default=dict, server_default="{}")

    recommended_action = Column(Text, default="")
    status = Column(String(50), default="detected")  # detected | reviewed | approved | in_progress | completed | dismissed

    detected_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    __table_args__ = (
        Index("ix_opp_workspace_impact", "workspace_id", "impact"),
        Index("ix_opp_workspace_status", "workspace_id", "status"),
        Index("ix_opp_workspace_score", "workspace_id", "impact_score"),
    )
