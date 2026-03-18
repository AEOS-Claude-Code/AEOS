"""
AEOS – Command Dashboard: API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership

from .service import get_command_dashboard

router = APIRouter(prefix="/v1/command", tags=["Command Dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    """Get the real-time command dashboard data."""
    return await get_command_dashboard(db, membership.workspace_id)
