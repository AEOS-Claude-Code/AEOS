"""
AEOS – Market Research Engine: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class MarketSizing(BaseModel):
    tam: float  # Total Addressable Market (USD billions)
    sam: float  # Serviceable Addressable Market
    som: float  # Serviceable Obtainable Market
    tam_label: str = ""
    sam_label: str = ""
    som_label: str = ""


class BenchmarkItem(BaseModel):
    metric: str
    your_value: float
    industry_avg: float
    unit: str = ""
    status: str = "neutral"  # above | below | neutral


class GrowthDriver(BaseModel):
    title: str
    description: str
    impact: str = "medium"  # high | medium | low
    category: str = ""


class MarketThreat(BaseModel):
    title: str
    description: str
    severity: str = "medium"  # high | medium | low


class MarketPositioning(BaseModel):
    score: float  # 0-100
    label: str  # "Early Stage" | "Growing" | "Established" | "Market Leader"
    strengths: list[str] = []
    growth_areas: list[str] = []


class MarketResearchResponse(BaseModel):
    id: str
    workspace_id: str
    status: str
    industry: str
    market_sizing: MarketSizing
    benchmarks: list[BenchmarkItem]
    growth_drivers: list[GrowthDriver]
    threats: list[MarketThreat]
    opportunities: list[GrowthDriver]
    market_positioning: MarketPositioning
    market_growth_rate: float
    computed_at: Optional[str] = None


class ComputeResponse(BaseModel):
    report_id: str
    status: str
    message: str
