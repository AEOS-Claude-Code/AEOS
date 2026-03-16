"""
AEOS – Auth contract router.

Placeholder endpoints that return deterministic mock data matching the
exact response shapes that Phase 2 JWT authentication will produce.

Phase 2 will replace this file with real auth logic.  The frontend
integration will NOT need to be rewritten because the contracts are
stable.

Response contracts:
  GET  /api/v1/auth/me             → current authenticated user
  GET  /api/v1/workspaces/current  → current workspace with plan + usage
"""

from __future__ import annotations

from datetime import datetime, timedelta
from fastapi import APIRouter, Header
from typing import Optional

from app.seed.data import WORKSPACE, OWNER_USER, WORKSPACE_ID

router = APIRouter(prefix="/v1", tags=["Auth contracts (dev)"])

# ── Response builders ────────────────────────────────────────────────


def _build_user_response() -> dict:
    """
    GET /api/v1/auth/me response shape.

    Phase 2 will:
      - decode the JWT access token from the Authorization header
      - query the users table by token subject
      - return the same shape below

    Fields:
      id              str       User UUID
      email           str       Login email
      full_name       str       Display name
      initials        str       2-char avatar initials
      role            str       "owner" | "admin" | "member" | "viewer"
      is_active       bool      Account active flag
      workspace_id    str       Current workspace UUID
      workspace_role  str       Role within this workspace
      permissions     list[str] Resolved permission slugs
      created_at      str       ISO 8601
      last_login_at   str       ISO 8601
    """
    now = datetime.utcnow()
    return {
        "id": OWNER_USER["id"],
        "email": OWNER_USER["email"],
        "full_name": OWNER_USER["full_name"],
        "initials": OWNER_USER["initials"],
        "role": OWNER_USER["role"],
        "is_active": OWNER_USER["is_active"],
        "workspace_id": OWNER_USER["workspace_id"],
        "workspace_role": "owner",
        "permissions": [
            "workspace:read",
            "workspace:write",
            "workspace:admin",
            "members:read",
            "members:write",
            "members:invite",
            "integrations:read",
            "integrations:write",
            "leads:read",
            "leads:write",
            "opportunities:read",
            "opportunities:write",
            "reports:read",
            "reports:export",
            "strategy:read",
            "strategy:approve",
            "billing:read",
            "billing:write",
        ],
        "created_at": OWNER_USER["created_at"],
        "last_login_at": (now - timedelta(minutes=12)).isoformat(),
    }


def _build_workspace_response() -> dict:
    """
    GET /api/v1/workspaces/current response shape.

    Phase 2 will:
      - resolve workspace_id from the JWT token
      - query the workspaces table
      - join subscription + token usage
      - return the same shape below

    Fields:
      id              str       Workspace UUID
      name            str       Company display name
      slug            str       URL-safe workspace slug
      industry        str       Industry vertical
      country         str       ISO country code
      city            str       City name
      team_size       int       Number of team members
      website_url     str       Primary website
      logo_url        str|null  Logo URL (S3/R2)
      plan            object    Current subscription plan
      token_usage     object    Token consumption stats
      setup           object    Onboarding wizard state
      owner           object    Workspace owner summary
      created_at      str       ISO 8601
    """
    ws = WORKSPACE
    now = datetime.utcnow()
    return {
        "id": ws["id"],
        "name": ws["name"],
        "slug": ws["slug"],
        "industry": ws["industry"],
        "country": ws["country"],
        "city": ws["city"],
        "team_size": ws["team_size"],
        "website_url": ws["website_url"],
        "logo_url": None,
        "plan": {
            "id": "plan-growth",
            "name": "Growth",
            "tier": "growth",
            "price_monthly": 59,
            "max_workspaces": 1,
            "max_users": 5,
            "included_tokens": 150000,
            "is_active": True,
            "current_period_start": (now - timedelta(days=15)).isoformat(),
            "current_period_end": (now + timedelta(days=15)).isoformat(),
        },
        "token_usage": {
            "included": 150000,
            "used": ws["tokens_used"],
            "purchased": 0,
            "remaining": 150000 - ws["tokens_used"],
            "purchased_expires_at": None,
            "reset_at": (now + timedelta(days=15)).isoformat(),
        },
        "setup": {
            "completed": ws["setup_completed"],
            "current_step": ws["setup_step"],
            "total_steps": 5,
            "steps": {
                "company_profile": True,
                "website_and_social": True,
                "competitors": True,
                "connect_platforms": True,
                "dashboard_ready": True,
            },
        },
        "owner": {
            "id": OWNER_USER["id"],
            "email": OWNER_USER["email"],
            "full_name": OWNER_USER["full_name"],
        },
        "created_at": ws["created_at"],
    }


# ── Endpoints ────────────────────────────────────────────────────────


@router.get(
    "/auth/me",
    summary="Current user",
    description=(
        "Returns the authenticated user profile. "
        "Phase 2 will validate the JWT Bearer token. "
        "Currently returns demo user for local development."
    ),
)
async def auth_me(
    authorization: Optional[str] = Header(None),
):
    """
    Phase 2 replacement plan:
      1. Extract token from Authorization: Bearer <token>
      2. Decode JWT, verify signature + expiry
      3. Query user by token subject (user_id)
      4. Return user with resolved permissions
      5. Return 401 if token invalid/expired
    """
    # Phase 2: validate token here
    # For now: return demo user regardless of token
    return _build_user_response()


@router.get(
    "/workspaces/current",
    summary="Current workspace",
    description=(
        "Returns the workspace associated with the authenticated user's "
        "session, including plan details, token usage, and setup state. "
        "Phase 2 will resolve workspace from the JWT token."
    ),
)
async def workspaces_current(
    authorization: Optional[str] = Header(None),
):
    """
    Phase 2 replacement plan:
      1. Extract user_id from JWT
      2. Query active workspace membership
      3. Join workspace + subscription + token_usage
      4. Return full workspace object
      5. Return 401 if not authenticated, 403 if no workspace access
    """
    # Phase 2: resolve workspace from token here
    # For now: return demo workspace regardless
    return _build_workspace_response()
