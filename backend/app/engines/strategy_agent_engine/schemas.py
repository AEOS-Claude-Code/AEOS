"""
AEOS – Strategy Agent Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class BusinessPlanSection(BaseModel):
    key: str
    title: str
    status: str = "pending"  # pending | generating | completed | failed
    content: str = ""
    word_count: int = 0
    generated_at: Optional[str] = None


class BusinessPlanResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    title: str
    version: int
    sections: list[BusinessPlanSection]
    current_section: Optional[str] = None
    sections_completed: int
    sections_total: int
    metadata: dict = {}
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str


class BusinessPlanProgress(BaseModel):
    id: str
    status: str
    current_section: Optional[str] = None
    sections_completed: int
    sections_total: int


class BusinessPlanListItem(BaseModel):
    id: str
    title: str
    status: str
    version: int
    sections_completed: int
    sections_total: int
    created_at: str


class GenerateRequest(BaseModel):
    force_regenerate: bool = False


class GenerateResponse(BaseModel):
    plan_id: str
    status: str
    message: str
