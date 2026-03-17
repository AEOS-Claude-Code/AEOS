"""
AEOS – Digital Presence Engine.

Phase 8: Unified digital presence scoring, history, and recommendations.

Subscribes to scan_completed events to auto-recompute digital presence
when a new company scan finishes.
"""

from __future__ import annotations

import logging
from app.engines.event_bus import subscribe
from app.engines.contracts import EngineEvent

logger = logging.getLogger("aeos.engine.digital_presence")


async def _on_scan_completed(event: EngineEvent) -> None:
    """Auto-recompute digital presence after a company scan completes."""
    logger.info(
        "Scan completed for workspace=%s, triggering DP recompute",
        event.workspace_id,
    )
    try:
        from app.core.database import async_session_factory
        from .service import compute_digital_presence

        async with async_session_factory() as db:
            await compute_digital_presence(db, event.workspace_id)
            await db.commit()
    except Exception as e:
        logger.error("Auto DP recompute failed workspace=%s: %s", event.workspace_id, str(e)[:200])


subscribe("scan_completed", _on_scan_completed)
