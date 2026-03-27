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

# TLD → country mapping (includes compound TLDs like .com.sa, .net.sa etc.)
TLD_COUNTRY: dict[str, str] = {
    # Middle East — compound TLDs first (longer = higher priority in sort)
    ".com.sa": "Saudi Arabia", ".net.sa": "Saudi Arabia", ".org.sa": "Saudi Arabia", ".sa": "Saudi Arabia",
    ".com.ae": "UAE", ".net.ae": "UAE", ".ae": "UAE",
    ".com.qa": "Qatar", ".qa": "Qatar",
    ".com.kw": "Kuwait", ".kw": "Kuwait",
    ".com.bh": "Bahrain", ".bh": "Bahrain",
    ".com.om": "Oman", ".om": "Oman",
    ".com.jo": "Jordan", ".jo": "Jordan",
    ".com.eg": "Egypt", ".eg": "Egypt",
    ".com.lb": "Lebanon", ".lb": "Lebanon",
    ".co.ma": "Morocco", ".ma": "Morocco",
    ".com.tn": "Tunisia", ".tn": "Tunisia",
    ".com.dz": "Algeria", ".dz": "Algeria",
    ".com.iq": "Iraq", ".iq": "Iraq",
    ".ps": "Palestine", ".ly": "Libya",
    ".sd": "Sudan", ".ye": "Yemen", ".sy": "Syria",
    # Western
    ".co.uk": "United Kingdom", ".uk": "United Kingdom",
    ".us": "United States", ".ca": "Canada",
    ".com.au": "Australia", ".au": "Australia",
    ".de": "Germany", ".fr": "France", ".it": "Italy", ".es": "Spain",
    ".nl": "Netherlands", ".co.in": "India", ".in": "India",
    ".pk": "Pakistan", ".com.pk": "Pakistan",
    ".com.tr": "Turkey", ".tr": "Turkey",
    ".ru": "Russia", ".com.br": "Brazil", ".br": "Brazil",
    ".com.mx": "Mexico", ".mx": "Mexico",
    ".jp": "Japan", ".co.jp": "Japan",
    ".co.kr": "South Korea", ".kr": "South Korea",
    ".cn": "China", ".com.cn": "China",
    ".sg": "Singapore", ".com.sg": "Singapore",
    ".my": "Malaysia", ".com.my": "Malaysia",
    ".ph": "Philippines", ".th": "Thailand",
    ".co.id": "Indonesia", ".id": "Indonesia",
    ".vn": "Vietnam",
    ".ng": "Nigeria", ".com.ng": "Nigeria",
    ".co.ke": "Kenya", ".ke": "Kenya",
    ".co.za": "South Africa", ".za": "South Africa",
    ".gh": "Ghana",
    ".ie": "Ireland", ".se": "Sweden", ".ch": "Switzerland",
}

# Phone prefix → country
PHONE_PREFIX_COUNTRY: dict[str, str] = {
    "+966": "Saudi Arabia", "+971": "UAE", "+974": "Qatar",
    "+965": "Kuwait", "+973": "Bahrain", "+968": "Oman", "+962": "Jordan",
    "+20": "Egypt", "+961": "Lebanon", "+212": "Morocco",
    "+1": "United States", "+44": "United Kingdom", "+49": "Germany",
    "+33": "France", "+91": "India", "+92": "Pakistan", "+90": "Turkey",
    "+86": "China", "+81": "Japan", "+82": "South Korea",
    "+55": "Brazil", "+52": "Mexico", "+7": "Russia",
    "+65": "Singapore", "+60": "Malaysia", "+63": "Philippines",
    "00966": "Saudi Arabia", "00971": "UAE", "00962": "Jordan",
    "00974": "Qatar", "00965": "Kuwait", "00973": "Bahrain",
}

# City keywords to detect from content
CITY_PATTERNS: dict[str, list[str]] = {
    "Saudi Arabia": [
        "riyadh", "jeddah", "jidda", "dammam", "mecca", "makkah",
        "medina", "madinah", "khobar", "dhahran", "tabuk", "abha",
        "taif", "hail", "jizan", "najran", "yanbu", "jubail",
    ],
    "UAE": [
        "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah",
        "fujairah", "umm al quwain", "al ain",
    ],
    "Jordan": [
        "amman", "aqaba", "irbid", "zarqa", "petra", "wadi musa", "wadi rum",
        "jerash", "madaba", "salt", "karak", "mafraq", "ajloun", "tafilah", "maan",
    ],
    "Qatar": ["doha", "al wakrah", "al khor", "lusail"],
    "Kuwait": ["kuwait city", "hawalli", "salmiya", "farwaniya"],
    "Bahrain": ["manama", "muharraq", "riffa"],
    "Oman": ["muscat", "salalah", "sohar", "nizwa"],
    "Egypt": ["cairo", "alexandria", "giza", "luxor", "aswan", "sharm el sheikh"],
    "Lebanon": ["beirut", "tripoli", "sidon", "byblos"],
    "United Kingdom": ["london", "manchester", "birmingham", "leeds", "glasgow", "edinburgh", "liverpool", "bristol", "sheffield", "cardiff"],
    "United States": [
        "new york", "los angeles", "chicago", "houston", "phoenix",
        "san francisco", "seattle", "miami", "boston", "dallas", "austin",
        "denver", "atlanta", "san diego", "portland",
    ],
    "India": ["mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata", "pune", "ahmedabad", "jaipur"],
    "Turkey": ["istanbul", "ankara", "izmir", "antalya", "bursa"],
    "Pakistan": ["karachi", "lahore", "islamabad", "rawalpindi", "faisalabad"],
    "Morocco": ["casablanca", "rabat", "marrakech", "fez", "tangier"],
    "Tunisia": ["tunis", "sfax", "sousse"],
    "Iraq": ["baghdad", "erbil", "basra", "sulaymaniyah", "mosul"],
    "Palestine": ["ramallah", "gaza", "nablus", "hebron", "bethlehem"],
    "Singapore": ["singapore"],
    "Malaysia": ["kuala lumpur", "george town", "johor bahru"],
    "Australia": ["sydney", "melbourne", "brisbane", "perth", "adelaide", "canberra"],
    "Canada": ["toronto", "vancouver", "montreal", "calgary", "ottawa"],
    "Japan": ["tokyo", "osaka", "yokohama", "kyoto", "nagoya"],
    "South Korea": ["seoul", "busan", "incheon"],
    "China": ["beijing", "shanghai", "guangzhou", "shenzhen", "hangzhou"],
    "Brazil": ["sao paulo", "rio de janeiro", "brasilia"],
    "Mexico": ["mexico city", "guadalajara", "monterrey", "cancun"],
    "South Africa": ["johannesburg", "cape town", "durban", "pretoria"],
    "Nigeria": ["lagos", "abuja", "kano"],
    "Kenya": ["nairobi", "mombasa"],
    "Germany": ["berlin", "munich", "hamburg", "frankfurt", "cologne"],
    "France": ["paris", "marseille", "lyon", "toulouse", "nice"],
    "Italy": ["rome", "milan", "naples", "turin", "florence"],
    "Spain": ["madrid", "barcelona", "valencia", "seville"],
    "Netherlands": ["amsterdam", "rotterdam", "the hague", "utrecht"],
    "Sweden": ["stockholm", "gothenburg", "malmo"],
    "Switzerland": ["zurich", "geneva", "basel", "bern"],
    "Ireland": ["dublin", "cork", "galway"],
    "Algeria": ["algiers", "oran", "constantine"],
    "Libya": ["tripoli", "benghazi", "misrata"],
    "Sudan": ["khartoum", "omdurman", "port sudan"],
}


# Country names to detect from URL or content
COUNTRY_KEYWORDS: dict[str, list[str]] = {
    "Jordan": ["jordan", "jordanian", "الأردن"],
    "Saudi Arabia": ["saudi", "ksa", "المملكة العربية السعودية", "السعودية"],
    "UAE": ["uae", "emirates", "emirati", "الإمارات", "united arab emirates"],
    "Qatar": ["qatar", "qatari", "قطر"],
    "Kuwait": ["kuwait", "kuwaiti", "الكويت"],
    "Bahrain": ["bahrain", "bahraini", "البحرين"],
    "Oman": ["oman", "omani", "عمان"],
    "Egypt": ["egypt", "egyptian", "مصر"],
    "Lebanon": ["lebanon", "lebanese", "لبنان"],
    "Morocco": ["morocco", "moroccan", "المغرب"],
    "Tunisia": ["tunisia", "tunisian", "تونس"],
    "Iraq": ["iraq", "iraqi", "العراق"],
    "Palestine": ["palestine", "palestinian", "فلسطين"],
    "United Kingdom": ["united kingdom", "british", "england", "scotland", "wales"],
    "United States": ["united states", "usa", "american"],
    "Germany": ["germany", "german", "deutschland"],
    "France": ["france", "french"],
    "Turkey": ["turkey", "turkish", "türkiye"],
    "India": ["india", "indian"],
    "Pakistan": ["pakistan", "pakistani"],
    "Singapore": ["singapore"],
    "Malaysia": ["malaysia", "malaysian"],
    "Australia": ["australia", "australian"],
    "Canada": ["canada", "canadian"],
    "Japan": ["japan", "japanese"],
    "South Korea": ["south korea", "korean"],
    "China": ["china", "chinese"],
    "Brazil": ["brazil", "brazilian", "brasil"],
    "Mexico": ["mexico", "mexican"],
    "South Africa": ["south africa"],
    "Nigeria": ["nigeria", "nigerian"],
    "Kenya": ["kenya", "kenyan"],
    "Italy": ["italy", "italian", "italia"],
    "Spain": ["spain", "spanish", "españa"],
    "Netherlands": ["netherlands", "dutch", "holland"],
    "Sweden": ["sweden", "swedish"],
    "Switzerland": ["switzerland", "swiss"],
    "Ireland": ["ireland", "irish"],
    "Algeria": ["algeria", "algerian", "الجزائر"],
    "Libya": ["libya", "libyan", "ليبيا"],
    "Sudan": ["sudan", "sudanese", "السودان"],
}


_CURRENCY_COUNTRY: dict[str, str] = {
    "sar": "Saudi Arabia", "﷼": "Saudi Arabia", "saudi riyal": "Saudi Arabia",
    "aed": "UAE", "dirham": "UAE",
    "qar": "Qatar", "qatari riyal": "Qatar",
    "kwd": "Kuwait", "kuwaiti dinar": "Kuwait",
    "bhd": "Bahrain", "bahraini dinar": "Bahrain",
    "omr": "Oman", "omani rial": "Oman",
    "jod": "Jordan", "jordanian dinar": "Jordan",
    "egp": "Egypt", "egyptian pound": "Egypt",
    "lbp": "Lebanon", "lebanese pound": "Lebanon",
    "gbp": "United Kingdom", "£": "United Kingdom",
    "eur": "Germany",  # fallback
    "inr": "India", "₹": "India",
    "pkr": "Pakistan",
    "try": "Turkey", "₺": "Turkey", "turkish lira": "Turkey",
    "brl": "Brazil", "r$": "Brazil",
    "mxn": "Mexico",
    "jpy": "Japan", "¥": "Japan",
    "krw": "South Korea", "₩": "South Korea",
    "cny": "China",
    "sgd": "Singapore",
    "myr": "Malaysia",
    "aud": "Australia", "a$": "Australia",
    "cad": "Canada", "c$": "Canada",
    "zar": "South Africa",
    "ngn": "Nigeria", "₦": "Nigeria",
    "kes": "Kenya",
    "mad": "Morocco",
}

# Locale / language hints in HTML
_LOCALE_COUNTRY: dict[str, str] = {
    "ar-sa": "Saudi Arabia", "ar-ae": "UAE", "ar-qa": "Qatar",
    "ar-kw": "Kuwait", "ar-bh": "Bahrain", "ar-om": "Oman",
    "ar-jo": "Jordan", "ar-eg": "Egypt", "ar-lb": "Lebanon",
    "ar-ma": "Morocco", "ar-tn": "Tunisia", "ar-iq": "Iraq",
    "ar-ps": "Palestine", "en-gb": "United Kingdom", "en-us": "United States",
    "en-au": "Australia", "en-ca": "Canada", "en-sg": "Singapore",
    "en-in": "India", "de-de": "Germany", "de-at": "Germany",
    "fr-fr": "France", "es-es": "Spain", "it-it": "Italy",
    "nl-nl": "Netherlands", "sv-se": "Sweden", "pt-br": "Brazil",
    "ja-jp": "Japan", "ko-kr": "South Korea", "zh-cn": "China",
    "tr-tr": "Turkey", "ms-my": "Malaysia",
}


def detect_location(
    url: str = "",
    corpus: str = "",
    phone_numbers: list[str] | None = None,
) -> dict[str, str]:
    """
    Detect country and city from URL TLD, phone numbers, URL keywords,
    country names in content, currency/locale hints, and city names.
    Returns {"country": "...", "city": "..."}.
    """
    country = ""
    city = ""
    phone_numbers = phone_numbers or []

    # 1. Check TLD — robust extraction with multiple strategies
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        host = parsed.netloc or parsed.path.split("/")[0] or url
        # Strip port if present
        host = host.split(":")[0].lower().strip().rstrip(".")

        # Strategy A: check TLD map (sorted longest-first so .com.sa matches before .sa)
        for tld in sorted(TLD_COUNTRY.keys(), key=len, reverse=True):
            if host.endswith(tld):
                country = TLD_COUNTRY[tld]
                break

        # Strategy B: if no match, extract last 1-2 domain parts and check
        if not country:
            parts = host.rsplit(".", 2)
            if len(parts) >= 2:
                last_part = "." + parts[-1]  # e.g. ".sa"
                last_two = "." + parts[-2] + "." + parts[-1] if len(parts) >= 3 else ""  # e.g. ".com.sa"
                if last_two and last_two in TLD_COUNTRY:
                    country = TLD_COUNTRY[last_two]
                elif last_part in TLD_COUNTRY:
                    country = TLD_COUNTRY[last_part]
    except Exception:
        pass

    # 2. Check phone prefixes (try all phones, handle various formats)
    if not country:
        for phone in phone_numbers:
            clean = re.sub(r"[^\d+]", "", phone.strip())
            variants = [clean]
            if clean.startswith("00"):
                variants.append("+" + clean[2:])
            if not clean.startswith("+") and not clean.startswith("00"):
                variants.append("+" + clean)

            for variant in variants:
                for prefix, c in sorted(PHONE_PREFIX_COUNTRY.items(), key=lambda x: -len(x[0])):
                    if variant.startswith(prefix):
                        country = c
                        break
                if country:
                    break
            if country:
                break

    # 3. Check country names in URL (e.g., "jordantours-travel.com")
    if not country:
        url_lower = url.lower()
        for c, keywords in COUNTRY_KEYWORDS.items():
            for kw in keywords:
                if kw in url_lower:
                    country = c
                    break
            if country:
                break

    # 4. Check HTML locale attributes (lang="ar-sa", hreflang, og:locale)
    if not country:
        lower_corpus = corpus.lower()
        locale_patterns = re.findall(r'(?:lang|hreflang|locale)[="\s:]+([a-z]{2}-[a-z]{2})', lower_corpus)
        for locale in locale_patterns:
            if locale in _LOCALE_COUNTRY:
                country = _LOCALE_COUNTRY[locale]
                break

    # 5. Check country names in content
    if not country:
        lower_corpus = corpus.lower()
        for c, keywords in COUNTRY_KEYWORDS.items():
            for kw in keywords:
                if kw in lower_corpus:
                    country = c
                    break
            if country:
                break

    # 6. Check currency signals in content
    if not country:
        lower_corpus = corpus.lower()
        for currency, c in _CURRENCY_COUNTRY.items():
            if currency in lower_corpus:
                country = c
                break

    # 7. Detect city from content
    lower_corpus = corpus.lower()
    if country and country in CITY_PATTERNS:
        for city_name in CITY_PATTERNS[country]:
            if city_name in lower_corpus:
                city = city_name.title()
                break

    # Also try all cities if no city found yet (can also infer country)
    if not city:
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
