"""
AEOS – Onboarding wizard API router.

POST /api/v1/onboarding/company      → Step 1
POST /api/v1/onboarding/presence     → Step 2
POST /api/v1/onboarding/competitors  → Step 3
POST /api/v1/onboarding/integrations → Step 4
POST /api/v1/onboarding/complete     → Step 5
GET  /api/v1/onboarding/status       → Current progress
"""

from __future__ import annotations

import logging
from datetime import datetime

logger = logging.getLogger("aeos.onboarding")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_workspace
from app.auth.models import User, Workspace
from app.auth.service import get_onboarding
from app.auth.schemas import (
    OnboardingCompanyPayload,
    OnboardingPresencePayload,
    OnboardingCompetitorsPayload,
    OnboardingIntegrationsPayload,
    OnboardingStepResponse,
    ReadinessResponse,
    CompetitorDiscoveryResponse,
    DiscoveredCompetitor,
)

router = APIRouter(prefix="/v1/onboarding", tags=["Onboarding Wizard"])


async def _get_onboarding_or_404(db: AsyncSession, workspace_id: str):
    ob = await get_onboarding(db, workspace_id)
    if not ob:
        raise HTTPException(status_code=404, detail="Onboarding record not found")
    return ob


@router.get(
    "/status",
    response_model=ReadinessResponse,
    summary="Get current onboarding status",
)
async def onboarding_status(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    ob = await _get_onboarding_or_404(db, workspace.id)
    return ReadinessResponse(
        workspace_id=workspace.id,
        percentage=ob.readiness_pct,
        status=ob.readiness_status,
        steps={
            "company_profile": ob.step_company,
            "website_and_social": ob.step_presence,
            "competitors": ob.step_competitors,
            "connect_platforms": ob.step_integrations,
            "dashboard_ready": ob.step_complete,
        },
    )


@router.post(
    "/company",
    response_model=OnboardingStepResponse,
    summary="Step 1: Company profile",
)
async def step_company(
    body: OnboardingCompanyPayload,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    ob = await _get_onboarding_or_404(db, workspace.id)
    profile = workspace.profile

    if profile:
        profile.industry = body.industry
        profile.country = body.country
        profile.city = body.city
        profile.team_size = body.team_size
        profile.primary_goal = body.primary_goal

    ob.step_company = True
    ob.current_step = max(ob.current_step, 2)

    return OnboardingStepResponse(
        step=1,
        completed=True,
        next_step=2,
        readiness_pct=ob.readiness_pct,
    )


@router.post(
    "/presence",
    response_model=OnboardingStepResponse,
    summary="Step 2: Website and social links",
)
async def step_presence(
    body: OnboardingPresencePayload,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    ob = await _get_onboarding_or_404(db, workspace.id)
    profile = workspace.profile

    if profile:
        profile.website_url = body.website_url
        profile.social_links = body.social_links
        profile.whatsapp_link = body.whatsapp_link
        profile.contact_page = body.contact_page
        profile.phone = body.phone
        profile.google_business_url = body.google_business_url

    ob.step_presence = True
    ob.current_step = max(ob.current_step, 3)

    return OnboardingStepResponse(
        step=2,
        completed=True,
        next_step=3,
        readiness_pct=ob.readiness_pct,
    )


@router.get(
    "/discover-competitors",
    response_model=CompetitorDiscoveryResponse,
    summary="AI-discover competitors based on industry & country",
)
async def discover_competitors(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """
    Use Claude AI to discover competitors in the same industry and country.
    Reads industry, country, and website_url from the workspace profile.
    """
    profile = workspace.profile
    if not profile:
        raise HTTPException(status_code=404, detail="No workspace profile found")

    industry = profile.industry or "general"
    country = profile.country or ""
    city = profile.city or ""
    company_name = workspace.name or ""
    website_url = profile.website_url or ""

    if industry == "general" and not website_url:
        return CompetitorDiscoveryResponse(competitors=[], source="fallback")

    competitors = await _ai_discover_competitors(
        company_name=company_name,
        website_url=website_url,
        industry=industry,
        country=country,
        city=city,
    )
    source = "ai" if competitors else "fallback"
    return CompetitorDiscoveryResponse(competitors=competitors, source=source)


async def _ai_discover_competitors(
    company_name: str,
    website_url: str,
    industry: str,
    country: str,
    city: str,
) -> list[DiscoveredCompetitor]:
    """Call Claude to discover competitor websites."""
    import json as _json

    from app.core.config import get_settings

    settings = get_settings()
    api_key = settings.ANTHROPIC_API_KEY

    if not api_key:
        logger.info("No ANTHROPIC_API_KEY — skipping competitor discovery")
        return []

    location = f"{city}, {country}" if city else country
    prompt = (
        f"Find 5 real competitor companies for this business:\n"
        f"- Company: {company_name}\n"
        f"- Website: {website_url}\n"
        f"- Industry: {industry}\n"
        f"- Location: {location}\n\n"
        f"Return ONLY competitors that:\n"
        f"1. Operate in the same industry ({industry})\n"
        f"2. Serve the same geographic market ({location})\n"
        f"3. Are real, existing companies with working websites\n"
        f"4. Are direct competitors (similar size/market, not global giants unless relevant)\n\n"
        f"Return a JSON array of objects with keys: name, url, description.\n"
        f"The url must be a real website URL (https://...).\n"
        f"The description should be one short sentence about what they do.\n"
        f"Return ONLY the JSON array, no other text."
    )

    try:
        import httpx

        model = settings.AI_DEFAULT_MODEL or "claude-sonnet-4-20250514"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 600,
                    "system": "You are a business research assistant. Return only valid JSON.",
                    "messages": [{"role": "user", "content": prompt}],
                },
            )

            if resp.status_code != 200:
                logger.warning("Claude API returned %d for competitor discovery", resp.status_code)
                return []

            data = resp.json()
            text = ""
            for block in data.get("content", []):
                if block.get("type") == "text":
                    text += block["text"]

            # Parse JSON from response (handle markdown code blocks)
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                text = text.rsplit("```", 1)[0]
            text = text.strip()

            items = _json.loads(text)
            result = []
            for item in items[:5]:
                url = item.get("url", "").strip()
                if url and not url.startswith("http"):
                    url = "https://" + url
                if url:
                    result.append(DiscoveredCompetitor(
                        name=item.get("name", ""),
                        url=url,
                        description=item.get("description", ""),
                    ))
            logger.info("Discovered %d competitors via AI", len(result))
            return result

    except Exception as e:
        logger.warning("Competitor discovery failed: %s", str(e)[:200])
        return []


@router.post(
    "/competitors",
    response_model=OnboardingStepResponse,
    summary="Step 3: Competitors",
)
async def step_competitors(
    body: OnboardingCompetitorsPayload,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    ob = await _get_onboarding_or_404(db, workspace.id)
    profile = workspace.profile

    if profile:
        profile.competitor_urls = body.competitor_urls

    ob.step_competitors = True
    ob.current_step = max(ob.current_step, 4)

    return OnboardingStepResponse(
        step=3,
        completed=True,
        next_step=4,
        readiness_pct=ob.readiness_pct,
    )


@router.post(
    "/integrations",
    response_model=OnboardingStepResponse,
    summary="Step 4: Connect platforms (acknowledgement)",
)
async def step_integrations(
    body: OnboardingIntegrationsPayload,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    ob = await _get_onboarding_or_404(db, workspace.id)

    ob.step_integrations = True
    ob.current_step = max(ob.current_step, 5)

    return OnboardingStepResponse(
        step=4,
        completed=True,
        next_step=5,
        readiness_pct=ob.readiness_pct,
    )


@router.post(
    "/complete",
    response_model=OnboardingStepResponse,
    summary="Step 5: Mark onboarding complete",
)
async def step_complete(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    ob = await _get_onboarding_or_404(db, workspace.id)

    ob.step_complete = True
    ob.completed = True
    ob.completed_at = datetime.utcnow()
    ob.current_step = 5

    # Trigger company scan if website URL exists
    profile = workspace.profile
    if profile and profile.website_url:
        try:
            from app.engines.company_scanner_engine.tasks import scan_company_website
            scan_company_website.delay(
                workspace.id,
                profile.website_url,
                profile.social_links,
            )
        except Exception:
            logger.exception("Scan trigger failed for workspace=%s (non-fatal)", workspace.id)

    return OnboardingStepResponse(
        step=5,
        completed=True,
        next_step=None,
        readiness_pct=ob.readiness_pct,
    )
