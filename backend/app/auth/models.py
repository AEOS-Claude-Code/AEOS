"""
AEOS – Auth & workspace database models.

Phase 2: Users, workspaces, memberships, onboarding, refresh tokens.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


# ── User ─────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "user" or "platform_admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    @property
    def initials(self) -> str:
        parts = self.full_name.strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return self.full_name[:2].upper()


# ── Workspace ────────────────────────────────────────────────────────

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    profile = relationship("WorkspaceProfile", uselist=False, back_populates="workspace", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="workspace", cascade="all, delete-orphan")
    onboarding = relationship("OnboardingProgress", uselist=False, back_populates="workspace", cascade="all, delete-orphan")


# ── Membership ───────────────────────────────────────────────────────

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="owner")  # owner | admin | member | viewer
    is_default = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)

    user = relationship("User", back_populates="memberships")
    workspace = relationship("Workspace", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("user_id", "workspace_id", name="uq_membership"),
    )


# ── Workspace Profile ────────────────────────────────────────────────

class WorkspaceProfile(Base):
    __tablename__ = "workspace_profiles"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), unique=True, nullable=False)

    industry = Column(String(100), default="general")
    country = Column(String(100), default="")
    city = Column(String(100), default="")
    team_size = Column(Integer, default=1)
    primary_goal = Column(String(500), default="")

    website_url = Column(String(500), default="")
    social_links = Column(JSON, default=dict)
    whatsapp_link = Column(String(500), default="")
    contact_page = Column(String(500), default="")
    phone = Column(String(50), default="")
    google_business_url = Column(String(500), default="")
    tech_stack = Column(JSON, default=list)  # list of detected technology names
    emails = Column(JSON, default=list)  # list of detected email addresses
    og_image = Column(String(1000), default="")
    favicon_url = Column(String(500), default="")
    business_hours = Column(JSON, default=list)
    content_languages = Column(JSON, default=list)
    detected_competitors_data = Column(JSON, default=list)
    seo_keywords = Column(JSON, default=list)  # list of detected SEO keyword strings
    detected_team = Column(JSON, default=dict)  # {team_page_url, members: [{name, role}], count}
    detected_services = Column(JSON, default=list)  # list of service/product names
    detected_seo_health = Column(JSON, default=dict)  # SEO health check results

    competitor_urls = Column(JSON, default=list)  # list of strings

    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    workspace = relationship("Workspace", back_populates="profile")


# ── Onboarding Progress ──────────────────────────────────────────────

class OnboardingProgress(Base):
    __tablename__ = "onboarding_progress"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), unique=True, nullable=False)

    current_step = Column(Integer, default=1, nullable=False)  # 1-5
    completed = Column(Boolean, default=False, nullable=False)

    step_company = Column(Boolean, default=False)
    step_presence = Column(Boolean, default=False)
    step_competitors = Column(Boolean, default=False)
    step_integrations = Column(Boolean, default=False)
    step_complete = Column(Boolean, default=False)

    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    workspace = relationship("Workspace", back_populates="onboarding")

    @property
    def readiness_pct(self) -> int:
        steps = [self.step_company, self.step_presence, self.step_competitors, self.step_integrations, self.step_complete]
        return int((sum(1 for s in steps if s) / len(steps)) * 100)

    @property
    def readiness_status(self) -> str:
        pct = self.readiness_pct
        if pct == 0:
            return "new"
        elif pct <= 40:
            return "basic_setup"
        elif pct <= 60:
            return "partially_connected"
        elif pct < 100:
            return "fully_connected"
        return "ready_for_ai"


# ── Refresh Token ────────────────────────────────────────────────────

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
