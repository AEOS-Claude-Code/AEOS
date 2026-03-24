"""
AEOS – Integrations Hub: Service layer.

Manages connection lifecycle, provider dispatch, and credential storage.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import PROVIDERS, Integration, IntegrationCredential
from .providers.google_provider import simulate_oauth as google_oauth, GOOGLE_PROVIDERS
from .providers.meta_provider import simulate_oauth as meta_oauth, META_PROVIDERS
from .providers.wordpress_provider import simulate_connect as wordpress_connect
from .providers.shopify_provider import simulate_oauth as shopify_oauth
from app.core.events import EventType, publish_event

logger = logging.getLogger("aeos.integrations")


# ── Provider dispatch ────────────────────────────────────────────────

def _simulate_credentials(provider_id: str, account_name: str, config: dict) -> dict:
    """Route to the correct provider and return simulated credentials."""
    if provider_id in GOOGLE_PROVIDERS:
        return google_oauth(provider_id, account_name)
    elif provider_id in META_PROVIDERS:
        return meta_oauth(provider_id, account_name)
    elif provider_id == "wordpress":
        return wordpress_connect(config.get("site_url", ""), account_name)
    elif provider_id == "shopify":
        return shopify_connect(config.get("store_name", ""), account_name)
    else:
        # Generic simulation for providers without a dedicated module
        return _generic_simulate(provider_id, account_name)


def shopify_connect(store_name: str, account_name: str) -> dict:
    return shopify_oauth(store_name, account_name)


def _generic_simulate(provider_id: str, account_name: str) -> dict:
    """Fallback simulation for providers without a dedicated module."""
    import uuid
    name = account_name or f"demo-{provider_id}"
    logger.info("Generic simulation for provider=%s (account=%s)", provider_id, name)
    return {
        "access_token": f"sim_{provider_id}_{uuid.uuid4().hex[:16]}",
        "refresh_token": "",
        "token_type": "bearer",
        "expires_at": None,
        "scope": "read",
        "external_account_id": f"{provider_id}-{uuid.uuid4().hex[:8]}",
        "external_account_name": name,
    }


# ── Connection lifecycle ─────────────────────────────────────────────


async def list_integrations(db: AsyncSession, workspace_id: str) -> list[dict]:
    """Return all providers with their connection status for a workspace."""
    result = await db.execute(
        select(Integration).where(Integration.workspace_id == workspace_id)
    )
    connected = {i.provider_id: i for i in result.scalars().all()}

    items = []
    for pid, prov in PROVIDERS.items():
        intg = connected.get(pid)
        items.append({
            "id": intg.id if intg else "",
            "provider_id": pid,
            "provider_name": prov["name"],
            "category": prov["category"],
            "description": prov["description"],
            "icon": prov["icon"],
            "status": intg.status if intg else "disconnected",
            "display_name": intg.display_name if intg else "",
            "connected_at": intg.connected_at.isoformat() if intg and intg.connected_at else None,
            "last_sync_at": intg.last_sync_at.isoformat() if intg and intg.last_sync_at else None,
            "error_message": intg.error_message if intg else "",
        })

    return items


async def connect_provider(
    db: AsyncSession,
    workspace_id: str,
    provider_id: str,
    config: dict,
    account_name: str = "",
) -> Integration:
    """Connect (or reconnect) a provider for a workspace."""
    if provider_id not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider_id}")

    provider = PROVIDERS[provider_id]

    # Check if already exists
    result = await db.execute(
        select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider_id == provider_id,
        )
    )
    intg = result.scalar_one_or_none()

    if not intg:
        intg = Integration(
            workspace_id=workspace_id,
            provider_id=provider_id,
        )
        db.add(intg)
        await db.flush()

    # Simulate credential exchange
    intg.status = "connecting"
    await db.flush()

    try:
        creds = _simulate_credentials(provider_id, account_name, config)

        # Upsert credentials
        cred_result = await db.execute(
            select(IntegrationCredential).where(IntegrationCredential.integration_id == intg.id)
        )
        cred = cred_result.scalar_one_or_none()
        if not cred:
            cred = IntegrationCredential(integration_id=intg.id)
            db.add(cred)

        cred.access_token = creds.get("access_token", "")
        cred.refresh_token = creds.get("refresh_token", "")
        cred.token_type = creds.get("token_type", "bearer")
        cred.scope = creds.get("scope", "")
        cred.api_key = creds.get("api_key", "")
        cred.api_secret = creds.get("api_secret", "")
        cred.external_account_id = creds.get("external_account_id", "")
        cred.external_account_name = creds.get("external_account_name", "")

        if creds.get("expires_at"):
            from datetime import datetime as dt
            try:
                cred.expires_at = dt.fromisoformat(creds["expires_at"])
            except (ValueError, TypeError):
                logger.warning("Failed to parse expires_at for integration %s", intg.id)

        # Mark connected
        intg.status = "connected"
        intg.display_name = creds.get("external_account_name", provider["name"])
        intg.connected_at = datetime.utcnow()
        intg.config = config
        intg.error_message = ""

        logger.info("Connected %s for workspace=%s (account=%s)", provider_id, workspace_id, intg.display_name)

        # Emit event
        await publish_event(
            EventType.INTEGRATION_CONNECTED,
            workspace_id=workspace_id,
            engine="integrations",
            payload={"provider_id": provider_id, "display_name": intg.display_name},
        )

    except Exception as e:
        intg.status = "error"
        intg.error_message = str(e)[:500]
        logger.exception("Failed to connect %s for workspace=%s", provider_id, workspace_id)

    return intg


async def disconnect_provider(
    db: AsyncSession,
    workspace_id: str,
    provider_id: str,
) -> bool:
    """Disconnect a provider, clearing credentials."""
    result = await db.execute(
        select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider_id == provider_id,
        )
    )
    intg = result.scalar_one_or_none()
    if not intg:
        return False

    # Delete credentials
    cred_result = await db.execute(
        select(IntegrationCredential).where(IntegrationCredential.integration_id == intg.id)
    )
    cred = cred_result.scalar_one_or_none()
    if cred:
        await db.delete(cred)

    intg.status = "disconnected"
    intg.disconnected_at = datetime.utcnow()
    intg.display_name = ""
    intg.error_message = ""

    logger.info("Disconnected %s for workspace=%s", provider_id, workspace_id)
    return True


async def get_connected_count(db: AsyncSession, workspace_id: str) -> int:
    """Count connected integrations for a workspace."""
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Integration.id)).where(
            Integration.workspace_id == workspace_id,
            Integration.status == "connected",
        )
    )
    return result.scalar_one()


async def get_valid_access_token(db: AsyncSession, integration_id: str) -> str:
    """Return a valid access token, refreshing if expired."""
    from .providers.google_provider import refresh_access_token, GOOGLE_PROVIDERS
    from app.core.config import get_settings

    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    intg = result.scalar_one_or_none()
    if not intg or intg.status != "connected":
        raise ValueError("Integration not connected")

    cred_result = await db.execute(
        select(IntegrationCredential).where(IntegrationCredential.integration_id == integration_id)
    )
    cred = cred_result.scalar_one_or_none()
    if not cred or not cred.access_token:
        raise ValueError("No credentials found")

    # Check if token is still valid (5 min buffer)
    if cred.expires_at and cred.expires_at > datetime.utcnow() + timedelta(minutes=5):
        return cred.access_token

    # Token expired or expiring soon — refresh it
    if intg.provider_id in GOOGLE_PROVIDERS and cred.refresh_token:
        settings = get_settings()
        try:
            new_tokens = await refresh_access_token(
                refresh_token=cred.refresh_token,
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )
            cred.access_token = new_tokens["access_token"]
            cred.expires_at = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            await db.flush()
            logger.info("Refreshed access token for integration %s", integration_id)
            return cred.access_token
        except Exception as e:
            logger.error("Token refresh failed for integration %s: %s", integration_id, str(e))
            raise ValueError(f"Token refresh failed: {str(e)}")

    return cred.access_token
