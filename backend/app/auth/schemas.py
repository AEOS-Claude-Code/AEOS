"""
AEOS – Auth Pydantic schemas.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Requests ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    company_name: str = Field(default="", max_length=255)
    website_url: str = Field(default="", max_length=500)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Responses ────────────────────────────────────────────────────────

class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    initials: str
    role: str
    is_active: bool
    workspace_id: str
    workspace_role: str
    permissions: list[str]
    created_at: str
    last_login_at: Optional[str] = None


class WorkspacePlanResponse(BaseModel):
    id: str
    name: str
    tier: str
    price_monthly: int
    max_workspaces: int
    max_users: int
    included_tokens: int
    is_active: bool
    current_period_start: str
    current_period_end: str


class TokenUsageResponse(BaseModel):
    included: int
    used: int
    purchased: int
    remaining: int
    purchased_expires_at: Optional[str] = None
    reset_at: str


class WorkspaceSetupResponse(BaseModel):
    completed: bool
    current_step: int
    total_steps: int = 5
    steps: dict[str, bool]


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    industry: str
    country: str
    city: str
    team_size: int
    website_url: str
    logo_url: Optional[str] = None
    plan: WorkspacePlanResponse
    token_usage: TokenUsageResponse
    setup: WorkspaceSetupResponse
    owner: dict
    created_at: str


class ReadinessResponse(BaseModel):
    workspace_id: str
    percentage: int
    status: str
    steps: dict[str, bool]


# ── Onboarding step payloads ─────────────────────────────────────────

class OnboardingCompanyPayload(BaseModel):
    industry: str = ""
    country: str = ""
    city: str = ""
    team_size: int = 1
    primary_goal: str = ""


class OnboardingPresencePayload(BaseModel):
    website_url: str = ""
    social_links: dict[str, str] = Field(default_factory=dict)
    whatsapp_link: str = ""
    contact_page: str = ""
    phone: str = ""
    google_business_url: str = ""


class OnboardingCompetitorsPayload(BaseModel):
    competitor_urls: list[str] = Field(default_factory=list, max_length=10)


class OnboardingIntegrationsPayload(BaseModel):
    """Step 4 just marks acknowledgement – real connections in Phase 6."""
    acknowledged: bool = True


class OnboardingStepResponse(BaseModel):
    step: int
    completed: bool
    next_step: Optional[int] = None
    readiness_pct: int
