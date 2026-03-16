"""
AEOS – Company Scanner Engine: Database models.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
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


def _share_token():
    return uuid.uuid4().hex[:16]


class CompanyScanReport(Base):
    __tablename__ = "company_scan_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    website_url = Column(String(500), nullable=False)
    status = Column(String(50), default="pending", nullable=False)

    # Public sharing
    share_token = Column(String(32), unique=True, nullable=False, default=_share_token, index=True)
    is_public = Column(Boolean, default=True, nullable=False)

    # Website analysis
    page_title = Column(String(500), default="")
    meta_description = Column(Text, default="")
    headings = Column(JSON, default=list)  # [{level: "h1", text: "..."}, ...]
    detected_keywords = Column(JSON, default=list)
    internal_links_count = Column(Integer, default=0)
    pages_detected = Column(Integer, default=0)

    # SEO
    seo_score = Column(Integer, default=0)  # 0-100
    seo_details = Column(JSON, default=dict)

    # Social presence
    social_presence = Column(JSON, default=dict)  # {linkedin: true, facebook: false, ...}

    # Tech stack
    tech_stack = Column(JSON, default=list)  # ["wordpress", "google_analytics", ...]

    # Summary
    scan_summary = Column(Text, default="")

    # Timestamps
    scan_started_at = Column(DateTime, nullable=True)
    scan_completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)
