"""
AEOS – Main FastAPI application.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routers import health
from app.api.routers.auth_contract import router as auth_contract_router
from app.engines.strategic_intelligence_engine.router import router as strategy_router
from app.seed.router import seed_router, data_router as seed_data_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    # ── Startup ──
    yield
    # ── Shutdown ──


app = FastAPI(
    title="AEOS API",
    description="Autonomous Enterprise Operating System – Backend API",
    version="0.1.0",
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
app.include_router(auth_contract_router, prefix="/api")
app.include_router(strategy_router, prefix="/api")
app.include_router(seed_router, prefix="/api")
app.include_router(seed_data_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "AEOS",
        "version": "0.1.0",
        "description": "Autonomous Enterprise Operating System",
    }
