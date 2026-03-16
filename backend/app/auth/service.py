"""
AEOS – Auth service layer.

JWT token creation/validation, password hashing, user + workspace queries.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.auth.models import (
    User,
    Workspace,
    Membership,
    WorkspaceProfile,
    OnboardingProgress,
    RefreshToken,
)

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Password helpers ─────────────────────────────────────────────────


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ──────────────────────────────────────────────────────


def create_access_token(user_id: str, workspace_id: str) -> str:
    expires = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "wid": workspace_id,
        "type": "access",
        "exp": expires,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token_value() -> str:
    return str(uuid.uuid4()) + "-" + str(uuid.uuid4())


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


# ── Slug helper ──────────────────────────────────────────────────────


def slugify(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower().strip())
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "workspace"


# ── Database queries ─────────────────────────────────────────────────


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.memberships))
    )
    return result.scalar_one_or_none()


async def get_default_membership(db: AsyncSession, user_id: str) -> Optional[Membership]:
    result = await db.execute(
        select(Membership)
        .where(Membership.user_id == user_id, Membership.is_default == True)
    )
    return result.scalar_one_or_none()


async def get_workspace_with_profile(db: AsyncSession, workspace_id: str) -> Optional[Workspace]:
    result = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(
            selectinload(Workspace.profile),
            selectinload(Workspace.onboarding),
            selectinload(Workspace.memberships).selectinload(Membership.user),
        )
    )
    return result.scalar_one_or_none()


async def get_onboarding(db: AsyncSession, workspace_id: str) -> Optional[OnboardingProgress]:
    result = await db.execute(
        select(OnboardingProgress).where(OnboardingProgress.workspace_id == workspace_id)
    )
    return result.scalar_one_or_none()


# ── Registration (transactional) ─────────────────────────────────────


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
    company_name: str,
    website_url: str = "",
) -> tuple[User, Workspace, Membership]:
    """
    Create user + workspace + membership + profile + onboarding in one transaction.
    """
    # Create user
    user = User(
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        full_name=full_name.strip(),
    )
    db.add(user)
    await db.flush()  # get user.id

    # Create workspace
    base_slug = slugify(company_name)
    workspace = Workspace(
        name=company_name.strip(),
        slug=f"{base_slug}-{user.id[:8]}",
    )
    db.add(workspace)
    await db.flush()  # get workspace.id

    # Create membership
    membership = Membership(
        user_id=user.id,
        workspace_id=workspace.id,
        role="owner",
        is_default=True,
    )
    db.add(membership)

    # Create workspace profile (with website if provided)
    profile = WorkspaceProfile(
        workspace_id=workspace.id,
        website_url=website_url.strip() if website_url else "",
    )
    db.add(profile)

    # Create onboarding progress
    onboarding = OnboardingProgress(workspace_id=workspace.id)
    db.add(onboarding)

    return user, workspace, membership


# ── Refresh token management ─────────────────────────────────────────


async def create_refresh_token(db: AsyncSession, user_id: str) -> RefreshToken:
    token = RefreshToken(
        user_id=user_id,
        token=create_refresh_token_value(),
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(token)
    return token


async def get_refresh_token(db: AsyncSession, token_value: str) -> Optional[RefreshToken]:
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == token_value,
            RefreshToken.revoked == False,
        )
    )
    return result.scalar_one_or_none()


async def revoke_user_tokens(db: AsyncSession, user_id: str) -> None:
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
        )
    )
    for token in result.scalars().all():
        token.revoked = True


# ── Permission builder ───────────────────────────────────────────────

OWNER_PERMISSIONS = [
    "workspace:read", "workspace:write", "workspace:admin",
    "members:read", "members:write", "members:invite",
    "integrations:read", "integrations:write",
    "leads:read", "leads:write",
    "opportunities:read", "opportunities:write",
    "reports:read", "reports:export",
    "strategy:read", "strategy:approve",
    "billing:read", "billing:write",
]

ADMIN_PERMISSIONS = [p for p in OWNER_PERMISSIONS if p != "billing:write"]
MEMBER_PERMISSIONS = [p for p in ADMIN_PERMISSIONS if ":write" not in p and ":admin" not in p and ":invite" not in p and ":export" not in p and ":approve" not in p]
VIEWER_PERMISSIONS = [p for p in MEMBER_PERMISSIONS if ":write" not in p]


def get_permissions(role: str) -> list[str]:
    return {
        "owner": OWNER_PERMISSIONS,
        "admin": ADMIN_PERMISSIONS,
        "member": MEMBER_PERMISSIONS,
        "viewer": VIEWER_PERMISSIONS,
    }.get(role, VIEWER_PERMISSIONS)
