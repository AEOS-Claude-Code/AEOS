"""
AEOS – Google integration provider.

Simulates OAuth flow for Google Search Console, Google Analytics, and Google Ads.
In production, this would redirect to Google's OAuth consent screen and handle the callback.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger("aeos.integrations.google")

GOOGLE_PROVIDERS = {"google_search_console", "google_analytics", "google_ads"}

SCOPES = {
    "google_search_console": "https://www.googleapis.com/auth/webmasters.readonly",
    "google_analytics": "https://www.googleapis.com/auth/analytics.readonly",
    "google_ads": "https://www.googleapis.com/auth/adwords",
}


def simulate_oauth(provider_id: str, account_name: str = "") -> dict:
    """
    Simulate a Google OAuth token exchange.
    Returns fake credentials matching the real OAuth response shape.
    """
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
