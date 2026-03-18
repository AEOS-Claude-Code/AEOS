"""
AEOS – KPI Framework Engine: Database models.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, JSON, String
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class KPIFramework(Base):
    """KPI framework report for a workspace."""
    __tablename__ = "kpi_frameworks"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    status = Column(String(50), default="pending", nullable=False)

    # Overall KPI health
    overall_kpi_score = Column(Float, default=0.0)
    total_kpis = Column(Float, default=0)
    tracked_kpis = Column(Float, default=0)

    # KPI data
    company_kpis = Column(JSON, default=list)      # Top-level company KPIs
    department_kpis = Column(JSON, default=list)    # Per-department KPIs
    digital_kpis = Column(JSON, default=list)       # Digital performance KPIs
    financial_kpis = Column(JSON, default=list)     # Financial KPIs
    review_cadence = Column(JSON, default=dict)     # Recommended review schedule
    dashboard_config = Column(JSON, default=dict)   # Dashboard layout recommendations

    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_kpi_ws_status", "workspace_id", "status"),
        Index("ix_kpi_ws_created", "workspace_id", "created_at"),
    )
