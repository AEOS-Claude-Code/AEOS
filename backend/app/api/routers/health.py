"""
AEOS – Health check router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "aeos-backend"}


@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": result.scalar_one() == 1}


@router.get("/health/redis")
async def health_redis(redis=Depends(get_redis)):
    pong = await redis.ping()
    return {"status": "ok", "redis": pong}
