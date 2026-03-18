"""
AEOS – Executive Copilot Engine: Service layer.

Gathers context from all intelligence engines and generates
natural-language answers. Uses Claude API when available,
falls back to deterministic template-based answers.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Workspace
from app.engines.lead_intelligence_engine.models import Lead
from app.engines.lead_intelligence_engine.service import ensure_seed_leads
from app.engines.opportunity_intelligence_engine.models import Opportunity
from app.engines.opportunity_intelligence_engine.detector import ensure_seed_opportunities
from app.engines.company_scanner_engine.models import CompanyScanReport
from app.engines.company_scanner_engine.service import get_latest_scan
from app.engines.contracts import EngineEvent
from app.engines.event_bus import emit
from app.core.config import get_settings

from .models import CopilotConversation
from .schemas import CopilotResponse, CopilotSource

logger = logging.getLogger("aeos.engine.copilot")


# ── Context gathering ────────────────────────────────────────────────


async def _gather_context(db: AsyncSession, workspace: Workspace) -> dict:
    """Gather intelligence from all engines into a context dict."""
    workspace_id = workspace.id
    profile = workspace.profile
    thirty_days = datetime.utcnow() - timedelta(days=30)

    ctx: dict = {
        "company_name": workspace.name,
        "industry": profile.industry if profile else "general",
        "website_url": profile.website_url if profile else "",
        "city": profile.city if profile else "",
        "country": profile.country if profile else "",
        "team_size": profile.team_size if profile else 1,
    }

    # Lead stats
    await ensure_seed_leads(db, workspace_id)
    await db.flush()

    total_leads = (await db.execute(
        select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id, Lead.created_at >= thirty_days)
    )).scalar_one()

    qualified = (await db.execute(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.status.in_(["qualified", "proposal", "won"]),
            Lead.created_at >= thirty_days,
        )
    )).scalar_one()

    source_q = (
        select(Lead.source, func.count(Lead.id))
        .where(Lead.workspace_id == workspace_id, Lead.created_at >= thirty_days)
        .group_by(Lead.source).order_by(func.count(Lead.id).desc()).limit(3)
    )
    top_sources = [(r[0], r[1]) for r in (await db.execute(source_q)).all()]

    ctx["total_leads"] = total_leads
    ctx["qualified_leads"] = qualified
    ctx["conversion_rate"] = round((qualified / max(1, total_leads)) * 100, 1)
    ctx["top_sources"] = top_sources

    # Opportunities
    await ensure_seed_opportunities(db, workspace)
    await db.flush()

    total_opps = (await db.execute(
        select(func.count(Opportunity.id)).where(Opportunity.workspace_id == workspace_id)
    )).scalar_one()

    high_opps = (await db.execute(
        select(func.count(Opportunity.id)).where(Opportunity.workspace_id == workspace_id, Opportunity.impact == "high")
    )).scalar_one()

    top_opp_q = (
        select(Opportunity.title, Opportunity.impact_score)
        .where(Opportunity.workspace_id == workspace_id)
        .order_by(Opportunity.impact_score.desc()).limit(3)
    )
    top_opps = [(r[0], r[1]) for r in (await db.execute(top_opp_q)).all()]

    ctx["total_opportunities"] = total_opps
    ctx["high_impact_opportunities"] = high_opps
    ctx["top_opportunities"] = top_opps

    # Company scan
    scan = await get_latest_scan(db, workspace_id)
    if scan and scan.status == "completed":
        ctx["seo_score"] = scan.seo_score
        ctx["social_presence"] = scan.social_presence or {}
        ctx["tech_stack"] = scan.tech_stack or []
        ctx["pages_detected"] = scan.pages_detected
    else:
        ctx["seo_score"] = None
        ctx["social_presence"] = {}
        ctx["tech_stack"] = []

    # Integrations
    try:
        from app.modules.integrations.models import Integration
        intg_result = await db.execute(
            select(Integration).where(
                Integration.workspace_id == workspace_id,
                Integration.status == "connected",
            )
        )
        connected_intgs = list(intg_result.scalars().all())
        ctx["connected_integrations"] = [i.provider_id for i in connected_intgs]
        ctx["integration_count"] = len(connected_intgs)
    except Exception:
        ctx["connected_integrations"] = []
        ctx["integration_count"] = 0

    # ── New engine data (Phase 29 enhancement) ──

    # Digital Presence
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        dp = await get_latest_report(db, workspace_id)
        if dp:
            ctx["digital_presence_score"] = dp.overall_score or 0
            ctx["dp_website"] = dp.website_performance or 0
            ctx["dp_seo"] = dp.search_visibility or 0
            ctx["dp_social"] = dp.social_presence or 0
            ctx["dp_reputation"] = dp.reputation or 0
    except Exception:
        pass

    # Gap Analysis
    try:
        from app.engines.gap_analysis_engine.service import get_latest_report as get_gap
        gap = await get_gap(db, workspace_id)
        if gap:
            ctx["gap_score"] = gap.overall_gap_score or 0
            ctx["gap_dept_coverage"] = gap.department_coverage_score or 0
            ctx["gap_recommendations"] = [r.get("title", "") for r in (gap.recommendations or [])[:3]]
    except Exception:
        pass

    # Competitor Intelligence
    try:
        from app.engines.competitor_intelligence_engine.service import get_latest_report as get_comp
        comp = await get_comp(db, workspace_id)
        if comp:
            ctx["competitive_positioning"] = comp.overall_positioning or 0
            ctx["comp_strengths"] = [s.get("title", "") for s in (comp.strengths or [])[:3]]
            ctx["comp_weaknesses"] = [w.get("title", "") for w in (comp.weaknesses or [])[:3]]
    except Exception:
        pass

    # Market Research
    try:
        from app.engines.market_research_engine.service import get_latest_report as get_market
        market = await get_market(db, workspace_id)
        if market:
            ctx["market_tam"] = market.tam or 0
            ctx["market_sam"] = market.sam or 0
            ctx["market_growth_rate"] = market.market_growth_rate or 0
            ctx["market_position_score"] = (market.market_positioning or {}).get("score", 0)
    except Exception:
        pass

    # Financial Health
    try:
        from app.engines.financial_health_engine.service import get_latest_report as get_fin
        fin = await get_fin(db, workspace_id)
        if fin:
            ctx["financial_health_score"] = fin.overall_score or 0
            ctx["est_revenue"] = (fin.revenue_model or {}).get("estimated_annual_revenue", 0)
            ctx["cost_ratio"] = (fin.cost_structure or {}).get("cost_to_revenue_ratio", 0)
            ctx["ai_savings_potential"] = (fin.cost_structure or {}).get("optimization_potential", 0)
    except Exception:
        pass

    # Financial Model
    try:
        from app.engines.financial_model_engine.service import get_latest as get_model
        model = await get_model(db, workspace_id)
        if model:
            ctx["model_y1_revenue"] = model.year1_revenue or 0
            ctx["model_y5_revenue"] = model.year5_revenue or 0
            ctx["model_ebitda_margin"] = model.year3_ebitda_margin or 0
            ctx["model_break_even"] = model.break_even_month or 0
    except Exception:
        pass

    # KPI Framework
    try:
        from app.engines.kpi_framework_engine.service import get_latest as get_kpi
        kpi = await get_kpi(db, workspace_id)
        if kpi:
            ctx["kpi_health"] = kpi.overall_kpi_score or 0
            ctx["kpi_total"] = int(kpi.total_kpis or 0)
            ctx["kpi_tracked"] = int(kpi.tracked_kpis or 0)
    except Exception:
        pass

    # AI Agents
    try:
        from app.engines.agent_framework_engine.models import AIAgent
        agent_count = (await db.execute(
            select(func.count(AIAgent.id)).where(AIAgent.workspace_id == workspace_id)
        )).scalar() or 0
        ctx["ai_agents"] = agent_count
    except Exception:
        pass

    return ctx


# ── Answer generation ────────────────────────────────────────────────

TOPIC_PATTERNS: dict[str, list[str]] = {
    "opportunities": ["opportunit", "growth", "improve", "potential"],
    "leads": ["lead", "prospect", "pipeline", "funnel", "convert"],
    "seo": ["seo", "search", "ranking", "website", "traffic", "organic"],
    "social": ["social", "facebook", "instagram", "linkedin", "twitter", "youtube"],
    "strategy": ["strategy", "priorit", "roadmap", "plan", "focus"],
    "health": ["health", "score", "how are we", "overview", "status", "dashboard"],
    "competitors": ["competitor", "competition", "rival", "benchmark", "versus"],
    "integrations": ["integration", "connect", "platform", "tool", "sync"],
    "digital": ["digital", "presence", "online", "web score"],
    "gaps": ["gap", "structure", "organization", "department", "missing"],
    "market": ["market", "tam", "sam", "som", "industry", "sector", "size"],
    "financial": ["financ", "revenue", "cost", "profit", "ebitda", "money", "budget"],
    "kpi": ["kpi", "metric", "track", "measure", "indicator", "performance"],
    "agents": ["agent", "ai team", "deploy", "virtual employee"],
}


def _detect_topic(question: str) -> str:
    q = question.lower()
    for topic, patterns in TOPIC_PATTERNS.items():
        if any(p in q for p in patterns):
            return topic
    return "general"


def _generate_answer(ctx: dict, question: str) -> tuple[str, list[CopilotSource], float]:
    """Generate a deterministic answer from context. Returns (answer, sources, confidence)."""
    topic = _detect_topic(question)
    name = ctx["company_name"]
    sources: list[CopilotSource] = []

    if topic == "opportunities":
        top = ctx.get("top_opportunities", [])
        if top:
            opp_lines = "; ".join(f"{t[0]} (impact: {t[1]})" for t in top[:3])
            answer = (
                f"{name} has {ctx['total_opportunities']} detected opportunities, "
                f"of which {ctx['high_impact_opportunities']} are high-impact. "
                f"The top opportunities are: {opp_lines}. "
                f"Focus on the highest-impact items first to maximize ROI."
            )
            sources.append(CopilotSource(engine="opportunity_radar", label="Opportunities detected", value=str(ctx["total_opportunities"])))
        else:
            answer = f"No opportunities have been detected for {name} yet. Complete onboarding and add your website to enable opportunity scanning."
        return answer, sources, 0.85

    elif topic == "leads":
        answer = (
            f"{name} has captured {ctx['total_leads']} leads in the last 30 days, "
            f"with {ctx['qualified_leads']} qualified ({ctx['conversion_rate']}% conversion rate). "
        )
        if ctx["top_sources"]:
            src_text = ", ".join(f"{s[0].replace('_', ' ')} ({s[1]})" for s in ctx["top_sources"])
            answer += f"Top sources: {src_text}."
        sources.append(CopilotSource(engine="lead_intelligence", label="Total leads (30d)", value=str(ctx["total_leads"])))
        sources.append(CopilotSource(engine="lead_intelligence", label="Conversion rate", value=f"{ctx['conversion_rate']}%"))
        return answer, sources, 0.9

    elif topic == "seo":
        seo = ctx.get("seo_score")
        if seo is not None:
            level = "strong" if seo >= 70 else "moderate" if seo >= 45 else "weak"
            answer = (
                f"{name}'s SEO health score is {seo}/100, which is {level}. "
                f"The website has {ctx.get('pages_detected', 0)} pages detected. "
            )
            if seo < 70:
                answer += "Key areas for improvement include optimizing meta descriptions, adding structured headings, and targeting high-intent keywords."
            sources.append(CopilotSource(engine="company_scanner", label="SEO score", value=f"{seo}/100"))
        else:
            answer = f"No SEO scan has been completed for {name} yet. Add your website URL to generate an SEO analysis."
        return answer, sources, 0.85

    elif topic == "social":
        presence = ctx.get("social_presence", {})
        active = [k for k, v in presence.items() if v]
        missing = [k for k, v in presence.items() if not v]
        answer = f"{name} has a presence on {len(active)} social platforms"
        if active:
            answer += f": {', '.join(active)}. "
        else:
            answer += ". "
        if missing:
            answer += f"Missing platforms: {', '.join(missing)}. Consider expanding to reach a wider audience."
        sources.append(CopilotSource(engine="company_scanner", label="Social platforms", value=f"{len(active)} active"))
        return answer, sources, 0.8

    elif topic == "strategy" or topic == "health":
        answer = (
            f"Here's {name}'s business intelligence overview: "
            f"{ctx['total_leads']} leads captured (30d), {ctx['qualified_leads']} qualified, "
            f"{ctx['total_opportunities']} opportunities detected ({ctx['high_impact_opportunities']} high-impact). "
        )
        seo = ctx.get("seo_score")
        if seo is not None:
            answer += f"SEO score: {seo}/100. "
        tech = ctx.get("tech_stack", [])
        if tech:
            answer += f"Tech stack: {', '.join(tech[:5])}. "
        answer += "Focus on high-impact opportunities and improving lead conversion rate for the fastest growth."
        sources.append(CopilotSource(engine="strategic_intelligence", label="Leads (30d)", value=str(ctx["total_leads"])))
        sources.append(CopilotSource(engine="opportunity_radar", label="High-impact opportunities", value=str(ctx["high_impact_opportunities"])))
        return answer, sources, 0.85

    elif topic == "integrations":
        connected = ctx.get("connected_integrations", [])
        count = ctx.get("integration_count", 0)
        if count > 0:
            platforms = ", ".join(p.replace("_", " ") for p in connected[:5])
            answer = f"{name} has {count} connected integration(s): {platforms}. "
            answer += "Connected integrations feed real-time data into AEOS intelligence engines for more accurate insights."
        else:
            answer = f"{name} has no connected integrations yet. "
            answer += "Connecting platforms like Google Analytics, HubSpot, or Slack will significantly improve the accuracy of your lead scoring, SEO analysis, and strategic recommendations."
        sources.append(CopilotSource(engine="integrations", label="Connected platforms", value=str(count)))
        return answer, sources, 0.8

    else:
        # General
        answer = (
            f"{name} ({ctx['industry']}) is a {ctx['team_size']}-person company"
        )
        if ctx.get("city"):
            answer += f" based in {ctx['city']}"
        answer += f". In the last 30 days: {ctx['total_leads']} leads, {ctx['total_opportunities']} opportunities detected. "
        answer += "Ask me about leads, opportunities, SEO, social presence, or strategy for detailed insights."
        return answer, sources, 0.7


# ── Public API ───────────────────────────────────────────────────────


async def ask_copilot(
    db: AsyncSession,
    workspace: Workspace,
    user_id: str,
    question: str,
) -> CopilotResponse:
    """Process a question and return an AI-powered answer."""
    # Record token usage (best-effort)
    try:
        from app.modules.billing.service import consume_tokens, get_operation_cost
        cost = get_operation_cost("copilot_query")
        await consume_tokens(db, workspace.id, "copilot_query", cost, engine="executive_copilot", detail=question[:100], user_id=user_id)
    except Exception:
        logger.warning("Token tracking failed for copilot workspace=%s (non-fatal)", workspace.id)

    ctx = await _gather_context(db, workspace)
    answer, sources, confidence = _generate_answer(ctx, question)

    # Try Claude API if available
    settings = get_settings()
    if settings.ANTHROPIC_API_KEY:
        try:
            ai_answer = await _ask_claude(ctx, question, settings.ANTHROPIC_API_KEY)
            if ai_answer:
                answer = ai_answer
                confidence = min(confidence + 0.1, 1.0)
        except Exception:
            logger.warning("Claude API call failed for workspace=%s, using deterministic answer", workspace.id)

    # Save to conversation history
    convo = CopilotConversation(
        workspace_id=workspace.id,
        user_id=user_id,
        question=question,
        answer=answer,
        sources=[s.model_dump() for s in sources],
        confidence=confidence,
    )
    db.add(convo)

    logger.info("Copilot answered workspace=%s topic=%s confidence=%.2f", workspace.id, _detect_topic(question), confidence)
    await emit(EngineEvent(
        event_type="copilot_answered",
        workspace_id=workspace.id,
        engine="executive_copilot",
        payload={"question": question[:100], "confidence": confidence},
    ))

    return CopilotResponse(
        question=question,
        answer=answer,
        sources=sources,
        confidence=confidence,
        workspace_id=workspace.id,
    )


async def _ask_claude(ctx: dict, question: str, api_key: str) -> str | None:
    """Call Claude API for a natural-language answer. Returns None on failure."""
    import httpx

    context_text = (
        f"Company: {ctx['company_name']} ({ctx['industry']})\n"
        f"Team size: {ctx['team_size']}, Location: {ctx.get('city', '')} {ctx.get('country', '')}\n"
        f"Website: {ctx.get('website_url', 'not set')}\n"
        f"Leads (30d): {ctx['total_leads']} total, {ctx['qualified_leads']} qualified, {ctx['conversion_rate']}% conversion\n"
        f"Opportunities: {ctx['total_opportunities']} detected, {ctx['high_impact_opportunities']} high-impact\n"
    )
    seo = ctx.get("seo_score")
    if seo is not None:
        context_text += f"SEO score: {seo}/100\n"
    social = ctx.get("social_presence", {})
    active_social = [k for k, v in social.items() if v]
    if active_social:
        context_text += f"Social: {', '.join(active_social)}\n"
    tech = ctx.get("tech_stack", [])
    if tech:
        context_text += f"Tech stack: {', '.join(tech)}\n"
    top_opps = ctx.get("top_opportunities", [])
    if top_opps:
        context_text += f"Top opportunities: {'; '.join(f'{t[0]} (impact {t[1]})' for t in top_opps[:3])}\n"

    # Enhanced context from all engines
    if ctx.get("digital_presence_score"):
        context_text += f"Digital Presence Score: {ctx['digital_presence_score']:.0f}/100 (Website: {ctx.get('dp_website', 0):.0f}, SEO: {ctx.get('dp_seo', 0):.0f}, Social: {ctx.get('dp_social', 0):.0f})\n"
    if ctx.get("gap_score") is not None:
        context_text += f"Organizational Gap Score: {ctx['gap_score']:.0f}/100 (lower=better, dept coverage gap: {ctx.get('gap_dept_coverage', 0):.0f}%)\n"
        if ctx.get("gap_recommendations"):
            context_text += f"Gap recommendations: {'; '.join(ctx['gap_recommendations'])}\n"
    if ctx.get("competitive_positioning"):
        context_text += f"Competitive Positioning: {ctx['competitive_positioning']:.0f}/100 (>50=ahead of competitors)\n"
        if ctx.get("comp_strengths"):
            context_text += f"Competitive strengths: {'; '.join(ctx['comp_strengths'])}\n"
        if ctx.get("comp_weaknesses"):
            context_text += f"Competitive weaknesses: {'; '.join(ctx['comp_weaknesses'])}\n"
    if ctx.get("market_tam"):
        context_text += f"Market: TAM ${ctx['market_tam']:.1f}B, SAM ${ctx['market_sam']:.1f}B, Growth {ctx.get('market_growth_rate', 0)}% CAGR\n"
    if ctx.get("financial_health_score"):
        context_text += f"Financial Health: {ctx['financial_health_score']:.0f}/100, Est. Revenue: ${ctx.get('est_revenue', 0):,.0f}, Cost ratio: {ctx.get('cost_ratio', 0):.0%}\n"
    if ctx.get("model_y1_revenue"):
        context_text += f"Financial Model: Y1 ${ctx['model_y1_revenue']:,.0f} → Y5 ${ctx.get('model_y5_revenue', 0):,.0f}, Y3 EBITDA margin: {ctx.get('model_ebitda_margin', 0):.1f}%\n"
    if ctx.get("kpi_health"):
        context_text += f"KPI Framework: {ctx['kpi_health']:.0f}/100 health, {ctx.get('kpi_tracked', 0)}/{ctx.get('kpi_total', 0)} tracked\n"
    if ctx.get("ai_agents"):
        context_text += f"AI Agents: {ctx['ai_agents']} deployed\n"

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "system": (
                    "You are AEOS, the AI Enterprise Operating System executive copilot. "
                    "You have access to comprehensive company intelligence: digital presence, "
                    "organizational gap analysis, competitive benchmarking, market research, "
                    "financial health, 5-year financial projections, KPI tracking, and AI agent deployment. "
                    "Answer using ONLY the data provided. Be concise, actionable, and cite specific numbers. "
                    "When appropriate, recommend which AEOS engine or feature the user should use next."
                ),
                "messages": [
                    {"role": "user", "content": f"Company data:\n{context_text}\n\nQuestion: {question}"},
                ],
            },
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("content") and data["content"][0].get("text"):
                return data["content"][0]["text"]
    return None
