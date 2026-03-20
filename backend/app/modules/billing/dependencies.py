"""
AEOS – Billing: Plan-tier gating dependencies.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_membership
from app.auth.models import Membership

from .models import Subscription
from .service import get_or_create_subscription


async def require_paid_plan(
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> Subscription:
    """FastAPI dependency that blocks starter-tier workspaces.

    Returns the Subscription if the workspace is on a paid plan.
    Raises HTTP 403 if the workspace is on the starter (free) tier.
    """
    sub = await get_or_create_subscription(db, membership.workspace_id)
    if sub.plan_tier == "starter":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "plan_upgrade_required",
                "message": "This feature requires a Growth plan or higher.",
                "current_tier": "starter",
            },
        )
    return sub
