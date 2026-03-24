"""
AEOS – Google integration provider.

Real OAuth 2.0 flow with PKCE for Google Search Console, Analytics, and Ads.
Falls back to simulation when GOOGLE_CLIENT_ID is not configured.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx

logger = logging.getLogger("aeos.integrations.google")

GOOGLE_PROVIDERS = {"google_search_console", "google_analytics", "google_ads"}

SCOPES = {
    "google_search_console": "https://www.googleapis.com/auth/webmasters.readonly",
    "google_analytics": "https://www.googleapis.com/auth/analytics.readonly",
    "google_ads": "https://www.googleapis.com/auth/adwords",
}

# Always request all scopes so one consent covers all Google providers
ALL_SCOPES = " ".join([
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"


# ── PKCE Helpers ──────────────────────────────────────────────────

def generate_code_verifier() -> str:
    """Generate a random PKCE code_verifier (43-128 chars, URL-safe base64)."""
    return base64.urlsafe_b64encode(os.urandom(32)).rstrip(b"=").decode("ascii")


def generate_code_challenge(verifier: str) -> str:
    """Derive the S256 code_challenge from a verifier."""
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def generate_state_token() -> str:
    """Generate a cryptographically random state token."""
    return uuid.uuid4().hex + uuid.uuid4().hex  # 64 hex chars


# ── Authorization URL ─────────────────────────────────────────────

def build_authorization_url(
    client_id: str,
    redirect_uri: str,
    state: str,
    code_challenge: str,
    scopes: str = ALL_SCOPES,
) -> str:
    """Build the Google OAuth authorization URL."""
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scopes,
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


# ── Token Exchange ────────────────────────────────────────────────

async def exchange_code_for_tokens(
    code: str,
    code_verifier: str,
    redirect_uri: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """Exchange authorization code for access and refresh tokens."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            },
        )
        if resp.status_code != 200:
            logger.error("Google token exchange failed: %s %s", resp.status_code, resp.text[:500])
            raise ValueError(f"Google token exchange failed: {resp.status_code}")

        data = resp.json()
        logger.info("Google token exchange successful, scopes: %s", data.get("scope", ""))
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token", ""),
            "token_type": data.get("token_type", "Bearer"),
            "expires_in": data.get("expires_in", 3600),
            "scope": data.get("scope", ""),
        }


# ── Token Refresh ─────────────────────────────────────────────────

async def refresh_access_token(
    refresh_token: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """Refresh an expired access token."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "refresh_token",
            },
        )
        if resp.status_code != 200:
            logger.error("Google token refresh failed: %s %s", resp.status_code, resp.text[:500])
            raise ValueError(f"Google token refresh failed: {resp.status_code}")

        data = resp.json()
        return {
            "access_token": data["access_token"],
            "expires_in": data.get("expires_in", 3600),
        }


# ── User Info ─────────────────────────────────────────────────────

async def get_user_info(access_token: str) -> dict:
    """Fetch Google user info (email, name) for display."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            return {"email": "", "name": ""}
        data = resp.json()
        return {
            "email": data.get("email", ""),
            "name": data.get("name", ""),
        }


# ── Token Revocation ──────────────────────────────────────────────

async def revoke_token(token: str) -> bool:
    """Revoke a Google access or refresh token."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                GOOGLE_REVOKE_URL,
                params={"token": token},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            return resp.status_code == 200
    except Exception:
        logger.warning("Failed to revoke Google token")
        return False


# ── Simulation Fallback ──────────────────────────────────────────

def simulate_oauth(provider_id: str, account_name: str = "") -> dict:
    """Simulate a Google OAuth token exchange (development only)."""
    if provider_id not in GOOGLE_PROVIDERS:
        raise ValueError(f"Unknown Google provider: {provider_id}")
    name = account_name or f"demo-{provider_id.replace('_', '-')}"
    logger.info("Simulated Google OAuth for %s (account=%s)", provider_id, name)
    return {
        "access_token": f"sim_goog_{uuid.uuid4().hex[:24]}",
        "refresh_token": f"sim_goog_refresh_{uuid.uuid4().hex[:16]}",
        "token_type": "bearer",
        "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
        "scope": SCOPES.get(provider_id, ""),
        "external_account_id": f"accounts/{uuid.uuid4().hex[:8]}",
        "external_account_name": name,
    }
