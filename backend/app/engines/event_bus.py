"""
AEOS – Domain event bus.

Dual-mode event bus:
1. In-process async handlers (immediate, same request lifecycle)
2. Redis Pub/Sub broadcast (cross-process, Celery workers, future microservices)

Engines continue calling emit() exactly as before. The bus now
also publishes to Redis automatically. No engine code changes needed.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Callable, Awaitable

from .contracts import EngineEvent

logger = logging.getLogger("aeos.events")

# ── In-process subscribers ───────────────────────────────────────────

_subscribers: dict[str, list[Callable[[EngineEvent], Awaitable[None]]]] = defaultdict(list)


def subscribe(event_type: str, handler: Callable[[EngineEvent], Awaitable[None]]) -> None:
    """Register an in-process async handler for an event type."""
    _subscribers[event_type].append(handler)
    logger.debug("Subscribed %s to %s", handler.__name__, event_type)


async def emit(event: EngineEvent) -> None:
    """
    Emit an event to:
    1. All in-process subscribers (immediate)
    2. Redis Pub/Sub channel (broadcast to other processes)

    Failures in either path are logged, not raised.
    """
    logger.info(
        "Event: %s workspace=%s engine=%s",
        event.event_type, event.workspace_id, event.engine,
    )

    # 1. In-process dispatch
    for handler in _subscribers.get(event.event_type, []):
        try:
            await handler(event)
        except Exception:
            logger.exception("In-process handler %s failed for %s", handler.__name__, event.event_type)

    # 2. Redis Pub/Sub broadcast
    try:
        from app.core.events.event_publisher import publish_event
        await publish_event(
            event_type=event.event_type,
            workspace_id=event.workspace_id,
            engine=event.engine,
            payload=event.payload,
        )
    except Exception:
        logger.warning("Redis publish failed for %s (non-fatal)", event.event_type)


def clear() -> None:
    """Clear all in-process subscribers (for testing)."""
    _subscribers.clear()
