"""
AEOS – Financial Model Engine: Calculator.

Generates 5-year financial projections with P&L, EBITDA, break-even,
and funding analysis from company profile + industry benchmarks.
"""

from __future__ import annotations

from app.engines.market_research_engine.industry_data import get_industry_data


def build_assumptions(
    industry: str, team_size: int, digital_score: float,
) -> dict:
    """Build model assumptions from available data."""
    data = get_industry_data(industry)
    growth = data["annual_growth_rate"]
    avg_rev = data["avg_revenue_per_employee"]

    # AI boost factor (AEOS improves efficiency over time)
    ai_boost = min(8, digital_score * 0.08)  # 0-8% additional growth from AI

    return {
        "base_growth_rate": round(growth + ai_boost, 1),
        "cost_reduction_from_ai": round(min(20, 5 + team_size * 0.3), 1),
        "headcount_growth_rate": round(min(30, growth * 1.5), 1),
        "avg_revenue_per_employee": avg_rev,
        "industry_growth_rate": growth,
    }


def build_yearly_projections(
    base_revenue: float,
    base_costs: float,
    team_size: int,
    assumptions: dict,
    years: int = 5,
) -> list[dict]:
    """Generate 5-year P&L projections."""
    projections = []
    rev = base_revenue
    growth_rate = assumptions["base_growth_rate"]
    headcount = team_size
    hc_growth = assumptions["headcount_growth_rate"]
    ai_cost_reduction = assumptions["cost_reduction_from_ai"]

    for year in range(1, years + 1):
        # Revenue grows by base rate, accelerating slightly with AI
        year_boost = min(3, year * 0.5)  # AI compounds over time
        effective_growth = growth_rate + year_boost
        if year > 1:
            rev = rev * (1 + effective_growth / 100)

        # Headcount grows but slower than revenue (AI leverage)
        if year > 1:
            headcount = int(headcount * (1 + hc_growth / 200))  # Half the rate

        # Cost structure
        cogs = rev * 0.30  # ~30% COGS
        personnel = headcount * 80000  # Avg fully-loaded cost per employee
        ai_savings = personnel * (ai_cost_reduction / 100) * min(1, year / 3)  # Ramps up
        opex = personnel - ai_savings + (rev * 0.15)  # Personnel + overhead
        total_costs = cogs + opex

        gross_profit = rev - cogs
        ebitda = rev - total_costs
        ebitda_margin = (ebitda / rev * 100) if rev > 0 else 0
        net_income = ebitda * 0.80  # ~20% tax estimate

        projections.append({
            "year": year,
            "revenue": round(rev),
            "cogs": round(cogs),
            "gross_profit": round(gross_profit),
            "operating_expenses": round(opex),
            "ebitda": round(ebitda),
            "ebitda_margin": round(ebitda_margin, 1),
            "net_income": round(net_income),
            "headcount": headcount,
            "revenue_growth": round(effective_growth, 1),
        })

    return projections


def build_monthly_cashflow(
    base_revenue: float,
    base_costs: float,
    growth_rate: float,
    months: int = 24,
) -> list[dict]:
    """Generate first 24 months of cash flow."""
    cashflow = []
    monthly_rev = base_revenue / 12
    monthly_cost = base_costs / 12
    cumulative = 0
    monthly_growth = (1 + growth_rate / 100) ** (1 / 12) - 1

    for month in range(1, months + 1):
        rev = monthly_rev * (1 + monthly_growth) ** month
        # Costs grow slower due to AI optimization
        costs = monthly_cost * (1 + monthly_growth * 0.6) ** month
        net = rev - costs
        cumulative += net

        cashflow.append({
            "month": month,
            "revenue": round(rev),
            "expenses": round(costs),
            "net_cashflow": round(net),
            "cumulative_cashflow": round(cumulative),
        })

    return cashflow


def build_revenue_streams(
    base_revenue: float,
    industry: str,
    growth_rate: float,
) -> list[dict]:
    """Break down revenue into streams based on industry."""
    stream_configs = {
        "saas": [
            ("Subscriptions", 0.70, growth_rate + 5),
            ("Professional Services", 0.20, growth_rate),
            ("Marketplace / Add-ons", 0.10, growth_rate + 10),
        ],
        "ecommerce": [
            ("Product Sales", 0.75, growth_rate),
            ("Marketplace Fees", 0.15, growth_rate + 5),
            ("Advertising", 0.10, growth_rate + 8),
        ],
        "travel": [
            ("Tour Packages", 0.60, growth_rate),
            ("Accommodation Bookings", 0.25, growth_rate + 3),
            ("Transfer & Activities", 0.15, growth_rate + 5),
        ],
        "healthcare": [
            ("Patient Services", 0.70, growth_rate),
            ("Telemedicine", 0.20, growth_rate + 10),
            ("Health Products", 0.10, growth_rate + 5),
        ],
        "agency": [
            ("Retainer Clients", 0.50, growth_rate),
            ("Project Work", 0.35, growth_rate + 3),
            ("Digital Products", 0.15, growth_rate + 8),
        ],
    }

    configs = stream_configs.get(industry, [
        ("Core Services", 0.65, growth_rate),
        ("Secondary Revenue", 0.25, growth_rate + 3),
        ("New Channels", 0.10, growth_rate + 8),
    ])

    streams = []
    for name, pct, stream_growth in configs:
        y1 = base_revenue * pct
        y3 = y1 * (1 + stream_growth / 100) ** 2
        y5 = y1 * (1 + stream_growth / 100) ** 4
        streams.append({
            "name": name,
            "year1": round(y1),
            "year3": round(y3),
            "year5": round(y5),
            "growth_rate": round(stream_growth, 1),
            "pct_of_total": round(pct * 100, 1),
        })

    return streams


def build_cost_breakdown(
    base_costs: float,
    team_size: int,
    growth_rate: float,
) -> list[dict]:
    """Break down costs by category with 5-year trajectory."""
    categories = [
        ("Personnel & Salaries", 0.45, growth_rate * 0.5),
        ("Technology & AI Tools", 0.12, growth_rate * 0.3),
        ("Marketing & Sales", 0.18, growth_rate * 0.8),
        ("Operations & Facilities", 0.15, growth_rate * 0.3),
        ("General & Admin", 0.10, growth_rate * 0.2),
    ]

    breakdown = []
    for name, pct, cat_growth in categories:
        y1 = base_costs * pct
        y3 = y1 * (1 + cat_growth / 100) ** 2
        y5 = y1 * (1 + cat_growth / 100) ** 4
        breakdown.append({
            "name": name,
            "year1": round(y1),
            "year3": round(y3),
            "year5": round(y5),
            "pct_of_revenue": round(pct * 100, 1),
        })

    return breakdown


def build_ebitda_analysis(projections: list[dict]) -> dict:
    """Extract EBITDA analysis from yearly projections."""
    y1 = projections[0] if len(projections) > 0 else {}
    y3 = projections[2] if len(projections) > 2 else {}
    y5 = projections[4] if len(projections) > 4 else {}

    margins = [p.get("ebitda_margin", 0) for p in projections]
    trend = "improving" if len(margins) > 1 and margins[-1] > margins[0] else "stable"

    return {
        "year1_ebitda": y1.get("ebitda", 0),
        "year3_ebitda": y3.get("ebitda", 0),
        "year5_ebitda": y5.get("ebitda", 0),
        "year1_margin": y1.get("ebitda_margin", 0),
        "year3_margin": y3.get("ebitda_margin", 0),
        "year5_margin": y5.get("ebitda_margin", 0),
        "trend": trend,
    }


def build_break_even(monthly_cashflow: list[dict], base_costs: float) -> dict:
    """Calculate break-even point from monthly cash flow."""
    monthly_fixed = base_costs * 0.6 / 12  # ~60% of costs are fixed

    be_month = 0
    for cf in monthly_cashflow:
        if cf["cumulative_cashflow"] > 0 and be_month == 0:
            be_month = cf["month"]

    if be_month == 0:
        be_month = 36  # Default if not reached in 24 months

    # Contribution margin estimate
    if monthly_cashflow:
        last = monthly_cashflow[-1]
        contribution = (last["revenue"] - last["expenses"]) / max(last["revenue"], 1)
    else:
        contribution = 0.20

    be_revenue = monthly_fixed / max(contribution, 0.01)

    return {
        "break_even_month": be_month,
        "break_even_revenue": round(be_revenue),
        "monthly_fixed_costs": round(monthly_fixed),
        "contribution_margin": round(contribution * 100, 1),
        "status": "achieved" if be_month <= 12 else "projected" if be_month <= 36 else "not_projected",
    }


def build_funding_requirements(
    base_revenue: float,
    base_costs: float,
    team_size: int,
    break_even_month: int,
) -> dict:
    """Estimate funding requirements."""
    monthly_burn = (base_costs - base_revenue) / 12
    if monthly_burn <= 0:
        # Profitable — may not need funding
        return {
            "total_needed": 0,
            "runway_months": 999,
            "use_of_funds": [
                {"category": "Growth Investment", "amount": round(base_revenue * 0.3), "pct": 60},
                {"category": "Technology & AI", "amount": round(base_revenue * 0.1), "pct": 20},
                {"category": "Working Capital", "amount": round(base_revenue * 0.1), "pct": 20},
            ],
            "recommended_round": "bootstrapped",
            "valuation_range": f"${base_revenue * 3 / 1_000_000:.1f}M - ${base_revenue * 5 / 1_000_000:.1f}M (revenue multiple)",
        }

    months_to_be = max(break_even_month, 12)
    total_needed = monthly_burn * months_to_be * 1.3  # 30% buffer

    # Determine round type
    if total_needed < 500_000:
        round_type = "seed"
    elif total_needed < 3_000_000:
        round_type = "series_a"
    else:
        round_type = "series_b"

    return {
        "total_needed": round(total_needed),
        "runway_months": months_to_be,
        "use_of_funds": [
            {"category": "Product & Technology", "amount": round(total_needed * 0.35), "pct": 35},
            {"category": "Sales & Marketing", "amount": round(total_needed * 0.30), "pct": 30},
            {"category": "Team Expansion", "amount": round(total_needed * 0.20), "pct": 20},
            {"category": "Operations & Buffer", "amount": round(total_needed * 0.15), "pct": 15},
        ],
        "recommended_round": round_type,
        "valuation_range": f"${total_needed * 4 / 1_000_000:.1f}M - ${total_needed * 8 / 1_000_000:.1f}M (pre-money)",
    }


def build_scenarios(
    base_revenue: float,
    assumptions: dict,
) -> list[dict]:
    """Build base, optimistic, and pessimistic scenarios."""
    base_growth = assumptions["base_growth_rate"]

    scenarios = []
    for label, growth_mult, margin_adj in [
        ("Pessimistic", 0.6, -5),
        ("Base", 1.0, 0),
        ("Optimistic", 1.5, 5),
    ]:
        growth = base_growth * growth_mult
        y3_rev = base_revenue * (1 + growth / 100) ** 2
        y5_rev = base_revenue * (1 + growth / 100) ** 4
        y3_margin = max(0, 15 + margin_adj)
        y5_margin = max(0, 22 + margin_adj)

        scenarios.append({
            "label": label,
            "year3_revenue": round(y3_rev),
            "year3_ebitda": round(y3_rev * y3_margin / 100),
            "year5_revenue": round(y5_rev),
            "year5_ebitda": round(y5_rev * y5_margin / 100),
        })

    return scenarios
