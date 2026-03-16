"""
AEOS – Event type definitions.

Canonical event names for the Redis Pub/Sub bus.
All publishers and subscribers reference these constants
to avoid typos and enable IDE autocomplete.

Channel naming: aeos:events:{event_type}
"""

from __future__ import annotations


class EventType:
    """Namespace for all AEOS event type constants."""

    # ── Company Scanner ──────────────────────────────────────────
    COMPANY_SCAN_COMPLETED = "company_scan_completed"
    COMPANY_SCAN_FAILED = "company_scan_failed"

    # ── Lead Intelligence ────────────────────────────────────────
    LEAD_CREATED = "lead_created"
    LEADS_SEEDED = "leads_seeded"

    # ── Opportunity Radar ────────────────────────────────────────
    OPPORTUNITY_DETECTED = "opportunity_detected"
    OPPORTUNITIES_SEEDED = "opportunities_seeded"

    # ── Strategic Intelligence ───────────────────────────────────
    STRATEGY_GENERATED = "strategy_generated"

    # ── Executive Copilot ────────────────────────────────────────
    COPILOT_ANSWERED = "copilot_answered"

    # ── Billing ──────────────────────────────────────────────────
    TOKENS_CONSUMED = "tokens_consumed"
    PLAN_CHANGED = "plan_changed"

    # ── Integrations ─────────────────────────────────────────────
    INTEGRATION_CONNECTED = "integration_connected"
    INTEGRATION_DISCONNECTED = "integration_disconnected"

    @classmethod
    def all(cls) -> list[str]:
        """Return all event type strings."""
        return [
            v for k, v in vars(cls).items()
            if k.isupper() and isinstance(v, str)
        ]

    @classmethod
    def channel(cls, event_type: str) -> str:
        """Return the Redis channel name for an event type."""
        return f"aeos:events:{event_type}"

    @classmethod
    def wildcard_channel(cls) -> str:
        """Return the Redis pattern for subscribing to all AEOS events."""
        return "aeos:events:*"
