"""
AEOS – Reports Engine: Report Builder.

Generates executive report content from AEOS engine data.
Each report type produces a list of sections with markdown content.
"""

from __future__ import annotations

import logging
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("aeos.engine.reports.builder")


def _fmt(n: float) -> str:
    if n >= 1_000_000:
        return f"${n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"${n / 1_000:.0f}K"
    return f"${n:.0f}"


async def build_report(db: AsyncSession, workspace_id: str, report_type: str) -> dict:
    """
    Build report content for a given type.
    Returns {"title": str, "summary": str, "sections": list[dict]}.
    """
    builders = {
        "company_intelligence": _build_company_intelligence,
        "strategic_brief": _build_strategic_brief,
        "competitive_analysis": _build_competitive_analysis,
        "financial_overview": _build_financial_overview,
        "market_research": _build_market_research,
        "gap_analysis": _build_gap_analysis,
        "kpi_dashboard": _build_kpi_dashboard,
        "full_business_plan": _build_full_business_plan,
    }

    builder = builders.get(report_type, _build_company_intelligence)
    return await builder(db, workspace_id)


async def _gather_all_data(db: AsyncSession, workspace_id: str) -> dict:
    """Gather data from all engines."""
    data: dict = {"company": {}, "digital": {}, "gap": {}, "competitors": {}, "market": {}, "financial": {}, "model": {}, "kpi": {}, "plan": {}}

    # Company profile
    try:
        from app.auth.models import Workspace, WorkspaceProfile
        from sqlalchemy import select
        ws = (await db.execute(select(Workspace).where(Workspace.id == workspace_id))).scalar_one_or_none()
        prof = (await db.execute(select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id))).scalar_one_or_none()
        if ws and prof:
            data["company"] = {"name": ws.name, "industry": prof.industry or "general", "country": prof.country or "", "city": prof.city or "", "team_size": prof.team_size or 1, "website": prof.website_url or ""}
    except Exception:
        pass

    # Digital presence
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        dp = await get_latest_report(db, workspace_id)
        if dp:
            data["digital"] = {"score": dp.overall_score, "website": dp.website_performance, "seo": dp.search_visibility, "social": dp.social_presence, "reputation": dp.reputation, "conversion": dp.conversion_readiness, "recommendations": dp.recommendations or []}
    except Exception:
        pass

    # Gap analysis
    try:
        from app.engines.gap_analysis_engine.service import get_latest_report as get_gap
        gap = await get_gap(db, workspace_id)
        if gap:
            data["gap"] = {"score": gap.overall_gap_score, "dept_coverage": gap.department_coverage_score, "role_coverage": gap.role_coverage_score, "leadership": gap.leadership_gap_score, "breakdown": gap.gap_breakdown or [], "recommendations": gap.recommendations or []}
    except Exception:
        pass

    # Competitors
    try:
        from app.engines.competitor_intelligence_engine.service import get_latest_report as get_comp
        comp = await get_comp(db, workspace_id)
        if comp:
            data["competitors"] = {"positioning": comp.overall_positioning, "dimensions": comp.dimension_scores or [], "strengths": comp.strengths or [], "weaknesses": comp.weaknesses or [], "opportunities": comp.opportunities or [], "summary": comp.competitor_summary or []}
    except Exception:
        pass

    # Market research
    try:
        from app.engines.market_research_engine.service import get_latest_report as get_market
        market = await get_market(db, workspace_id)
        if market:
            data["market"] = {"tam": market.tam, "sam": market.sam, "som": market.som, "growth_rate": market.market_growth_rate, "positioning": market.market_positioning or {}, "drivers": market.growth_drivers or [], "threats": market.threats or []}
    except Exception:
        pass

    # Financial health
    try:
        from app.engines.financial_health_engine.service import get_latest_report as get_fin
        fin = await get_fin(db, workspace_id)
        if fin:
            data["financial"] = {"score": fin.overall_score, "revenue": fin.revenue_model or {}, "costs": fin.cost_structure or {}, "levers": fin.growth_levers or [], "risks": fin.financial_risks or [], "projections": fin.projections or []}
    except Exception:
        pass

    # Financial model
    try:
        from app.engines.financial_model_engine.service import get_latest as get_model
        model = await get_model(db, workspace_id)
        if model:
            data["model"] = {"y1_rev": model.year1_revenue, "y5_rev": model.year5_revenue, "be_month": model.break_even_month, "ebitda_margin": model.year3_ebitda_margin, "yearly": model.yearly_projections or [], "scenarios": model.scenarios or [], "funding": model.funding_requirements or {}}
    except Exception:
        pass

    # KPI framework
    try:
        from app.engines.kpi_framework_engine.service import get_latest as get_kpi
        kpi = await get_kpi(db, workspace_id)
        if kpi:
            data["kpi"] = {"score": kpi.overall_kpi_score, "total": int(kpi.total_kpis or 0), "tracked": int(kpi.tracked_kpis or 0), "company": kpi.company_kpis or [], "digital": kpi.digital_kpis or [], "financial": kpi.financial_kpis or [], "department": kpi.department_kpis or []}
    except Exception:
        pass

    # Business plan
    try:
        from app.engines.strategy_agent_engine.service import get_latest_plan
        plan = await get_latest_plan(db, workspace_id)
        if plan and plan.status == "completed":
            data["plan"] = {"title": plan.title, "sections": plan.sections or {}}
    except Exception:
        pass

    return data


async def _build_company_intelligence(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    dp = d["digital"]

    sections = [
        {"title": "Company Profile", "content": f"**{c.get('name', 'Company')}** is a {c.get('team_size', 1)}-person {c.get('industry', 'general').replace('_', ' ')} company based in {c.get('city', '')}, {c.get('country', '')}.\n\nWebsite: {c.get('website', 'N/A')}", "data": c},
        {"title": "Digital Presence", "content": f"**Overall Score: {dp.get('score', 0):.0f}/100**\n\n- Website Performance: {dp.get('website', 0):.0f}/100\n- Search Visibility: {dp.get('seo', 0):.0f}/100\n- Social Presence: {dp.get('social', 0):.0f}/100\n- Reputation: {dp.get('reputation', 0):.0f}/100\n- Conversion Readiness: {dp.get('conversion', 0):.0f}/100", "data": dp},
    ]

    if d["gap"]:
        g = d["gap"]
        sections.append({"title": "Organizational Assessment", "content": f"**Gap Score: {g.get('score', 0):.0f}/100** (lower is better)\n\n- Department Coverage Gap: {g.get('dept_coverage', 0):.0f}%\n- Role Coverage Gap: {g.get('role_coverage', 0):.0f}%\n- Leadership Gap: {g.get('leadership', 0):.0f}%", "data": g})

    if d["financial"]:
        f = d["financial"]
        rev = f.get("revenue", {})
        sections.append({"title": "Financial Summary", "content": f"**Financial Health: {f.get('score', 0):.0f}/100**\n\n- Est. Annual Revenue: {rev.get('revenue_label', 'N/A')}\n- Revenue/Employee: {_fmt(rev.get('revenue_per_employee', 0))}", "data": f})

    return {"title": f"Company Intelligence Report — {c.get('name', 'Company')}", "summary": f"Comprehensive intelligence report for {c.get('name', 'Company')}, covering digital presence, organizational structure, and financial health.", "sections": sections}


async def _build_strategic_brief(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    sections = []

    sections.append({"title": "Executive Summary", "content": f"**{c.get('name', 'Company')}** — a {c.get('industry', '').replace('_', ' ')} company with {c.get('team_size', 1)} team members.\n\nThis strategic brief summarizes key findings across digital presence, market positioning, competitive intelligence, and financial outlook.", "data": {}})

    if d["digital"]:
        sections.append({"title": "Digital Health", "content": f"Digital Presence Score: **{d['digital'].get('score', 0):.0f}/100**", "data": d["digital"]})

    if d["competitors"]:
        sections.append({"title": "Competitive Position", "content": f"Competitive Positioning: **{d['competitors'].get('positioning', 50):.0f}/100**\n\nStrengths: {len(d['competitors'].get('strengths', []))} identified\nWeaknesses: {len(d['competitors'].get('weaknesses', []))} identified", "data": d["competitors"]})

    if d["market"]:
        m = d["market"]
        sections.append({"title": "Market Opportunity", "content": f"TAM: **${m.get('tam', 0):.1f}B** | SAM: **${m.get('sam', 0):.1f}B** | SOM: **${m.get('som', 0):.3f}B**\n\nIndustry Growth: {m.get('growth_rate', 0)}% CAGR", "data": m})

    if d["model"]:
        mod = d["model"]
        sections.append({"title": "Financial Outlook", "content": f"Year 1 Revenue: **{_fmt(mod.get('y1_rev', 0))}** → Year 5: **{_fmt(mod.get('y5_rev', 0))}**\n\nYear 3 EBITDA Margin: **{mod.get('ebitda_margin', 0):.1f}%**", "data": mod})

    return {"title": f"Strategic Executive Brief — {c.get('name', 'Company')}", "summary": "High-level strategic overview combining all AEOS intelligence engines.", "sections": sections}


async def _build_competitive_analysis(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    comp = d.get("competitors", {})

    sections = [{"title": "Competitive Overview", "content": f"**Positioning Score: {comp.get('positioning', 50):.0f}/100**\n\nCompetitors analyzed: {len(comp.get('summary', []))}", "data": comp}]

    for s in comp.get("strengths", []):
        sections.append({"title": f"Strength: {s.get('title', '')}", "content": s.get("description", ""), "data": s})
    for w in comp.get("weaknesses", []):
        sections.append({"title": f"Weakness: {w.get('title', '')}", "content": w.get("description", ""), "data": w})
    for o in comp.get("opportunities", []):
        sections.append({"title": f"Opportunity: {o.get('title', '')}", "content": o.get("description", ""), "data": o})

    return {"title": f"Competitive Analysis — {c.get('name', 'Company')}", "summary": "Detailed competitive benchmarking across 6 dimensions.", "sections": sections}


async def _build_financial_overview(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    fin = d.get("financial", {})
    mod = d.get("model", {})

    sections = []
    if fin:
        rev = fin.get("revenue", {})
        sections.append({"title": "Financial Health", "content": f"**Score: {fin.get('score', 0):.0f}/100**\n\nEst. Revenue: {rev.get('revenue_label', 'N/A')}\nCost Ratio: {(fin.get('costs', {}).get('cost_to_revenue_ratio', 0) * 100):.0f}%", "data": fin})

    if mod.get("yearly"):
        rows = "\n".join([f"- **Year {y.get('year')}**: Revenue {_fmt(y.get('revenue', 0))}, EBITDA {_fmt(y.get('ebitda', 0))} ({y.get('ebitda_margin', 0):.1f}%)" for y in mod["yearly"]])
        sections.append({"title": "5-Year Projections", "content": rows, "data": mod})

    if mod.get("funding"):
        fr = mod["funding"]
        sections.append({"title": "Funding & Investment", "content": f"Total Needed: **{_fmt(fr.get('total_needed', 0))}**\nRecommended: **{fr.get('recommended_round', 'N/A').replace('_', ' ').title()}**\nValuation: {fr.get('valuation_range', 'N/A')}", "data": fr})

    return {"title": f"Financial Overview — {c.get('name', 'Company')}", "summary": "Financial health assessment and 5-year projections.", "sections": sections}


async def _build_market_research(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    m = d.get("market", {})

    sections = [{"title": "Market Sizing", "content": f"**TAM**: ${m.get('tam', 0):.1f}B\n**SAM**: ${m.get('sam', 0):.1f}B\n**SOM**: ${m.get('som', 0):.3f}B\n\nIndustry Growth Rate: {m.get('growth_rate', 0)}% CAGR", "data": m}]

    pos = m.get("positioning", {})
    if pos:
        sections.append({"title": "Market Position", "content": f"Score: **{pos.get('score', 50):.0f}/100** — {pos.get('label', '')}", "data": pos})

    drivers = m.get("drivers", [])
    if drivers:
        content = "\n".join([f"- **{d.get('title', '')}** [{d.get('impact', '')}]: {d.get('description', '')}" for d in drivers])
        sections.append({"title": "Growth Drivers", "content": content, "data": {}})

    threats = m.get("threats", [])
    if threats:
        content = "\n".join([f"- **{t.get('title', '')}** [{t.get('severity', '')}]: {t.get('description', '')}" for t in threats])
        sections.append({"title": "Market Threats", "content": content, "data": {}})

    return {"title": f"Market Research Report — {c.get('name', 'Company')}", "summary": "TAM/SAM/SOM analysis, growth drivers, and market positioning.", "sections": sections}


async def _build_gap_analysis(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    g = d.get("gap", {})

    sections = [{"title": "Gap Analysis Overview", "content": f"**Overall Gap Score: {g.get('score', 0):.0f}/100** (lower is better)\n\n- Department Coverage: {g.get('dept_coverage', 0):.0f}% gap\n- Role Coverage: {g.get('role_coverage', 0):.0f}% gap\n- Leadership: {g.get('leadership', 0):.0f}% gap", "data": g}]

    for dept in g.get("breakdown", [])[:10]:
        sections.append({"title": dept.get("department_name", ""), "content": f"Status: **{dept.get('status', '')}** | {dept.get('human_filled_roles', 0)} human, {dept.get('ai_filled_roles', 0)} AI | Severity: {dept.get('gap_severity', '')}", "data": dept})

    recs = g.get("recommendations", [])
    if recs:
        content = "\n".join([f"{r.get('priority', '')}. **{r.get('title', '')}** [{r.get('impact', '')}]: {r.get('description', '')}" for r in recs])
        sections.append({"title": "Recommendations", "content": content, "data": {}})

    return {"title": f"Gap Analysis Report — {c.get('name', 'Company')}", "summary": "Organizational gap assessment with department-level breakdown.", "sections": sections}


async def _build_kpi_dashboard(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    k = d.get("kpi", {})

    sections = [{"title": "KPI Overview", "content": f"**KPI Health: {k.get('score', 0):.0f}/100**\n\nTotal KPIs: {k.get('total', 0)}\nTracked: {k.get('tracked', 0)}", "data": k}]

    for category, label in [("company", "Company KPIs"), ("digital", "Digital KPIs"), ("financial", "Financial KPIs")]:
        kpis = k.get(category, [])
        if kpis:
            content = "\n".join([f"- **{kpi.get('name', '')}**: {kpi.get('current_value', 'Not tracked')} (Target: {kpi.get('target', 'N/A')}) [{kpi.get('status', 'not_tracked')}]" for kpi in kpis])
            sections.append({"title": label, "content": content, "data": {}})

    return {"title": f"KPI Framework Report — {c.get('name', 'Company')}", "summary": "Complete KPI framework with tracking status.", "sections": sections}


async def _build_full_business_plan(db, workspace_id) -> dict:
    d = await _gather_all_data(db, workspace_id)
    c = d["company"]
    plan = d.get("plan", {})

    sections = []
    plan_sections = plan.get("sections", {})
    if plan_sections:
        from app.engines.strategy_agent_engine.models import SECTION_KEYS, SECTION_TITLES
        for key in SECTION_KEYS:
            sec = plan_sections.get(key, {})
            if sec.get("content"):
                sections.append({"title": SECTION_TITLES.get(key, key), "content": sec["content"], "data": {}})

    if not sections:
        sections.append({"title": "Business Plan", "content": "No business plan generated yet. Use the AI Strategy Agent to generate one first.", "data": {}})

    return {"title": f"Business Plan — {c.get('name', 'Company')}", "summary": "AI-generated strategic business plan.", "sections": sections}
