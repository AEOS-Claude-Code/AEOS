"""
AEOS – Digital Presence Engine: Database models.

Phase 8: Unified digital presence scoring with history tracking.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    JSON,
    String,
    UniqueConstraint,
)
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class DigitalPresenceReport(Base):
    __tablename__ = "digital_presence_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(50), default="pending", nullable=False)

    # Overall composite score
    overall_score = Column(Float, default=0.0)

    # 5 sub-scores (each 0-100)
    website_performance = Column(Float, default=0.0)
    search_visibility = Column(Float, default=0.0)
    social_presence = Column(Float, default=0.0)
    reputation = Column(Float, default=0.0)
    conversion_readiness = Column(Float, default=0.0)

    # Detailed breakdown per category
    score_breakdown = Column(JSON, default=list, server_default="[]")

    # Actionable recommendations
    recommendations = Column(JSON, default=list, server_default="[]")

    # Which data sources contributed
    data_sources = Column(JSON, default=list, server_default="[]")

    # Timestamps
    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_dp_workspace_status", "workspace_id", "status"),
        Index("ix_dp_workspace_created", "workspace_id", "created_at"),
    )


class DigitalPresenceSnapshot(Base):
    __tablename__ = "digital_presence_snapshots"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    report_id = Column(String(36), ForeignKey("digital_presence_reports.id", ondelete="CASCADE"), nullable=False)

    overall_score = Column(Float, default=0.0)
    website_performance = Column(Float, default=0.0)
    search_visibility = Column(Float, default=0.0)
    social_presence = Column(Float, default=0.0)
    reputation = Column(Float, default=0.0)
    conversion_readiness = Column(Float, default=0.0)

    snapshot_date = Column(Date, default=date.today, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "snapshot_date", name="uq_dp_snapshot_per_day"),
        Index("ix_dp_snap_workspace_date", "workspace_id", "snapshot_date"),
    )
