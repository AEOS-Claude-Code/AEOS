"""
AEOS – Smart Intake Engine: API router.

Provides the intake-from-url endpoint for smart onboarding.
This endpoint is accessible to authenticated users during onboarding.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from .schemas import IntakeFromUrlRequest, IntakeFromUrlResponse
from . import service

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
