"""
AEOS – Main FastAPI application.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from app.engines.executive_copilot_engine.router import router as copilot_router
from app.modules.billing.router import router as billing_router
from app.modules.integrations.router import router as integrations_router
from app.seed.router import seed_router

# Import models so Base.metadata sees all tables
import app.auth.models  # noqa
import app.engines.lead_intelligence_engine.models  # noqa
import app.engines.opportunity_intelligence_engine.models  # noqa
import app.engines.company_scanner_engine.models  # noqa
import app.engines.executive_copilot_engine.models  # noqa
import app.modules.billing.models  # noqa
import app.modules.integrations.models  # noqa

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    setup_logging("DEBUG" if settings.DEBUG else "INFO")
    # ── Startup: create tables in development ──
    if settings.ENVIRONMENT in ("development", "dev", "local", "test"):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    # ── Shutdown ──


app = FastAPI(
    title="AEOS API",
    description="Autonomous Enterprise Operating System – Backend API",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(health.router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(workspace_router, prefix="/api")
app.include_router(onboarding_router, prefix="/api")
app.include_router(strategy_router, prefix="/api")
app.include_router(leads_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")
app.include_router(scanner_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(integrations_router, prefix="/api")
app.include_router(seed_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "AEOS",
        "version": "0.3.0",
        "description": "Autonomous Enterprise Operating System",
    }
