"""
AEOS – Reports Engine: Database models.

Stores generated executive reports with sharing capability.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


def _share_token():
    return str(uuid.uuid4())[:12]


REPORT_TYPES = [
    "company_intelligence",
    "strategic_brief",
    "competitive_analysis",
    "financial_overview",
    "market_research",
    "gap_analysis",
    "kpi_dashboard",
    "full_business_plan",
]

REPORT_TITLES = {
    "company_intelligence": "Company Intelligence Report",
    "strategic_brief": "Strategic Executive Brief",
    "competitive_analysis": "Competitive Analysis Report",
    "financial_overview": "Financial Overview & Projections",
    "market_research": "Market Research & Sizing Report",
    "gap_analysis": "Organizational Gap Analysis Report",
    "kpi_dashboard": "KPI Framework & Tracking Report",
    "full_business_plan": "Full Business Plan",
}


class GeneratedReport(Base):
    """An executive report generated from AEOS engine data."""
    __tablename__ = "generated_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    user_id = Column(String(36), nullable=True)

    report_type = Column(String(100), nullable=False)
    title = Column(String(500), default="")
    status = Column(String(50), default="pending")  # pending | generating | completed | failed

    # Content
    sections = Column(JSON, default=list)  # List of {title, content, data}
    summary = Column(Text, default="")
    metadata_json = Column("metadata", JSON, default=dict)

    # Sharing
    share_token = Column(String(36), default=_share_token, unique=True)
    is_public = Column(String(10), default="false")  # "true" | "false"

    generated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_report_ws_type", "workspace_id", "report_type"),
        Index("ix_report_share", "share_token", unique=True),
    )
