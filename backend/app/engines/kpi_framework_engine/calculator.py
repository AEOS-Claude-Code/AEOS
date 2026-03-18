"""
AEOS – KPI Framework Engine: Calculator.

Builds a complete KPI framework from templates + actual AEOS data.
Populates current values where data is available from other engines.
"""

from __future__ import annotations

import uuid

from .kpi_templates import (
    COMPANY_KPIS, DIGITAL_KPIS, FINANCIAL_KPIS,
    DEPARTMENT_KPI_TEMPLATES, REVIEW_CADENCE,
)


def _uid() -> str:
    return str(uuid.uuid4())[:8]


def build_company_kpis(data: dict) -> list[dict]:
    """Build company-level KPIs with current values from AEOS data."""
    kpis = []
    for tpl in COMPANY_KPIS:
        kpi = {**tpl, "id": _uid(), "category": "company", "department": "company"}

        # Populate current values from available data
        if tpl["id"] == "employee_productivity":
            rev = data.get("revenue_per_employee", 0)
            avg = data.get("industry_avg_revenue_per_employee", 0)
            if rev > 0:
                kpi["current_value"] = f"${rev:,.0f}"
                kpi["status"] = "on_track" if rev >= avg else "at_risk"
        elif tpl["id"] == "revenue_growth":
            growth = data.get("market_growth_rate", 0)
            if growth > 0:
                kpi["current_value"] = f"{growth:.1f}% (industry avg)"
                kpi["status"] = "on_track" if growth > 10 else "at_risk"

        kpis.append(kpi)
    return kpis


def build_digital_kpis(data: dict) -> list[dict]:
    """Build digital KPIs with current values from AEOS engines."""
    kpis = []
    for tpl in DIGITAL_KPIS:
        kpi = {**tpl, "id": _uid(), "category": "digital", "department": "digital"}

        if tpl["id"] == "digital_presence_score":
            score = data.get("digital_presence_score", 0)
            if score > 0:
                kpi["current_value"] = f"{score:.0f}/100"
                kpi["status"] = "on_track" if score >= 70 else "at_risk" if score >= 40 else "off_track"

        elif tpl["id"] == "seo_score":
            score = data.get("seo_score", 0)
            if score > 0:
                kpi["current_value"] = f"{score:.0f}/100"
                kpi["status"] = "on_track" if score >= 65 else "at_risk" if score >= 40 else "off_track"

        elif tpl["id"] == "social_engagement":
            count = data.get("social_platforms", 0)
            if count > 0:
                kpi["current_value"] = f"{count} platforms"
                kpi["status"] = "on_track" if count >= 4 else "at_risk" if count >= 2 else "off_track"

        elif tpl["id"] == "website_performance":
            score = data.get("website_performance_score", 0)
            if score > 0:
                kpi["current_value"] = f"{score:.0f}/100"
                kpi["status"] = "on_track" if score >= 75 else "at_risk"

        elif tpl["id"] == "competitive_position":
            score = data.get("competitive_positioning", 0)
            if score > 0:
                kpi["current_value"] = f"{score:.0f}/100"
                kpi["status"] = "on_track" if score >= 55 else "at_risk"

        kpis.append(kpi)
    return kpis


def build_financial_kpis(data: dict) -> list[dict]:
    """Build financial KPIs with current values."""
    kpis = []
    for tpl in FINANCIAL_KPIS:
        kpi = {**tpl, "id": _uid(), "category": "financial", "department": "finance"}

        if tpl["id"] == "cost_ratio":
            ratio = data.get("cost_to_revenue_ratio", 0)
            if ratio > 0:
                kpi["current_value"] = f"{ratio * 100:.0f}%"
                kpi["status"] = "on_track" if ratio < 0.80 else "at_risk" if ratio < 0.90 else "off_track"

        elif tpl["id"] == "ai_roi":
            savings = data.get("ai_optimization_potential", 0)
            if savings > 0:
                kpi["current_value"] = f"{savings:.0f}% potential savings"
                kpi["status"] = "on_track" if savings > 15 else "at_risk"

        kpis.append(kpi)
    return kpis


def build_department_kpis(departments: list[dict]) -> list[dict]:
    """Build department-level KPIs based on the company's org chart."""
    kpis = []
    for dept in departments:
        dept_id = dept.get("id", "")
        dept_name = dept.get("name", "")
        templates = DEPARTMENT_KPI_TEMPLATES.get(dept_id, [])

        for tpl in templates:
            kpi = {
                **tpl,
                "id": _uid(),
                "category": "department",
                "department": dept_name,
                "current_value": "",
                "status": "not_tracked",
                "data_source": f"AEOS {dept_name} AI",
            }
            kpis.append(kpi)

    return kpis


def calculate_kpi_score(
    company_kpis: list[dict],
    digital_kpis: list[dict],
    financial_kpis: list[dict],
    department_kpis: list[dict],
) -> dict:
    """Calculate overall KPI health score."""
    all_kpis = company_kpis + digital_kpis + financial_kpis + department_kpis
    total = len(all_kpis)
    tracked = sum(1 for k in all_kpis if k.get("status") != "not_tracked")
    on_track = sum(1 for k in all_kpis if k.get("status") == "on_track")
    at_risk = sum(1 for k in all_kpis if k.get("status") == "at_risk")

    if total == 0:
        return {"score": 0, "total": 0, "tracked": 0}

    # Score based on tracking coverage + health of tracked KPIs
    tracking_score = (tracked / total) * 50  # Up to 50 for coverage
    health_score = 0
    if tracked > 0:
        health_score = (on_track / tracked) * 40 + (at_risk / tracked) * 15  # Up to 40+15

    return {
        "score": round(min(100, tracking_score + health_score), 1),
        "total": total,
        "tracked": tracked,
    }


def build_review_cadence() -> dict:
    """Return recommended review cadence."""
    return REVIEW_CADENCE
