"""
AEOS – Event infrastructure.

Redis Pub/Sub event bus for cross-engine and cross-process communication.
"""

from .event_types import EventType
from .event_publisher import publish_event
from .event_subscriber import EventSubscriber

__all__ = ["EventType", "publish_event", "EventSubscriber"]
