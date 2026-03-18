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

        return IntakeFromUrlResponse(
            url=url,
            detected_company_name=workspace.name or "",
            detected_industry=profile.industry or "other",
            industry_confidence=0.8 if profile.industry and profile.industry != "general" else 0.0,
            detected_phone_numbers=[profile.phone] if profile.phone else [],
            detected_emails=[],
            detected_social_links=social_links,
            detected_whatsapp_links=[profile.whatsapp_link] if profile.whatsapp_link else [],
            detected_contact_pages=[profile.contact_page] if profile.contact_page else [],
            detected_booking_pages=[],
            detected_tech_stack=[],
            page_title="",
            meta_description="",
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

        await db.flush()
        return result
    except Exception:
        logger.exception("Fresh intake scan failed for workspace=%s", workspace.id)
        raise HTTPException(status_code=500, detail="Website scan failed")
