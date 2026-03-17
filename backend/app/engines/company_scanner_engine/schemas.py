"""
AEOS – Company Scanner Engine: Pydantic schemas.

Phase 7: Extended with performance, security, accessibility,
structured data, crawl info, and scan history.
"""

from __future__ import annotations

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
    pages_crawled: int = 0
    crawled_pages: list[dict] = Field(default_factory=list)
    seo_score: int
    seo_details: dict
    social_presence: dict
    tech_stack: list[str]
    performance: dict = Field(default_factory=dict)
    security: dict = Field(default_factory=dict)
    accessibility: dict = Field(default_factory=dict)
    structured_data: dict = Field(default_factory=dict)
    crawl_info: dict = Field(default_factory=dict)
    overall_score: int = 0
    scan_summary: str
    scan_started_at: Optional[str] = None
    scan_completed_at: Optional[str] = None
    created_at: str


class ScanHistoryItem(BaseModel):
    id: str
    website_url: str
    status: str
    seo_score: int
    overall_score: int = 0
    pages_crawled: int = 0
    scan_started_at: Optional[str] = None
    scan_completed_at: Optional[str] = None
    created_at: str


class ScanHistoryResponse(BaseModel):
    scans: list[ScanHistoryItem]
    total: int
