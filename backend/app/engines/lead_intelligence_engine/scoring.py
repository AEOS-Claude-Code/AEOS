"""
AEOS – Lead Intelligence Engine: Scoring and classification.

Deterministic lead scoring based on observable signals.
No AI calls — pure rule-based logic.
"""

from __future__ import annotations


# ── Score weights ────────────────────────────────────────────────────

SOURCE_SCORES: dict[str, int] = {
    "organic_search": 25,
    "paid_search": 20,
    "referral": 22,
    "social": 15,
    "email": 18,
    "direct": 10,
    "whatsapp": 20,
}

CHANNEL_BONUSES: dict[str, int] = {
    "website_form": 15,
    "booking": 25,
    "phone": 20,
    "whatsapp": 18,
    "google_ads": 10,
    "instagram": 8,
    "manual": 5,
}

PAGE_BONUSES: dict[str, int] = {
    "/pricing": 20,
    "/demo": 20,
    "/contact": 15,
    "/book": 18,
    "/free-trial": 20,
    "/signup": 15,
    "/case-studies": 10,
    "/features": 8,
}

STATUS_BONUSES: dict[str, int] = {
    "new": 0,
    "contacted": 5,
    "qualified": 15,
    "proposal": 20,
    "won": 30,
    "lost": -10,
}


def compute_lead_score(
    source: str = "",
    channel: str = "",
    landing_page: str = "",
    status: str = "new",
    event_count: int = 0,
    has_email: bool = False,
    has_phone: bool = False,
    has_company: bool = False,
) -> int:
    """
    Compute a lead score 0-100 from observable signals.
    Higher score = more likely to convert.
    """
    score = 0

    # Source quality
    score += SOURCE_SCORES.get(source, 5)

    # Channel quality
    score += CHANNEL_BONUSES.get(channel, 0)

    # Landing page intent
    for path, bonus in PAGE_BONUSES.items():
        if path in landing_page.lower():
            score += bonus
            break

    # Status progression
    score += STATUS_BONUSES.get(status, 0)

    # Engagement (events)
    score += min(15, event_count * 3)

    # Contact completeness
    if has_email:
        score += 5
    if has_phone:
        score += 5
    if has_company:
        score += 5

    return max(0, min(100, score))


def classify_lead(score: int) -> str:
    """Classify lead as cold/warm/hot based on score."""
    if score >= 70:
        return "hot"
    elif score >= 40:
        return "warm"
    return "cold"
