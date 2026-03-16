"""
AEOS – Shopify integration provider.

Simulates Shopify OAuth flow for store connections.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger("aeos.integrations.shopify")


def simulate_oauth(store_name: str = "", account_name: str = "") -> dict:
    """Simulate a Shopify OAuth token exchange."""
    name = account_name or "demo-shopify-store"
    logger.info("Simulated Shopify OAuth (account=%s)", name)

    return {
        "access_token": f"sim_shpat_{uuid.uuid4().hex[:24]}",
        "refresh_token": "",
        "token_type": "bearer",
        "expires_at": None,
        "scope": "read_products,read_orders,read_analytics",
        "external_account_id": f"{store_name or 'demo'}.myshopify.com",
        "external_account_name": name,
    }
