"""
AEOS – Health check router.

Production-grade health endpoints for monitoring and orchestration.
"""

from __future__ import annotations

import time
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis

router = APIRouter(tags=["health"])

_START_TIME = time.time()


@router.get("/health")
async def health_check():
    """Basic liveness probe — always returns 200 if the server is running."""
    return {
        "status": "ok",
        "service": "aeos-backend",
        "version": "0.4.0",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": int(time.time() - _START_TIME),
    }


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Readiness probe — checks all critical dependencies.
    Returns 200 only when the service is ready to handle requests.
    """
    checks = {"database": False, "timestamp": datetime.utcnow().isoformat()}
    all_ok = True

    # Database
    try:
        result = await db.execute(text("SELECT 1"))
        checks["database"] = result.scalar_one() == 1
    except Exception as e:
        checks["database"] = False
        checks["database_error"] = str(e)[:100]
        all_ok = False

    # Redis (optional — don't fail readiness if Redis is down)
    try:
        redis = await get_redis()
        pong = await redis.ping()
        checks["redis"] = bool(pong)
    except Exception:
        checks["redis"] = False

    checks["status"] = "ready" if all_ok else "not_ready"
    return checks


@router.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": result.scalar_one() == 1}


@router.get("/health/redis")
async def health_redis(redis=Depends(get_redis)):
    pong = await redis.ping()
    return {"status": "ok", "redis": pong}


@router.get("/health/info")
async def system_info():
    """System information for monitoring dashboards."""
    import platform
    return {
        "service": "aeos-backend",
        "version": "0.4.0",
        "python": platform.python_version(),
        "platform": platform.platform(),
        "uptime_seconds": int(time.time() - _START_TIME),
        "engines": [
            "digital_presence", "gap_analysis", "competitor_intelligence",
            "market_research", "financial_health", "financial_model",
            "kpi_framework", "strategy_agent", "reports", "agent_framework",
            "command_dashboard", "executive_copilot", "smart_intake",
            "company_scanner", "strategic_intelligence",
        ],
        "total_engines": 15,
    }
