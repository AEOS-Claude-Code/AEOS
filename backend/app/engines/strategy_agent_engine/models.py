"""
AEOS – Strategy Agent Engine: Database models.

Stores AI-generated business plans with section-level progress tracking.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
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


SECTION_KEYS = [
    "executive_summary",
    "company_overview",
    "market_analysis",
    "organizational_structure",
    "marketing_sales_strategy",
    "operations_plan",
    "financial_projections",
    "risk_assessment",
    "implementation_roadmap",
    "kpi_framework",
]

SECTION_TITLES = {
    "executive_summary": "Executive Summary",
    "company_overview": "Company Overview",
    "market_analysis": "Market Analysis",
    "organizational_structure": "Organizational Structure",
    "marketing_sales_strategy": "Marketing & Sales Strategy",
    "operations_plan": "Operations Plan",
    "financial_projections": "Financial Projections",
    "risk_assessment": "Risk Assessment",
    "implementation_roadmap": "Implementation Roadmap",
    "kpi_framework": "KPI Framework",
}


class BusinessPlan(Base):
    """AI-generated strategic business plan."""
    __tablename__ = "business_plans"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(String(36), nullable=True)

    status = Column(String(50), default="pending", nullable=False)
    version = Column(Integer, default=1)
    title = Column(String(500), default="")

    # Sections stored as JSON: {"key": {"status": "completed", "content": "...", "word_count": 350}}
    sections = Column(JSON, default=dict)
    metadata_json = Column("metadata", JSON, default=dict)
    context_snapshot = Column(JSON, default=dict)

    current_section = Column(String(100), nullable=True)
    sections_completed = Column(Integer, default=0)
    sections_total = Column(Integer, default=10)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_bplan_ws_status", "workspace_id", "status"),
        Index("ix_bplan_ws_created", "workspace_id", "created_at"),
    )
