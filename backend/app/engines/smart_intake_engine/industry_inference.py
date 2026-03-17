"""
AEOS – Smart Intake Engine: Industry Inference.

Deterministic rule-based industry classification from website content.
Uses keyword matching across title, description, headings, and tech stack
with confidence scoring. Also detects country/city from website signals.
"""

from __future__ import annotations

import re
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
            "nursing", "physiotherapy", "chiropractic", "mental health",
        ],
        "tech_signals": ["epic", "cerner", "healthgrades"],
        "weight": 1.0,
    },
    "travel": {
        "keywords": [
            "travel", "tour", "tourism", "hotel", "flight", "booking",
            "vacation", "destination", "resort", "accommodation", "cruise",
            "airline", "trip", "adventure", "itinerary", "hostel",
            "safari", "excursion", "guided tour", "sightseeing",
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
            "e-learning", "elearning", "classroom", "academy",
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
            "agency", "marketing agency", "digital agency", "advertising",
            "campaign", "social media marketing", "seo agency", "ppc",
            "media buying", "influencer", "public relations", "pr agency",
        ],
        "tech_signals": [],
        "weight": 1.0,
    },
    "design_creative": {
        "keywords": [
            "design", "graphic design", "branding", "logo", "creative",
            "visual identity", "ui design", "ux design", "web design",
            "interior design", "industrial design", "motion graphics",
            "animation", "illustration", "typography", "art direction",
            "creative studio", "design studio", "portfolio", "our work",
            "case study", "brand identity",
        ],
        "tech_signals": ["behance", "dribbble", "figma", "adobe", "sketch"],
        "weight": 1.0,
    },
    "engineering": {
        "keywords": [
            "engineering", "engineer", "mechanical", "electrical", "civil",
            "structural", "industrial", "chemical", "environmental",
            "construction", "building", "infrastructure", "project management",
            "epc", "contracting", "contractor", "mep", "hvac", "plumbing",
            "fabrication", "manufacturing", "quality control", "inspection",
            "technical", "solutions provider", "engineering solutions",
            "turnkey", "commissioning", "procurement",
        ],
        "tech_signals": ["autocad", "revit", "solidworks", "catia"],
        "weight": 1.0,
    },
    "construction": {
        "keywords": [
            "construction", "builder", "building", "renovation", "remodeling",
            "general contractor", "roofing", "flooring", "painting",
            "concrete", "steel", "masonry", "excavation", "demolition",
            "residential construction", "commercial construction",
            "project delivery", "site work", "foundation",
        ],
        "tech_signals": ["procore", "buildertrend", "plangrid"],
        "weight": 1.0,
    },
    "manufacturing": {
        "keywords": [
            "manufacturing", "factory", "production", "assembly", "oem",
            "supply chain", "warehouse", "logistics", "distribution",
            "raw materials", "quality assurance", "lean manufacturing",
            "cnc", "machining", "molding", "packaging", "iso",
        ],
        "tech_signals": ["sap", "oracle", "netsuite"],
        "weight": 1.0,
    },
    "technology": {
        "keywords": [
            "technology", "tech", "it services", "it solutions", "cybersecurity",
            "network", "data center", "cloud computing", "managed services",
            "it support", "it consulting", "digital transformation",
            "artificial intelligence", "machine learning", "iot",
            "blockchain", "fintech", "devops", "infrastructure",
        ],
        "tech_signals": ["aws", "azure", "google cloud", "docker", "kubernetes"],
        "weight": 0.9,
    },
    "retail": {
        "keywords": [
            "retail", "boutique", "collection", "fashion",
            "clothing", "accessories", "jewelry", "shoes", "brand",
            "new arrivals", "season", "wear", "luxury", "lifestyle",
        ],
        "tech_signals": ["shopify", "square"],
        "weight": 0.9,
    },
    "finance": {
        "keywords": [
            "finance", "financial", "banking", "insurance", "investment",
            "wealth management", "fintech", "loan", "mortgage", "credit",
            "trading", "brokerage", "asset management", "fund",
            "payment", "money transfer", "remittance",
        ],
        "tech_signals": ["plaid", "stripe", "square"],
        "weight": 1.0,
    },
    "logistics": {
        "keywords": [
            "logistics", "shipping", "freight", "cargo", "supply chain",
            "warehouse", "distribution", "courier", "last mile",
            "fleet management", "transport", "transportation", "trucking",
            "import", "export", "customs", "clearance", "forwarding",
        ],
        "tech_signals": [],
        "weight": 1.0,
    },
    "media_entertainment": {
        "keywords": [
            "media", "entertainment", "film", "video", "production",
            "music", "podcast", "broadcasting", "streaming", "news",
            "magazine", "publishing", "content creation", "photography",
            "events", "event management", "concert", "festival",
        ],
        "tech_signals": ["vimeo", "youtube", "spotify", "soundcloud"],
        "weight": 1.0,
    },
    "nonprofit": {
        "keywords": [
            "nonprofit", "non-profit", "ngo", "charity", "foundation",
            "donate", "donation", "volunteer", "cause", "mission",
            "community", "social impact", "humanitarian", "relief",
        ],
        "tech_signals": [],
        "weight": 1.0,
    },
    "professional_services": {
        "keywords": [
            "consulting", "legal", "law", "attorney", "accountant",
            "accounting", "advisory", "firm", "practice", "expertise",
            "professional", "financial", "tax", "audit",
            "compliance", "partner", "associates",
        ],
        "tech_signals": [],
        "weight": 0.8,
    },
}


# ── Country/City detection from website signals ──────────────────

# TLD → country mapping
TLD_COUNTRY: dict[str, str] = {
    ".sa": "Saudi Arabia", ".ae": "United Arab Emirates", ".qa": "Qatar",
    ".kw": "Kuwait", ".bh": "Bahrain", ".om": "Oman", ".jo": "Jordan",
    ".eg": "Egypt", ".lb": "Lebanon", ".ma": "Morocco", ".tn": "Tunisia",
    ".dz": "Algeria", ".iq": "Iraq", ".ps": "Palestine", ".ly": "Libya",
    ".sd": "Sudan", ".ye": "Yemen", ".sy": "Syria",
    ".uk": "United Kingdom", ".co.uk": "United Kingdom",
    ".us": "United States", ".ca": "Canada", ".au": "Australia",
    ".de": "Germany", ".fr": "France", ".it": "Italy", ".es": "Spain",
    ".nl": "Netherlands", ".in": "India", ".pk": "Pakistan",
    ".tr": "Turkey", ".ru": "Russia", ".br": "Brazil", ".mx": "Mexico",
    ".jp": "Japan", ".kr": "South Korea", ".cn": "China",
    ".sg": "Singapore", ".my": "Malaysia", ".ph": "Philippines",
    ".th": "Thailand", ".id": "Indonesia", ".vn": "Vietnam",
    ".ng": "Nigeria", ".ke": "Kenya", ".za": "South Africa",
    ".gh": "Ghana",
}

# Phone prefix → country
PHONE_PREFIX_COUNTRY: dict[str, str] = {
    "+966": "Saudi Arabia", "+971": "United Arab Emirates", "+974": "Qatar",
    "+965": "Kuwait", "+973": "Bahrain", "+968": "Oman", "+962": "Jordan",
    "+20": "Egypt", "+961": "Lebanon", "+212": "Morocco",
    "+1": "United States", "+44": "United Kingdom", "+49": "Germany",
    "+33": "France", "+91": "India", "+92": "Pakistan", "+90": "Turkey",
    "+86": "China", "+81": "Japan", "+82": "South Korea",
    "+55": "Brazil", "+52": "Mexico", "+7": "Russia",
    "+65": "Singapore", "+60": "Malaysia", "+63": "Philippines",
    "00966": "Saudi Arabia", "00971": "United Arab Emirates", "00962": "Jordan",
    "00974": "Qatar", "00965": "Kuwait", "00973": "Bahrain",
}

# City keywords to detect from content
CITY_PATTERNS: dict[str, list[str]] = {
    "Saudi Arabia": [
        "riyadh", "jeddah", "jidda", "dammam", "mecca", "makkah",
        "medina", "madinah", "khobar", "dhahran", "tabuk", "abha",
        "taif", "hail", "jizan", "najran", "yanbu", "jubail",
    ],
    "United Arab Emirates": [
        "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah",
        "fujairah", "umm al quwain",
    ],
    "Jordan": [
        "amman", "aqaba", "irbid", "zarqa", "petra", "jerash", "madaba",
        "salt", "karak", "mafraq",
    ],
    "Qatar": ["doha", "al wakrah", "al khor", "lusail"],
    "Kuwait": ["kuwait city", "hawalli", "salmiya", "farwaniya"],
    "Bahrain": ["manama", "muharraq", "riffa"],
    "Oman": ["muscat", "salalah", "sohar", "nizwa"],
    "Egypt": ["cairo", "alexandria", "giza", "luxor", "aswan", "sharm el sheikh"],
    "Lebanon": ["beirut", "tripoli", "sidon", "byblos"],
    "United Kingdom": ["london", "manchester", "birmingham", "leeds", "glasgow", "edinburgh"],
    "United States": [
        "new york", "los angeles", "chicago", "houston", "phoenix",
        "san francisco", "seattle", "miami", "boston", "dallas", "austin",
    ],
}


def detect_location(
    url: str = "",
    corpus: str = "",
    phone_numbers: list[str] | None = None,
) -> dict[str, str]:
    """
    Detect country and city from URL TLD, phone numbers, and content.
    Returns {"country": "...", "city": "..."}.
    """
    country = ""
    city = ""
    phone_numbers = phone_numbers or []

    # 1. Check TLD
    from urllib.parse import urlparse
    try:
        host = urlparse(url).netloc or url
        # Check longest TLD first (e.g., .co.uk before .uk)
        for tld in sorted(TLD_COUNTRY.keys(), key=len, reverse=True):
            if host.endswith(tld):
                country = TLD_COUNTRY[tld]
                break
    except Exception:
        pass

    # 2. Check phone prefixes
    if not country:
        for phone in phone_numbers:
            clean = phone.strip().replace(" ", "").replace("-", "")
            for prefix, c in sorted(PHONE_PREFIX_COUNTRY.items(), key=lambda x: -len(x[0])):
                if clean.startswith(prefix):
                    country = c
                    break
            if country:
                break

    # 3. Detect city from content
    lower_corpus = corpus.lower()
    if country and country in CITY_PATTERNS:
        for city_name in CITY_PATTERNS[country]:
            if city_name in lower_corpus:
                city = city_name.title()
                break
    else:
        # Search all cities if country not yet detected
        for c, cities in CITY_PATTERNS.items():
            for city_name in cities:
                if city_name in lower_corpus:
                    if not country:
                        country = c
                    city = city_name.title()
                    break
            if city:
                break

    return {"country": country, "city": city}


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
        dominance = top_score / total_score
    else:
        dominance = 0.0

    # Confidence formula: combines absolute score + relative dominance
    magnitude_conf = min(1.0, top_score / 8.0)
    confidence = round(magnitude_conf * 0.5 + dominance * 0.5, 2)

    return {
        "detected_industry": top_industry,
        "industry_confidence": confidence,
        "industry_scores": {k: round(v, 1) for k, v in sorted(scores.items(), key=lambda x: -x[1])[:5]},
        "signals_found": signals.get(top_industry, [])[:10],
    }
