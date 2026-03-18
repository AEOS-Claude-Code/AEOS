"""
AEOS – Competitor Intelligence Engine: Comparison logic.

Benchmarks client vs competitors across 6 dimensions.
Generates strengths, weaknesses, and opportunities.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("aeos.engine.competitor.comparison")


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


DIMENSIONS = [
    {"key": "seo", "label": "SEO & Search Visibility", "weight": 0.25},
    {"key": "performance", "label": "Website Performance", "weight": 0.20},
    {"key": "social", "label": "Social Media Presence", "weight": 0.20},
    {"key": "tech_security", "label": "Technology & Security", "weight": 0.15},
    {"key": "content", "label": "Content & Structure", "weight": 0.10},
    {"key": "digital_maturity", "label": "Digital Maturity", "weight": 0.10},
]


def _get_client_scores(client_scan: dict) -> dict[str, float]:
    """Extract dimension scores from client's scan data."""
    social_count = sum(1 for v in (client_scan.get("social_presence") or {}).values() if v)
    tech_count = len(client_scan.get("tech_stack") or [])

    return {
        "seo": client_scan.get("seo_score", 0) or 0,
        "performance": client_scan.get("performance_score", 0) or client_scan.get("performance", {}).get("score", 0) or 0,
        "social": min(100, social_count * 20),
        "tech_security": (client_scan.get("security_score", 0) or client_scan.get("security", {}).get("score", 0) or 0),
        "content": client_scan.get("seo_score", 0) * 0.5 + min(50, len(client_scan.get("keywords", []) or []) * 5),
        "digital_maturity": client_scan.get("overall_score", 0) or 0,
    }


def _get_competitor_scores(competitor: dict) -> dict[str, float]:
    """Extract dimension scores from competitor data."""
    social_count = sum(1 for v in (competitor.get("social_presence") or {}).values() if v)

    return {
        "seo": competitor.get("seo_score", 0) or 0,
        "performance": competitor.get("performance_score", 0) or 0,
        "social": min(100, social_count * 20),
        "tech_security": competitor.get("security_score", 0) or 0,
        "content": (competitor.get("seo_score", 0) or 0) * 0.5 + min(50, len(competitor.get("keywords", []) or []) * 5),
        "digital_maturity": competitor.get("overall_score", 0) or 0,
    }


def compute_comparison(
    client_scan: dict,
    competitors: list[dict],
) -> dict:
    """
    Compare client against competitors across all dimensions.
    Returns full comparison report data.
    """
    if not competitors:
        return {
            "overall_positioning": 50.0,
            "dimension_scores": [],
            "strengths": [],
            "weaknesses": [],
            "opportunities": [],
            "competitor_summary": [],
        }

    client_scores = _get_client_scores(client_scan)

    # Average competitor scores per dimension
    comp_scores_list = [_get_competitor_scores(c) for c in competitors]
    avg_comp_scores: dict[str, float] = {}
    for key in client_scores:
        values = [cs[key] for cs in comp_scores_list if cs[key] > 0]
        avg_comp_scores[key] = sum(values) / len(values) if values else 0

    # Build dimension comparison
    dimension_scores = []
    weighted_client = 0.0
    weighted_comp = 0.0

    for dim in DIMENSIONS:
        key = dim["key"]
        client_val = client_scores.get(key, 0)
        comp_avg = avg_comp_scores.get(key, 0)
        gap = client_val - comp_avg

        dimension_scores.append({
            "dimension": key,
            "label": dim["label"],
            "weight": dim["weight"],
            "client_score": round(client_val, 1),
            "competitor_avg": round(comp_avg, 1),
            "gap": round(gap, 1),
        })

        weighted_client += client_val * dim["weight"]
        weighted_comp += comp_avg * dim["weight"]

    # Overall positioning (0-100 scale, 50 = equal, >50 = client ahead)
    if weighted_comp > 0:
        ratio = weighted_client / max(weighted_comp, 1)
        overall = _clamp(50 * ratio, 10, 95)
    else:
        overall = 50.0

    # Generate insights
    strengths = _find_strengths(dimension_scores, client_scores)
    weaknesses = _find_weaknesses(dimension_scores, client_scores)
    opportunities = _find_opportunities(dimension_scores, competitors)

    # Per-competitor summary
    competitor_summary = []
    for comp in competitors:
        comp_total = _get_competitor_scores(comp)
        comp_overall = sum(comp_total[d["key"]] * d["weight"] for d in DIMENSIONS)
        client_overall = sum(client_scores[d["key"]] * d["weight"] for d in DIMENSIONS)

        competitor_summary.append({
            "id": comp.get("id", ""),
            "name": comp.get("name", "Unknown"),
            "url": comp.get("url", ""),
            "overall_score": round(comp_overall, 1),
            "vs_client": round(client_overall - comp_overall, 1),
        })

    # Sort by strongest competitor first
    competitor_summary.sort(key=lambda x: x["overall_score"], reverse=True)

    return {
        "overall_positioning": round(overall, 1),
        "dimension_scores": dimension_scores,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "opportunities": opportunities,
        "competitor_summary": competitor_summary,
    }


def _find_strengths(dimension_scores: list[dict], client_scores: dict) -> list[dict]:
    """Find dimensions where client is significantly ahead."""
    strengths = []

    for ds in dimension_scores:
        if ds["gap"] > 10 and ds["client_score"] > 40:
            strengths.append({
                "category": ds["dimension"],
                "title": f"Strong {ds['label']}",
                "description": (
                    f"You score {ds['client_score']:.0f} vs competitor average of {ds['competitor_avg']:.0f} "
                    f"in {ds['label'].lower()}. This is a competitive advantage — maintain and build on it."
                ),
                "impact": "high" if ds["gap"] > 20 else "medium",
            })

    return strengths[:4]


def _find_weaknesses(dimension_scores: list[dict], client_scores: dict) -> list[dict]:
    """Find dimensions where client is significantly behind."""
    weaknesses = []

    for ds in sorted(dimension_scores, key=lambda x: x["gap"]):
        if ds["gap"] < -10:
            weaknesses.append({
                "category": ds["dimension"],
                "title": f"Gap in {ds['label']}",
                "description": (
                    f"You score {ds['client_score']:.0f} vs competitor average of {ds['competitor_avg']:.0f}. "
                    f"Closing this gap in {ds['label'].lower()} should be a priority."
                ),
                "impact": "high" if ds["gap"] < -20 else "medium",
            })

    return weaknesses[:4]


def _find_opportunities(dimension_scores: list[dict], competitors: list[dict]) -> list[dict]:
    """Find strategic opportunities from competitive gaps."""
    opportunities = []

    # Low-scoring dimensions across ALL players = whitespace
    for ds in dimension_scores:
        if ds["client_score"] < 40 and ds["competitor_avg"] < 40:
            opportunities.append({
                "category": ds["dimension"],
                "title": f"Whitespace in {ds['label']}",
                "description": (
                    f"Both you ({ds['client_score']:.0f}) and competitors ({ds['competitor_avg']:.0f}) "
                    f"score low in {ds['label'].lower()}. First mover advantage possible."
                ),
                "impact": "high",
            })

    # Tech stack gaps
    all_tech = set()
    for c in competitors:
        all_tech.update(c.get("tech_stack") or [])

    if len(all_tech) > 3:
        popular_tech = [t for t in all_tech if sum(1 for c in competitors if t in (c.get("tech_stack") or [])) >= len(competitors) / 2]
        if popular_tech:
            opportunities.append({
                "category": "tech_security",
                "title": "Technology adoption opportunity",
                "description": (
                    f"Competitors commonly use: {', '.join(popular_tech[:5])}. "
                    f"Consider adopting similar technologies for competitive parity."
                ),
                "impact": "medium",
            })

    # Social platform gaps
    all_socials = set()
    for c in competitors:
        for platform, active in (c.get("social_presence") or {}).items():
            if active:
                all_socials.add(platform)

    if all_socials:
        opportunities.append({
            "category": "social",
            "title": "Social media expansion",
            "description": (
                f"Competitors are active on: {', '.join(sorted(all_socials))}. "
                f"Ensure you have presence on these platforms."
            ),
            "impact": "medium",
        })

    return opportunities[:5]
