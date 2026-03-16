"""
AEOS – Seed / dev-tools router.

POST /api/seed/reset   → Reset engine data for the authenticated workspace
GET  /api/seed/status   → Current data counts

Guarded by ENVIRONMENT=development.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace
from app.engines.lead_intelligence_engine.models import Lead, LeadEvent, LeadSource
from app.engines.lead_intelligence_engine.service import ensure_seed_leads
from app.engines.opportunity_intelligence_engine.models import Opportunity
from app.engines.opportunity_intelligence_engine.detector import ensure_seed_opportunities
from app.engines.company_scanner_engine.models import CompanyScanReport
from app.engines.executive_copilot_engine.models import CopilotConversation
from app.modules.integrations.models import Integration, IntegrationCredential

logger = logging.getLogger("aeos.seed")
settings = get_settings()

seed_router = APIRouter(prefix="/seed", tags=["Seed (dev only)"])


def _guard():
    if settings.ENVIRONMENT not in ("development", "dev", "local", "test"):
        raise HTTPException(status_code=403, detail="Seed endpoints are disabled in production")


@seed_router.get("/status", summary="Data counts for the current workspace")
async def seed_status(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    _guard()
    wid = workspace.id

    leads = (await db.execute(select(func.count(Lead.id)).where(Lead.workspace_id == wid))).scalar_one()
    opps = (await db.execute(select(func.count(Opportunity.id)).where(Opportunity.workspace_id == wid))).scalar_one()
    scans = (await db.execute(select(func.count(CompanyScanReport.id)).where(CompanyScanReport.workspace_id == wid))).scalar_one()
    convos = (await db.execute(select(func.count(CopilotConversation.id)).where(CopilotConversation.workspace_id == wid))).scalar_one()

    return {
        "workspace_id": wid,
        "workspace_name": workspace.name,
        "counts": {
            "leads": leads,
            "opportunities": opps,
            "scans": scans,
            "copilot_conversations": convos,
        },
    }


@seed_router.post("/reset", summary="Clear and re-seed engine data for the current workspace")
async def seed_reset(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    _guard()
    wid = workspace.id
    logger.info("Resetting seed data for workspace=%s", wid)

    # Delete existing engine data (order matters for FK constraints)
    await db.execute(delete(CopilotConversation).where(CopilotConversation.workspace_id == wid))
    await db.execute(delete(CompanyScanReport).where(CompanyScanReport.workspace_id == wid))
    await db.execute(delete(Opportunity).where(Opportunity.workspace_id == wid))
    await db.execute(delete(LeadEvent).where(LeadEvent.workspace_id == wid))
    await db.execute(delete(LeadSource).where(LeadSource.workspace_id == wid))
    await db.execute(delete(Lead).where(Lead.workspace_id == wid))

    # Delete integration data (credentials FK → integrations)
    intg_ids_q = select(Integration.id).where(Integration.workspace_id == wid)
    await db.execute(delete(IntegrationCredential).where(IntegrationCredential.integration_id.in_(intg_ids_q)))
    await db.execute(delete(Integration).where(Integration.workspace_id == wid))
    await db.flush()

    # Re-seed
    await ensure_seed_leads(db, wid)
    await db.flush()
    await ensure_seed_opportunities(db, workspace)
    await db.flush()

    # Re-scan if website exists
    profile = workspace.profile
    if profile and profile.website_url:
        from app.engines.company_scanner_engine.service import run_scan
        await run_scan(db, wid, profile.website_url, profile.social_links)

    logger.info("Seed reset complete for workspace=%s", wid)

    return {
        "status": "reset_complete",
        "workspace_id": wid,
        "message": "Engine data cleared and re-seeded.",
    }
