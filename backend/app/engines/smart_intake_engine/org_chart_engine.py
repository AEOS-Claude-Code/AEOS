"""
AEOS – Smart Intake Engine: Organizational Chart Recommendation.

Generates a recommended org structure based on the company's industry,
showing which departments need human staff vs AI agents.
Per the AEOS Vision: every missing department gets AI agents deployed.
"""

from __future__ import annotations


# ── Department definitions ───────────────────────────────────────

DEPARTMENTS = [
    {
        "id": "strategy",
        "name": "Strategy & Business Intelligence",
        "icon": "brain",
        "ai_head": "Strategy Director AI",
        "ai_agents": 1,
        "ai_roles": ["Strategic Advisory Agent"],
        "description": "Business plan execution, KPI tracking, market intelligence",
        "priority": 1,  # Always needed
    },
    {
        "id": "sales",
        "name": "Sales Department",
        "icon": "target",
        "ai_head": "Sales Director AI",
        "ai_agents": 3,
        "ai_roles": ["Lead Generation Agent", "Pipeline Manager Agent", "Proposal Writer Agent"],
        "description": "Lead generation, pipeline management, proposals, CRM",
        "priority": 1,
    },
    {
        "id": "marketing",
        "name": "Marketing Department",
        "icon": "megaphone",
        "ai_head": "Marketing Director AI",
        "ai_agents": 3,
        "ai_roles": ["Content Creator Agent", "SEO/SEM Agent", "Social Media Agent"],
        "description": "Brand strategy, content, social media, SEO, campaigns",
        "priority": 1,
    },
    {
        "id": "hr",
        "name": "HR Department",
        "icon": "users",
        "ai_head": "HR Director AI",
        "ai_agents": 3,
        "ai_roles": ["Recruitment Agent", "Onboarding Agent", "Performance Agent"],
        "description": "Hiring, onboarding, performance management, compliance",
        "priority": 2,
    },
    {
        "id": "finance",
        "name": "Finance & Accounting",
        "icon": "wallet",
        "ai_head": "Finance Director AI",
        "ai_agents": 3,
        "ai_roles": ["Bookkeeping Agent", "Financial Reporting Agent", "Budget Agent"],
        "description": "Invoicing, financial reporting, budgets, cash flow",
        "priority": 2,
    },
    {
        "id": "legal",
        "name": "Legal & Contracts",
        "icon": "shield",
        "ai_head": "Legal Director AI",
        "ai_agents": 2,
        "ai_roles": ["Contract Review Agent", "Compliance Agent"],
        "description": "Contract drafting/review, compliance, regulatory monitoring",
        "priority": 2,
    },
    {
        "id": "operations",
        "name": "Operations",
        "icon": "settings",
        "ai_head": "Operations Director AI",
        "ai_agents": 2,
        "ai_roles": ["Process Optimization Agent", "Quality Control Agent"],
        "description": "Process optimization, project tracking, vendor management",
        "priority": 2,
    },
    {
        "id": "it",
        "name": "IT & Technology",
        "icon": "cpu",
        "ai_head": "IT Director AI",
        "ai_agents": 2,
        "ai_roles": ["System Management Agent", "Cybersecurity Agent"],
        "description": "System management, cybersecurity, software procurement",
        "priority": 3,
    },
    {
        "id": "procurement",
        "name": "Procurement",
        "icon": "package",
        "ai_head": "Procurement Director AI",
        "ai_agents": 2,
        "ai_roles": ["Vendor Sourcing Agent", "Purchase Order Agent"],
        "description": "Vendor sourcing, RFQ management, supplier relationships",
        "priority": 3,
    },
]

# ── Industry-specific department priority overrides ──────────────
# Which departments are most critical per industry

INDUSTRY_PRIORITIES: dict[str, list[str]] = {
    "ecommerce": ["marketing", "sales", "operations", "finance", "it"],
    "healthcare": ["operations", "legal", "hr", "finance", "it"],
    "travel": ["sales", "marketing", "operations", "finance", "hr"],
    "restaurant": ["operations", "marketing", "hr", "finance", "procurement"],
    "education": ["operations", "hr", "marketing", "it", "finance"],
    "real_estate": ["sales", "marketing", "legal", "finance", "operations"],
    "saas": ["it", "marketing", "sales", "hr", "finance"],
    "agency": ["marketing", "sales", "operations", "hr", "finance"],
    "design_creative": ["marketing", "sales", "operations", "hr", "finance"],
    "engineering": ["operations", "procurement", "sales", "hr", "finance", "legal"],
    "construction": ["operations", "procurement", "legal", "hr", "finance"],
    "manufacturing": ["operations", "procurement", "sales", "finance", "hr"],
    "technology": ["it", "sales", "marketing", "hr", "finance"],
    "retail": ["sales", "marketing", "operations", "hr", "finance"],
    "finance": ["finance", "legal", "it", "sales", "hr"],
    "logistics": ["operations", "procurement", "sales", "finance", "it"],
    "media_entertainment": ["marketing", "sales", "operations", "hr", "finance"],
    "nonprofit": ["operations", "marketing", "hr", "finance", "legal"],
    "professional_services": ["sales", "legal", "finance", "hr", "operations"],
}


def generate_org_chart(industry: str = "other", team_size: int = 1) -> dict:
    """
    Generate a recommended org chart for the company.

    Returns:
        {
            "total_ai_agents": int,
            "total_departments": int,
            "departments": [
                {
                    "id": str,
                    "name": str,
                    "icon": str,
                    "status": "ai_managed" | "recommended",
                    "ai_head": str,
                    "ai_agents": int,
                    "ai_roles": [str],
                    "description": str,
                    "priority_rank": int,
                }
            ],
            "summary": str,
        }
    """
    # Get industry-specific priorities
    priority_order = INDUSTRY_PRIORITIES.get(industry, [])

    departments = []
    total_ai = 0

    for dept in DEPARTMENTS:
        # Determine priority rank (lower = more important)
        if dept["id"] in priority_order:
            rank = priority_order.index(dept["id"]) + 1
        elif dept["id"] == "strategy":
            rank = 0  # Strategy is always #1
        else:
            rank = 10

        ai_count = dept["ai_agents"] + 1  # +1 for the head agent

        departments.append({
            "id": dept["id"],
            "name": dept["name"],
            "icon": dept["icon"],
            "status": "ai_managed",
            "ai_head": dept["ai_head"],
            "ai_agents": ai_count,
            "ai_roles": dept["ai_roles"],
            "description": dept["description"],
            "priority_rank": rank,
        })
        total_ai += ai_count

    # Sort by priority rank
    departments.sort(key=lambda d: d["priority_rank"])

    # Generate summary
    industry_label = industry.replace("_", " ").title() if industry != "other" else "General"
    summary = (
        f"AEOS recommends deploying {total_ai} AI agents across {len(departments)} departments "
        f"for your {industry_label} company. Each department gets a Director AI and specialist agents "
        f"to handle day-to-day operations alongside your human team."
    )

    return {
        "total_ai_agents": total_ai,
        "total_departments": len(departments),
        "departments": departments,
        "summary": summary,
    }
