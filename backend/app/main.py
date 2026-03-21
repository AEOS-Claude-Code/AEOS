"""
AEOS – Main FastAPI application.
Version: 0.5.0
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.api.routers import health
from app.auth.router import router as auth_router
from app.auth.onboarding_router import router as onboarding_router
from app.workspaces.router import router as workspace_router
from app.engines.strategic_intelligence_engine.router import router as strategy_router
from app.engines.lead_intelligence_engine.router import router as leads_router
from app.engines.opportunity_intelligence_engine.router import router as opportunities_router
from app.engines.company_scanner_engine.router import router as scanner_router
from app.engines.digital_presence_engine.router import router as digital_presence_router
from app.engines.executive_copilot_engine.router import router as copilot_router
from app.engines.smart_intake_engine.router import router as intake_router
from app.engines.gap_analysis_engine.router import router as gap_analysis_router
from app.engines.strategy_agent_engine.router import router as business_plan_router
from app.engines.competitor_intelligence_engine.router import router as competitor_intel_router
from app.engines.market_research_engine.router import router as market_research_router
from app.engines.financial_health_engine.router import router as financial_health_router
from app.engines.kpi_framework_engine.router import router as kpi_router
from app.engines.financial_model_engine.router import router as financial_model_router
from app.engines.reports_engine.router import router as reports_engine_router
from app.engines.agent_framework_engine.router import router as agent_router
from app.engines.command_dashboard.router import router as command_router
from app.admin.router import router as admin_router
from app.modules.billing.router import router as billing_router
from app.modules.integrations.router import router as integrations_router
from app.modules.notifications.router import router as notifications_router
from app.seed.router import seed_router

# Import models so Base.metadata sees all tables
import app.auth.models  # noqa
import app.engines.lead_intelligence_engine.models  # noqa
import app.engines.opportunity_intelligence_engine.models  # noqa
import app.engines.company_scanner_engine.models  # noqa
import app.engines.digital_presence_engine.models  # noqa
import app.engines.gap_analysis_engine.models  # noqa
import app.engines.strategy_agent_engine.models  # noqa
import app.engines.competitor_intelligence_engine.models  # noqa
import app.engines.market_research_engine.models  # noqa
import app.engines.financial_health_engine.models  # noqa
import app.engines.kpi_framework_engine.models  # noqa
import app.engines.financial_model_engine.models  # noqa
import app.engines.reports_engine.models  # noqa
import app.engines.agent_framework_engine.models  # noqa
import app.engines.executive_copilot_engine.models  # noqa
import app.modules.billing.models  # noqa
import app.modules.integrations.models  # noqa
import app.modules.notifications.models  # noqa

settings = get_settings()
logger = logging.getLogger("aeos.http")

# ── Rate limiter ──
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    setup_logging("DEBUG" if settings.DEBUG else "INFO")
    # ── Startup: ensure tables exist (with timeout to prevent deploy hangs) ──
    try:
        async with asyncio.timeout(30):
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified")
        # Add missing columns (safe migrations)
        try:
            from sqlalchemy import text as sa_text
            async with engine.begin() as conn:
                migrations = [
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL",
                    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS allow_overage BOOLEAN DEFAULT FALSE NOT NULL",
                    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS overage_rate FLOAT DEFAULT 0.002 NOT NULL",
                    "ALTER TABLE token_wallets ADD COLUMN IF NOT EXISTS overage_tokens INTEGER DEFAULT 0 NOT NULL",
                ]
                for sql in migrations:
                    await conn.execute(sa_text(sql))
            logger.info("Schema migrations applied")
        except Exception as mig_exc:
            logger.warning("Migration skipped: %s", mig_exc)
    except (TimeoutError, Exception) as exc:
        logger.error("Database startup failed (%s): %s — app will start anyway", type(exc).__name__, exc)

    # Validate critical config
    if settings.ENVIRONMENT == "production" and settings.JWT_SECRET_KEY == "change-me-to-a-random-64-char-string":
        logger.critical("JWT_SECRET_KEY is using default value in production!")

    yield

    # ── Shutdown: dispose engine connections ──
    await engine.dispose()


app = FastAPI(
    title="AEOS API",
    description="Autonomous Enterprise Operating System – Backend API",
    version="0.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Attach limiter state
app.state.limiter = limiter


# ── Rate limit error handler ──
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please slow down."},
    )


# ── Global exception handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())[:8]
    logger.exception("Unhandled error [%s] %s %s", error_id, request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_id": error_id},
    )


# ── Request logging middleware ──
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()

    response: Response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        "%s %s %s %sms [%s]",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    response.headers["X-Request-ID"] = request_id
    return response


# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)

# ── Routers ──
app.include_router(health.router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(workspace_router, prefix="/api")
app.include_router(onboarding_router, prefix="/api")
app.include_router(intake_router, prefix="/api")
app.include_router(strategy_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")
app.include_router(scanner_router, prefix="/api")
app.include_router(digital_presence_router, prefix="/api")
app.include_router(gap_analysis_router, prefix="/api")
app.include_router(business_plan_router, prefix="/api")
app.include_router(competitor_intel_router, prefix="/api")
app.include_router(market_research_router, prefix="/api")
app.include_router(financial_health_router, prefix="/api")
app.include_router(kpi_router, prefix="/api")
app.include_router(financial_model_router, prefix="/api")
app.include_router(reports_engine_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(command_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(integrations_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(seed_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "AEOS",
        "version": "0.4.0",
        "description": "Autonomous Enterprise Operating System",
    }
