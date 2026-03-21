"""
AEOS – Smart Intake Engine: Service layer.

Orchestrates website profile collection, contact extraction,
social detection, tech stack detection, and industry inference.
"""

from __future__ import annotations

import json
import logging
import re
from urllib.parse import urlparse, urljoin, quote_plus

import httpx

from .website_profile_collector import collect_website_profile
from .contact_extractor import extract_contacts
from .social_extractor import extract_social_links
from .industry_inference import infer_industry, detect_location

logger = logging.getLogger("aeos.engine.intake")


# ── Industry competitor lookup ────────────────────────────────────────

# Country-specific competitors: { "country_key": { "industry": [...] } }
# country_key uses lowercase with underscores
COUNTRY_COMPETITORS: dict[str, dict[str, list[dict]]] = {
    "saudi arabia": {
        "design_creative": [
            {"name": "Tasmimak", "url": "https://tasmimak.com", "type": "Design platform (KSA)"},
            {"name": "Lucidya", "url": "https://lucidya.com", "type": "Digital marketing (KSA)"},
            {"name": "Crowd", "url": "https://crowd.sa", "type": "Creative agency (KSA)"},
        ],
        "ecommerce": [
            {"name": "Noon", "url": "https://noon.com/saudi-en", "type": "Marketplace (KSA)"},
            {"name": "Jarir", "url": "https://jarir.com", "type": "Retail & e-commerce (KSA)"},
            {"name": "Extra", "url": "https://extra.com", "type": "Electronics retail (KSA)"},
            {"name": "Namshi", "url": "https://namshi.com", "type": "Fashion e-commerce (KSA)"},
        ],
        "healthcare": [
            {"name": "Seha", "url": "https://seha.sa", "type": "Healthcare platform (KSA)"},
            {"name": "Nahdi Medical", "url": "https://nahdionline.com", "type": "Pharmacy chain (KSA)"},
            {"name": "Vezeeta", "url": "https://vezeeta.com/ar-sa", "type": "Doctor booking (KSA)"},
        ],
        "travel": [
            {"name": "Almosafer", "url": "https://almosafer.com", "type": "Travel booking (KSA)"},
            {"name": "Flyin", "url": "https://flyin.com", "type": "Travel platform (KSA)"},
            {"name": "Tajawal", "url": "https://tajawal.com", "type": "Travel booking (KSA)"},
        ],
        "restaurant": [
            {"name": "HungerStation", "url": "https://hungerstation.com", "type": "Food delivery (KSA)"},
            {"name": "Jahez", "url": "https://jahez.net", "type": "Food delivery (KSA)"},
            {"name": "Talabat", "url": "https://talabat.com", "type": "Food delivery (KSA)"},
            {"name": "The Chefz", "url": "https://thechefz.com", "type": "Premium delivery (KSA)"},
        ],
        "real_estate": [
            {"name": "Bayut", "url": "https://bayut.sa", "type": "Property portal (KSA)"},
            {"name": "Aqar", "url": "https://sa.aqar.fm", "type": "Property portal (KSA)"},
            {"name": "Sakani", "url": "https://sakani.sa", "type": "Housing program (KSA)"},
        ],
        "engineering": [
            {"name": "Dar Al-Handasah", "url": "https://dar.com", "type": "Engineering firm (KSA)"},
            {"name": "Saudi Diyar", "url": "https://saudidiyar.com", "type": "Engineering consultancy (KSA)"},
            {"name": "Nesma", "url": "https://nesma.com", "type": "Engineering & contracting (KSA)"},
        ],
        "construction": [
            {"name": "Saudi Binladin Group", "url": "https://sbg.com.sa", "type": "Construction (KSA)"},
            {"name": "Al Bawani", "url": "https://albawani.com", "type": "Construction (KSA)"},
            {"name": "Nesma & Partners", "url": "https://nesma.com", "type": "Contracting (KSA)"},
        ],
        "technology": [
            {"name": "STC Solutions", "url": "https://solutions.com.sa", "type": "IT solutions (KSA)"},
            {"name": "Elm", "url": "https://elm.sa", "type": "Digital platform (KSA)"},
            {"name": "Mozn", "url": "https://mozn.sa", "type": "AI company (KSA)"},
        ],
        "finance": [
            {"name": "STC Pay (stcpay)", "url": "https://stcpay.com.sa", "type": "Digital wallet (KSA)"},
            {"name": "Tamara", "url": "https://tamara.co", "type": "Buy now pay later (KSA)"},
            {"name": "Tabby", "url": "https://tabby.ai", "type": "Payment platform (KSA)"},
        ],
        "retail": [
            {"name": "Jarir Bookstore", "url": "https://jarir.com", "type": "Retail chain (KSA)"},
            {"name": "Panda", "url": "https://pfrsa.com", "type": "Supermarket chain (KSA)"},
            {"name": "Noon", "url": "https://noon.com/saudi-en", "type": "Online marketplace (KSA)"},
        ],
        "logistics": [
            {"name": "SMSA Express", "url": "https://smsaexpress.com", "type": "Courier (KSA)"},
            {"name": "Naqel Express", "url": "https://naqelexpress.com", "type": "Logistics (KSA)"},
            {"name": "SAL Saudi Logistics", "url": "https://sal.sa", "type": "Logistics (KSA)"},
        ],
        "education": [
            {"name": "Noon Academy", "url": "https://noonacademy.com", "type": "EdTech (KSA)"},
            {"name": "Classera", "url": "https://classera.com", "type": "Education platform (KSA)"},
            {"name": "Rwaq", "url": "https://rwaq.org", "type": "Online learning (KSA)"},
        ],
        "saas": [
            {"name": "Foodics", "url": "https://foodics.com", "type": "Restaurant SaaS (KSA)"},
            {"name": "Salla", "url": "https://salla.com", "type": "E-commerce SaaS (KSA)"},
            {"name": "Moyasar", "url": "https://moyasar.com", "type": "Payment SaaS (KSA)"},
        ],
        "agency": [
            {"name": "UTURN", "url": "https://uturn.me", "type": "Digital media (KSA)"},
            {"name": "Netizency", "url": "https://netizency.com", "type": "Social media agency (KSA)"},
        ],
        "manufacturing": [
            {"name": "SABIC", "url": "https://sabic.com", "type": "Manufacturing (KSA)"},
            {"name": "Ma'aden", "url": "https://maaden.com.sa", "type": "Mining & manufacturing (KSA)"},
        ],
    },
    "uae": {
        "design_creative": [
            {"name": "Crowd", "url": "https://crowd.ae", "type": "Creative agency (UAE)"},
            {"name": "Traffic Digital", "url": "https://trafficdigital.ae", "type": "Digital agency (UAE)"},
        ],
        "ecommerce": [
            {"name": "Noon", "url": "https://noon.com", "type": "Marketplace (UAE)"},
            {"name": "Namshi", "url": "https://namshi.com", "type": "Fashion (UAE)"},
            {"name": "Mumzworld", "url": "https://mumzworld.com", "type": "Family e-commerce (UAE)"},
        ],
        "real_estate": [
            {"name": "Bayut", "url": "https://bayut.com", "type": "Property portal (UAE)"},
            {"name": "Property Finder", "url": "https://propertyfinder.ae", "type": "Property portal (UAE)"},
            {"name": "Dubizzle", "url": "https://dubizzle.com", "type": "Classifieds (UAE)"},
        ],
        "restaurant": [
            {"name": "Talabat", "url": "https://talabat.com", "type": "Food delivery (UAE)"},
            {"name": "Deliveroo", "url": "https://deliveroo.ae", "type": "Food delivery (UAE)"},
            {"name": "Careem Food", "url": "https://careem.com", "type": "Food delivery (UAE)"},
        ],
        "travel": [
            {"name": "Musafir", "url": "https://musafir.com", "type": "Travel (UAE)"},
            {"name": "Dnata Travel", "url": "https://dnatatravel.com", "type": "Travel agency (UAE)"},
        ],
        "technology": [
            {"name": "Careem", "url": "https://careem.com", "type": "Super app (UAE)"},
            {"name": "G42", "url": "https://g42.ai", "type": "AI & cloud (UAE)"},
        ],
        "finance": [
            {"name": "Tabby", "url": "https://tabby.ai", "type": "BNPL (UAE)"},
            {"name": "Sarwa", "url": "https://sarwa.co", "type": "Investment platform (UAE)"},
        ],
        "logistics": [
            {"name": "Aramex", "url": "https://aramex.com", "type": "Logistics (UAE)"},
            {"name": "Fetchr", "url": "https://fetchr.us", "type": "Delivery (UAE)"},
        ],
    },
    "jordan": {
        "technology": [
            {"name": "Mawdoo3", "url": "https://mawdoo3.com", "type": "AI & content (Jordan)"},
            {"name": "Umniah", "url": "https://umniah.com", "type": "Telecom & tech (Jordan)"},
        ],
        "ecommerce": [
            {"name": "OpenSooq", "url": "https://opensooq.com", "type": "Classifieds (Jordan)"},
            {"name": "MarkaVIP", "url": "https://markavip.com", "type": "Flash sales (Jordan)"},
        ],
        "restaurant": [
            {"name": "Talabat", "url": "https://talabat.com", "type": "Food delivery (Jordan)"},
            {"name": "Careem Food", "url": "https://careem.com", "type": "Food delivery (Jordan)"},
        ],
        "education": [
            {"name": "Abwaab", "url": "https://abwaab.com", "type": "EdTech (Jordan)"},
            {"name": "Edraak", "url": "https://edraak.org", "type": "Online learning (Jordan)"},
        ],
    },
    "egypt": {
        "ecommerce": [
            {"name": "Jumia", "url": "https://jumia.com.eg", "type": "Marketplace (Egypt)"},
            {"name": "Amazon Egypt", "url": "https://amazon.eg", "type": "Marketplace (Egypt)"},
            {"name": "Noon Egypt", "url": "https://noon.com/egypt-en", "type": "Marketplace (Egypt)"},
        ],
        "restaurant": [
            {"name": "Talabat", "url": "https://talabat.com", "type": "Food delivery (Egypt)"},
            {"name": "Elmenus", "url": "https://elmenus.com", "type": "Food discovery (Egypt)"},
        ],
        "technology": [
            {"name": "Swvl", "url": "https://swvl.com", "type": "Transport tech (Egypt)"},
            {"name": "Instabug", "url": "https://instabug.com", "type": "Mobile SDK (Egypt)"},
        ],
        "finance": [
            {"name": "Fawry", "url": "https://fawry.com", "type": "Digital payments (Egypt)"},
            {"name": "valU", "url": "https://valu.com.eg", "type": "BNPL (Egypt)"},
        ],
    },
    "qatar": {
        "ecommerce": [
            {"name": "Snoonu", "url": "https://snoonu.com", "type": "Delivery platform (Qatar)"},
            {"name": "Talabat", "url": "https://talabat.com/qatar", "type": "Food delivery (Qatar)"},
        ],
        "real_estate": [
            {"name": "Property Finder Qatar", "url": "https://propertyfinder.qa", "type": "Property portal (Qatar)"},
        ],
    },
    "kuwait": {
        "restaurant": [
            {"name": "Talabat", "url": "https://talabat.com/kuwait", "type": "Food delivery (Kuwait)"},
            {"name": "Carriage", "url": "https://trycarriage.com", "type": "Delivery (Kuwait)"},
        ],
        "ecommerce": [
            {"name": "Boutiqaat", "url": "https://boutiqaat.com", "type": "Beauty e-commerce (Kuwait)"},
        ],
    },
}

# Global fallback competitors (used when no country-specific data available)
INDUSTRY_COMPETITORS: dict[str, list[dict]] = {
    "design_creative": [
        {"name": "99designs", "url": "https://99designs.com", "type": "Global platform"},
        {"name": "Fiverr", "url": "https://fiverr.com", "type": "Freelance marketplace"},
        {"name": "Dribbble", "url": "https://dribbble.com", "type": "Design community"},
    ],
    "ecommerce": [
        {"name": "Amazon", "url": "https://amazon.com", "type": "Global marketplace"},
        {"name": "Shopify Stores", "url": "https://shopify.com", "type": "E-commerce platform"},
        {"name": "Etsy", "url": "https://etsy.com", "type": "Handmade marketplace"},
    ],
    "healthcare": [
        {"name": "WebMD", "url": "https://webmd.com", "type": "Health information"},
        {"name": "Practo", "url": "https://practo.com", "type": "Healthcare platform"},
    ],
    "travel": [
        {"name": "Booking.com", "url": "https://booking.com", "type": "Travel booking"},
        {"name": "TripAdvisor", "url": "https://tripadvisor.com", "type": "Travel reviews"},
        {"name": "Airbnb", "url": "https://airbnb.com", "type": "Accommodation"},
    ],
    "restaurant": [
        {"name": "Talabat", "url": "https://talabat.com", "type": "Food delivery"},
        {"name": "Uber Eats", "url": "https://ubereats.com", "type": "Food delivery"},
        {"name": "Zomato", "url": "https://zomato.com", "type": "Restaurant discovery"},
    ],
    "real_estate": [
        {"name": "Bayut", "url": "https://bayut.com", "type": "Property portal"},
        {"name": "Property Finder", "url": "https://propertyfinder.ae", "type": "Property portal"},
        {"name": "Zillow", "url": "https://zillow.com", "type": "Real estate marketplace"},
    ],
    "saas": [
        {"name": "HubSpot", "url": "https://hubspot.com", "type": "Marketing SaaS"},
        {"name": "Salesforce", "url": "https://salesforce.com", "type": "CRM platform"},
        {"name": "Zoho", "url": "https://zoho.com", "type": "Business suite"},
    ],
    "education": [
        {"name": "Coursera", "url": "https://coursera.org", "type": "Online learning"},
        {"name": "Udemy", "url": "https://udemy.com", "type": "Course platform"},
    ],
    "technology": [
        {"name": "Google", "url": "https://google.com", "type": "Tech giant"},
        {"name": "Microsoft", "url": "https://microsoft.com", "type": "Software & cloud"},
    ],
    "agency": [
        {"name": "WPP", "url": "https://wpp.com", "type": "Agency network"},
        {"name": "Ogilvy", "url": "https://ogilvy.com", "type": "Creative agency"},
    ],
    "engineering": [
        {"name": "AECOM", "url": "https://aecom.com", "type": "Engineering firm"},
        {"name": "Jacobs", "url": "https://jacobs.com", "type": "Engineering & consulting"},
    ],
    "construction": [
        {"name": "Bechtel", "url": "https://bechtel.com", "type": "Construction firm"},
        {"name": "Skanska", "url": "https://skanska.com", "type": "Construction company"},
    ],
    "finance": [
        {"name": "PayPal", "url": "https://paypal.com", "type": "Payment platform"},
        {"name": "Stripe", "url": "https://stripe.com", "type": "Payment infrastructure"},
    ],
    "retail": [
        {"name": "Amazon", "url": "https://amazon.com", "type": "Online retail"},
        {"name": "Noon", "url": "https://noon.com", "type": "Regional marketplace"},
    ],
    "logistics": [
        {"name": "DHL", "url": "https://dhl.com", "type": "Logistics provider"},
        {"name": "Aramex", "url": "https://aramex.com", "type": "Shipping & logistics"},
    ],
    "manufacturing": [
        {"name": "Siemens", "url": "https://siemens.com", "type": "Industrial manufacturing"},
        {"name": "3M", "url": "https://3m.com", "type": "Manufacturing conglomerate"},
    ],
}


def _detect_business_hours(html: str) -> list[dict]:
    """Parse business hours from JSON-LD schema.org data and regex patterns."""
    hours: list[dict] = []

    # 1. Try JSON-LD openingHoursSpecification
    try:
        for match in re.finditer(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE):
            try:
                data = json.loads(match.group(1))
                specs = []
                if isinstance(data, dict):
                    specs = data.get("openingHoursSpecification", [])
                    if not specs and "@graph" in data:
                        for item in data["@graph"]:
                            specs.extend(item.get("openingHoursSpecification", []))
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            specs.extend(item.get("openingHoursSpecification", []))
                for spec in specs:
                    if not isinstance(spec, dict):
                        continue
                    days = spec.get("dayOfWeek", [])
                    if isinstance(days, str):
                        days = [days]
                    opens = spec.get("opens", "")
                    closes = spec.get("closes", "")
                    for day in days:
                        day_name = day.replace("https://schema.org/", "").replace("http://schema.org/", "")
                        hours.append({"day": day_name, "open": opens, "close": closes})
            except (json.JSONDecodeError, TypeError):
                continue
    except Exception:
        pass

    if hours:
        return hours

    # 2. Regex fallback for common patterns like "Mon-Fri: 9:00-17:00"
    DAY_MAP = {
        "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday", "thu": "Thursday",
        "fri": "Friday", "sat": "Saturday", "sun": "Sunday",
        "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
        "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday",
    }
    DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    # Pattern: "Mon-Fri: 9:00-17:00" or "Monday - Friday: 9AM - 5PM"
    range_pattern = re.compile(
        r'(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)'
        r'\s*[-–to]+\s*'
        r'(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)'
        r'\s*[:\s]\s*'
        r'(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)'
        r'\s*[-–to]+\s*'
        r'(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)',
        re.IGNORECASE,
    )

    def _normalize_time(t: str) -> str:
        t = t.strip().lower()
        m = re.match(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', t)
        if not m:
            return t
        hour = int(m.group(1))
        minute = m.group(2) or "00"
        ampm = m.group(3)
        if ampm == "pm" and hour < 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute}"

    for match in range_pattern.finditer(html):
        start_day = DAY_MAP.get(match.group(1).lower(), "")
        end_day = DAY_MAP.get(match.group(2).lower(), "")
        open_time = _normalize_time(match.group(3))
        close_time = _normalize_time(match.group(4))
        if start_day and end_day:
            try:
                si = DAY_ORDER.index(start_day)
                ei = DAY_ORDER.index(end_day)
                for i in range(si, ei + 1):
                    hours.append({"day": DAY_ORDER[i], "open": open_time, "close": close_time})
            except ValueError:
                pass

    # Single day pattern: "Saturday: 10AM-6PM"
    single_pattern = re.compile(
        r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday)'
        r'\s*[:\s]\s*'
        r'(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)'
        r'\s*[-–to]+\s*'
        r'(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)',
        re.IGNORECASE,
    )
    seen_days = {h["day"] for h in hours}
    for match in single_pattern.finditer(html):
        day = DAY_MAP.get(match.group(1).lower(), "")
        if day and day not in seen_days:
            hours.append({"day": day, "open": _normalize_time(match.group(2)), "close": _normalize_time(match.group(3))})
            seen_days.add(day)

    # Closed pattern: "Sunday: Closed"
    closed_pattern = re.compile(
        r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*[:\s]\s*closed',
        re.IGNORECASE,
    )
    for match in closed_pattern.finditer(html):
        day = DAY_MAP.get(match.group(1).lower(), "")
        if day and day not in seen_days:
            hours.append({"day": day, "open": "closed", "close": "closed"})

    return hours


SERVICE_COMPETITORS: dict[str, list[dict]] = {
    "bim": [
        {"name": "Autodesk", "url": "https://autodesk.com", "type": "BIM software"},
        {"name": "Graphisoft", "url": "https://graphisoft.com", "type": "BIM software"},
        {"name": "Trimble", "url": "https://trimble.com", "type": "BIM solutions"},
    ],
    "digital twin": [
        {"name": "Bentley Systems", "url": "https://bentley.com", "type": "Digital twin platform"},
        {"name": "Siemens Xcelerator", "url": "https://siemens.com", "type": "Digital twin"},
    ],
    "vdc": [
        {"name": "Procore", "url": "https://procore.com", "type": "Construction management"},
    ],
    "web design": [
        {"name": "Wix", "url": "https://wix.com", "type": "Website builder"},
        {"name": "Squarespace", "url": "https://squarespace.com", "type": "Website builder"},
    ],
    "graphic design": [
        {"name": "Canva", "url": "https://canva.com", "type": "Design platform"},
        {"name": "Adobe", "url": "https://adobe.com", "type": "Creative suite"},
    ],
    "seo": [
        {"name": "Semrush", "url": "https://semrush.com", "type": "SEO platform"},
        {"name": "Ahrefs", "url": "https://ahrefs.com", "type": "SEO tools"},
    ],
    "social media": [
        {"name": "Hootsuite", "url": "https://hootsuite.com", "type": "Social management"},
        {"name": "Buffer", "url": "https://buffer.com", "type": "Social scheduling"},
    ],
    "ecommerce": [
        {"name": "Shopify", "url": "https://shopify.com", "type": "E-commerce platform"},
        {"name": "WooCommerce", "url": "https://woocommerce.com", "type": "E-commerce plugin"},
    ],
    "crm": [
        {"name": "Salesforce", "url": "https://salesforce.com", "type": "CRM platform"},
        {"name": "HubSpot", "url": "https://hubspot.com", "type": "CRM & marketing"},
    ],
    "cloud": [
        {"name": "AWS", "url": "https://aws.amazon.com", "type": "Cloud platform"},
        {"name": "Azure", "url": "https://azure.microsoft.com", "type": "Cloud platform"},
    ],
    "erp": [
        {"name": "SAP", "url": "https://sap.com", "type": "ERP platform"},
        {"name": "Oracle", "url": "https://oracle.com", "type": "ERP solutions"},
    ],
    "mobile app": [
        {"name": "Flutter", "url": "https://flutter.dev", "type": "App framework"},
    ],
    "cybersecurity": [
        {"name": "CrowdStrike", "url": "https://crowdstrike.com", "type": "Security platform"},
        {"name": "Palo Alto", "url": "https://paloaltonetworks.com", "type": "Network security"},
    ],
    "consulting": [
        {"name": "McKinsey", "url": "https://mckinsey.com", "type": "Consulting firm"},
        {"name": "Deloitte", "url": "https://deloitte.com", "type": "Consulting & audit"},
    ],
    "accounting": [
        {"name": "QuickBooks", "url": "https://quickbooks.intuit.com", "type": "Accounting software"},
        {"name": "Xero", "url": "https://xero.com", "type": "Accounting platform"},
    ],
    "marketing": [
        {"name": "Mailchimp", "url": "https://mailchimp.com", "type": "Email marketing"},
        {"name": "HubSpot", "url": "https://hubspot.com", "type": "Marketing platform"},
    ],
    "3d modeling": [
        {"name": "SketchUp", "url": "https://sketchup.com", "type": "3D modeling"},
        {"name": "Blender", "url": "https://blender.org", "type": "3D creation"},
    ],
    "interior design": [
        {"name": "Havenly", "url": "https://havenly.com", "type": "Interior design"},
        {"name": "Modsy", "url": "https://modsy.com", "type": "Virtual design"},
    ],
    "architecture": [
        {"name": "ArchDaily", "url": "https://archdaily.com", "type": "Architecture platform"},
        {"name": "Revit", "url": "https://autodesk.com/products/revit", "type": "Architecture BIM"},
    ],
    "logistics": [
        {"name": "ShipBob", "url": "https://shipbob.com", "type": "Fulfillment"},
        {"name": "Flexport", "url": "https://flexport.com", "type": "Freight forwarding"},
    ],
    "hr": [
        {"name": "BambooHR", "url": "https://bamboohr.com", "type": "HR software"},
        {"name": "Workday", "url": "https://workday.com", "type": "HR & finance"},
    ],
    "training": [
        {"name": "Coursera", "url": "https://coursera.org", "type": "Online learning"},
        {"name": "Udemy", "url": "https://udemy.com", "type": "Course platform"},
    ],
    "data analytics": [
        {"name": "Tableau", "url": "https://tableau.com", "type": "Data visualization"},
        {"name": "Power BI", "url": "https://powerbi.microsoft.com", "type": "Business intelligence"},
    ],
    "ai": [
        {"name": "OpenAI", "url": "https://openai.com", "type": "AI platform"},
        {"name": "Google AI", "url": "https://ai.google", "type": "AI solutions"},
    ],
}


def _detect_competitors_static(industry: str, country: str, url: str, services: list[str] = None) -> list[dict]:
    """Static fallback: Return well-known competitors from hardcoded datasets."""
    country_key = country.lower().strip() if country else ""
    country_comps = COUNTRY_COMPETITORS.get(country_key, {}).get(industry, [])

    if not country_comps:
        competitors = list(INDUSTRY_COMPETITORS.get(industry, []))
    else:
        competitors = list(country_comps)

    try:
        scanned_domain = urlparse(url).netloc.replace("www.", "").lower()
    except Exception:
        scanned_domain = ""

    result = []
    seen_domains: set[str] = set()
    for comp in competitors:
        try:
            comp_domain = urlparse(comp["url"]).netloc.replace("www.", "").lower()
        except Exception:
            comp_domain = ""
        if comp_domain and scanned_domain and comp_domain == scanned_domain:
            continue
        if comp_domain not in seen_domains:
            result.append(comp)
            seen_domains.add(comp_domain)

    if services:
        for service in services:
            service_lower = service.lower()
            for keyword, service_comps in SERVICE_COMPETITORS.items():
                if keyword in service_lower:
                    for comp in service_comps:
                        if len(result) >= 6:
                            break
                        try:
                            comp_domain = urlparse(comp["url"]).netloc.replace("www.", "").lower()
                        except Exception:
                            comp_domain = ""
                        if comp_domain and scanned_domain and comp_domain == scanned_domain:
                            continue
                        if comp_domain not in seen_domains:
                            result.append(comp)
                            seen_domains.add(comp_domain)
            if len(result) >= 6:
                break

    return result[:6]


async def _discover_competitors_ai(
    company_name: str,
    industry: str,
    country: str,
    city: str,
    url: str,
    services: list[str] = None,
) -> list[dict]:
    """
    AI-powered competitor discovery using Claude API.

    Uses the AEOS Competitor Intelligence Engine approach:
    1. Builds a rich context prompt from company profile data
    2. Asks Claude to identify real local competitors in the same market
    3. Parses structured JSON response with competitor names, URLs, and types
    4. Falls back to static data if AI is unavailable
    """
    from app.core.config import settings

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        logger.info("No Anthropic API key — falling back to static competitor detection")
        return _detect_competitors_static(industry, country, url, services)

    try:
        scanned_domain = urlparse(url).netloc.replace("www.", "").lower()
    except Exception:
        scanned_domain = ""

    # Build the context for AI
    services_text = ", ".join(services[:10]) if services else "not detected"
    country_text = country or "unknown"
    city_text = city or ""
    location_text = f"{city_text}, {country_text}".strip(", ") if city_text else country_text

    prompt = (
        f"You are an AI-powered competitor intelligence engine for the MENA region and global markets.\n\n"
        f"Company: {company_name or scanned_domain}\n"
        f"Website: {url}\n"
        f"Industry: {industry}\n"
        f"Location: {location_text}\n"
        f"Services/Products: {services_text}\n\n"
        f"Identify exactly 6 real competitors for this company. Focus on:\n"
        f"1. LOCAL competitors in {country_text} that offer similar services/products\n"
        f"2. Regional competitors in the same market (MENA/GCC if applicable)\n"
        f"3. Only include companies that ACTUALLY EXIST with real, working websites\n"
        f"4. Match competitors to the specific services: {services_text}\n"
        f"5. Do NOT include the company itself ({scanned_domain})\n"
        f"6. Prefer direct competitors (same services/industry) over indirect ones\n\n"
        f"Return ONLY a JSON array with exactly 6 objects. No markdown, no explanation:\n"
        f'[{{"name": "Company Name", "url": "https://example.com", "type": "Brief description of what they do"}}]\n\n'
        f"Requirements:\n"
        f"- Each URL must be a real, valid website (https://...)\n"
        f"- Each name must be the actual company name\n"
        f"- Each type should be a short description (under 50 chars) mentioning their market\n"
        f"- Prioritize competitors from {country_text} first, then regional, then global\n"
    )

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 800,
                    "system": (
                        "You are the AEOS Competitor Intelligence Engine. "
                        "You identify real, verified competitors for businesses based on their industry, "
                        "location, and services. You ONLY return real companies with real websites. "
                        "You focus on local and regional competitors first. "
                        "You respond with ONLY valid JSON arrays, no markdown, no explanation."
                    ),
                    "messages": [
                        {"role": "user", "content": prompt},
                    ],
                },
            )

            if resp.status_code != 200:
                logger.warning("Claude API returned %d for competitor discovery", resp.status_code)
                return _detect_competitors_static(industry, country, url, services)

            data = resp.json()
            if not data.get("content") or not data["content"][0].get("text"):
                return _detect_competitors_static(industry, country, url, services)

            ai_text = data["content"][0]["text"].strip()

            # Parse JSON — handle potential markdown wrapping
            if ai_text.startswith("```"):
                ai_text = re.sub(r"^```(?:json)?\s*", "", ai_text)
                ai_text = re.sub(r"\s*```$", "", ai_text)

            competitors = json.loads(ai_text)
            if not isinstance(competitors, list):
                return _detect_competitors_static(industry, country, url, services)

            # Validate and filter
            result = []
            seen_domains: set[str] = set()
            for comp in competitors:
                if not isinstance(comp, dict):
                    continue
                name = comp.get("name", "").strip()
                comp_url = comp.get("url", "").strip()
                comp_type = comp.get("type", "").strip()

                if not name or not comp_url:
                    continue
                if not comp_url.startswith("http"):
                    comp_url = "https://" + comp_url

                try:
                    comp_domain = urlparse(comp_url).netloc.replace("www.", "").lower()
                except Exception:
                    continue

                # Skip self
                if comp_domain and scanned_domain and comp_domain == scanned_domain:
                    continue
                # Skip duplicates
                if comp_domain in seen_domains:
                    continue

                result.append({
                    "name": name[:60],
                    "url": comp_url,
                    "type": comp_type[:80] if comp_type else f"{industry} competitor",
                })
                seen_domains.add(comp_domain)

                if len(result) >= 6:
                    break

            if result:
                logger.info(
                    "AI competitor discovery found %d competitors for %s (%s, %s)",
                    len(result), company_name or scanned_domain, industry, country_text,
                )
                return result

            # AI returned empty/invalid — fall back
            logger.info("AI competitor discovery returned no valid results — using static fallback")
            return _detect_competitors_static(industry, country, url, services)

    except Exception as e:
        logger.warning("AI competitor discovery failed: %s — using static fallback", str(e)[:100])
        return _detect_competitors_static(industry, country, url, services)


# Keep sync wrapper for backward compatibility
def _detect_competitors(industry: str, country: str, url: str, services: list[str] = None) -> list[dict]:
    """Sync fallback — uses static data. Prefer _discover_competitors_ai() for AI-powered discovery."""
    return _detect_competitors_static(industry, country, url, services)


# ── Common English / HTML stop words to exclude from SEO keywords ──
_STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should",
    "may", "might", "must", "can", "could", "this", "that", "these", "those",
    "it", "its", "we", "our", "us", "you", "your", "they", "their", "them",
    "he", "she", "him", "her", "his", "all", "each", "every", "both", "few",
    "more", "most", "other", "some", "such", "no", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "about", "above", "after", "again",
    "also", "any", "as", "back", "because", "before", "between", "both",
    "come", "contact", "get", "go", "here", "how", "if", "into", "know",
    "like", "make", "many", "me", "my", "new", "now", "one", "out", "over",
    "said", "see", "take", "there", "then", "time", "two", "up", "use",
    "want", "way", "what", "when", "which", "who", "why", "work",
    "home", "page", "click", "read", "learn", "menu", "skip", "main",
    "content", "navigation", "search", "close", "open", "more", "less",
    "copyright", "reserved", "rights", "privacy", "policy", "terms",
    "conditions", "cookie", "cookies", "accept", "website", "site",
}


def _extract_seo_keywords(html: str, title: str, description: str, headings: list[str]) -> list[str]:
    """Extract top SEO keywords from page content using meta keywords + TF analysis."""
    keywords: list[str] = []
    seen = set()

    def _add(kw: str):
        kw = kw.strip().lower()
        if kw and kw not in seen and len(kw) >= 3 and kw not in _STOP_WORDS:
            seen.add(kw)
            keywords.append(kw.title())

    # 1. Meta keywords tag (highest priority — site explicitly declared these)
    kw_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\']([^"\']+)', html, re.IGNORECASE)
    if not kw_match:
        kw_match = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+name=["\']keywords["\']', html, re.IGNORECASE)
    if kw_match:
        for kw in kw_match.group(1).split(","):
            _add(kw.strip())

    # 2. Extract from title (strong SEO signal)
    if title:
        for sep in [" | ", " - ", " – ", " — ", " :: ", " : ", ","]:
            if sep in title:
                for part in title.split(sep):
                    part = part.strip()
                    if 3 <= len(part) <= 40:
                        _add(part)
                break
        else:
            for word in title.split():
                _add(word)

    # 3. Extract from headings (H1/H2)
    for heading in headings[:6]:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', heading)
        for w in words:
            _add(w)

    # 4. Extract from meta description
    if description:
        words = re.findall(r'\b[a-zA-Z]{4,}\b', description)
        for w in words:
            _add(w)

    # 5. Simple term frequency on visible text (fallback)
    if len(keywords) < 8:
        try:
            from bs4 import BeautifulSoup as _BS
            soup = _BS(html, "lxml")
            # Remove script/style
            for tag in soup.find_all(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True).lower()
            words = re.findall(r'\b[a-z]{4,15}\b', text)
            freq: dict[str, int] = {}
            for w in words:
                if w not in _STOP_WORDS and w not in seen:
                    freq[w] = freq.get(w, 0) + 1
            # Top by frequency
            for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:15]:
                _add(w)
                if len(keywords) >= 20:
                    break
        except Exception:
            pass

    return keywords[:20]


async def _extract_team_members(html: str, url: str) -> dict:
    """
    Detect team page and extract team member names/roles.
    If a team page URL is found, fetches it and extracts members from it too.
    Returns dict with: team_page_url, members: [{name, role}], count, linkedin_search_url.
    """
    result: dict = {"team_page_url": "", "members": [], "count": 0, "linkedin_search_url": ""}

    try:
        from bs4 import BeautifulSoup as _BS
        soup = _BS(html, "lxml")
    except Exception:
        return result

    base_domain = urlparse(url).netloc

    # 1. Look for team/about page links
    team_keywords = ["team", "our-team", "our_team", "about-us", "about_us", "about",
                     "people", "leadership", "staff", "who-we-are", "founders"]
    for a in soup.find_all("a", href=True):
        href = a["href"].strip().lower()
        for kw in team_keywords:
            if kw in href:
                from urllib.parse import urljoin as _urljoin
                full = _urljoin(url, a["href"])
                if base_domain in full:
                    result["team_page_url"] = full
                    break
        if result["team_page_url"]:
            break

    # Helper: validate a name candidate
    def _is_valid_name(name: str, seen: set) -> bool:
        if not name or len(name) <= 2 or len(name) > 60:
            return False
        if name.lower() in seen:
            return False
        if name.startswith("http") or name.startswith("www."):
            return False
        if any(c.isdigit() for c in name):
            return False
        # Must have at least 2 words (first + last name)
        if " " not in name.strip():
            return False
        # Skip common non-name phrases
        skip_phrases = ["read more", "learn more", "view profile", "our team", "about us",
                        "get in touch", "contact us", "see all", "view all", "click here",
                        "load more", "show more", "all rights", "privacy policy",
                        "terms of", "follow us", "connect with", "join our"]
        if name.lower().strip() in skip_phrases or any(p in name.lower() for p in skip_phrases):
            return False
        # Must contain letters only (plus spaces, hyphens, apostrophes, dots)
        if not re.match(r"^[A-Za-z\u0600-\u06FF\u0750-\u077F\s\.\-']+$", name):
            return False
        return True

    # Helper to extract members from a soup object
    def _extract_members_from_soup(page_soup, existing_members, is_about_page=False):
        members = []
        seen_names = {m["name"].lower() for m in existing_members}
        max_members = 10

        def _at_limit():
            return len(existing_members) + len(members) >= max_members

        # ---- Strategy 1: JSON-LD Person/Employee schema ----
        page_html = str(page_soup)
        for match in re.finditer(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', page_html, re.DOTALL | re.IGNORECASE):
            if _at_limit():
                break
            try:
                data = json.loads(match.group(1))
                items = data if isinstance(data, list) else [data]
                if isinstance(data, dict) and "@graph" in data:
                    items = data["@graph"]
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    if item.get("@type") in ("Person", "Employee"):
                        name = item.get("name", "")
                        role = item.get("jobTitle", "") or item.get("description", "")
                        if _is_valid_name(name.strip(), seen_names):
                            members.append({"name": name.strip(), "role": role.strip()})
                            seen_names.add(name.strip().lower())
            except Exception:
                continue

        if _at_limit():
            return members

        # ---- Strategy 2: CSS class/id based team sections ----
        section_kws = ["team", "staff", "people", "leadership", "founders", "management",
                       "directors", "executives", "partners", "members"]
        team_sections = page_soup.find_all(["section", "div"], class_=lambda c: c and any(
            kw in str(c).lower() for kw in section_kws
        ))
        if not team_sections:
            team_sections = page_soup.find_all(["section", "div"], id=lambda i: i and any(
                kw in str(i).lower() for kw in section_kws
            ))

        # ---- Strategy 3: Heading-text based sections ----
        # Find sections that contain headings with team-related text
        heading_kws = ["team", "people", "leadership", "management", "founders",
                       "who we are", "our experts", "meet the", "our people",
                       "board of", "directors", "partners"]
        if not team_sections or is_about_page:
            for heading in page_soup.find_all(["h1", "h2", "h3"], limit=20):
                h_text = heading.get_text(strip=True).lower()
                if any(kw in h_text for kw in heading_kws):
                    # Get the parent section/div of this heading
                    parent = heading.find_parent(["section", "div"])
                    if parent and parent not in team_sections:
                        team_sections.append(parent)

        def _extract_from_cards(section):
            found = []
            for card in section.find_all(["div", "li", "article", "figure"], recursive=True):
                if _at_limit():
                    break
                # Look for heading tags (name) + paragraph/span (role)
                texts = [t.get_text(strip=True) for t in card.find_all(["h2", "h3", "h4", "h5", "h6", "strong", "b", "dt"], limit=3)]
                subtexts = [t.get_text(strip=True) for t in card.find_all(["p", "span", "small", "dd", "em"], limit=3)]
                if texts:
                    name_candidate = texts[0]
                    role_candidate = ""
                    # Try subtexts first, then secondary heading text
                    for st in subtexts:
                        if st and st != name_candidate and len(st) < 100:
                            role_candidate = st
                            break
                    if not role_candidate and len(texts) > 1:
                        role_candidate = texts[1]
                    if _is_valid_name(name_candidate, seen_names):
                        found.append({
                            "name": name_candidate,
                            "role": role_candidate[:100] if role_candidate else "",
                        })
                        seen_names.add(name_candidate.lower())
            return found

        for section in team_sections[:5]:
            members.extend(_extract_from_cards(section))
            if _at_limit():
                break

        if _at_limit():
            return members

        # ---- Strategy 4: Image-card pattern detection ----
        # Many about/team pages show people as: <div><img/><h3>Name</h3><p>Role</p></div>
        # Find divs that contain exactly one image + heading text (likely a person card)
        if not members or is_about_page:
            candidate_cards = []
            for card in page_soup.find_all(["div", "li", "article", "figure"], recursive=True):
                imgs = card.find_all("img", limit=2)
                headings = card.find_all(["h2", "h3", "h4", "h5", "h6", "strong"], limit=3)
                # Card with exactly 1 image and 1-2 headings is likely a person card
                if len(imgs) == 1 and 1 <= len(headings) <= 2:
                    img = imgs[0]
                    img_src = img.get("src", "") or img.get("data-src", "")
                    img_alt = img.get("alt", "")
                    # Check if image alt text looks like a name
                    heading_text = headings[0].get_text(strip=True)
                    # Skip cards where heading is too long (probably not a name)
                    if len(heading_text) > 60:
                        continue
                    candidate_cards.append(card)

            # If we found multiple similar cards, they're likely team member cards
            if len(candidate_cards) >= 2:
                for card in candidate_cards:
                    if _at_limit():
                        break
                    headings = card.find_all(["h2", "h3", "h4", "h5", "h6", "strong"], limit=3)
                    subtexts = [t.get_text(strip=True) for t in card.find_all(["p", "span", "small", "em"], limit=3)]
                    if headings:
                        name_candidate = headings[0].get_text(strip=True)
                        role_candidate = ""
                        for st in subtexts:
                            if st and st != name_candidate and len(st) < 100:
                                role_candidate = st
                                break
                        if not role_candidate and len(headings) > 1:
                            role_candidate = headings[1].get_text(strip=True)
                        if _is_valid_name(name_candidate, seen_names):
                            members.append({
                                "name": name_candidate,
                                "role": role_candidate[:100] if role_candidate else "",
                            })
                            seen_names.add(name_candidate.lower())

        if _at_limit():
            return members

        # ---- Strategy 5: About page full scan (broader) ----
        # On about pages, look for any repeated heading+subtext pattern that looks like names
        if is_about_page and not members:
            all_headings = page_soup.find_all(["h3", "h4", "h5"], limit=30)
            name_candidates = []
            for h in all_headings:
                text = h.get_text(strip=True)
                if _is_valid_name(text, seen_names):
                    # Get the next sibling or parent text for role
                    role = ""
                    next_el = h.find_next_sibling(["p", "span", "small", "div"])
                    if next_el:
                        role = next_el.get_text(strip=True)[:100]
                    name_candidates.append({"name": text, "role": role})

            # Only add if we found at least 2 (pattern of people, not random headings)
            if len(name_candidates) >= 2:
                for nc in name_candidates:
                    if _at_limit():
                        break
                    members.append(nc)
                    seen_names.add(nc["name"].lower())

        return members

    # 2. Extract team members from main page HTML
    result["members"] = _extract_members_from_soup(soup, [])

    # 3. If we found a team/about page URL, fetch it and extract more members
    if result["team_page_url"] and len(result["members"]) < 10:
        try:
            team_url = result["team_page_url"]
            is_about = any(kw in team_url.lower() for kw in ["about", "who-we-are", "who_we_are"])
            logger.info("Following team/about page %s for team members (is_about=%s)", team_url, is_about)
            team_profile = await collect_website_profile(team_url)
            team_html = team_profile.get("html", "")
            if team_html:
                team_soup = _BS(team_html, "lxml")
                extra_members = _extract_members_from_soup(team_soup, result["members"], is_about_page=is_about)
                result["members"].extend(extra_members)
                result["members"] = result["members"][:10]
        except Exception as e:
            logger.info("Team page follow failed: %s", str(e)[:100])

    # 3b. If still no members, try common about/team URL patterns
    if len(result["members"]) < 1:
        from urllib.parse import urljoin as _urljoin
        base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        about_paths = ["/about-us", "/about", "/about-us/", "/about/",
                       "/team", "/our-team", "/team/", "/our-team/",
                       "/people", "/leadership", "/who-we-are"]
        for path in about_paths:
            candidate_url = _urljoin(base_url, path)
            # Skip if we already tried this URL
            if candidate_url == result.get("team_page_url"):
                continue
            try:
                logger.info("Trying common about/team path: %s", candidate_url)
                about_profile = await collect_website_profile(candidate_url)
                about_html = about_profile.get("html", "")
                if about_html and len(about_html) > 500:
                    about_soup = _BS(about_html, "lxml")
                    is_about = "about" in path
                    extra = _extract_members_from_soup(about_soup, result["members"], is_about_page=is_about)
                    if extra:
                        if not result["team_page_url"]:
                            result["team_page_url"] = candidate_url
                        result["members"].extend(extra)
                        result["members"] = result["members"][:10]
                        logger.info("Found %d members from %s", len(extra), candidate_url)
                        break  # Found members, stop trying more paths
            except Exception:
                continue

    result["count"] = len(result["members"])

    # 4. Build LinkedIn search URL
    # Check if we already have a LinkedIn URL from social links
    # Derive company name from URL domain for the search
    try:
        domain = urlparse(url).netloc.replace("www.", "")
        company_name = domain.split(".")[0]
    except Exception:
        company_name = ""

    result["linkedin_search_url"] = f"https://www.linkedin.com/search/results/people/?keywords={quote_plus(company_name)}"

    return result


def _extract_services(html: str, headings: list[str]) -> list[str]:
    """
    Extract main products/services offered by the company from the website.
    Returns a list of service/product names (up to 12).
    """
    services: list[str] = []
    seen = set()

    def _add(s: str):
        s = s.strip()
        if s and s.lower() not in seen and 3 <= len(s) <= 80:
            seen.add(s.lower())
            services.append(s)

    try:
        from bs4 import BeautifulSoup as _BS
        soup = _BS(html, "lxml")
    except Exception:
        return services

    # 1. Extract from JSON-LD Service/Product schema
    for match in re.finditer(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE):
        try:
            data = json.loads(match.group(1))
            items = data if isinstance(data, list) else [data]
            if isinstance(data, dict) and "@graph" in data:
                items = data["@graph"]
            for item in items:
                if not isinstance(item, dict):
                    continue
                if item.get("@type") in ("Service", "Product", "Offer", "SoftwareApplication"):
                    name = item.get("name", "")
                    if name:
                        _add(name)
                # Also check hasOfferCatalog
                catalog = item.get("hasOfferCatalog", {})
                if isinstance(catalog, dict):
                    for offer in catalog.get("itemListElement", []):
                        if isinstance(offer, dict) and offer.get("name"):
                            _add(offer["name"])
        except Exception:
            continue

    # 2. Look for services/products sections
    service_keywords = ["service", "product", "solution", "offering", "what-we-do",
                        "what_we_do", "capabilities", "expertise"]
    service_sections = soup.find_all(["section", "div"], class_=lambda c: c and any(
        kw in str(c).lower() for kw in service_keywords
    ))
    if not service_sections:
        service_sections = soup.find_all(["section", "div"], id=lambda i: i and any(
            kw in str(i).lower() for kw in service_keywords
        ))

    for section in service_sections[:3]:
        # Extract from list items or cards within service sections
        for el in section.find_all(["h3", "h4", "h5", "strong"], limit=12):
            text = el.get_text(strip=True)
            if text and len(text) < 80:
                _add(text)
        for li in section.find_all("li", limit=12):
            text = li.get_text(strip=True)
            if text and len(text) < 80 and not text.startswith("http"):
                _add(text)
        if len(services) >= 8:
            break

    # 3. Extract from navigation menu items under "Services"/"Products"
    for nav in soup.find_all("nav"):
        for a in nav.find_all("a", href=True):
            text = a.get_text(strip=True).lower()
            href = a["href"].lower()
            if any(kw in text or kw in href for kw in ["service", "product", "solution"]):
                # This link's siblings or children might list services
                parent = a.parent
                if parent:
                    for sub_a in parent.find_all("a", href=True):
                        sub_text = sub_a.get_text(strip=True)
                        if (sub_text and len(sub_text) < 60
                            and sub_text.lower() not in {"services", "products", "solutions", "all services", "all products", "home", "about", "contact"}):
                            _add(sub_text)

    # 4. Fallback: check headings for service-like content
    if not services:
        for heading in headings:
            heading_lower = heading.lower()
            if any(kw in heading_lower for kw in ["service", "product", "solution", "what we",
                                                    "our expertise", "we offer", "we provide", "we do"]):
                # The heading itself might describe a service category
                if len(heading) < 80:
                    _add(heading)

    return services[:12]


# ── SEO health check ────────────────────────────────────────────────

async def _check_seo_health(html: str, url: str) -> dict:
    """Check website SEO health indicators and return a summary dict."""
    from html.parser import HTMLParser

    results: dict[str, dict] = {}

    # --- has_ssl ---
    results["has_ssl"] = {
        "status": url.startswith("https"),
        "detail": "Site uses HTTPS" if url.startswith("https") else "Site does not use HTTPS",
    }

    # --- has_sitemap ---
    base_url = urljoin(url, "/")
    sitemap_url = urljoin(base_url, "sitemap.xml")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5) as client:
            resp = await client.head(sitemap_url)
            if resp.status_code >= 400:
                resp = await client.get(sitemap_url)
            sitemap_ok = resp.status_code < 400
    except Exception:
        sitemap_ok = False
    results["has_sitemap"] = {
        "status": sitemap_ok,
        "detail": "sitemap.xml found" if sitemap_ok else "sitemap.xml not found",
    }

    # --- has_robots ---
    robots_url = urljoin(base_url, "robots.txt")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5) as client:
            resp = await client.head(robots_url)
            if resp.status_code >= 400:
                resp = await client.get(robots_url)
            robots_ok = resp.status_code < 400
    except Exception:
        robots_ok = False
    results["has_robots"] = {
        "status": robots_ok,
        "detail": "robots.txt found" if robots_ok else "robots.txt not found",
    }

    # --- HTML-based checks ---
    html_lower = html.lower()

    # has_meta_title
    title_match = re.search(r"<title[^>]*>(.+?)</title>", html_lower, re.DOTALL)
    has_title = bool(title_match and title_match.group(1).strip())
    results["has_meta_title"] = {
        "status": has_title,
        "detail": "Title tag found" if has_title else "Title tag missing or empty",
    }

    # has_meta_description
    desc_match = re.search(r'<meta\s[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html_lower)
    if not desc_match:
        desc_match = re.search(r'<meta\s[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', html_lower)
    has_desc = bool(desc_match and desc_match.group(1).strip())
    results["has_meta_description"] = {
        "status": has_desc,
        "detail": "Meta description found" if has_desc else "Meta description missing",
    }

    # has_h1
    has_h1 = bool(re.search(r"<h1[\s>]", html_lower))
    results["has_h1"] = {
        "status": has_h1,
        "detail": "H1 tag found" if has_h1 else "No H1 tag found",
    }

    # has_canonical
    has_canonical = bool(re.search(r'<link\s[^>]*rel=["\']canonical["\']', html_lower))
    results["has_canonical"] = {
        "status": has_canonical,
        "detail": "Canonical link found" if has_canonical else "No canonical link found",
    }

    # has_og_tags
    has_og = bool(
        re.search(r'<meta\s[^>]*property=["\']og:title["\']', html_lower)
        or re.search(r'<meta\s[^>]*property=["\']og:image["\']', html_lower)
    )
    results["has_og_tags"] = {
        "status": has_og,
        "detail": "Open Graph tags found" if has_og else "No Open Graph tags found",
    }

    # has_viewport
    has_viewport = bool(re.search(r'<meta\s[^>]*name=["\']viewport["\']', html_lower))
    results["has_viewport"] = {
        "status": has_viewport,
        "detail": "Viewport meta tag found" if has_viewport else "Viewport meta tag missing (not mobile-friendly)",
    }

    # --- Score ---
    check_keys = [k for k in results if k != "score"]
    passed = sum(1 for k in check_keys if results[k]["status"])
    total = len(check_keys)
    results["score"] = round((passed / total) * 100) if total else 0

    return results


async def intake_from_url(url: str) -> dict:
    """
    Main intake pipeline: fetch website and extract everything.
    Returns a flat dict matching IntakeFromUrlResponse fields.
    """
    # Normalize URL
    if url and not url.startswith("http"):
        url = "https://" + url

    logger.info("Smart intake starting for %s", url)

    # 1. Fetch and parse website
    profile = await collect_website_profile(url)
    html = profile.get("html", "")

    # 2. Extract contacts
    contacts = extract_contacts(html, url)

    # 3. Extract social links
    social = extract_social_links(html, url)

    # 4. Detect tech stack (reuse scanner's tech_stack_collector)
    tech_stack = _detect_tech_stack(html, url)

    # 5. Infer industry
    industry_result = infer_industry(
        title=profile.get("title", ""),
        description=profile.get("description", ""),
        headings=profile.get("headings", []),
        tech_stack=tech_stack,
        url=url,
    )

    # 5b. Follow contact page to extract more contacts if we missed phone/email
    if contacts["contact_pages"]:
        try:
            contact_url = contacts["contact_pages"][0]
            logger.info("Following contact page %s for more data", contact_url)
            contact_profile = await collect_website_profile(contact_url)
            contact_html = contact_profile.get("html", "")
            if contact_html:
                extra_contacts = extract_contacts(contact_html, contact_url)
                # Merge new findings
                seen_phones = set(contacts["phone_numbers"])
                for phone in extra_contacts["phone_numbers"]:
                    if phone not in seen_phones:
                        contacts["phone_numbers"].append(phone)
                        seen_phones.add(phone)
                seen_emails = set(contacts["emails"])
                for email in extra_contacts["emails"]:
                    if email not in seen_emails:
                        contacts["emails"].append(email)
                        seen_emails.add(email)
                if not contacts["whatsapp_links"]:
                    contacts["whatsapp_links"] = extra_contacts["whatsapp_links"]
                # Also add contact page HTML to corpus for country/city detection
                html = html + " " + contact_html[:5000]
        except Exception as e:
            logger.info("Contact page follow failed: %s", str(e)[:100])

    # 6. Detect country/city
    corpus = " ".join([
        profile.get("title", ""),
        profile.get("description", ""),
        " ".join(profile.get("headings", [])),
        html[:10000],  # First 10K chars of HTML for address patterns
    ])
    location = detect_location(
        url=url,
        corpus=corpus,
        phone_numbers=contacts["phone_numbers"],
    )

    # 7. Extract business hours
    business_hours = _detect_business_hours(html)

    # 7b. Extract SEO keywords
    seo_keywords = _extract_seo_keywords(
        html=html,
        title=profile.get("title", ""),
        description=profile.get("description", ""),
        headings=profile.get("headings", []),
    )

    # 7c. Extract team members
    team_data = await _extract_team_members(html, url)

    # 7d. Extract services/products
    detected_services = _extract_services(html, profile.get("headings", []))

    # 7e. Check SEO health
    seo_health = await _check_seo_health(html, url)

    # 8. Discover competitors (AI-powered with static fallback)
    competitors = await _discover_competitors_ai(
        company_name=profile.get("detected_company_name", ""),
        industry=industry_result["detected_industry"],
        country=location.get("country", ""),
        city=location.get("city", ""),
        url=url,
        services=detected_services,
    )

    logger.info(
        "Intake complete for %s: company=%s, industry=%s (%.0f%%), country=%s, city=%s",
        url,
        profile.get("detected_company_name", ""),
        industry_result["detected_industry"],
        industry_result["industry_confidence"] * 100,
        location.get("country", ""),
        location.get("city", ""),
    )

    return {
        "url": url,
        "detected_company_name": profile.get("detected_company_name", ""),
        "detected_industry": industry_result["detected_industry"],
        "industry_confidence": industry_result["industry_confidence"],
        "industry_scores": industry_result["industry_scores"],
        "industry_signals": industry_result["signals_found"],
        "detected_country": location.get("country", ""),
        "detected_city": location.get("city", ""),
        "detected_phone_numbers": contacts["phone_numbers"],
        "detected_emails": contacts["emails"],
        "detected_social_links": social,
        "detected_whatsapp_links": contacts["whatsapp_links"],
        "detected_contact_pages": contacts["contact_pages"],
        "detected_booking_pages": contacts["booking_pages"],
        "detected_tech_stack": tech_stack,
        "page_title": profile.get("title", ""),
        "meta_description": profile.get("description", ""),
        "og_image": profile.get("og_image", ""),
        "favicon_url": profile.get("favicon_url", ""),
        "detected_business_hours": business_hours,
        "detected_languages": profile.get("detected_languages", []),
        "detected_competitors": competitors,
        "detected_keywords": seo_keywords,
        "detected_team": team_data,
        "detected_services": detected_services,
        "detected_seo_health": seo_health,
    }


def _detect_tech_stack(html: str, url: str) -> list[str]:
    """Reuse scanner's tech detection."""
    try:
        from app.engines.company_scanner_engine.collectors.tech_stack_collector import (
            detect_tech_from_html,
            detect_tech_from_url,
            merge_tech,
        )
        html_tech = detect_tech_from_html(html)
        url_tech = detect_tech_from_url(url)
        return merge_tech(html_tech, url_tech)
    except Exception:
        return []
