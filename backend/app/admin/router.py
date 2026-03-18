"""
AEOS – Admin Console: API router.

Admin-only endpoints for platform management.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User

from .service import get_platform_stats, list_workspaces, list_users, get_system_health

router = APIRouter(prefix="/v1/admin", tags=["Admin Console"])


def _require_admin(user: User = Depends(get_current_user)) -> User:
    """Ensure the user is a platform admin."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
async def admin_stats(
    user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide statistics."""
    return await get_platform_stats(db)


@router.get("/workspaces")
async def admin_workspaces(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces."""
    return await list_workspaces(db, limit, offset)


@router.get("/users")
async def admin_users(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users."""
    return await list_users(db, limit, offset)


@router.get("/health")
async def admin_health(
    user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """System health check."""
    return await get_system_health(db)
