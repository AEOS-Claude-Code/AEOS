"""
AEOS – Market Research Engine: Database models.
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


class MarketResearchReport(Base):
    """Market research and TAM/SAM/SOM report for a workspace."""
    __tablename__ = "market_research_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    status = Column(String(50), default="pending", nullable=False)

    # Market sizing (USD billions)
    tam = Column(Float, default=0.0)
    sam = Column(Float, default=0.0)
    som = Column(Float, default=0.0)

    # Industry metrics
    industry = Column(String(100), default="")
    market_growth_rate = Column(Float, default=0.0)
    avg_revenue_per_employee = Column(Float, default=0.0)
    digital_maturity_benchmark = Column(Float, default=0.0)

    # Detailed data
    benchmarks = Column(JSON, default=dict)
    growth_drivers = Column(JSON, default=list)
    threats = Column(JSON, default=list)
    opportunities = Column(JSON, default=list)
    market_positioning = Column(JSON, default=dict)
    regional_data = Column(JSON, default=dict)

    computed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_market_report_ws_status", "workspace_id", "status"),
        Index("ix_market_report_ws_created", "workspace_id", "created_at"),
    )
