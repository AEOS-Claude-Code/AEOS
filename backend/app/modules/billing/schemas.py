"""
AEOS – Billing Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Plan ─────────────────────────────────────────────────────────────

class PlanInfo(BaseModel):
    id: str
    name: str
    tier: str
    price_monthly: int
    max_workspaces: int
    max_users: int
    included_tokens: int
    features: list[str] = Field(default_factory=list)


class PlanListResponse(BaseModel):
    plans: list[PlanInfo]


# ── Subscription ─────────────────────────────────────────────────────

class SubscriptionResponse(BaseModel):
    plan: PlanInfo
    status: str
    is_trial: bool
    trial_days_remaining: int = 0
    current_period_start: str
    current_period_end: str


class ChangePlanRequest(BaseModel):
    plan_tier: str = Field(..., pattern="^(starter|growth|business|enterprise)$")


# ── Token balance ────────────────────────────────────────────────────

class TokenBalanceResponse(BaseModel):
    included: int
    purchased: int
    used: int
    available: int
    total: int
    reset_at: str
    usage_pct: float


# ── Token usage ──────────────────────────────────────────────────────

class TokenUsageItem(BaseModel):
    id: str
    operation: str
    tokens_consumed: int
    engine: str
    detail: str
    created_at: str


class TokenUsageResponse(BaseModel):
    workspace_id: str
    items: list[TokenUsageItem]
    total_used: int
    period_start: str


# ── Purchase ─────────────────────────────────────────────────────────

class PurchaseTokensRequest(BaseModel):
    amount: int = Field(..., ge=1000, le=10000000, description="Number of tokens to purchase")


class PurchaseTokensResponse(BaseModel):
    transaction_id: str
    tokens_added: int
    new_balance: int
    payment_status: str
    message: str
