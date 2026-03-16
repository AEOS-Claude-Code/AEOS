"""
AEOS – Domain event bus.

Dual-mode event bus:
1. In-process async handlers (immediate, same request lifecycle)
2. Redis Pub/Sub broadcast (cross-process, Celery workers, future microservices)

Includes retry logic for Redis publish and failed-event tracking.
"""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Callable, Awaitable

from .contracts import EngineEvent

logger = logging.getLogger("aeos.events")

# ── In-process subscribers ───────────────────────────────────────────

_subscribers: dict[str, list[Callable[[EngineEvent], Awaitable[None]]]] = defaultdict(list)

# Track failed events for observability
_failed_events: list[dict] = []
MAX_FAILED_EVENTS = 100


def subscribe(event_type: str, handler: Callable[[EngineEvent], Awaitable[None]]) -> None:
    """Register an in-process async handler for an event type."""
    _subscribers[event_type].append(handler)
    logger.debug("Subscribed %s to %s", handler.__name__, event_type)


async def emit(event: EngineEvent) -> None:
    """
    Emit an event to:
    1. All in-process subscribers (immediate)
    2. Redis Pub/Sub channel (broadcast to other processes)

    In-process handler failures are logged and tracked.
    Redis publish retries up to 2 times with exponential backoff.
    """
    logger.info(
        "Event: %s workspace=%s engine=%s",
        event.event_type, event.workspace_id, event.engine,
    )

    handler_failures = []

    # 1. In-process dispatch
    for handler in _subscribers.get(event.event_type, []):
        try:
            await handler(event)
        except Exception as exc:
            logger.exception("In-process handler %s failed for %s", handler.__name__, event.event_type)
            handler_failures.append({"handler": handler.__name__, "error": str(exc)})

    # 2. Redis Pub/Sub broadcast with retry
    redis_ok = False
    for attempt in range(3):
        try:
            from app.core.events.event_publisher import publish_event
            await publish_event(
                event_type=event.event_type,
                workspace_id=event.workspace_id,
                engine=event.engine,
                payload=event.payload,
            )
            redis_ok = True
            break
        except Exception:
            if attempt < 2:
                await asyncio.sleep(0.1 * (2 ** attempt))  # 0.1s, 0.2s backoff
            else:
                logger.warning("Redis publish failed after 3 attempts for %s", event.event_type)

    # Track failures for observability
    if handler_failures or not redis_ok:
        _track_failure(event, handler_failures, redis_ok)


def _track_failure(event: EngineEvent, handler_failures: list, redis_ok: bool) -> None:
    if len(_failed_events) >= MAX_FAILED_EVENTS:
        _failed_events.pop(0)
    _failed_events.append({
        "event_type": event.event_type,
        "workspace_id": event.workspace_id,
        "handler_failures": handler_failures,
        "redis_published": redis_ok,
    })


def get_failed_events() -> list[dict]:
    """Return recent failed events for monitoring."""
    return list(_failed_events)


def clear() -> None:
    """Clear all in-process subscribers (for testing)."""
    _subscribers.clear()
    _failed_events.clear()
