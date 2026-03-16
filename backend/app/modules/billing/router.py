"""
AEOS – Billing API Router.

GET  /api/v1/billing/plans          → List all available plans
GET  /api/v1/billing/plan           → Current subscription + plan
POST /api/v1/billing/change-plan    → Upgrade/downgrade plan
GET  /api/v1/billing/token-balance  → Token wallet balance
GET  /api/v1/billing/token-usage    → Recent token usage log
POST /api/v1/billing/purchase-tokens → Purchase additional tokens
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace
from .models import PLANS, TRIAL_DAYS
from .schemas import (
    PlanInfo,
    PlanListResponse,
    SubscriptionResponse,
    ChangePlanRequest,
    TokenBalanceResponse,
    TokenUsageItem,
    TokenUsageResponse,
    PurchaseTokensRequest,
    PurchaseTokensResponse,
)
from .service import (
    get_or_create_subscription,
    change_plan,
    get_or_create_wallet,
    get_usage_history,
    purchase_tokens,
)

router = APIRouter(prefix="/v1/billing", tags=["Billing"])


def _plan_info(tier: str) -> PlanInfo:
    p = PLANS.get(tier, PLANS["starter"])
    return PlanInfo(**p)


@router.get(
    "/plans",
    response_model=PlanListResponse,
    summary="List all available plans",
)
async def list_plans():
    return PlanListResponse(
        plans=[PlanInfo(**p) for p in PLANS.values()]
    )


@router.get(
    "/plan",
    response_model=SubscriptionResponse,
    summary="Current subscription and plan details",
)
async def current_plan(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    sub = await get_or_create_subscription(db, workspace.id)
    now = datetime.utcnow()

    is_trial = sub.status == "trialing" and sub.trial_end and sub.trial_end > now
    trial_remaining = max(0, (sub.trial_end - now).days) if is_trial and sub.trial_end else 0

    return SubscriptionResponse(
        plan=_plan_info(sub.plan_tier),
        status=sub.status,
        is_trial=is_trial,
        trial_days_remaining=trial_remaining,
        current_period_start=sub.current_period_start.isoformat(),
        current_period_end=sub.current_period_end.isoformat(),
    )


@router.post(
    "/change-plan",
    response_model=SubscriptionResponse,
    summary="Change subscription plan",
)
async def update_plan(
    body: ChangePlanRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    try:
        sub = await change_plan(db, workspace.id, body.plan_tier)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.utcnow()
    is_trial = sub.status == "trialing" and sub.trial_end and sub.trial_end > now

    return SubscriptionResponse(
        plan=_plan_info(sub.plan_tier),
        status=sub.status,
        is_trial=is_trial,
        trial_days_remaining=0,
        current_period_start=sub.current_period_start.isoformat(),
        current_period_end=sub.current_period_end.isoformat(),
    )


@router.get(
    "/token-balance",
    response_model=TokenBalanceResponse,
    summary="Current token wallet balance",
)
async def token_balance(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_or_create_wallet(db, workspace.id)
    usage_pct = (wallet.used_tokens / max(1, wallet.total)) * 100

    return TokenBalanceResponse(
        included=wallet.included_tokens,
        purchased=wallet.purchased_tokens,
        used=wallet.used_tokens,
        available=wallet.available,
        total=wallet.total,
        reset_at=wallet.reset_at.isoformat(),
        usage_pct=round(usage_pct, 1),
    )


@router.get(
    "/token-usage",
    response_model=TokenUsageResponse,
    summary="Recent token usage log",
)
async def token_usage(
    limit: int = Query(50, ge=1, le=200),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    sub = await get_or_create_subscription(db, workspace.id)
    items = await get_usage_history(db, workspace.id, limit)

    return TokenUsageResponse(
        workspace_id=workspace.id,
        items=[
            TokenUsageItem(
                id=u.id,
                operation=u.operation,
                tokens_consumed=u.tokens_consumed,
                engine=u.engine or "",
                detail=u.detail or "",
                created_at=u.created_at.isoformat(),
            )
            for u in items
        ],
        total_used=sum(u.tokens_consumed for u in items),
        period_start=sub.current_period_start.isoformat(),
    )


@router.post(
    "/purchase-tokens",
    response_model=PurchaseTokensResponse,
    summary="Purchase additional tokens (simulated)",
)
async def purchase(
    body: PurchaseTokensRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    tx = await purchase_tokens(db, workspace.id, body.amount)
    wallet = await get_or_create_wallet(db, workspace.id)

    return PurchaseTokensResponse(
        transaction_id=tx.id,
        tokens_added=body.amount,
        new_balance=wallet.available,
        payment_status=tx.payment_status,
        message=f"Successfully added {body.amount:,} tokens to your wallet.",
    )
