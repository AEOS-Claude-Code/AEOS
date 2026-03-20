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

from fastapi import HTTPException

from .models import (
    PLANS,
    TRIAL_DAYS,
    Subscription,
    TokenWallet,
    TokenUsage,
    TokenTransaction,
    UsageAlert,
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


async def enforce_token_budget(db: AsyncSession, workspace_id: str, operation: str) -> int:
    """
    Pre-operation check: ensure workspace has enough tokens.
    Returns token cost if OK.
    Raises HTTP 402 if insufficient and overage not allowed.
    If overage allowed, tracks overage tokens.
    """
    cost = get_operation_cost(operation)
    wallet = await get_or_create_wallet(db, workspace_id)

    if wallet.available >= cost:
        return cost

    # Insufficient tokens — check overage
    sub = await get_or_create_subscription(db, workspace_id)
    if getattr(sub, 'allow_overage', False):
        # Allow operation but track overage
        overage_amount = cost - max(0, wallet.available)
        logger.warning(
            "Overage: workspace=%s op=%s overage=%d tokens",
            workspace_id, operation, overage_amount,
        )
        return cost

    # Block operation
    plan_tier = sub.plan_tier
    plan_name = PLANS.get(plan_tier, {}).get("name", plan_tier)
    raise HTTPException(
        status_code=402,
        detail={
            "error": "token_limit_reached",
            "message": f"Your {plan_name} plan token limit has been reached. Upgrade your plan or purchase additional tokens.",
            "tokens_available": wallet.available,
            "tokens_required": cost,
            "plan_tier": plan_tier,
            "upgrade_url": "/app/settings",
        },
    )


async def check_and_create_alerts(db: AsyncSession, workspace_id: str) -> None:
    """Check token usage and create alerts at threshold crossings."""
    wallet = await get_or_create_wallet(db, workspace_id)
    if wallet.total <= 0:
        return

    usage_pct = round((wallet.used_tokens / wallet.total) * 100)

    THRESHOLDS = [
        (100, "exhausted", "Token limit reached. Operations will be blocked until you upgrade or purchase more tokens."),
        (95, "critical", "You've used 95% of your tokens. Running out soon — upgrade or purchase more."),
        (80, "warning", "You've used 80% of your token allocation. Consider upgrading your plan."),
        (50, "info", "You've used half of your token allocation for this billing period."),
    ]

    for threshold, alert_type, message in THRESHOLDS:
        if usage_pct >= threshold:
            # Check if this threshold alert already exists (unacknowledged)
            existing = (await db.execute(
                select(UsageAlert).where(
                    UsageAlert.workspace_id == workspace_id,
                    UsageAlert.threshold_pct == threshold,
                    UsageAlert.acknowledged == False,
                )
            )).scalar_one_or_none()

            if not existing:
                alert = UsageAlert(
                    workspace_id=workspace_id,
                    alert_type=alert_type,
                    threshold_pct=threshold,
                    current_usage_pct=usage_pct,
                    message=message,
                )
                db.add(alert)
                logger.info("Usage alert: workspace=%s type=%s pct=%d", workspace_id, alert_type, usage_pct)
            break  # Only create the highest threshold alert


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

    # Track overage if over limit
    if wallet.used_tokens > wallet.total:
        overage = wallet.used_tokens - wallet.total
        from sqlalchemy import update
        await db.execute(
            update(TokenWallet)
            .where(TokenWallet.workspace_id == workspace_id)
            .values(overage_tokens=overage)
        )

    # Check for usage alerts
    try:
        await check_and_create_alerts(db, workspace_id)
    except Exception:
        pass  # Non-critical

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
    "market_research_compute": 150,
    "financial_health_compute": 150,
    "kpi_framework_compute": 100,
    "financial_model_compute": 200,
    "report_generation": 100,
    "agent_task_execution": 50,
}


def get_operation_cost(operation: str) -> int:
    """Get the token cost for an operation."""
    return OPERATION_COSTS.get(operation, 10)
