"""
AEOS – Lead Intelligence Engine: Service layer.

Provides lead queries, summaries, and seed data generation for workspaces.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Lead, LeadEvent, LeadSource
from .scoring import compute_lead_score, classify_lead
from app.engines.contracts import EngineEvent
from app.engines.event_bus import emit

logger = logging.getLogger("aeos.engine.leads")


# ── Seed data generator ──────────────────────────────────────────────

SEED_LEADS = [
    {"name": "Sarah Mitchell", "email": "sarah@brightpath.com", "company": "BrightPath Consulting", "source": "organic_search", "channel": "website_form", "status": "qualified", "landing_page": "/pricing", "utm_source": "google", "utm_medium": "organic"},
    {"name": "James Rodriguez", "email": "j.rod@techvault.io", "company": "TechVault", "source": "paid_search", "channel": "google_ads", "status": "new", "landing_page": "/features", "utm_source": "google", "utm_medium": "cpc"},
    {"name": "Emily Tanaka", "email": "emily@greenlane.co", "company": "GreenLane Co", "source": "social", "channel": "instagram", "status": "qualified", "landing_page": "/case-studies", "utm_source": "instagram", "utm_medium": "social"},
    {"name": "Marcus Webb", "email": "marcus@webblabs.com", "company": "Webb Labs", "source": "referral", "channel": "partner", "status": "contacted", "landing_page": "/demo", "utm_source": "partner", "utm_medium": "referral"},
    {"name": "Lisa Andersen", "email": "lisa@nordicretail.dk", "company": "Nordic Retail", "source": "organic_search", "channel": "whatsapp", "status": "new", "landing_page": "/contact", "utm_source": "google", "utm_medium": "organic"},
    {"name": "David Park", "email": "d.park@synthwave.io", "company": "Synthwave", "source": "direct", "channel": "website_form", "status": "proposal", "landing_page": "/pricing", "utm_source": "", "utm_medium": ""},
    {"name": "Amara Osei", "email": "amara@solarcraft.gh", "company": "SolarCraft", "source": "social", "channel": "instagram", "status": "new", "landing_page": "/features", "utm_source": "instagram", "utm_medium": "social"},
    {"name": "Tom Fischer", "email": "tom@berlinbytes.de", "company": "Berlin Bytes", "source": "organic_search", "channel": "website_form", "status": "qualified", "landing_page": "/demo", "utm_source": "google", "utm_medium": "organic"},
    {"name": "Priya Sharma", "email": "priya@cloudnest.in", "company": "CloudNest", "source": "email", "channel": "website_form", "status": "contacted", "landing_page": "/free-trial", "utm_source": "newsletter", "utm_medium": "email"},
    {"name": "Carlos Mendez", "email": "carlos@rapido.mx", "company": "Rapido MX", "source": "whatsapp", "channel": "whatsapp", "status": "qualified", "landing_page": "/book", "utm_source": "whatsapp", "utm_medium": "direct"},
]


async def ensure_seed_leads(db: AsyncSession, workspace_id: str) -> None:
    """Create seed leads for a workspace if none exist."""
    result = await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id)
    )
    count = result.scalar_one()
    if count > 0:
        return

    now = datetime.utcnow()
    for i, data in enumerate(SEED_LEADS):
        score = compute_lead_score(
            source=data["source"],
            channel=data["channel"],
            landing_page=data["landing_page"],
            status=data["status"],
            event_count=2,
            has_email=bool(data["email"]),
            has_phone=False,
            has_company=bool(data["company"]),
        )
        lead = Lead(
            workspace_id=workspace_id,
            name=data["name"],
            email=data["email"],
            company=data["company"],
            source=data["source"],
            channel=data["channel"],
            status=data["status"],
            landing_page=data["landing_page"],
            utm_source=data["utm_source"],
            utm_medium=data["utm_medium"],
            score=score,
            classification=classify_lead(score),
            created_at=now - timedelta(days=30 - i * 3, hours=i * 2),
        )
        db.add(lead)

    logger.info("Seeded %d leads for workspace=%s", len(SEED_LEADS), workspace_id)
    await emit(EngineEvent(
        event_type="leads_seeded",
        workspace_id=workspace_id,
        engine="lead_intelligence",
        payload={"count": len(SEED_LEADS)},
    ))


# ── Queries ──────────────────────────────────────────────────────────


async def get_leads(
    db: AsyncSession,
    workspace_id: str,
    status_filter: Optional[str] = None,
    classification_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Lead]:
    """Get leads for a workspace with optional filters."""
    q = select(Lead).where(Lead.workspace_id == workspace_id)
    if status_filter:
        q = q.where(Lead.status == status_filter)
    if classification_filter:
        q = q.where(Lead.classification == classification_filter)
    q = q.order_by(Lead.score.desc(), Lead.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_lead_summary(db: AsyncSession, workspace_id: str) -> dict:
    """Compute lead summary stats for the workspace."""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # Total leads
    total_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= thirty_days_ago,
    )
    total = (await db.execute(total_q)).scalar_one()

    # By status
    status_q = select(
        Lead.status, func.count(Lead.id)
    ).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= thirty_days_ago,
    ).group_by(Lead.status)
    status_rows = (await db.execute(status_q)).all()
    by_status = {row[0]: row[1] for row in status_rows}

    qualified = by_status.get("qualified", 0) + by_status.get("proposal", 0) + by_status.get("won", 0)

    # By source
    source_q = select(
        Lead.source, func.count(Lead.id), func.avg(Lead.score)
    ).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= thirty_days_ago,
    ).group_by(Lead.source).order_by(func.count(Lead.id).desc())
    source_rows = (await db.execute(source_q)).all()
    by_source = [
        {"source": row[0], "count": row[1], "avg_score": round(float(row[2] or 0), 1)}
        for row in source_rows
    ]

    # By classification (score distribution)
    class_q = select(
        Lead.classification, func.count(Lead.id)
    ).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= thirty_days_ago,
    ).group_by(Lead.classification)
    class_rows = (await db.execute(class_q)).all()
    by_classification = {row[0]: row[1] for row in class_rows}

    # Conversion rate
    conversion_rate = round((qualified / max(1, total)) * 100, 1)

    # Top source
    top_source = by_source[0]["source"] if by_source else "none"

    # Trend (compare last 15 days vs prior 15 days)
    mid_point = datetime.utcnow() - timedelta(days=15)
    recent_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= mid_point,
    )
    prior_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= thirty_days_ago,
        Lead.created_at < mid_point,
    )
    recent = (await db.execute(recent_q)).scalar_one()
    prior = (await db.execute(prior_q)).scalar_one()

    if recent > prior * 1.1:
        trend = "rising"
    elif recent < prior * 0.9:
        trend = "declining"
    else:
        trend = "stable"

    return {
        "total_leads_30d": total,
        "qualified_leads_30d": qualified,
        "conversion_rate": conversion_rate,
        "top_source": top_source,
        "trend": trend,
        "by_source": by_source,
        "by_status": by_status,
        "by_classification": by_classification,
    }
