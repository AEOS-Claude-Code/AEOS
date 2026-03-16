"""
AEOS – Meta integration provider.

Simulates OAuth flow for Meta (Facebook/Instagram Ads) and Instagram Business.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger("aeos.integrations.meta")

META_PROVIDERS = {"meta", "instagram"}

SCOPES = {
    "meta": "ads_management,ads_read,pages_read_engagement",
    "instagram": "instagram_basic,instagram_manage_insights,pages_show_list",
}


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
        "scope": SCOPES.get(provider_id, ""),
        "external_account_id": f"act_{uuid.uuid4().hex[:12]}",
        "external_account_name": name,
    }
