"""
AEOS – Event subscriber.

Listens to Redis Pub/Sub channels and dispatches events to registered handlers.
Designed to run as a long-lived background task (in Celery worker or dedicated process).

Usage:
    from app.core.events import EventSubscriber, EventType

    subscriber = EventSubscriber()

    @subscriber.on(EventType.COMPANY_SCAN_COMPLETED)
    async def handle_scan(event: dict):
        print(f"Scan completed for {event['workspace_id']}")

    # Start listening (blocking)
    await subscriber.listen()

    # Or listen to all events
    await subscriber.listen_all()
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any, Callable, Awaitable

import redis.asyncio as aioredis

from app.core.config import get_settings
from .event_types import EventType

logger = logging.getLogger("aeos.events.subscriber")

EventHandler = Callable[[dict[str, Any]], Awaitable[None]]


class EventSubscriber:
    """
    Redis Pub/Sub event subscriber.

    Register handlers with @subscriber.on(EventType.X) or subscriber.register().
    Call subscriber.listen() to start consuming events.
    """

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)
        self._client: aioredis.Redis | None = None
        self._running = False

    def _get_client(self) -> aioredis.Redis:
        if self._client is None:
            settings = get_settings()
            self._client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        return self._client

    # ── Handler registration ─────────────────────────────────────

    def on(self, event_type: str) -> Callable:
        """Decorator to register an async handler for an event type."""
        def decorator(fn: EventHandler) -> EventHandler:
            self._handlers[event_type].append(fn)
            logger.debug("Registered handler %s for %s", fn.__name__, event_type)
            return fn
        return decorator

    def register(self, event_type: str, handler: EventHandler) -> None:
        """Programmatically register a handler."""
        self._handlers[event_type].append(handler)
        logger.debug("Registered handler %s for %s", handler.__name__, event_type)

    @property
    def registered_events(self) -> list[str]:
        """List all event types that have at least one handler."""
        return list(self._handlers.keys())

    # ── Event dispatch ───────────────────────────────────────────

    async def _dispatch(self, event_type: str, event_data: dict) -> None:
        """Dispatch an event to all registered handlers. Failures are logged, not raised."""
        handlers = self._handlers.get(event_type, [])
        if not handlers:
            return

        for handler in handlers:
            try:
                await handler(event_data)
            except Exception:
                logger.exception(
                    "Handler %s failed for event %s (workspace=%s)",
                    handler.__name__, event_type, event_data.get("workspace_id", "?"),
                )

    # ── Listening ────────────────────────────────────────────────

    async def listen(self) -> None:
        """
        Subscribe to channels for all registered event types and start listening.
        Blocks until stop() is called or the connection drops.
        """
        if not self._handlers:
            logger.warning("No handlers registered — nothing to listen for")
            return

        client = self._get_client()
        pubsub = client.pubsub()

        channels = [EventType.channel(et) for et in self._handlers]
        await pubsub.subscribe(*channels)
        logger.info("Subscribed to %d channels: %s", len(channels), ", ".join(self._handlers.keys()))

        self._running = True
        try:
            while self._running:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    await self._process_message(message)
        except asyncio.CancelledError:
            logger.info("Subscriber cancelled")
        finally:
            await pubsub.unsubscribe(*channels)
            await pubsub.close()
            self._running = False

    async def listen_all(self) -> None:
        """
        Subscribe to ALL AEOS events using a pattern subscription.
        Dispatches to handlers whose event_type matches.
        """
        client = self._get_client()
        pubsub = client.pubsub()

        pattern = EventType.wildcard_channel()
        await pubsub.psubscribe(pattern)
        logger.info("Subscribed to pattern: %s", pattern)

        self._running = True
        try:
            while self._running:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "pmessage":
                    await self._process_message(message)
        except asyncio.CancelledError:
            logger.info("Pattern subscriber cancelled")
        finally:
            await pubsub.punsubscribe(pattern)
            await pubsub.close()
            self._running = False

    def stop(self) -> None:
        """Signal the listener to stop on the next iteration."""
        self._running = False
        logger.info("Stop signal sent to subscriber")

    # ── Message processing ───────────────────────────────────────

    async def _process_message(self, message: dict) -> None:
        """Parse a Redis message and dispatch to handlers."""
        try:
            data = json.loads(message.get("data", "{}"))
            event_type = data.get("event_type", "")

            if not event_type:
                logger.warning("Received message without event_type: %s", message)
                return

            logger.debug(
                "Received %s workspace=%s engine=%s",
                event_type, data.get("workspace_id", "?"), data.get("engine", "?"),
            )
            await self._dispatch(event_type, data)

        except json.JSONDecodeError:
            logger.warning("Failed to parse event message: %s", message.get("data", ""))
        except Exception:
            logger.exception("Failed to process event message")
