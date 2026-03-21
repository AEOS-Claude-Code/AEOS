"""
AEOS – Smart Intake Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class IntakeFromUrlRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)


class IntakeFromUrlResponse(BaseModel):
    url: str
    detected_company_name: str
    detected_industry: str
    industry_confidence: float
    industry_scores: dict[str, float] = {}
    industry_signals: list[str] = []
    detected_country: str = ""
    detected_city: str = ""
    detected_phone_numbers: list[str] = []
    detected_emails: list[str] = []
    detected_social_links: dict[str, list[str]] = {}
    detected_whatsapp_links: list[str] = []
    detected_contact_pages: list[str] = []
    detected_booking_pages: list[str] = []
    detected_tech_stack: list[str] = []
    page_title: str = ""
    meta_description: str = ""
    og_image: str = ""
    favicon_url: str = ""
    detected_business_hours: list[dict] = []
    detected_languages: list[str] = []
    detected_competitors: list[dict] = []
    detected_keywords: list[str] = []
