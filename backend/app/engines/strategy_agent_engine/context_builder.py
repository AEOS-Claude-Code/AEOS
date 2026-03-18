"""
AEOS – Strategy Agent Engine: Context Builder.

Aggregates data from ALL AEOS engines into structured context blocks
for each business plan section. Each section receives only the data
relevant to it, keeping prompts focused and within token budgets.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("aeos.engine.strategy_agent.context")


async def build_full_context(db: AsyncSession, workspace_id: str) -> dict[str, Any]:
    """
    Gather all available data for business plan generation.
    Returns a dict with keys for each data source.
    """
    ctx: dict[str, Any] = {
        "company": {},
        "digital_presence": {},
        "gap_analysis": {},
        "org_chart": {},
        "scan": {},
        "strategy": {},
        "leads": {},
        "opportunities": {},
    }

    # 1. Workspace profile
    try:
        from app.auth.models import WorkspaceProfile, Workspace
        from sqlalchemy import select

        ws_result = await db.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        workspace = ws_result.scalar_one_or_none()

        prof_result = await db.execute(
            select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace_id)
        )
        profile = prof_result.scalar_one_or_none()

        if workspace and profile:
            ctx["company"] = {
                "name": workspace.name,
                "industry": profile.industry or "general",
                "country": profile.country or "",
                "city": profile.city or "",
                "team_size": profile.team_size or 1,
                "website_url": profile.website_url or "",
                "primary_goal": profile.primary_goal or "",
                "competitor_urls": profile.competitor_urls or [],
                "social_links": profile.social_links or {},
                "phone": profile.phone or "",
            }
    except Exception as e:
        logger.warning("Failed to load workspace profile: %s", e)

    # 2. Digital presence
    try:
        from app.engines.digital_presence_engine.service import get_latest_report
        report = await get_latest_report(db, workspace_id)
        if report:
            ctx["digital_presence"] = {
                "overall_score": report.overall_score,
                "website_performance": report.website_performance,
                "search_visibility": report.search_visibility,
                "social_presence": report.social_presence,
                "reputation": report.reputation,
                "conversion_readiness": report.conversion_readiness,
                "recommendations": report.recommendations or [],
            }
    except Exception as e:
        logger.warning("Failed to load digital presence: %s", e)

    # 3. Gap analysis
    try:
        from app.engines.gap_analysis_engine.service import get_latest_report as get_gap_report
        gap = await get_gap_report(db, workspace_id)
        if gap:
            ctx["gap_analysis"] = {
                "overall_gap_score": gap.overall_gap_score,
                "department_coverage": gap.department_coverage_score,
                "role_coverage": gap.role_coverage_score,
                "leadership_gaps": gap.leadership_gap_score,
                "critical_functions": gap.critical_function_score,
                "operational_maturity": gap.operational_maturity_score,
                "gap_breakdown": gap.gap_breakdown or [],
                "recommendations": gap.recommendations or [],
            }
    except Exception as e:
        logger.warning("Failed to load gap analysis: %s", e)

    # 4. Org chart
    try:
        from app.engines.smart_intake_engine.org_chart_engine import generate_org_chart
        industry = ctx["company"].get("industry", "other")
        org = generate_org_chart(industry=industry)
        ctx["org_chart"] = {
            "total_departments": org["total_departments"],
            "total_ai_agents": org["total_ai_agents"],
            "departments": [
                {"name": d["name"], "ai_head": d["ai_head"], "agents": len(d["ai_roles"])}
                for d in org["departments"][:10]
            ],
        }
    except Exception as e:
        logger.warning("Failed to load org chart: %s", e)

    # 5. Company scan
    try:
        from app.engines.company_scanner_engine.models import CompanyScanReport
        from sqlalchemy import select as sa_select

        scan_result = await db.execute(
            sa_select(CompanyScanReport)
            .where(
                CompanyScanReport.workspace_id == workspace_id,
                CompanyScanReport.status == "completed",
            )
            .order_by(CompanyScanReport.created_at.desc())
            .limit(1)
        )
        scan = scan_result.scalar_one_or_none()
        if scan:
            ctx["scan"] = {
                "seo_score": scan.seo_score,
                "overall_score": getattr(scan, "overall_score", None),
                "tech_stack": scan.tech_stack or [],
                "social_presence": scan.social_presence or {},
                "keywords": getattr(scan, "keywords", []) or [],
            }
    except Exception as e:
        logger.warning("Failed to load scan: %s", e)

    # 6. Strategic intelligence
    try:
        from app.engines.strategic_intelligence_engine.service import get_strategic_summary
        summary = await get_strategic_summary(db, workspace_id)
        if summary:
            ctx["strategy"] = {
                "health_score": summary.get("health", {}).get("score", 0),
                "health_label": summary.get("health", {}).get("label", ""),
                "headline": summary.get("headline", ""),
                "key_insight": summary.get("key_insight", ""),
                "priorities": [
                    {"title": p.get("title", ""), "category": p.get("category", ""), "impact": p.get("impact_score", 0)}
                    for p in (summary.get("priorities", []) or [])[:5]
                ],
                "risks": [
                    {"title": r.get("title", ""), "severity": r.get("severity", ""), "description": r.get("description", "")}
                    for r in (summary.get("risks", []) or [])[:3]
                ],
            }
    except Exception as e:
        logger.warning("Failed to load strategy: %s", e)

    return ctx


def format_company_block(ctx: dict) -> str:
    """Format company data into a text block for prompts."""
    c = ctx.get("company", {})
    if not c:
        return "Company data not available."

    lines = [
        f"Company: {c.get('name', 'Unknown')}",
        f"Industry: {c.get('industry', 'general').replace('_', ' ').title()}",
        f"Location: {c.get('city', '')}, {c.get('country', '')}".strip(", "),
        f"Team size: {c.get('team_size', 1)} employees",
        f"Website: {c.get('website_url', 'N/A')}",
    ]
    if c.get("primary_goal"):
        lines.append(f"Primary goal: {c['primary_goal']}")
    if c.get("competitor_urls"):
        lines.append(f"Competitors tracked: {len(c['competitor_urls'])}")

    return "\n".join(lines)


def format_digital_presence_block(ctx: dict) -> str:
    """Format digital presence scores."""
    dp = ctx.get("digital_presence", {})
    if not dp:
        return "Digital presence data not yet available."

    return (
        f"Digital Presence Score: {dp.get('overall_score', 0):.0f}/100\n"
        f"  Website Performance: {dp.get('website_performance', 0):.0f}/100\n"
        f"  Search Visibility: {dp.get('search_visibility', 0):.0f}/100\n"
        f"  Social Presence: {dp.get('social_presence', 0):.0f}/100\n"
        f"  Reputation: {dp.get('reputation', 0):.0f}/100\n"
        f"  Conversion Readiness: {dp.get('conversion_readiness', 0):.0f}/100"
    )


def format_gap_analysis_block(ctx: dict) -> str:
    """Format gap analysis data."""
    ga = ctx.get("gap_analysis", {})
    if not ga:
        return "Organizational gap analysis not yet available."

    lines = [
        f"Overall Gap Score: {ga.get('overall_gap_score', 0):.0f}/100 (lower is better)",
        f"  Department Coverage Gap: {ga.get('department_coverage', 0):.0f}%",
        f"  Role Coverage Gap: {ga.get('role_coverage', 0):.0f}%",
        f"  Leadership Gap: {ga.get('leadership_gaps', 0):.0f}%",
        f"  Critical Functions Gap: {ga.get('critical_functions', 0):.0f}%",
        f"  Operational Maturity Gap: {ga.get('operational_maturity', 0):.0f}%",
    ]

    breakdown = ga.get("gap_breakdown", [])
    if breakdown:
        lines.append("\nDepartment Status:")
        for d in breakdown[:8]:
            lines.append(f"  {d.get('department_name', '')}: {d.get('status', '')} ({d.get('human_filled_roles', 0)} human, {d.get('ai_filled_roles', 0)} AI)")

    return "\n".join(lines)


def format_org_chart_block(ctx: dict) -> str:
    """Format org chart data."""
    oc = ctx.get("org_chart", {})
    if not oc:
        return "Org chart not available."

    lines = [
        f"Total Departments: {oc.get('total_departments', 0)}",
        f"Total AI Agents: {oc.get('total_ai_agents', 0)}",
        "\nDepartments:",
    ]
    for d in oc.get("departments", [])[:10]:
        lines.append(f"  {d['name']}: {d['ai_head']} + {d['agents']} specialist agents")

    return "\n".join(lines)


def format_strategy_block(ctx: dict) -> str:
    """Format strategic intelligence data."""
    s = ctx.get("strategy", {})
    if not s:
        return "Strategic intelligence not yet available."

    lines = [
        f"Health Score: {s.get('health_score', 0)}/100 ({s.get('health_label', '')})",
    ]
    if s.get("headline"):
        lines.append(f"Headline: {s['headline']}")
    if s.get("key_insight"):
        lines.append(f"Key Insight: {s['key_insight']}")

    priorities = s.get("priorities", [])
    if priorities:
        lines.append("\nTop Priorities:")
        for p in priorities:
            lines.append(f"  - {p['title']} (impact: {p['impact']})")

    risks = s.get("risks", [])
    if risks:
        lines.append("\nActive Risks:")
        for r in risks:
            lines.append(f"  - [{r['severity']}] {r['title']}")

    return "\n".join(lines)


def format_scan_block(ctx: dict) -> str:
    """Format company scan data."""
    sc = ctx.get("scan", {})
    if not sc:
        return "Website scan not yet available."

    lines = [f"SEO Score: {sc.get('seo_score', 0)}/100"]
    if sc.get("tech_stack"):
        lines.append(f"Tech Stack: {', '.join(sc['tech_stack'][:8])}")
    if sc.get("keywords"):
        lines.append(f"Keywords: {', '.join(sc['keywords'][:10])}")

    return "\n".join(lines)


def build_section_context(ctx: dict, section_key: str) -> str:
    """Build a focused context block for a specific section."""
    company = format_company_block(ctx)

    section_contexts = {
        "executive_summary": f"{company}\n\n{format_strategy_block(ctx)}\n\n{format_digital_presence_block(ctx)}\n\n{format_gap_analysis_block(ctx)}",
        "company_overview": f"{company}\n\n{format_scan_block(ctx)}\n\n{format_digital_presence_block(ctx)}",
        "market_analysis": f"{company}\n\n{format_strategy_block(ctx)}\n\n{format_scan_block(ctx)}",
        "organizational_structure": f"{company}\n\n{format_gap_analysis_block(ctx)}\n\n{format_org_chart_block(ctx)}",
        "marketing_sales_strategy": f"{company}\n\n{format_digital_presence_block(ctx)}\n\n{format_strategy_block(ctx)}",
        "operations_plan": f"{company}\n\n{format_scan_block(ctx)}\n\n{format_gap_analysis_block(ctx)}",
        "financial_projections": f"{company}\n\n{format_strategy_block(ctx)}",
        "risk_assessment": f"{company}\n\n{format_strategy_block(ctx)}\n\n{format_gap_analysis_block(ctx)}",
        "implementation_roadmap": f"{company}\n\n{format_strategy_block(ctx)}\n\n{format_gap_analysis_block(ctx)}",
        "kpi_framework": f"{company}\n\n{format_strategy_block(ctx)}\n\n{format_gap_analysis_block(ctx)}",
    }

    return section_contexts.get(section_key, company)
