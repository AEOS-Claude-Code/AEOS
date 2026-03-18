"""
AEOS – Billing service layer.

Manages subscriptions, token wallets, usage recording, and token purchases.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    PLANS,
    TRIAL_DAYS,
    Subscription,
    TokenWallet,
    TokenUsage,
    TokenTransaction,
)

logger = logging.getLogger("aeos.billing")


# ── Subscription management ──────────────────────────────────────────


async def get_or_create_subscription(db: AsyncSession, workspace_id: str) -> Subscription:
    """Get existing subscription or create a starter trial."""
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == workspace_id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        return sub

    now = datetime.utcnow()
    sub = Subscription(
        workspace_id=workspace_id,
        plan_tier="starter",
        status="trialing",
        trial_start=now,
        trial_end=now + timedelta(days=TRIAL_DAYS),
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(sub)
    await db.flush()

    # Create token wallet
    plan = PLANS["starter"]
    wallet = TokenWallet(
        workspace_id=workspace_id,
        included_tokens=plan["included_tokens"],
        reset_at=now + timedelta(days=30),
    )
    db.add(wallet)

    # Initial grant transaction
    tx = TokenTransaction(
        workspace_id=workspace_id,
        type="grant",
        amount=plan["included_tokens"],
        description=f"Initial {plan['name']} plan token allocation",
    )
    db.add(tx)

    logger.info("Created subscription workspace=%s plan=starter trial=%dd", workspace_id, TRIAL_DAYS)
    return sub


async def change_plan(db: AsyncSession, workspace_id: str, new_tier: str) -> Subscription:
    """Change the workspace plan tier."""
    if new_tier not in PLANS:
        raise ValueError(f"Unknown plan tier: {new_tier}")

    sub = await get_or_create_subscription(db, workspace_id)
    old_tier = sub.plan_tier
    plan = PLANS[new_tier]

    sub.plan_tier = new_tier
    sub.status = "active"
    sub.current_period_start = datetime.utcnow()
    sub.current_period_end = datetime.utcnow() + timedelta(days=30)

    # Update wallet included tokens
    wallet = await get_or_create_wallet(db, workspace_id)
    wallet.included_tokens = plan["included_tokens"]
    wallet.reset_at = sub.current_period_end

    # Log transaction
    tx = TokenTransaction(
        workspace_id=workspace_id,
        type="plan_reset",
        amount=plan["included_tokens"],
        description=f"Plan changed from {old_tier} to {new_tier}",
    )
    db.add(tx)

    logger.info("Plan changed workspace=%s from=%s to=%s tokens=%d", workspace_id, old_tier, new_tier, plan["included_tokens"])
    return sub


# ── Token wallet ─────────────────────────────────────────────────────


async def get_or_create_wallet(db: AsyncSession, workspace_id: str) -> TokenWallet:
    """Get existing wallet or create one."""
    result = await db.execute(
        select(TokenWallet).where(TokenWallet.workspace_id == workspace_id)
    )
    wallet = result.scalar_one_or_none()
    if wallet:
        return wallet

    # Ensure subscription exists first
    sub = await get_or_create_subscription(db, workspace_id)
    plan = PLANS.get(sub.plan_tier, PLANS["starter"])

    wallet = TokenWallet(
        workspace_id=workspace_id,
        included_tokens=plan["included_tokens"],
        reset_at=sub.current_period_end,
    )
    db.add(wallet)
    await db.flush()
    return wallet


async def check_token_budget(db: AsyncSession, workspace_id: str, required: int) -> bool:
    """Check if the workspace has enough tokens. Returns True if OK."""
    wallet = await get_or_create_wallet(db, workspace_id)
    return wallet.available >= required


async def consume_tokens(
    db: AsyncSession,
    workspace_id: str,
    operation: str,
    tokens: int,
    engine: str = "",
    detail: str = "",
    user_id: str = "",
) -> TokenUsage:
    """
    Record token consumption for an operation.
    Uses atomic SQL UPDATE to avoid race conditions under concurrent requests.
    """
    from sqlalchemy import update

    # Ensure wallet exists
    wallet = await get_or_create_wallet(db, workspace_id)

    # Atomic increment — avoids read-modify-write race condition
    await db.execute(
        update(TokenWallet)
        .where(TokenWallet.workspace_id == workspace_id)
        .values(used_tokens=TokenWallet.used_tokens + tokens)
    )

    # Refresh wallet to get updated value for logging
    await db.refresh(wallet)

    usage = TokenUsage(
        workspace_id=workspace_id,
        user_id=user_id,
        operation=operation,
        tokens_consumed=tokens,
        engine=engine,
        detail=detail,
    )
    db.add(usage)

    logger.info(
        "Tokens consumed workspace=%s op=%s tokens=%d used=%d/%d",
        workspace_id, operation, tokens, wallet.used_tokens, wallet.total,
    )
    return usage


# ── Token purchases ──────────────────────────────────────────────────


async def purchase_tokens(
    db: AsyncSession,
    workspace_id: str,
    amount: int,
) -> TokenTransaction:
    """
    Simulate a token purchase. In production, this would call Stripe.
    Returns the transaction record.
    """
    wallet = await get_or_create_wallet(db, workspace_id)
    wallet.purchased_tokens += amount
    wallet.purchased_expires_at = datetime.utcnow() + timedelta(days=365)

    tx = TokenTransaction(
        workspace_id=workspace_id,
        type="purchase",
        amount=amount,
        description=f"Purchased {amount:,} tokens",
        payment_status="simulated",
        payment_reference=f"sim-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
    )
    db.add(tx)

    logger.info("Token purchase workspace=%s amount=%d new_balance=%d", workspace_id, amount, wallet.available)
    return tx


# ── Usage queries ────────────────────────────────────────────────────


async def get_usage_history(
    db: AsyncSession,
    workspace_id: str,
    limit: int = 50,
) -> list[TokenUsage]:
    """Get recent token usage records."""
    result = await db.execute(
        select(TokenUsage)
        .where(TokenUsage.workspace_id == workspace_id)
        .order_by(TokenUsage.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_period_usage(db: AsyncSession, workspace_id: str) -> int:
    """Get total tokens used in the current billing period."""
    sub = await get_or_create_subscription(db, workspace_id)
    result = await db.execute(
        select(func.coalesce(func.sum(TokenUsage.tokens_consumed), 0)).where(
            TokenUsage.workspace_id == workspace_id,
            TokenUsage.created_at >= sub.current_period_start,
        )
    )
    return result.scalar_one()


# ── Token cost definitions ───────────────────────────────────────────

OPERATION_COSTS: dict[str, int] = {
    "copilot_query": 100,
    "company_scan": 500,
    "strategy_generation": 200,
    "lead_scoring": 50,
    "opportunity_detection": 50,
    "digital_presence_compute": 200,
    "gap_analysis_compute": 150,
    "business_plan_generation": 2000,
    "business_plan_section_regen": 200,
    "competitor_scan": 300,
}


def get_operation_cost(operation: str) -> int:
    """Get the token cost for an operation."""
    return OPERATION_COSTS.get(operation, 10)
