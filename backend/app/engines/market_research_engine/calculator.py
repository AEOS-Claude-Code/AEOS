"""
AEOS – Market Research Engine: TAM/SAM/SOM Calculator.

Estimates market sizing and positioning based on industry, location, and company data.
"""

from __future__ import annotations

from .industry_data import get_industry_data, get_regional_multiplier


def calculate_market_sizing(
    industry: str,
    country: str,
    team_size: int,
    digital_maturity_score: float = 50.0,
) -> dict:
    """
    Calculate TAM, SAM, SOM for the company.
    Returns dict with tam, sam, som (in USD billions) and labels.
    """
    data = get_industry_data(industry)
    global_tam = data["global_market_size_b"]
    regional_mult = get_regional_multiplier(country)

    # TAM: Regional market size
    tam = global_tam * regional_mult

    # SAM: Serviceable fraction (SME segment of the regional market)
    # SMEs typically represent 40-60% of most markets
    sme_fraction = 0.45
    sam = tam * sme_fraction

    # SOM: Obtainable fraction based on company maturity
    # Larger teams and higher digital maturity = higher obtainable share
    maturity_factor = min(1.0, (digital_maturity_score / 100) * 0.6 + 0.2)
    size_factor = min(1.0, (team_size / 100) * 0.5 + 0.1)
    obtainable_pct = maturity_factor * size_factor * 0.05  # Max ~5% of SAM
    som = sam * max(0.001, obtainable_pct)

    return {
        "tam": round(tam, 2),
        "sam": round(sam, 2),
        "som": round(som, 3),
        "tam_label": _format_market_size(tam),
        "sam_label": _format_market_size(sam),
        "som_label": _format_market_size(som),
    }


def calculate_benchmarks(
    industry: str,
    team_size: int,
    digital_maturity_score: float = 50.0,
    seo_score: float = 0.0,
    social_platforms: int = 0,
) -> list[dict]:
    """Generate industry benchmark comparisons."""
    data = get_industry_data(industry)

    benchmarks = [
        {
            "metric": "Digital Maturity",
            "your_value": round(digital_maturity_score, 0),
            "industry_avg": data["avg_digital_maturity"],
            "unit": "score",
            "status": "above" if digital_maturity_score > data["avg_digital_maturity"] else "below",
        },
        {
            "metric": "SEO Score",
            "your_value": round(seo_score, 0),
            "industry_avg": data["avg_digital_maturity"] * 0.7,  # Approx SEO benchmark
            "unit": "score",
            "status": "above" if seo_score > data["avg_digital_maturity"] * 0.7 else "below",
        },
        {
            "metric": "Social Presence",
            "your_value": social_platforms,
            "industry_avg": 3.5,
            "unit": "platforms",
            "status": "above" if social_platforms > 3 else "below",
        },
        {
            "metric": "Market Growth Rate",
            "your_value": data["annual_growth_rate"],
            "industry_avg": data["annual_growth_rate"],
            "unit": "%",
            "status": "neutral",
        },
        {
            "metric": "Revenue/Employee Benchmark",
            "your_value": data["avg_revenue_per_employee"],
            "industry_avg": data["avg_revenue_per_employee"],
            "unit": "USD",
            "status": "neutral",
        },
    ]

    return benchmarks


def calculate_positioning(
    team_size: int,
    digital_maturity_score: float,
    gap_score: float = 50.0,
    competitor_positioning: float = 50.0,
) -> dict:
    """Calculate market positioning score and label."""
    # Composite positioning based on multiple factors
    factors = [
        digital_maturity_score * 0.30,
        (100 - gap_score) * 0.25,  # Lower gap = better
        competitor_positioning * 0.25,
        min(100, team_size * 2) * 0.20,  # Team size factor
    ]
    score = sum(factors)
    score = max(0, min(100, score))

    if score >= 75:
        label = "Market Leader"
    elif score >= 55:
        label = "Established Player"
    elif score >= 35:
        label = "Growing Contender"
    else:
        label = "Early Stage"

    # Derive strengths and growth areas
    strengths = []
    growth_areas = []

    if digital_maturity_score > 60:
        strengths.append("Strong digital foundation")
    else:
        growth_areas.append("Digital maturity improvement needed")

    if gap_score < 40:
        strengths.append("Well-structured organization")
    else:
        growth_areas.append("Organizational gaps to address")

    if competitor_positioning > 55:
        strengths.append("Competitive positioning advantage")
    else:
        growth_areas.append("Competitive differentiation needed")

    if team_size >= 20:
        strengths.append("Sufficient team depth")
    else:
        growth_areas.append("Team expansion for growth")

    return {
        "score": round(score, 1),
        "label": label,
        "strengths": strengths,
        "growth_areas": growth_areas,
    }


def generate_opportunities(industry: str, country: str) -> list[dict]:
    """Generate market opportunities from industry data."""
    data = get_industry_data(industry)
    drivers = data.get("key_growth_drivers", [])

    opportunities = []
    for driver in drivers:
        if driver.get("impact") == "high":
            opportunities.append({
                "title": driver["title"],
                "description": driver["description"],
                "impact": "high",
                "category": driver.get("category", "market"),
            })

    # Add regional opportunity if GCC
    from .industry_data import GCC_COUNTRIES
    if country in GCC_COUNTRIES:
        opportunities.append({
            "title": "GCC Digital Economy Growth",
            "description": f"The {country} digital economy is growing rapidly with government-backed initiatives and Vision 2030 programs.",
            "impact": "high",
            "category": "market",
        })

    return opportunities[:5]


def _format_market_size(value_b: float) -> str:
    """Format market size in billions/millions for display."""
    if value_b >= 1.0:
        return f"${value_b:.1f}B"
    elif value_b >= 0.001:
        return f"${value_b * 1000:.0f}M"
    else:
        return f"${value_b * 1000000:.0f}K"
