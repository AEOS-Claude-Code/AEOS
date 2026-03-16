"""
AEOS – Redis connection helper.
"""

from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import get_settings

settings = get_settings()

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency – returns the shared async Redis client."""
    return redis_client
