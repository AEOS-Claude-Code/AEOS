"""
AEOS – Lead Intelligence Engine: Database models.

Phase 3: Leads, lead events, lead source attribution.
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
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Contact info
    name = Column(String(255), default="")
    email = Column(String(255), default="")
    phone = Column(String(50), default="")
    company = Column(String(255), default="")

    # Source attribution
    source = Column(String(100), nullable=False, default="direct")  # organic_search | paid_search | social | referral | direct | email | whatsapp
    channel = Column(String(100), default="")  # website_form | google_ads | instagram | whatsapp | phone | booking | manual
    utm_source = Column(String(255), default="")
    utm_medium = Column(String(255), default="")
    utm_campaign = Column(String(255), default="")
    referrer_url = Column(String(500), default="")
    landing_page = Column(String(500), default="")

    # Scoring
    score = Column(Integer, default=0)  # 0-100
    status = Column(String(50), default="new")  # new | contacted | qualified | proposal | won | lost
    classification = Column(String(50), default="cold")  # cold | warm | hot

    # Metadata
    tags = Column(JSON, default=list, server_default="[]")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    events = relationship("LeadEvent", back_populates="lead", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("workspace_id", "email", name="uq_lead_workspace_email"),
        Index("ix_lead_workspace_status", "workspace_id", "status"),
        Index("ix_lead_workspace_classification", "workspace_id", "classification"),
        Index("ix_lead_workspace_source", "workspace_id", "source"),
        Index("ix_lead_workspace_created", "workspace_id", "created_at"),
    )

    @property
    def classification_from_score(self) -> str:
        if self.score >= 70:
            return "hot"
        elif self.score >= 40:
            return "warm"
        return "cold"


class LeadEvent(Base):
    __tablename__ = "lead_events"

    id = Column(String(36), primary_key=True, default=_uuid)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), nullable=False, index=True)

    event_type = Column(String(50), nullable=False)  # page_view | form_submit | whatsapp_click | phone_click | booking | email_open | manual_note
    page_url = Column(String(500), default="")
    event_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_now, nullable=False)

    lead = relationship("Lead", back_populates="events")


class LeadSource(Base):
    """Aggregated source stats – computed periodically."""
    __tablename__ = "lead_sources"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    source = Column(String(100), nullable=False)
    channel = Column(String(100), default="")
    lead_count = Column(Integer, default=0)
    qualified_count = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    avg_score = Column(Float, default=0.0)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)
