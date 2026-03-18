"""
AEOS – Financial Model Engine: Database models.

Stores 3-5 year financial projections with P&L, EBITDA, break-even analysis.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class FinancialModel(Base):
    """3-5 year financial projection model for a workspace."""
    __tablename__ = "financial_models"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    status = Column(String(50), default="pending", nullable=False)
    version = Column(Integer, default=1)

    # Summary metrics
    year1_revenue = Column(Float, default=0.0)
    year5_revenue = Column(Float, default=0.0)
    break_even_month = Column(Integer, default=0)
    year3_ebitda_margin = Column(Float, default=0.0)

    # Detailed projections
    yearly_projections = Column(JSON, default=list)   # 5-year P&L
    monthly_cashflow = Column(JSON, default=list)     # First 24 months
    revenue_streams = Column(JSON, default=list)      # Revenue breakdown
    cost_breakdown = Column(JSON, default=list)       # Cost categories over time
    ebitda_analysis = Column(JSON, default=dict)      # EBITDA progression
    break_even_analysis = Column(JSON, default=dict)  # Break-even calculation
    funding_requirements = Column(JSON, default=dict) # Investment needs
    assumptions = Column(JSON, default=dict)          # Model assumptions
    scenarios = Column(JSON, default=dict)            # Base/optimistic/pessimistic

    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_finmodel_ws_status", "workspace_id", "status"),
        Index("ix_finmodel_ws_created", "workspace_id", "created_at"),
    )
