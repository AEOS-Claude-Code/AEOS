"""
AEOS – Competitor Intelligence Engine: Database models.

Stores competitor profiles and competitive positioning reports.
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
)
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class Competitor(Base):
    """A competitor tracked by a workspace."""
    __tablename__ = "competitors"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url = Column(String(500), nullable=False)
    name = Column(String(255), default="")
    industry_guess = Column(String(100), default="")
    status = Column(String(50), default="pending")  # pending | scanning | scanned | failed

    # Scores from scan
    seo_score = Column(Float, default=0.0)
    performance_score = Column(Float, default=0.0)
    security_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)

    # Detailed data
    tech_stack = Column(JSON, default=list)
    social_presence = Column(JSON, default=dict)
    keywords = Column(JSON, default=list)
    scan_data = Column(JSON, default=dict)  # Full scan snapshot

    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_competitor_ws_url", "workspace_id", "url", unique=True),
    )


class CompetitorReport(Base):
    """Competitive positioning report for a workspace."""
    __tablename__ = "competitor_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(String(50), default="pending")

    # Overall positioning (0-100, higher = client is stronger)
    overall_positioning = Column(Float, default=50.0)

    # Per-dimension scores: {"seo": {"client": 75, "avg_competitor": 60, "gap": 15}, ...}
    dimension_scores = Column(JSON, default=dict)

    # Strategic insights
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    opportunities = Column(JSON, default=list)

    # Per-competitor summary
    competitor_summary = Column(JSON, default=list)

    competitors_scanned = Column(Integer, default=0)
    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_comp_report_ws_status", "workspace_id", "status"),
        Index("ix_comp_report_ws_created", "workspace_id", "created_at"),
    )
