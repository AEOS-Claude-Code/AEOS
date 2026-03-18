"""
AEOS – Reports Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ReportSection(BaseModel):
    title: str
    content: str  # Markdown content
    data: dict = {}  # Structured data for charts/tables


class ReportListItem(BaseModel):
    id: str
    report_type: str
    title: str
    status: str
    share_token: str
    is_public: bool = False
    generated_at: Optional[str] = None
    created_at: str


class ReportResponse(BaseModel):
    id: str
    workspace_id: str
    report_type: str
    title: str
    status: str
    sections: list[ReportSection]
    summary: str
    share_token: str
    is_public: bool = False
    metadata: dict = {}
    generated_at: Optional[str] = None
    created_at: str


class GenerateRequest(BaseModel):
    report_type: str


class GenerateResponse(BaseModel):
    report_id: str
    status: str
    message: str


class ShareRequest(BaseModel):
    is_public: bool
