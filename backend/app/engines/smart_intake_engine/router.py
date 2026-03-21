"""
AEOS – Smart Intake Engine: API router.

Provides the intake-from-url endpoint for smart onboarding,
and a GET endpoint to retrieve stored intake results.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_workspace
from app.auth.models import User, Workspace, WorkspaceProfile
from .schemas import IntakeFromUrlRequest, IntakeFromUrlResponse
from . import service

logger = logging.getLogger("aeos.engine.intake")

router = APIRouter(prefix="/v1/onboarding", tags=["Smart Intake"])


@router.post("/intake-from-url", response_model=IntakeFromUrlResponse)
async def intake_from_url(
    body: IntakeFromUrlRequest,
    user=Depends(get_current_user),
):
    """
    Scan a URL and auto-detect company info for onboarding.
    Returns detected company name, industry, contacts, social links, etc.
    """
    result = await service.intake_from_url(body.url)
    return result


@router.get("/org-chart-recommendation")
async def get_org_chart(
    industry: str = "other",
    workspace: Workspace = Depends(get_current_workspace),
):
    """
    Get a recommended organizational chart with AI agent allocation
    based on the company's industry.
    """
    from .org_chart_engine import generate_org_chart

    # Use workspace profile industry if available and no override
    if industry == "other" and workspace.profile:
        profile_industry = workspace.profile.industry or "other"
        if profile_industry != "general":
            industry = profile_industry

    return generate_org_chart(industry=industry)


@router.get("/intake-results", response_model=IntakeFromUrlResponse)
async def get_intake_results(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """
    Get stored intake results for the current workspace.
    If no data exists but workspace has a website_url, triggers a fresh scan.
    """
    profile = workspace.profile
    if not profile:
        raise HTTPException(status_code=404, detail="No workspace profile found")

    url = profile.website_url or ""

    # Check if we have meaningful detected data already
    has_data = bool(
        profile.industry and profile.industry != "general"
        or profile.social_links
        or profile.phone
    )

    if has_data:
        # Build response from stored profile data
        social_links: dict[str, list[str]] = {}
        if profile.social_links and isinstance(profile.social_links, dict):
            for platform, link in profile.social_links.items():
                if isinstance(link, list):
                    social_links[platform] = link
                elif isinstance(link, str) and link:
                    social_links[platform] = [link]

        # Backfill country from URL if not yet stored (fast TLD check, no network)
        country = profile.country or ""
        city = profile.city or ""
        if not country and url:
            try:
                from .industry_inference import detect_location
                loc = detect_location(url=url)
                country = loc.get("country", "")
                city = loc.get("city", "") or city
                if country:
                    profile.country = country
                    if city:
                        profile.city = city
                    await db.flush()
            except Exception:
                pass

        # Always re-detect competitors using latest country-specific logic
        industry = profile.industry or "other"
        try:
            from .service import _detect_competitors
            fresh_competitors = _detect_competitors(industry=industry, country=country, url=url)
            # Update stored data if changed
            if fresh_competitors:
                profile.detected_competitors_data = fresh_competitors
                await db.flush()
        except Exception:
            fresh_competitors = profile.detected_competitors_data if isinstance(profile.detected_competitors_data, list) else []

        # Backfill team, services, keywords if missing (new features on existing user)
        team_data = profile.detected_team if isinstance(profile.detected_team, dict) and profile.detected_team.get("count") else {}
        services_data = profile.detected_services if isinstance(profile.detected_services, list) and profile.detected_services else []
        keywords_data = profile.seo_keywords if isinstance(profile.seo_keywords, list) and profile.seo_keywords else []

        if url and (not team_data or not services_data or not keywords_data):
            try:
                from .website_profile_collector import collect_website_profile
                from .service import _extract_team_members, _extract_services, _extract_seo_keywords
                wp = await collect_website_profile(url)
                html = wp.get("html", "")
                if html:
                    if not team_data:
                        team_data = _extract_team_members(html, url)
                        profile.detected_team = team_data
                    if not services_data:
                        services_data = _extract_services(html, wp.get("headings", []))
                        profile.detected_services = services_data
                    if not keywords_data:
                        keywords_data = _extract_seo_keywords(
                            html=html,
                            title=wp.get("title", ""),
                            description=wp.get("description", ""),
                            headings=wp.get("headings", []),
                        )
                        profile.seo_keywords = keywords_data
                    await db.flush()
            except Exception:
                logger.info("Backfill extraction failed for workspace=%s", workspace.id)

        return IntakeFromUrlResponse(
            url=url,
            detected_company_name=workspace.name or "",
            detected_industry=industry,
            industry_confidence=0.8 if profile.industry and profile.industry != "general" else 0.0,
            detected_country=country,
            detected_city=city,
            detected_phone_numbers=[profile.phone] if profile.phone else [],
            detected_emails=profile.emails if isinstance(profile.emails, list) else [],
            detected_social_links=social_links,
            detected_whatsapp_links=[profile.whatsapp_link] if profile.whatsapp_link else [],
            detected_contact_pages=[profile.contact_page] if profile.contact_page else [],
            detected_booking_pages=[],
            detected_tech_stack=profile.tech_stack if isinstance(profile.tech_stack, list) else [],
            page_title="",
            meta_description="",
            og_image=profile.og_image or "",
            favicon_url=profile.favicon_url or "",
            detected_business_hours=profile.business_hours if isinstance(profile.business_hours, list) else [],
            detected_languages=profile.content_languages if isinstance(profile.content_languages, list) else [],
            detected_competitors=fresh_competitors,
            detected_keywords=keywords_data,
            detected_team=team_data,
            detected_services=services_data,
        )

    # No stored data — trigger fresh scan if URL available
    if not url:
        raise HTTPException(status_code=404, detail="No website URL configured")

    try:
        result = await service.intake_from_url(url)

        # Save results to profile
        if result.get("detected_company_name"):
            workspace.name = result["detected_company_name"]
        if result.get("detected_industry"):
            profile.industry = result["detected_industry"]

        social_raw = result.get("detected_social_links", {})
        social_flat = {}
        for platform, urls in social_raw.items():
            if urls:
                social_flat[platform] = urls[0]
        if social_flat:
            profile.social_links = social_flat

        phones = result.get("detected_phone_numbers", [])
        if phones:
            profile.phone = phones[0]

        whatsapp = result.get("detected_whatsapp_links", [])
        if whatsapp:
            profile.whatsapp_link = whatsapp[0]

        contacts = result.get("detected_contact_pages", [])
        if contacts:
            profile.contact_page = contacts[0]

        if result.get("detected_country"):
            profile.country = result["detected_country"]
        if result.get("detected_city"):
            profile.city = result["detected_city"]

        tech = result.get("detected_tech_stack", [])
        if tech:
            profile.tech_stack = tech

        emails = result.get("detected_emails", [])
        if emails:
            profile.emails = emails

        if result.get("og_image"):
            profile.og_image = result["og_image"]
        if result.get("favicon_url"):
            profile.favicon_url = result["favicon_url"]
        if result.get("detected_business_hours"):
            profile.business_hours = result["detected_business_hours"]
        if result.get("detected_languages"):
            profile.content_languages = result["detected_languages"]
        if result.get("detected_competitors"):
            profile.detected_competitors_data = result["detected_competitors"]
        if result.get("detected_keywords"):
            profile.seo_keywords = result["detected_keywords"]
        if result.get("detected_team"):
            profile.detected_team = result["detected_team"]
        if result.get("detected_services"):
            profile.detected_services = result["detected_services"]

        await db.flush()
        return result
    except Exception:
        logger.exception("Fresh intake scan failed for workspace=%s", workspace.id)
        raise HTTPException(status_code=500, detail="Website scan failed")
