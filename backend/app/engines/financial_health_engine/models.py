"""
AEOS – Financial Health Engine: Database models.
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


class FinancialHealthReport(Base):
    """Financial health assessment for a workspace."""
    __tablename__ = "financial_health_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    status = Column(String(50), default="pending", nullable=False)

    # Overall financial health score (0-100)
    overall_score = Column(Float, default=0.0)

    # 5 sub-scores
    revenue_potential_score = Column(Float, default=0.0)
    cost_efficiency_score = Column(Float, default=0.0)
    growth_readiness_score = Column(Float, default=0.0)
    risk_exposure_score = Column(Float, default=0.0)
    investment_readiness_score = Column(Float, default=0.0)

    # Detailed data
    revenue_model = Column(JSON, default=dict)      # Estimated revenue metrics
    cost_structure = Column(JSON, default=dict)      # Cost breakdown estimates
    growth_levers = Column(JSON, default=list)       # Growth opportunities
    financial_risks = Column(JSON, default=list)     # Risk factors
    recommendations = Column(JSON, default=list)     # Prioritized actions
    benchmarks = Column(JSON, default=dict)          # Industry comparisons
    projections = Column(JSON, default=dict)         # 3-year outlook

    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_fin_report_ws_status", "workspace_id", "status"),
        Index("ix_fin_report_ws_created", "workspace_id", "created_at"),
    )
