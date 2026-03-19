"""
AEOS – Admin Console: API router.

Standalone admin panel endpoints for platform management.
Protected by platform_admin role or admin secret key.
"""

from __future__ import annotations

import os
import logging

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.service import verify_password, create_access_token, get_user_by_email, hash_password

from .service import (
    get_platform_stats, list_workspaces, list_users, get_system_health,
    delete_user_and_workspace, update_user_role, toggle_user_active,
    get_workspace_detail, update_workspace_plan,
)

logger = logging.getLogger("aeos.admin")
router = APIRouter(prefix="/v1/admin", tags=["Admin Console"])

# Admin secret for initial setup (env var or hardcoded fallback)
ADMIN_SECRET = os.getenv("AEOS_ADMIN_SECRET", "aeos-admin-2026!")


class AdminLoginRequest(BaseModel):
    email: str
    password: str
    admin_secret: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: dict


def _require_admin(user: User = Depends(get_current_user)) -> User:
    """Ensure the user is a platform admin."""
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admin access required")
    return user


# ── Admin Auth ──────────────────────────────────────────────────────

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(body: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """Admin login with email + password + admin secret."""
    if body.admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    user = await get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Auto-promote to platform_admin if secret is correct
    if user.role != "platform_admin":
        user.role = "platform_admin"
        await db.flush()
        await db.commit()
        logger.info("User %s promoted to platform_admin", user.email)

    # Find their workspace for token
    from app.auth.service import get_default_membership
    membership = await get_default_membership(db, user.id)
    workspace_id = membership.workspace_id if membership else ""

    access_token = create_access_token(user.id, workspace_id)

    return AdminLoginResponse(
        access_token=access_token,
        admin={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    )


# ── Stats & Overview ────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    """Platform-wide statistics."""
    return await get_platform_stats(db)


@router.get("/workspaces")
async def admin_workspaces(
    limit: int = 50, offset: int = 0,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """List all workspaces."""
    return await list_workspaces(db, limit, offset)


@router.get("/workspaces/{workspace_id}")
async def admin_workspace_detail(
    workspace_id: str,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """Get workspace details including plan, tokens, and members."""
    return await get_workspace_detail(db, workspace_id)


@router.get("/users")
async def admin_users(
    limit: int = 50, offset: int = 0,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """List all users."""
    return await list_users(db, limit, offset)


@router.get("/health")
async def admin_health(user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db)):
    """System health check."""
    return await get_system_health(db)


# ── User Management ─────────────────────────────────────────────────

class ToggleActiveRequest(BaseModel):
    is_active: bool

class UpdateRoleRequest(BaseModel):
    role: str  # "user" or "platform_admin"

class UpdatePlanRequest(BaseModel):
    plan_tier: str  # "starter", "growth", "professional", "enterprise"


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """Delete a user and their workspace (if sole owner)."""
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await delete_user_and_workspace(db, user_id)
    return result


@router.put("/users/{user_id}/active")
async def admin_toggle_active(
    user_id: str, body: ToggleActiveRequest,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """Enable or disable a user."""
    return await toggle_user_active(db, user_id, body.is_active)


@router.put("/users/{user_id}/role")
async def admin_update_role(
    user_id: str, body: UpdateRoleRequest,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """Update a user's platform role."""
    return await update_user_role(db, user_id, body.role)


# ── Workspace Management ────────────────────────────────────────────

@router.put("/workspaces/{workspace_id}/plan")
async def admin_update_plan(
    workspace_id: str, body: UpdatePlanRequest,
    user: User = Depends(_require_admin), db: AsyncSession = Depends(get_db),
):
    """Change a workspace's billing plan."""
    return await update_workspace_plan(db, workspace_id, body.plan_tier)
