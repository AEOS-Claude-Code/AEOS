"""
AEOS – Billing models.

Phase 4: subscriptions, token_wallets, token_usage, token_transactions.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

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


# ── Plan definitions (static, not a table – kept in code) ────────────

PLANS = {
    "starter": {
        "id": "plan-starter",
        "name": "Starter",
        "tier": "starter",
        "price_monthly": 0,
        "max_workspaces": 1,
        "max_users": 2,
        "included_tokens": 5000,
        "features": ["company_scan", "lead_intelligence", "opportunity_radar"],
    },
    "growth": {
        "id": "plan-growth",
        "name": "Growth",
        "tier": "growth",
        "price_monthly": 49,
        "max_workspaces": 3,
        "max_users": 10,
        "included_tokens": 50000,
        "features": ["company_scan", "lead_intelligence", "opportunity_radar", "strategy", "copilot"],
    },
    "business": {
        "id": "plan-business",
        "name": "Business",
        "tier": "business",
        "price_monthly": 149,
        "max_workspaces": 10,
        "max_users": 50,
        "included_tokens": 200000,
        "features": ["company_scan", "lead_intelligence", "opportunity_radar", "strategy", "copilot", "reports", "integrations"],
    },
    "enterprise": {
        "id": "plan-enterprise",
        "name": "Enterprise",
        "tier": "enterprise",
        "price_monthly": 499,
        "max_workspaces": -1,
        "max_users": -1,
        "included_tokens": 1000000,
        "features": ["all"],
    },
}

TRIAL_DAYS = 14


# ── Subscription ─────────────────────────────────────────────────────

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    plan_tier = Column(String(50), nullable=False, default="starter")
    status = Column(String(50), nullable=False, default="trialing")  # trialing | active | past_due | canceled

    trial_start = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=False, default=_now)
    current_period_end = Column(DateTime, nullable=False)
    canceled_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)


# ── Token Wallet ─────────────────────────────────────────────────────

class TokenWallet(Base):
    __tablename__ = "token_wallets"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    included_tokens = Column(Integer, nullable=False, default=5000)  # from plan
    purchased_tokens = Column(Integer, nullable=False, default=0)
    used_tokens = Column(Integer, nullable=False, default=0)

    reset_at = Column(DateTime, nullable=False)  # when included tokens reset (period end)
    purchased_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    @property
    def available(self) -> int:
        return max(0, (self.included_tokens + self.purchased_tokens) - self.used_tokens)

    @property
    def total(self) -> int:
        return self.included_tokens + self.purchased_tokens


# ── Token Usage (per-operation log) ──────────────────────────────────

class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)

    operation = Column(String(100), nullable=False)  # copilot_query | company_scan | strategy_generation | lead_scoring
    tokens_consumed = Column(Integer, nullable=False, default=0)
    engine = Column(String(100), default="")
    detail = Column(Text, default="")

    created_at = Column(DateTime, default=_now, nullable=False)


# ── Token Transactions (purchases, grants, adjustments) ──────────────

class TokenTransaction(Base):
    __tablename__ = "token_transactions"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String(50), nullable=False)  # purchase | grant | plan_reset | adjustment
    amount = Column(Integer, nullable=False)  # positive = credit, negative = debit
    description = Column(String(500), default="")

    # Payment simulation fields (Stripe-ready for later)
    payment_status = Column(String(50), default="simulated")  # simulated | pending | completed | failed
    payment_reference = Column(String(255), default="")

    created_at = Column(DateTime, default=_now, nullable=False)
