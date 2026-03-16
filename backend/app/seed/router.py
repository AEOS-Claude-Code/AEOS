"""
AEOS – Seed data router.

Serves deterministic demo data for local development.
All endpoints are guarded: they return 404 in production.

Endpoints:
  GET  /api/v1/workspace/profile    → demo workspace + owner
  GET  /api/v1/leads                → 5 sample leads
  GET  /api/v1/opportunities        → 5 sample opportunities
  GET  /api/v1/integrations/status  → 4 integrations + recommendations
  GET  /api/seed/status             → current seed state
  POST /api/seed/reset              → reset seed data to defaults
"""

from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.seed.data import (
    WORKSPACE,
    OWNER_USER,
    LEADS,
    OPPORTUNITIES,
    INTEGRATIONS,
    RECOMMENDED_INTEGRATIONS,
    LEAD_SUMMARY,
    OPPORTUNITY_SUMMARY,
    INTEGRATION_SUMMARY,
)

settings = get_settings()

# ── In-memory mutable state (reset-able) ────────────────────────────
# We keep a mutable copy so the /reset endpoint can restore defaults.

_state: dict = {}


def _init_state() -> None:
    """Initialize or reset mutable seed state."""
    _state["workspace"] = {**WORKSPACE}
    _state["owner"] = {**OWNER_USER}
    _state["leads"] = [dict(l) for l in LEADS]
    _state["opportunities"] = [dict(o) for o in OPPORTUNITIES]
    _state["integrations"] = [dict(i) for i in INTEGRATIONS]
    _state["recommended_integrations"] = list(RECOMMENDED_INTEGRATIONS)
    _state["initialized_at"] = datetime.utcnow().isoformat()
    _state["reset_count"] = _state.get("reset_count", 0)


_init_state()

# ── Guard ────────────────────────────────────────────────────────────


def _guard() -> None:
    """Block seed endpoints in production."""
    if settings.ENVIRONMENT not in ("development", "dev", "local", "test"):
        raise HTTPException(status_code=404, detail="Not found")


# ── Routers ──────────────────────────────────────────────────────────

seed_router = APIRouter(prefix="/seed", tags=["Seed (dev only)"])
data_router = APIRouter(prefix="/v1", tags=["Seed data"])


# ── Seed management ──────────────────────────────────────────────────

@seed_router.get(
    "/status",
    summary="Seed status",
    description="Returns current seed data state. Development only.",
)
async def seed_status():
    _guard()
    return {
        "status": "active",
        "environment": settings.ENVIRONMENT,
        "workspace_id": _state["workspace"]["id"],
        "owner_email": _state["owner"]["email"],
        "leads_count": len(_state["leads"]),
        "opportunities_count": len(_state["opportunities"]),
        "integrations_count": len(_state["integrations"]),
        "initialized_at": _state["initialized_at"],
        "reset_count": _state["reset_count"],
    }


@seed_router.post(
    "/reset",
    summary="Reset seed data",
    description="Resets all seed data to defaults. Development only.",
)
async def seed_reset():
    _guard()
    _state["reset_count"] = _state.get("reset_count", 0) + 1
    _init_state()
    return {
        "status": "reset_complete",
        "message": "All seed data restored to defaults.",
        "reset_count": _state["reset_count"],
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Workspace profile ────────────────────────────────────────────────

@data_router.get(
    "/workspace/profile",
    summary="Workspace profile",
    description="Returns the demo workspace profile with owner info.",
)
async def workspace_profile():
    _guard()
    return {
        "workspace": _state["workspace"],
        "owner": _state["owner"],
    }


# ── Leads ────────────────────────────────────────────────────────────

@data_router.get(
    "/leads",
    summary="Leads list",
    description="Returns all seed leads with summary stats.",
)
async def leads_list():
    _guard()
    leads = _state["leads"]
    qualified = sum(1 for l in leads if l["status"] == "qualified")
    return {
        "workspace_id": _state["workspace"]["id"],
        "leads": leads,
        "summary": {
            "total_leads_30d": len(leads),
            "qualified_leads_30d": qualified,
            "conversion_rate": LEAD_SUMMARY["conversion_rate"],
            "top_source": LEAD_SUMMARY["top_source"],
            "trend": LEAD_SUMMARY["trend"],
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


# ── Opportunities ────────────────────────────────────────────────────

@data_router.get(
    "/opportunities",
    summary="Opportunities list",
    description="Returns all detected opportunities with summary.",
)
async def opportunities_list():
    _guard()
    opps = _state["opportunities"]
    high = sum(1 for o in opps if o["impact"] == "high")
    return {
        "workspace_id": _state["workspace"]["id"],
        "opportunities": opps,
        "summary": {
            "total_detected": len(opps),
            "high_impact_count": high,
            "categories": list({o["category"] for o in opps}),
            "top_opportunity": opps[0]["title"] if opps else "",
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


# ── Integrations ─────────────────────────────────────────────────────

@data_router.get(
    "/integrations/status",
    summary="Integration status",
    description="Returns connected integrations and recommendations.",
)
async def integrations_status():
    _guard()
    integs = _state["integrations"]
    connected = sum(1 for i in integs if i["status"] == "connected")
    total = len(integs) + len(_state["recommended_integrations"])
    critical_missing = [
        i["platform"] for i in integs if i["status"] == "disconnected"
    ]
    return {
        "workspace_id": _state["workspace"]["id"],
        "integrations": integs,
        "recommended": _state["recommended_integrations"],
        "summary": {
            "total_available": total,
            "total_connected": connected,
            "critical_missing": critical_missing,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }
