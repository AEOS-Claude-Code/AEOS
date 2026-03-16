"""
AEOS – Executive Copilot Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class CopilotAskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000, description="Natural language question about the business")


class CopilotSource(BaseModel):
    engine: str
    label: str
    value: str


class CopilotResponse(BaseModel):
    question: str
    answer: str
    sources: list[CopilotSource] = Field(default_factory=list)
    confidence: float = 0.0  # 0-1
    workspace_id: str = ""
