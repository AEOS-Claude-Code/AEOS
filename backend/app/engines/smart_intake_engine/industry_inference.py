"""
AEOS – Smart Intake Engine: Industry Inference.

Deterministic rule-based industry classification from website content.
Uses keyword matching across title, description, headings, and tech stack
with confidence scoring.
"""

from __future__ import annotations

from typing import Optional


# ── Industry keyword rules ───────────────────────────────────────

INDUSTRY_RULES: dict[str, dict] = {
    "ecommerce": {
        "keywords": [
            "shop", "store", "buy", "cart", "checkout", "product", "products",
            "add to cart", "add to bag", "price", "shipping", "delivery",
            "order", "purchase", "sale", "discount", "wholesale", "retail",
            "marketplace", "catalog", "catalogue",
        ],
        "tech_signals": [
            "shopify", "woocommerce", "magento", "bigcommerce", "prestashop",
            "opencart", "snipcart", "stripe", "paypal",
        ],
        "weight": 1.0,
    },
    "healthcare": {
        "keywords": [
            "health", "medical", "clinic", "hospital", "doctor", "patient",
            "therapy", "treatment", "wellness", "dental", "pharmacy",
            "healthcare", "diagnosis", "appointment", "telehealth",
            "nursing", "physiotherapy", "chiropractic",
        ],
        "tech_signals": ["epic", "cerner", "healthgrades"],
        "weight": 1.0,
    },
    "travel": {
        "keywords": [
            "travel", "tour", "tourism", "hotel", "flight", "booking",
            "vacation", "destination", "resort", "accommodation", "cruise",
            "airline", "trip", "adventure", "itinerary", "hostel",
        ],
        "tech_signals": ["tripadvisor", "booking.com", "expedia", "airbnb"],
        "weight": 1.0,
    },
    "restaurant": {
        "keywords": [
            "restaurant", "menu", "food", "dining", "cuisine", "chef",
            "reservation", "catering", "bistro", "cafe", "coffee",
            "bar", "grill", "pizza", "sushi", "delivery", "takeout",
            "brunch", "lunch", "dinner",
        ],
        "tech_signals": [
            "opentable", "doordash", "ubereats", "grubhub", "yelp",
            "square", "toast",
        ],
        "weight": 1.0,
    },
    "education": {
        "keywords": [
            "education", "school", "university", "college", "course",
            "training", "learning", "student", "teacher", "academic",
            "curriculum", "degree", "certificate", "tutor", "online course",
            "e-learning", "elearning", "classroom",
        ],
        "tech_signals": ["moodle", "canvas", "blackboard", "coursera"],
        "weight": 1.0,
    },
    "real_estate": {
        "keywords": [
            "real estate", "property", "properties", "rent", "lease",
            "apartment", "house", "condo", "mortgage", "listing",
            "broker", "realtor", "realty", "square feet", "sq ft",
            "bedroom", "bathroom", "land", "commercial property",
        ],
        "tech_signals": ["zillow", "realtor.com", "mls", "idx"],
        "weight": 1.0,
    },
    "saas": {
        "keywords": [
            "software", "platform", "dashboard", "api", "integration",
            "analytics", "automation", "workflow", "saas", "cloud",
            "enterprise", "solution", "demo", "free trial", "pricing plan",
            "sign up", "get started", "features",
        ],
        "tech_signals": [
            "intercom", "segment", "mixpanel", "amplitude", "hubspot",
            "stripe", "aws", "heroku",
        ],
        "weight": 0.9,
    },
    "agency": {
        "keywords": [
            "agency", "marketing", "branding", "creative", "design",
            "advertising", "campaign", "social media", "seo", "ppc",
            "content", "strategy", "portfolio", "case study", "clients",
            "our work", "services", "digital agency",
        ],
        "tech_signals": ["behance", "dribbble"],
        "weight": 1.0,
    },
    "retail": {
        "keywords": [
            "retail", "store", "boutique", "collection", "fashion",
            "clothing", "accessories", "jewelry", "shoes", "brand",
            "new arrivals", "season", "wear",
        ],
        "tech_signals": ["shopify", "square"],
        "weight": 0.9,
    },
    "professional_services": {
        "keywords": [
            "consulting", "legal", "law", "attorney", "accountant",
            "accounting", "advisory", "firm", "practice", "expertise",
            "professional", "service", "financial", "tax", "audit",
            "compliance", "partner", "associates",
        ],
        "tech_signals": [],
        "weight": 0.8,
    },
}


def infer_industry(
    title: str = "",
    description: str = "",
    headings: list[str] | None = None,
    tech_stack: list[str] | None = None,
    url: str = "",
) -> dict:
    """
    Infer industry from website content.

    Returns:
        {
            "detected_industry": str,
            "industry_confidence": float (0.0-1.0),
            "industry_scores": dict[str, float],
            "signals_found": list[str],
        }
    """
    headings = headings or []
    tech_stack = tech_stack or []

    # Build the text corpus to search
    corpus = " ".join([
        title.lower(),
        description.lower(),
        " ".join(h.lower() for h in headings),
        url.lower(),
    ])

    tech_corpus = " ".join(t.lower() for t in tech_stack)

    scores: dict[str, float] = {}
    signals: dict[str, list[str]] = {}

    for industry, rules in INDUSTRY_RULES.items():
        score = 0.0
        found: list[str] = []

        # Keyword matching (each hit = +1 point)
        for kw in rules["keywords"]:
            if kw in corpus:
                score += 1.0
                found.append(f"keyword:{kw}")

        # Tech signal matching (each hit = +2 points, stronger signal)
        for tech in rules["tech_signals"]:
            if tech in corpus or tech in tech_corpus:
                score += 2.0
                found.append(f"tech:{tech}")

        # Apply weight
        score *= rules["weight"]

        if score > 0:
            scores[industry] = score
            signals[industry] = found

    if not scores:
        return {
            "detected_industry": "other",
            "industry_confidence": 0.0,
            "industry_scores": {},
            "signals_found": [],
        }

    # Find top industry
    top_industry = max(scores, key=scores.get)  # type: ignore
    top_score = scores[top_industry]

    # Compute confidence (0-1): based on score magnitude and margin
    total_score = sum(scores.values())
    if total_score > 0:
        dominance = top_score / total_score  # How dominant is the top pick?
    else:
        dominance = 0.0

    # Confidence formula: combines absolute score + relative dominance
    # Score > 5 with dominance > 0.5 → high confidence
    magnitude_conf = min(1.0, top_score / 8.0)
    confidence = round(magnitude_conf * 0.5 + dominance * 0.5, 2)

    return {
        "detected_industry": top_industry,
        "industry_confidence": confidence,
        "industry_scores": {k: round(v, 1) for k, v in sorted(scores.items(), key=lambda x: -x[1])[:5]},
        "signals_found": signals.get(top_industry, [])[:10],
    }
