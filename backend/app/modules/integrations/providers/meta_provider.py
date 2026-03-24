"""
AEOS – Meta integration provider.

Real OAuth flow for Meta (Facebook/Instagram Ads) and Instagram Business,
with simulation fallback when META_APP_ID is not configured.
"""

from __future__ import annotations

import logging
import secrets
import uuid
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger("aeos.integrations.meta")

META_PROVIDERS = {"meta", "instagram"}

SCOPES = (
    "ads_management,ads_read,pages_read_engagement,"
    "instagram_basic,instagram_manage_insights,pages_show_list,email"
)

# Meta / Facebook Graph API v21.0 endpoints
META_AUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth"
META_TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token"
META_USER_INFO_URL = "https://graph.facebook.com/me"


def generate_state_token() -> str:
    """Generate a cryptographically-secure state token for CSRF protection."""
    return secrets.token_urlsafe(32)


def build_authorization_url(
    app_id: str,
    redirect_uri: str,
    state: str,
    scopes: str = SCOPES,
) -> str:
    """Build the Meta OAuth authorization URL (no PKCE — Meta doesn't support it)."""
    params = (
        f"client_id={app_id}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
        f"&scope={scopes}"
        f"&response_type=code"
    )
    return f"{META_AUTH_URL}?{params}"


async def exchange_code_for_tokens(
    code: str,
    redirect_uri: str,
    app_id: str,
    app_secret: str,
) -> dict:
    """Exchange the authorization code for a short-lived access token."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            META_TOKEN_URL,
            params={
                "client_id": app_id,
                "client_secret": app_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def exchange_long_lived_token(
    short_token: str,
    app_id: str,
    app_secret: str,
) -> dict:
    """Exchange a short-lived token for a long-lived token (~60 days)."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            META_TOKEN_URL,
            params={
                "grant_type": "fb_exchange_token",
                "client_id": app_id,
                "client_secret": app_secret,
                "fb_exchange_token": short_token,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_user_info(access_token: str) -> dict:
    """Fetch name, email, and id from the Graph API."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            META_USER_INFO_URL,
            params={
                "fields": "id,name,email",
                "access_token": access_token,
            },
        )
        resp.raise_for_status()
        return resp.json()


def simulate_oauth(provider_id: str, account_name: str = "") -> dict:
    """Simulate a Meta OAuth token exchange."""
    if provider_id not in META_PROVIDERS:
        raise ValueError(f"Unknown Meta provider: {provider_id}")

    name = account_name or f"demo-{provider_id}"
    logger.info("Simulated Meta OAuth for %s (account=%s)", provider_id, name)

    return {
        "access_token": f"sim_meta_{uuid.uuid4().hex[:24]}",
        "refresh_token": "",
        "token_type": "bearer",
        "expires_at": (datetime.utcnow() + timedelta(days=60)).isoformat(),
        "scope": SCOPES,
        "external_account_id": f"act_{uuid.uuid4().hex[:12]}",
        "external_account_name": name,
    }
