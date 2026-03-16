"""
AEOS – Opportunity Radar Engine: Detection logic.

Deterministic opportunity detection from workspace profile, lead patterns,
competitor URLs, and digital presence signals.

No AI calls. Pure rule-based analysis.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger("aeos.engine.opportunities")

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Workspace, WorkspaceProfile
from app.engines.lead_intelligence_engine.models import Lead
from .models import Opportunity


# ── Opportunity templates ────────────────────────────────────────────

TEMPLATES = [
    {
        "category": "keyword_gaps",
        "title": "Untapped local SEO keywords with high purchase intent",
        "description": "Analysis of your industry and location suggests high-volume keywords with commercial intent that have no competing content from your domain.",
        "recommended_action": "Create targeted landing pages for the top 5 identified keywords.",
        "impact": "high",
        "impact_score": 92,
        "effort_score": 35,
        "condition": lambda profile, stats: bool(profile.website_url),
    },
    {
        "category": "conversion",
        "title": "Form conversion rate below industry benchmark",
        "description": "Your lead conversion patterns suggest form optimization could improve capture rates significantly.",
        "recommended_action": "A/B test a shorter form variant on the top 3 landing pages.",
        "impact": "high",
        "impact_score": 78,
        "effort_score": 40,
        "condition": lambda profile, stats: stats.get("conversion_rate", 100) < 5.0,
    },
    {
        "category": "competitor",
        "title": "Competitor weakness in mobile experience",
        "description": "Competitors in your tracked list show lower mobile performance scores, creating an opportunity to capture mobile traffic.",
        "recommended_action": "Optimize Core Web Vitals and mobile UX to outrank on mobile SERPs.",
        "impact": "high",
        "impact_score": 85,
        "effort_score": 50,
        "condition": lambda profile, stats: len(profile.competitor_urls or []) > 0,
    },
    {
        "category": "local_market",
        "title": "Incomplete Google Business profile",
        "description": "Your Google Business presence can be improved with complete information, photos, and review management.",
        "recommended_action": "Complete profile, add photos, and launch a review collection campaign.",
        "impact": "medium",
        "impact_score": 68,
        "effort_score": 15,
        "condition": lambda profile, stats: bool(profile.city),
    },
    {
        "category": "social",
        "title": "Video content opportunity on social platforms",
        "description": "Your industry shows high engagement with video content. Your social profiles could benefit from a video content strategy.",
        "recommended_action": "Launch a 4-week Reels/Shorts content plan with product demos.",
        "impact": "medium",
        "impact_score": 62,
        "effort_score": 30,
        "condition": lambda profile, stats: bool(profile.social_links),
    },
    {
        "category": "content",
        "title": "Blog content gap in your niche",
        "description": "Competitors publish regular content that ranks for informational queries. A content strategy could capture top-of-funnel traffic.",
        "recommended_action": "Create a monthly content calendar targeting 10 informational keywords.",
        "impact": "medium",
        "impact_score": 58,
        "effort_score": 45,
        "condition": lambda profile, stats: bool(profile.website_url),
    },
    {
        "category": "technical",
        "title": "Website performance optimization needed",
        "description": "Page speed improvements can directly impact search rankings and conversion rates.",
        "recommended_action": "Run a performance audit and fix critical Core Web Vitals issues.",
        "impact": "high",
        "impact_score": 75,
        "effort_score": 35,
        "condition": lambda profile, stats: bool(profile.website_url),
    },
    {
        "category": "conversion",
        "title": "Lead source diversification opportunity",
        "description": "Your lead data shows over-reliance on a single source. Diversifying acquisition channels reduces risk.",
        "recommended_action": "Allocate 20% of marketing budget to test 2 new acquisition channels.",
        "impact": "medium",
        "impact_score": 65,
        "effort_score": 40,
        "condition": lambda profile, stats: stats.get("total_leads", 0) > 3,
    },
]


# ── Detection ────────────────────────────────────────────────────────


async def detect_opportunities(
    db: AsyncSession,
    workspace: Workspace,
) -> list[dict]:
    """
    Detect opportunities based on workspace profile and lead stats.
    Returns list of opportunity dicts ready for DB insertion.
    """
    profile = workspace.profile
    if not profile:
        return []

    # Get lead stats for condition evaluation
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace.id,
        Lead.created_at >= thirty_days_ago,
    )
    total = (await db.execute(total_q)).scalar_one()

    qualified_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace.id,
        Lead.status.in_(["qualified", "proposal", "won"]),
        Lead.created_at >= thirty_days_ago,
    )
    qualified = (await db.execute(qualified_q)).scalar_one()

    stats = {
        "total_leads": total,
        "qualified_leads": qualified,
        "conversion_rate": round((qualified / max(1, total)) * 100, 1),
    }

    detected = []
    for tmpl in TEMPLATES:
        try:
            if tmpl["condition"](profile, stats):
                detected.append({
                    "workspace_id": workspace.id,
                    "title": tmpl["title"],
                    "description": tmpl["description"],
                    "category": tmpl["category"],
                    "impact": tmpl["impact"],
                    "impact_score": tmpl["impact_score"],
                    "effort_score": tmpl["effort_score"],
                    "recommended_action": tmpl["recommended_action"],
                    "source_engine": "opportunity_intelligence_engine",
                })
        except Exception:
            logger.warning("Opportunity template '%s' evaluation failed", tmpl.get("title", "unknown"))
            continue

    # Sort by impact_score descending
    detected.sort(key=lambda o: o["impact_score"], reverse=True)
    return detected


async def ensure_seed_opportunities(db: AsyncSession, workspace: Workspace) -> None:
    """Create seed opportunities for a workspace if none exist."""
    result = await db.execute(
        select(func.count(Opportunity.id)).where(Opportunity.workspace_id == workspace.id)
    )
    if result.scalar_one() > 0:
        return

    detected = await detect_opportunities(db, workspace)
    now = datetime.utcnow()
    for i, data in enumerate(detected):
        opp = Opportunity(
            **data,
            detected_at=now - timedelta(days=i * 2),
        )
        db.add(opp)
