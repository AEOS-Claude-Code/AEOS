"""
AEOS – Financial Health Engine: Calculator.

Estimates financial health from company profile, industry benchmarks,
digital maturity, and organizational data. No actual financial data
required — uses industry intelligence to model estimates.
"""

from __future__ import annotations

from app.engines.market_research_engine.industry_data import get_industry_data


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def estimate_revenue_model(
    industry: str,
    team_size: int,
    digital_score: float,
) -> dict:
    """Estimate revenue metrics from industry benchmarks and team size."""
    data = get_industry_data(industry)
    avg_rev_per_emp = data["avg_revenue_per_employee"]

    # Adjust by digital maturity (higher digital = higher revenue efficiency)
    maturity_multiplier = 0.7 + (digital_score / 100) * 0.6  # 0.7x to 1.3x
    est_rev_per_emp = avg_rev_per_emp * maturity_multiplier
    est_annual_revenue = est_rev_per_emp * team_size

    # Revenue label
    if est_annual_revenue >= 10_000_000:
        label = f"${est_annual_revenue / 1_000_000:.1f}M"
    elif est_annual_revenue >= 1_000_000:
        label = f"${est_annual_revenue / 1_000_000:.1f}M"
    else:
        label = f"${est_annual_revenue / 1_000:.0f}K"

    # Trend based on digital score
    trend = "growing" if digital_score > 55 else "stable" if digital_score > 30 else "declining"

    return {
        "estimated_annual_revenue": round(est_annual_revenue),
        "revenue_per_employee": round(est_rev_per_emp),
        "industry_avg_revenue_per_employee": avg_rev_per_emp,
        "revenue_label": label,
        "revenue_trend": trend,
    }


def estimate_cost_structure(
    industry: str,
    team_size: int,
    est_revenue: float,
) -> dict:
    """Estimate cost structure from industry norms."""
    # Industry-specific cost-to-revenue ratios
    cost_ratios = {
        "saas": 0.70, "technology": 0.68, "agency": 0.75, "design_creative": 0.72,
        "ecommerce": 0.82, "retail": 0.85, "restaurant": 0.88, "healthcare": 0.78,
        "travel": 0.80, "education": 0.75, "real_estate": 0.65, "finance": 0.60,
        "construction": 0.85, "manufacturing": 0.82, "engineering": 0.78,
        "logistics": 0.84, "media_entertainment": 0.76, "nonprofit": 0.90,
        "professional_services": 0.70, "other": 0.78,
    }
    ratio = cost_ratios.get(industry, 0.78)
    est_costs = est_revenue * ratio

    # Cost categories (typical split)
    categories = [
        {"name": "Personnel & Salaries", "pct": 45, "amount": round(est_costs * 0.45)},
        {"name": "Operations & Overhead", "pct": 20, "amount": round(est_costs * 0.20)},
        {"name": "Marketing & Sales", "pct": 15, "amount": round(est_costs * 0.15)},
        {"name": "Technology & Tools", "pct": 10, "amount": round(est_costs * 0.10)},
        {"name": "Other / Miscellaneous", "pct": 10, "amount": round(est_costs * 0.10)},
    ]

    # AI agent optimization potential (AEOS can reduce operational costs)
    ai_savings_pct = min(25, team_size * 0.5 + 5)  # 5-25% savings

    return {
        "estimated_annual_costs": round(est_costs),
        "cost_to_revenue_ratio": round(ratio, 2),
        "major_cost_categories": categories,
        "optimization_potential": round(ai_savings_pct, 1),
    }


def calculate_projections(
    est_revenue: float,
    est_costs: float,
    growth_rate: float,
    ai_savings_pct: float,
) -> list[dict]:
    """Generate 3-year financial projections."""
    projections = []
    rev = est_revenue
    costs = est_costs

    for year in range(1, 4):
        # Revenue grows by industry growth rate + AI boost
        ai_boost = min(5, year * 1.5)  # AI agents improve revenue over time
        rev = rev * (1 + (growth_rate + ai_boost) / 100)

        # Costs grow slower due to AI optimization
        cost_reduction = min(ai_savings_pct, year * ai_savings_pct / 3)
        costs = costs * (1 + (growth_rate * 0.6) / 100) * (1 - cost_reduction / 100)

        profit = rev - costs

        projections.append({
            "year": year,
            "revenue": round(rev),
            "costs": round(costs),
            "profit": round(profit),
            "growth_rate": round(growth_rate + ai_boost, 1),
        })

    return projections


def score_revenue_potential(
    rev_per_emp: float,
    industry_avg: float,
    digital_score: float,
) -> float:
    """Score revenue generation potential (0-100, higher = better)."""
    ratio = rev_per_emp / max(industry_avg, 1)
    base = min(100, ratio * 60)
    digital_bonus = digital_score * 0.3
    return _clamp(base + digital_bonus)


def score_cost_efficiency(
    cost_ratio: float,
    ai_savings_potential: float,
) -> float:
    """Score cost efficiency (0-100, higher = better)."""
    # Lower cost ratio = better
    ratio_score = max(0, (1 - cost_ratio) * 200)  # 0.6 ratio → 80, 0.9 → 20
    ai_bonus = ai_savings_potential * 1.5
    return _clamp(ratio_score + ai_bonus)


def score_growth_readiness(
    growth_rate: float,
    digital_score: float,
    gap_score: float,
) -> float:
    """Score growth readiness (0-100, higher = better)."""
    growth_base = min(50, growth_rate * 4)  # 12% → 48
    digital_factor = digital_score * 0.3
    org_factor = (100 - gap_score) * 0.2  # Lower gap = more ready
    return _clamp(growth_base + digital_factor + org_factor)


def score_risk_exposure(
    cost_ratio: float,
    gap_score: float,
    digital_score: float,
) -> float:
    """Score risk exposure (0-100, higher = MORE risk)."""
    cost_risk = cost_ratio * 40  # High costs = more risk
    gap_risk = gap_score * 0.3  # More gaps = more risk
    digital_risk = (100 - digital_score) * 0.2  # Low digital = more risk
    return _clamp(cost_risk + gap_risk + digital_risk)


def score_investment_readiness(
    overall_score: float,
    digital_score: float,
    gap_score: float,
    team_size: int,
) -> float:
    """Score readiness for investment/funding (0-100, higher = more ready)."""
    health = overall_score * 0.3
    digital = digital_score * 0.25
    org = (100 - gap_score) * 0.25  # Lower gap = better
    scale = min(100, team_size * 4) * 0.20  # Larger team = more investable
    return _clamp(health + digital + org + scale)


def generate_growth_levers(
    industry: str,
    digital_score: float,
    gap_score: float,
    cost_ratio: float,
) -> list[dict]:
    """Generate growth opportunities."""
    levers = []

    if digital_score < 60:
        levers.append({
            "title": "Digital presence optimization",
            "description": "Improving website, SEO, and social media could increase lead generation by 20-40%.",
            "estimated_impact_pct": 25,
            "effort": "medium",
            "category": "digital",
        })

    if gap_score > 50:
        levers.append({
            "title": "Organizational structure completion",
            "description": "Filling organizational gaps with AI agents improves operational efficiency and reduces bottlenecks.",
            "estimated_impact_pct": 15,
            "effort": "easy",
            "category": "operations",
        })

    if cost_ratio > 0.80:
        levers.append({
            "title": "Cost structure optimization",
            "description": "AI-powered automation can reduce operational costs by 10-25% through process optimization.",
            "estimated_impact_pct": 20,
            "effort": "medium",
            "category": "finance",
        })

    data = get_industry_data(industry)
    growth_rate = data["annual_growth_rate"]
    if growth_rate > 8:
        levers.append({
            "title": f"Market growth capture ({growth_rate}% CAGR)",
            "description": f"Your industry is growing at {growth_rate}% annually. Positioning for this growth could significantly boost revenue.",
            "estimated_impact_pct": int(growth_rate),
            "effort": "hard",
            "category": "market",
        })

    levers.append({
        "title": "AI agent revenue multiplier",
        "description": "AEOS AI agents working 24/7 across departments can increase effective capacity by 3-5x without proportional cost increase.",
        "estimated_impact_pct": 30,
        "effort": "easy",
        "category": "ai",
    })

    return levers[:5]


def generate_financial_risks(
    industry: str,
    cost_ratio: float,
    gap_score: float,
    team_size: int,
) -> list[dict]:
    """Generate financial risk factors."""
    risks = []
    data = get_industry_data(industry)

    if cost_ratio > 0.85:
        risks.append({
            "title": "High cost-to-revenue ratio",
            "description": f"At {cost_ratio:.0%}, your estimated cost structure leaves thin margins. Focus on efficiency.",
            "severity": "high",
            "likelihood": "high",
            "mitigation": "Implement AI-powered cost optimization and automate repetitive processes.",
        })

    if gap_score > 60:
        risks.append({
            "title": "Operational risk from organizational gaps",
            "description": "Significant gaps in department coverage increase execution risk and slow decision-making.",
            "severity": "high",
            "likelihood": "medium",
            "mitigation": "Deploy AEOS AI agents to fill critical gaps immediately.",
        })

    if team_size < 10:
        risks.append({
            "title": "Key person dependency",
            "description": "Small teams are vulnerable to key person departures. Single points of failure exist.",
            "severity": "medium",
            "likelihood": "medium",
            "mitigation": "Document processes and deploy AI agents as backup for critical functions.",
        })

    # Add industry-specific threats as financial risks
    for threat in data.get("key_threats", [])[:2]:
        risks.append({
            "title": threat["title"],
            "description": threat["description"],
            "severity": threat.get("severity", "medium"),
            "likelihood": "medium",
            "mitigation": "Monitor market conditions and maintain agile response capability.",
        })

    return risks[:5]


def generate_recommendations(
    scores: dict,
    revenue_model: dict,
    cost_structure: dict,
    growth_levers: list,
) -> list[dict]:
    """Generate prioritized financial recommendations."""
    recs = []
    priority = 0

    if scores["cost_efficiency_score"] < 40:
        priority += 1
        recs.append({
            "priority": priority,
            "title": "Reduce cost-to-revenue ratio",
            "description": f"Your estimated cost ratio of {cost_structure['cost_to_revenue_ratio']:.0%} is high. AI automation could save {cost_structure['optimization_potential']:.0f}%.",
            "impact": "high",
            "category": "cost",
        })

    if scores["revenue_potential_score"] < 50:
        priority += 1
        recs.append({
            "priority": priority,
            "title": "Improve revenue per employee",
            "description": f"At ${revenue_model['revenue_per_employee']:,.0f}/employee vs industry avg ${revenue_model['industry_avg_revenue_per_employee']:,.0f}. Focus on productivity tools and AI augmentation.",
            "impact": "high",
            "category": "revenue",
        })

    if scores["growth_readiness_score"] < 50:
        priority += 1
        recs.append({
            "priority": priority,
            "title": "Strengthen growth foundation",
            "description": "Improve digital presence and organizational structure before pursuing aggressive growth.",
            "impact": "medium",
            "category": "growth",
        })

    if scores["risk_exposure_score"] > 60:
        priority += 1
        recs.append({
            "priority": priority,
            "title": "Mitigate financial risk exposure",
            "description": "High risk score indicates vulnerabilities. Diversify revenue streams and build operational resilience.",
            "impact": "high",
            "category": "risk",
        })

    if scores["investment_readiness_score"] > 60:
        priority += 1
        recs.append({
            "priority": priority,
            "title": "Explore funding opportunities",
            "description": "Your company shows strong investment readiness. Consider growth funding to accelerate market capture.",
            "impact": "medium",
            "category": "investment",
        })

    # Always add AEOS ROI recommendation
    priority += 1
    recs.append({
        "priority": priority,
        "title": "Maximize AEOS AI agent ROI",
        "description": "Deploy AI agents across all departments to maximize the revenue multiplier effect while keeping costs controlled.",
        "impact": "high",
        "category": "ai",
    })

    return recs[:6]


def compute_all_scores(
    revenue_model: dict,
    cost_structure: dict,
    growth_rate: float,
    digital_score: float,
    gap_score: float,
    team_size: int,
) -> dict:
    """Compute all 5 financial health dimensions."""
    rev_score = score_revenue_potential(
        revenue_model["revenue_per_employee"],
        revenue_model["industry_avg_revenue_per_employee"],
        digital_score,
    )
    cost_score = score_cost_efficiency(
        cost_structure["cost_to_revenue_ratio"],
        cost_structure["optimization_potential"],
    )
    growth_score = score_growth_readiness(growth_rate, digital_score, gap_score)
    risk_score = score_risk_exposure(
        cost_structure["cost_to_revenue_ratio"], gap_score, digital_score,
    )
    # Invert risk for overall (lower risk = better health)
    risk_inverted = 100 - risk_score

    overall = (
        rev_score * 0.25
        + cost_score * 0.20
        + growth_score * 0.25
        + risk_inverted * 0.15
        + 50 * 0.15  # Placeholder for investment readiness contribution
    )
    overall = _clamp(overall)

    invest_score = score_investment_readiness(overall, digital_score, gap_score, team_size)

    return {
        "overall_score": round(overall, 1),
        "revenue_potential_score": round(rev_score, 1),
        "cost_efficiency_score": round(cost_score, 1),
        "growth_readiness_score": round(growth_score, 1),
        "risk_exposure_score": round(risk_score, 1),
        "investment_readiness_score": round(invest_score, 1),
    }
