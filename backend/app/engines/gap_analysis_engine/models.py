"""
AEOS – Gap Analysis Engine: Database models.

Stores organizational gap analysis reports and workspace role assignments.
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
    JSON,
    String,
)
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class WorkspaceRoleAssignment(Base):
    """Stores which org chart roles are filled by humans vs AI."""
    __tablename__ = "workspace_role_assignments"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    role_map = Column(JSON, default=dict)  # {"dept_id:role_name": true/false}
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)


class OrgGapAnalysisReport(Base):
    """Organizational gap analysis report for a workspace."""
    __tablename__ = "org_gap_analysis_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(String(50), default="pending", nullable=False)

    # Overall gap score (0-100, higher = more gaps)
    overall_gap_score = Column(Float, default=0.0)

    # 5 sub-scores (each 0-100, higher = more gaps)
    department_coverage_score = Column(Float, default=0.0)
    role_coverage_score = Column(Float, default=0.0)
    leadership_gap_score = Column(Float, default=0.0)
    critical_function_score = Column(Float, default=0.0)
    operational_maturity_score = Column(Float, default=0.0)

    # JSON details
    gap_breakdown = Column(JSON, default=list)        # list of per-department details
    recommendations = Column(JSON, default=list)       # prioritized actions
    ideal_org_summary = Column(JSON, default=dict)     # snapshot of ideal org used

    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_gap_reports_ws_status", "workspace_id", "status"),
        Index("ix_gap_reports_ws_created", "workspace_id", "created_at"),
    )
