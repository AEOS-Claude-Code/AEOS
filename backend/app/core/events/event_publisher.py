"""
AEOS – Event publisher.

Publishes domain events to Redis Pub/Sub channels.
Designed to be called from API request handlers, engine services,
and Celery tasks.

Usage (async context — API handlers, engine services):
    from app.core.events import publish_event, EventType
    await publish_event(EventType.COMPANY_SCAN_COMPLETED, workspace_id="abc", payload={...})

Usage (sync context — Celery tasks):
    from app.core.events.event_publisher import publish_event_sync
    publish_event_sync(EventType.COMPANY_SCAN_COMPLETED, workspace_id="abc", payload={...})
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis
import redis as sync_redis

from app.core.config import get_settings
from .event_types import EventType

logger = logging.getLogger("aeos.events.publisher")


def _build_message(
    event_type: str,
    workspace_id: str,
    engine: str = "",
    payload: dict[str, Any] | None = None,
) -> str:
    """Serialize an event to JSON for Redis PUBLISH."""
    return json.dumps({
        "event_type": event_type,
        "workspace_id": workspace_id,
        "engine": engine,
        "payload": payload or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# ── Async publisher (for FastAPI request context) ────────────────────

_async_client: aioredis.Redis | None = None


def _get_async_client() -> aioredis.Redis:
    """Lazy-init async Redis client for publishing."""
    global _async_client
    if _async_client is None:
        settings = get_settings()
        _async_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _async_client


async def publish_event(
    event_type: str,
    workspace_id: str,
    engine: str = "",
    payload: dict[str, Any] | None = None,
) -> int:
    """
    Publish an event to the Redis Pub/Sub channel.

    Returns the number of subscribers that received the message.
    Non-blocking, fire-and-forget. Failures are logged, not raised.
    """
    channel = EventType.channel(event_type)
    message = _build_message(event_type, workspace_id, engine, payload)

    try:
        client = _get_async_client()
        receivers = await client.publish(channel, message)
        logger.info(
            "Published %s → %s (workspace=%s, receivers=%d)",
            event_type, channel, workspace_id, receivers,
        )
        return receivers
    except Exception:
        logger.exception("Failed to publish event %s to Redis", event_type)
        return 0


# ── Sync publisher (for Celery task context) ─────────────────────────

_sync_client: sync_redis.Redis | None = None


def _get_sync_client() -> sync_redis.Redis:
    """Lazy-init sync Redis client for Celery workers."""
    global _sync_client
    if _sync_client is None:
        settings = get_settings()
        _sync_client = sync_redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _sync_client


def publish_event_sync(
    event_type: str,
    workspace_id: str,
    engine: str = "",
    payload: dict[str, Any] | None = None,
) -> int:
    """
    Synchronous version of publish_event for use in Celery tasks.

    Returns the number of subscribers that received the message.
    """
    channel = EventType.channel(event_type)
    message = _build_message(event_type, workspace_id, engine, payload)

    try:
        client = _get_sync_client()
        receivers = client.publish(channel, message)
        logger.info(
            "Published (sync) %s → %s (workspace=%s, receivers=%d)",
            event_type, channel, workspace_id, receivers,
        )
        return receivers
    except Exception:
        logger.exception("Failed to sync-publish event %s to Redis", event_type)
        return 0
