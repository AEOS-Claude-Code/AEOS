"""
AEOS – WordPress integration provider.

WordPress uses API key authentication (not OAuth).
Simulates REST API connection to a WordPress site.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

logger = logging.getLogger("aeos.integrations.wordpress")


def simulate_connect(site_url: str = "", account_name: str = "") -> dict:
    """Simulate a WordPress API key connection."""
    name = account_name or "demo-wordpress"
    logger.info("Simulated WordPress connection (account=%s)", name)

    return {
        "access_token": "",
        "refresh_token": "",
        "token_type": "api_key",
        "expires_at": None,
        "scope": "read",
        "api_key": f"sim_wp_{uuid.uuid4().hex[:20]}",
        "api_secret": f"sim_wp_secret_{uuid.uuid4().hex[:12]}",
        "external_account_id": site_url or "https://demo.wordpress.com",
        "external_account_name": name,
    }
