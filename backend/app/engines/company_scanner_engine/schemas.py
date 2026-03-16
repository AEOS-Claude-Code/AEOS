"""
AEOS – Company Scanner Engine: Pydantic schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ScanTriggerResponse(BaseModel):
    scan_id: str
    status: str
    message: str


class WebsiteData(BaseModel):
    title: str = ""
    description: str = ""
    headings: list[dict] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    internal_links_count: int = 0
    pages_detected: int = 0


class SEOData(BaseModel):
    score: int = 0
    details: dict = Field(default_factory=dict)


class SocialPresenceData(BaseModel):
    linkedin: bool = False
    facebook: bool = False
    instagram: bool = False
    twitter: bool = False
    youtube: bool = False


class TechStackData(BaseModel):
    detected: list[str] = Field(default_factory=list)


class ScanReportResponse(BaseModel):
    id: str
    workspace_id: str
    website_url: str
    status: str
    share_token: str = ""
    share_url: str = ""
    company_name: str = ""
    page_title: str
    meta_description: str
    headings: list[dict]
    detected_keywords: list[str]
    internal_links_count: int
    pages_detected: int
    seo_score: int
    seo_details: dict
    social_presence: dict
    tech_stack: list[str]
    scan_summary: str
    scan_started_at: Optional[str] = None
    scan_completed_at: Optional[str] = None
    created_at: str
