"""
AEOS – Auth maintenance tasks.

Celery beat tasks for auth housekeeping.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from app.core.celery_app import celery_app
from app.core.database import async_session_factory

logger = logging.getLogger("aeos.auth.tasks")


@celery_app.task(name="auth.cleanup_refresh_tokens")
def cleanup_refresh_tokens():
    """
    Purge expired and revoked refresh tokens.
    Scheduled to run nightly via Celery Beat.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_async_cleanup())
        return result
    finally:
        loop.close()


async def _async_cleanup() -> dict:
    """Delete old tokens from the database."""
    from sqlalchemy import delete, or_
    from app.auth.models import RefreshToken

    cutoff = datetime.utcnow() - timedelta(days=1)  # Keep recently expired for 24h grace

    async with async_session_factory() as db:
        try:
            result = await db.execute(
                delete(RefreshToken).where(
                    or_(
                        RefreshToken.revoked == True,
                        RefreshToken.expires_at < cutoff,
                    )
                )
            )
            await db.commit()
            count = result.rowcount
            logger.info("Cleaned up %d expired/revoked refresh tokens", count)
            return {"purged": count}
        except Exception:
            await db.rollback()
            logger.exception("Refresh token cleanup failed")
            return {"purged": 0, "error": "cleanup failed"}
