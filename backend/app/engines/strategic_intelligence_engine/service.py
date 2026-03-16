"""
AEOS – Strategic Intelligence Engine: Service orchestrator.

Phase 3.5: Fully wired to real database tables.
Signal collectors query the actual leads, opportunities, and workspace
profile created by Phase 2 (auth/onboarding) and Phase 3 (engines).

All collector functions are async and receive a db session.
Includes a 60-second per-workspace signal cache to avoid redundant queries.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Workspace, WorkspaceProfile
from app.engines.lead_intelligence_engine.models import Lead
from app.engines.lead_intelligence_engine.service import ensure_seed_leads
from app.engines.opportunity_intelligence_engine.models import Opportunity
from app.engines.opportunity_intelligence_engine.detector import ensure_seed_opportunities

logger = logging.getLogger("aeos.engine.strategy")

# ── Signal cache (per-workspace, 60s TTL, max 100 entries) ───────────

_signal_cache: dict[str, tuple[datetime, "SignalMap"]] = {}
CACHE_TTL_SECONDS = 60
CACHE_MAX_SIZE = 100


def _get_cached(workspace_id: str) -> Optional["SignalMap"]:
    entry = _signal_cache.get(workspace_id)
    if not entry:
        return None
    cached_at, signals = entry
    if (datetime.utcnow() - cached_at).total_seconds() >= CACHE_TTL_SECONDS:
        _signal_cache.pop(workspace_id, None)
        return None
    logger.debug("Signal cache HIT workspace=%s", workspace_id)
    return signals


def _set_cached(workspace_id: str, signals: "SignalMap") -> None:
    # Evict expired entries and enforce max size
    now = datetime.utcnow()
    expired = [k for k, (t, _) in _signal_cache.items() if (now - t).total_seconds() >= CACHE_TTL_SECONDS]
    for k in expired:
        _signal_cache.pop(k, None)
    if len(_signal_cache) >= CACHE_MAX_SIZE:
        oldest_key = min(_signal_cache, key=lambda k: _signal_cache[k][0])
        _signal_cache.pop(oldest_key, None)
    _signal_cache[workspace_id] = (now, signals)

from .schemas import (
    ContextPack,
    CompetitorSignal,
    DigitalPresenceSignal,
    DigitalTwinSignal,
    FinanceSummarySignal,
    HealthScore,
    HRSummarySignal,
    IndustrySignal,
    IntegrationStatusSignal,
    LeadIntelligenceSignal,
    OperationsSummarySignal,
    OpportunitySignal,
    PriorityCategory,
    PriorityList,
    RiskList,
    RoadmapResponse,
    SignalMap,
    StrategicSummary,
    WorkspaceProfileSignal,
)
from .rules import compute_health_score, detect_priorities, generate_headline, generate_key_insight
from .priorities import build_priority_list
from .risks import build_risk_list
from .roadmap import build_roadmaps
from .context_pack import build_context_pack


# ── Signal collectors (async, query real DB) ─────────────────────────


async def _collect_workspace_profile(
    db: AsyncSession, workspace: Workspace,
) -> WorkspaceProfileSignal:
    """Read from the real workspace + profile tables."""
    profile = workspace.profile
    onboarding = workspace.onboarding

    return WorkspaceProfileSignal(
        company_name=workspace.name or "",
        industry=profile.industry if profile else "general",
        country=profile.country if profile else "",
        city=profile.city if profile else "",
        team_size=profile.team_size if profile else 1,
        website_url=profile.website_url if profile else "",
        goals=[profile.primary_goal] if profile and profile.primary_goal else [],
        setup_completed=onboarding.completed if onboarding else False,
    )


async def _collect_leads(
    db: AsyncSession, workspace_id: str,
) -> LeadIntelligenceSignal:
    """Query real leads table for summary stats."""
    thirty_days = datetime.utcnow() - timedelta(days=30)

    total_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace_id,
        Lead.created_at >= thirty_days,
    )
    total = (await db.execute(total_q)).scalar_one()

    qualified_q = select(func.count(Lead.id)).where(
        Lead.workspace_id == workspace_id,
        Lead.status.in_(["qualified", "proposal", "won"]),
        Lead.created_at >= thirty_days,
    )
    qualified = (await db.execute(qualified_q)).scalar_one()

    conversion_rate = round((qualified / max(1, total)) * 100, 1)

    # Top source
    source_q = (
        select(Lead.source, func.count(Lead.id))
        .where(Lead.workspace_id == workspace_id, Lead.created_at >= thirty_days)
        .group_by(Lead.source)
        .order_by(func.count(Lead.id).desc())
        .limit(1)
    )
    source_row = (await db.execute(source_q)).first()
    top_source = source_row[0] if source_row else "none"

    # Trend
    mid = datetime.utcnow() - timedelta(days=15)
    recent = (await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id, Lead.created_at >= mid)
    )).scalar_one()
    prior = (await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id, Lead.created_at >= thirty_days, Lead.created_at < mid)
    )).scalar_one()

    if recent > prior * 1.1:
        trend = "rising"
    elif recent < prior * 0.9:
        trend = "declining"
    else:
        trend = "stable"

    return LeadIntelligenceSignal(
        total_leads_30d=total,
        qualified_leads_30d=qualified,
        conversion_rate=conversion_rate,
        top_source=top_source,
        trend=trend,
    )


async def _collect_opportunities(
    db: AsyncSession, workspace_id: str,
) -> OpportunitySignal:
    """Query real opportunities table."""
    total_q = select(func.count(Opportunity.id)).where(
        Opportunity.workspace_id == workspace_id
    )
    total = (await db.execute(total_q)).scalar_one()

    high_q = select(func.count(Opportunity.id)).where(
        Opportunity.workspace_id == workspace_id,
        Opportunity.impact == "high",
    )
    high_count = (await db.execute(high_q)).scalar_one()

    # Categories
    cat_q = select(Opportunity.category).where(
        Opportunity.workspace_id == workspace_id
    ).distinct()
    cat_rows = (await db.execute(cat_q)).scalars().all()

    # Top opportunity
    top_q = (
        select(Opportunity.title)
        .where(Opportunity.workspace_id == workspace_id)
        .order_by(Opportunity.impact_score.desc())
        .limit(1)
    )
    top_row = (await db.execute(top_q)).scalar_one_or_none()

    return OpportunitySignal(
        total_detected=total,
        high_impact_count=high_count,
        categories=list(cat_rows),
        top_opportunity=top_row or "",
    )


async def _collect_competitors(
    db: AsyncSession, workspace: Workspace,
) -> CompetitorSignal:
    """Read competitor URLs from workspace profile."""
    profile = workspace.profile
    urls = profile.competitor_urls if profile and profile.competitor_urls else []
    return CompetitorSignal(
        tracked_count=len(urls),
        avg_competitor_score=61.0,  # Placeholder until Phase 12
        our_relative_position="behind" if urls else "unknown",
    )


async def _collect_industry(
    db: AsyncSession, workspace: Workspace,
) -> IndustrySignal:
    """Industry benchmarks based on workspace profile."""
    profile = workspace.profile
    industry = profile.industry if profile else "general"
    return IndustrySignal(
        industry=industry,
        benchmark_conversion_rate=3.2,
        benchmark_digital_score=65.0,
        benchmark_lead_volume_30d=100,
    )


def _collect_digital_presence() -> DigitalPresenceSignal:
    """Placeholder – Phase 8 will compute real scores."""
    return DigitalPresenceSignal(
        score=52.0,
        website_performance=65.0,
        search_visibility=38.0,
        social_presence=55.0,
        reputation=60.0,
        conversion_readiness=42.0,
    )


async def _collect_integrations(db: AsyncSession, workspace_id: str) -> IntegrationStatusSignal:
    """Query real integration records from Phase 6 integrations table."""
    try:
        from app.modules.integrations.models import Integration, PROVIDERS
        result = await db.execute(
            select(Integration).where(
                Integration.workspace_id == workspace_id,
                Integration.status == "connected",
            )
        )
        connected = list(result.scalars().all())
        connected_ids = {i.provider_id for i in connected}
        total_available = len(PROVIDERS)

        # Identify critical missing platforms
        critical_providers = {"google_analytics", "google_search_console"}
        critical_missing = [
            PROVIDERS[pid]["name"]
            for pid in critical_providers
            if pid not in connected_ids and pid in PROVIDERS
        ]

        return IntegrationStatusSignal(
            total_available=total_available,
            total_connected=len(connected),
            critical_missing=critical_missing,
        )
    except Exception:
        logger.warning("Failed to collect integration signals (non-fatal)")
        return IntegrationStatusSignal(
            total_available=12,
            total_connected=0,
            critical_missing=["Google Analytics", "Google Search Console"],
        )


# ── Aggregation ──────────────────────────────────────────────────────


async def collect_signals(
    db: AsyncSession, workspace: Workspace,
) -> SignalMap:
    """
    Aggregate all signals from real DB + placeholder engines.
    Uses a 60-second per-workspace cache to avoid redundant queries
    when the dashboard loads summary/priorities/roadmap/risks in parallel.
    """
    workspace_id = workspace.id

    # Check cache first
    cached = _get_cached(workspace_id)
    if cached:
        return cached

    logger.info("Collecting signals workspace=%s", workspace_id)

    # Ensure seed data exists for this workspace
    await ensure_seed_leads(db, workspace_id)
    await db.flush()
    await ensure_seed_opportunities(db, workspace)
    await db.flush()

    ws_signal = await _collect_workspace_profile(db, workspace)
    lead_signal = await _collect_leads(db, workspace_id)
    opp_signal = await _collect_opportunities(db, workspace_id)
    comp_signal = await _collect_competitors(db, workspace)
    ind_signal = await _collect_industry(db, workspace)

    result = SignalMap(
        workspace=ws_signal,
        digital_presence=_collect_digital_presence(),
        leads=lead_signal,
        opportunities=opp_signal,
        competitors=comp_signal,
        industry=ind_signal,
        integrations=await _collect_integrations(db, workspace_id),
        finance=FinanceSummarySignal(available=False),
        hr=HRSummarySignal(available=False),
        operations=OperationsSummarySignal(available=False),
        digital_twin=DigitalTwinSignal(available=False),
        collected_at=datetime.utcnow(),
    )

    _set_cached(workspace_id, result)
    return result


# ── Public API (async) ───────────────────────────────────────────────


async def get_strategic_summary(
    db: AsyncSession, workspace: Workspace,
) -> StrategicSummary:
    signals = await collect_signals(db, workspace)
    health = compute_health_score(signals)
    priorities = detect_priorities(signals, health)

    return StrategicSummary(
        workspace_id=workspace.id,
        company_name=signals.workspace.company_name,
        health_score=health,
        headline=generate_headline(health, signals),
        key_insight=generate_key_insight(health, priorities, signals),
        signal_map=signals,
        generated_at=datetime.utcnow(),
    )


async def get_priorities(
    db: AsyncSession, workspace: Workspace,
    category: PriorityCategory | None = None,
) -> PriorityList:
    signals = await collect_signals(db, workspace)
    health = compute_health_score(signals)
    return build_priority_list(
        workspace.id, signals, health, category_filter=category,
    )


async def get_roadmaps(
    db: AsyncSession, workspace: Workspace,
) -> RoadmapResponse:
    signals = await collect_signals(db, workspace)
    health = compute_health_score(signals)
    priorities = detect_priorities(signals, health)
    return build_roadmaps(workspace.id, priorities, signals, health)


async def get_risks(
    db: AsyncSession, workspace: Workspace,
) -> RiskList:
    signals = await collect_signals(db, workspace)
    health = compute_health_score(signals)
    return build_risk_list(workspace.id, signals, health)


async def get_context_pack(
    db: AsyncSession, workspace: Workspace,
) -> ContextPack:
    signals = await collect_signals(db, workspace)
    health = compute_health_score(signals)
    priorities = detect_priorities(signals, health)
    from .rules import detect_risks as _detect_risks
    risks = _detect_risks(signals, health)
    return build_context_pack(workspace.id, signals, health, priorities, risks)
