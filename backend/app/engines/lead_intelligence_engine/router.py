"""
AEOS – Lead Intelligence Engine: API router.

GET /api/v1/leads/summary
GET /api/v1/leads/list
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace
from .service import get_lead_summary, get_leads, ensure_seed_leads


class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal = "proposal"
    won = "won"
    lost = "lost"


class LeadClassification(str, Enum):
    cold = "cold"
    warm = "warm"
    hot = "hot"


router = APIRouter(prefix="/v1/leads", tags=["Lead Intelligence"])


@router.get("/summary", summary="Lead summary stats")
async def lead_summary(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await ensure_seed_leads(db, workspace.id)
    await db.flush()
    summary = await get_lead_summary(db, workspace.id)
    return {
        "workspace_id": workspace.id,
        **summary,
    }


@router.get("/list", summary="List leads")
async def lead_list(
    status: Optional[LeadStatus] = Query(None, description="Filter by status"),
    classification: Optional[LeadClassification] = Query(None, description="Filter by classification"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await ensure_seed_leads(db, workspace.id)
    await db.flush()
    status_val = status.value if status else None
    class_val = classification.value if classification else None
    leads = await get_leads(db, workspace.id, status_val, class_val, limit, offset)
    return {
        "workspace_id": workspace.id,
        "leads": [
            {
                "id": l.id,
                "name": l.name,
                "email": l.email,
                "company": l.company,
                "source": l.source,
                "channel": l.channel,
                "status": l.status,
                "score": l.score,
                "classification": l.classification,
                "landing_page": l.landing_page,
                "created_at": l.created_at.isoformat(),
            }
            for l in leads
        ],
        "total": len(leads),
    }
