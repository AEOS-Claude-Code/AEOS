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


async def _search_web(query: str, max_results: int = 10) -> list[dict]:
    """
    Search the web using DuckDuckGo HTML search (no API key needed).
    Returns list of {title, url, snippet} dicts.
    """
    results: list[dict] = []
    search_url = "https://html.duckduckgo.com/html/"

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.post(
                search_url,
                data={"q": query, "b": ""},
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://html.duckduckgo.com/",
                },
            )
            if resp.status_code != 200:
                logger.warning("DuckDuckGo search returned %d for query: %s", resp.status_code, query[:80])
                return results

            html = resp.text

            from bs4 import BeautifulSoup as _BS
            soup = _BS(html, "lxml")

            for result_div in soup.select(".result"):
                title_el = result_div.select_one(".result__title a, .result__a")
                snippet_el = result_div.select_one(".result__snippet")
                url_el = result_div.select_one(".result__url")

                if not title_el:
                    continue

                title = title_el.get_text(strip=True)
                snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                # Extract actual URL from DuckDuckGo redirect
                href = title_el.get("href", "")
                if "uddg=" in href:
                    from urllib.parse import parse_qs, urlparse as _up
                    parsed = _up(href)
                    qs = parse_qs(parsed.query)
                    actual_url = qs.get("uddg", [""])[0]
                elif href.startswith("http"):
                    actual_url = href
                elif url_el:
                    raw_url = url_el.get_text(strip=True)
                    actual_url = f"https://{raw_url}" if not raw_url.startswith("http") else raw_url
                else:
                    continue

                if actual_url:
                    results.append({
                        "title": title,
                        "url": actual_url,
                        "snippet": snippet,
                    })
                    if len(results) >= max_results:
                        break

    except Exception as e:
        logger.warning("Web search failed for query '%s': %s", query[:60], str(e)[:100])

    return results


async def _discover_competitors_ai(
    company_name: str,
    industry: str,
    country: str,
    city: str,
    url: str,
    services: list[str] = None,
) -> list[dict]:
    """
    AI-powered competitor discovery: Web Search + Claude Analysis.

    Pipeline:
    1. Build targeted search queries from detected services + location
    2. Search DuckDuckGo for real companies matching each service
    3. Feed all search results to Claude for intelligent filtering & ranking
    4. Claude selects the 6 best competitors that match the company's services
    5. Falls back to static data if search + AI both fail
    """
    from app.core.config import settings

    try:
        scanned_domain = urlparse(url).netloc.replace("www.", "").lower()
    except Exception:
        scanned_domain = ""

    country_text = country or "unknown"
    city_text = city or ""
    location_text = f"{city_text}, {country_text}".strip(", ") if city_text else country_text
    services_text = ", ".join(services[:10]) if services else ""

    # ── Step 1: Build search queries based on services + location ──
    search_queries: list[str] = []

    if services:
        # Group services into max 3 search queries (2-3 services each)
        for i in range(0, min(len(services), 9), 3):
            service_group = " ".join(services[i:i + 3])
            query = f"{service_group} companies in {location_text}"
            search_queries.append(query)

        # Add a broader industry + services query
        top_services = " ".join(services[:3])
        search_queries.append(f"{top_services} competitors {country_text}")
    else:
        # No services detected — search by industry
        search_queries.append(f"{industry} companies in {location_text}")
        search_queries.append(f"top {industry} firms {country_text}")

    # ── Step 2: Execute web searches in parallel ──
    import asyncio
    all_search_results: list[dict] = []

    search_tasks = [_search_web(q, max_results=8) for q in search_queries[:4]]
    search_outputs = await asyncio.gather(*search_tasks, return_exceptions=True)

    for output in search_outputs:
        if isinstance(output, list):
            all_search_results.extend(output)

    logger.info(
        "Web search returned %d results across %d queries for %s",
        len(all_search_results), len(search_queries), company_name or scanned_domain,
    )

    # Deduplicate by domain
    seen_search_domains: set[str] = set()
    unique_results: list[dict] = []
    for sr in all_search_results:
        try:
            sr_domain = urlparse(sr["url"]).netloc.replace("www.", "").lower()
        except Exception:
            continue
        # Skip self and search engines/social media
        skip_domains = {"google.com", "facebook.com", "linkedin.com", "twitter.com", "x.com",
                        "youtube.com", "instagram.com", "wikipedia.org", "duckduckgo.com",
                        "reddit.com", "pinterest.com", "tiktok.com", "amazon.com"}
        if sr_domain == scanned_domain:
            continue
        if any(skip in sr_domain for skip in skip_domains):
            continue
        if sr_domain not in seen_search_domains:
            unique_results.append(sr)
            seen_search_domains.add(sr_domain)

    # ── Step 3: Use Claude to analyze search results and pick competitors ──
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        # No AI available — pick top results that look like companies
        logger.info("No Anthropic API key — returning top search results as competitors")
        if unique_results:
            return _pick_best_from_search(unique_results, scanned_domain, industry, 6)
        return _detect_competitors_static(industry, country, url, services)

    if not unique_results:
        logger.info("No search results found — Claude will use its own knowledge")

    # Format search results for Claude
    search_context = ""
    for i, sr in enumerate(unique_results[:25], 1):
        search_context += f"{i}. {sr['title']}\n   URL: {sr['url']}\n   {sr['snippet'][:150]}\n\n"

    if not search_context:
        search_context = "(No search results available — use your knowledge of the market)\n"

    prompt = (
        f"You are the AEOS Competitor Intelligence Engine. Your task is to identify the best "
        f"competitors for a company based on REAL web search results.\n\n"
        f"═══ TARGET COMPANY ═══\n"
        f"Company: {company_name or scanned_domain}\n"
        f"Website: {url}\n"
        f"Industry: {industry}\n"
        f"Location: {location_text}\n"
        f"Services/Products: {services_text or 'not detected'}\n\n"
        f"═══ WEB SEARCH RESULTS ═══\n"
        f"{search_context}\n"
        f"═══ INSTRUCTIONS ═══\n"
        f"From the search results above, select exactly 6 companies that are the BEST competitors.\n\n"
        f"FILTERING RULES (STRICT):\n"
        f"- ONLY select companies that provide THE SAME or very similar services/products: {services_text or industry}\n"
        f"- MUST be from {country_text} or the same region\n"
        f"- MUST be real operating companies (not directories, blogs, news sites, or marketplaces)\n"
        f"- Do NOT include {scanned_domain}\n"
        f"- If search results don't have 6 good matches, supplement with your knowledge of real "
        f"  companies in {country_text} that offer: {services_text or industry}\n\n"
        f"Return ONLY a JSON array with exactly 6 objects. No markdown, no explanation:\n"
        f'[{{"name": "Company Name", "url": "https://example.com", "type": "Brief description (what services they offer)"}}]\n'
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1000,
                    "system": (
                        "You are the AEOS Competitor Intelligence Engine. "
                        "You analyze web search results to identify real, verified competitors. "
                        "You ONLY select companies that offer the SAME services/products as the target company. "
                        "You prioritize local competitors from the same country. "
                        "You respond with ONLY valid JSON arrays, no markdown, no explanation, no preamble."
                    ),
                    "messages": [
                        {"role": "user", "content": prompt},
                    ],
                },
            )

            if resp.status_code != 200:
                logger.warning("Claude API returned %d for competitor analysis", resp.status_code)
                if unique_results:
                    return _pick_best_from_search(unique_results, scanned_domain, industry, 6)
                return _detect_competitors_static(industry, country, url, services)

            data = resp.json()
            if not data.get("content") or not data["content"][0].get("text"):
                if unique_results:
                    return _pick_best_from_search(unique_results, scanned_domain, industry, 6)
                return _detect_competitors_static(industry, country, url, services)

            ai_text = data["content"][0]["text"].strip()

            # Parse JSON — handle potential markdown wrapping
            if ai_text.startswith("```"):
                ai_text = re.sub(r"^```(?:json)?\s*", "", ai_text)
                ai_text = re.sub(r"\s*```$", "", ai_text)

            competitors = json.loads(ai_text)
            if not isinstance(competitors, list):
                if unique_results:
                    return _pick_best_from_search(unique_results, scanned_domain, industry, 6)
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

                if comp_domain and scanned_domain and comp_domain == scanned_domain:
                    continue
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
                    "AI+Search competitor discovery found %d competitors for %s (%s, %s)",
                    len(result), company_name or scanned_domain, industry, country_text,
                )
                return result

            logger.info("AI analysis returned no valid competitors — using search fallback")
            if unique_results:
                return _pick_best_from_search(unique_results, scanned_domain, industry, 6)
            return _detect_competitors_static(industry, country, url, services)

    except Exception as e:
        logger.warning("AI competitor analysis failed: %s", str(e)[:100])
        if unique_results:
            return _pick_best_from_search(unique_results, scanned_domain, industry, 6)
        return _detect_competitors_static(industry, country, url, services)


def _pick_best_from_search(
    search_results: list[dict], scanned_domain: str, industry: str, limit: int = 6
) -> list[dict]:
    """Pick the best competitor candidates from raw search results (no AI)."""
    result = []
    seen: set[str] = set()
    for sr in search_results:
        try:
            domain = urlparse(sr["url"]).netloc.replace("www.", "").lower()
        except Exception:
            continue
        if domain == scanned_domain or domain in seen:
            continue
        # Derive company name from title (take first part before separators)
        title = sr.get("title", "")
        name = re.split(r"\s*[|–—-]\s*", title)[0].strip()
        if not name or len(name) > 60:
            name = domain.split(".")[0].replace("-", " ").title()

        result.append({
            "name": name[:60],
            "url": sr["url"],
            "type": sr.get("snippet", "")[:80] or f"{industry} company",
        })
        seen.add(domain)
        if len(result) >= limit:
            break
    return result


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

    def _is_gibberish(word: str) -> bool:
        """Detect CloudFlare-obfuscated nonsense words (e.g. Whqm, Ybbq, Ldkz, Lvem)."""
        if len(word) < 3:
            return True
        w = word.lower()
        # Count vowels — real English words have ~35-45% vowels
        vowels = sum(1 for c in w if c in "aeiou")
        ratio = vowels / len(w) if w else 0
        if ratio < 0.15 and len(w) > 3:
            return True  # Too few vowels for a real word
        if ratio > 0.8 and len(w) > 3:
            return True  # Too many vowels
        # Check for uncommon consonant clusters
        consonant_run = 0
        max_consonant_run = 0
        for c in w:
            if c not in "aeiou":
                consonant_run += 1
                max_consonant_run = max(max_consonant_run, consonant_run)
            else:
                consonant_run = 0
        if max_consonant_run >= 4:
            return True  # 4+ consecutive consonants = likely gibberish
        # Check against common English bigrams — real words contain these
        common_bigrams = {"th", "he", "in", "er", "an", "re", "on", "at", "en", "nd",
                          "ti", "es", "or", "te", "of", "ed", "is", "it", "al", "ar",
                          "st", "to", "nt", "ng", "se", "ha", "as", "ou", "io", "le",
                          "ve", "co", "me", "de", "hi", "ri", "ro", "ic", "ne", "ea",
                          "ra", "ce", "li", "ch", "ll", "be", "ma", "si", "om", "ur"}
        if len(w) >= 4:
            bigrams = [w[i:i+2] for i in range(len(w) - 1)]
            unique_bigrams = set(bigrams)
            common_count = len(unique_bigrams & common_bigrams)
            # For short words (4 chars = 3 bigrams), require at least 2 common bigrams
            # For longer words, require at least 60% common bigrams
            min_required = max(2, int(len(unique_bigrams) * 0.6))
            if common_count < min_required:
                return True  # Too few common English bigrams = likely gibberish
        return False

    def _add(kw: str):
        kw = kw.strip().lower()
        if kw and kw not in seen and len(kw) >= 3 and kw not in _STOP_WORDS:
            if _is_gibberish(kw):
                return
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

        if _at_limit():
            return members

        # ---- Strategy 6: Broad text-pattern scan for name + role pairs ----
        # Search ALL divs/lis for elements that look like "Name\nTitle/Role" patterns
        # This catches custom layouts where team members aren't in typical sections
        if not members:
            # Look for containers with multiple child items that each have a name-like heading
            for container in page_soup.find_all(["div", "ul", "section"], recursive=True):
                children = container.find_all(["div", "li", "article"], recursive=False)
                if len(children) < 2 or len(children) > 30:
                    continue

                found_in_container = []
                for child in children:
                    if _at_limit():
                        break
                    # Get all text nodes with some structure
                    all_text_els = child.find_all(["h2", "h3", "h4", "h5", "h6", "strong", "b", "a", "span", "p"], limit=6)
                    if not all_text_els:
                        continue
                    # First text element could be name
                    name_el = all_text_els[0]
                    name_text = name_el.get_text(strip=True)
                    if not _is_valid_name(name_text, seen_names):
                        continue
                    # Remaining text elements - look for role
                    role_text = ""
                    for el in all_text_els[1:]:
                        t = el.get_text(strip=True)
                        if t and t != name_text and len(t) < 100 and len(t) > 2:
                            role_text = t
                            break
                    found_in_container.append({"name": name_text, "role": role_text})

                # If container has 2+ people, it's likely a team section
                if len(found_in_container) >= 2:
                    for fc in found_in_container:
                        if _at_limit():
                            break
                        if fc["name"].lower() not in seen_names:
                            members.append(fc)
                            seen_names.add(fc["name"].lower())
                    if members:
                        break  # Found team section

        if _at_limit():
            return members

        # ---- Strategy 7: LinkedIn/social profile links as people indicators ----
        # If the page has LinkedIn profile links (not company pages), extract names from link text or alt
        if not members:
            linkedin_links = page_soup.find_all("a", href=re.compile(r"linkedin\.com/in/", re.I))
            for link in linkedin_links[:max_members]:
                if _at_limit():
                    break
                # Get name from link text, adjacent heading, or parent container
                name = link.get_text(strip=True)
                if not _is_valid_name(name, seen_names):
                    # Try parent container
                    parent = link.find_parent(["div", "li", "article", "figure"])
                    if parent:
                        headings = parent.find_all(["h2", "h3", "h4", "h5", "h6", "strong", "b"], limit=2)
                        for h in headings:
                            name = h.get_text(strip=True)
                            if _is_valid_name(name, seen_names):
                                break
                if _is_valid_name(name, seen_names):
                    role = ""
                    parent = link.find_parent(["div", "li", "article", "figure"])
                    if parent:
                        for el in parent.find_all(["p", "span", "small", "em"], limit=3):
                            t = el.get_text(strip=True)
                            if t and t != name and len(t) < 100:
                                role = t
                                break
                    members.append({"name": name, "role": role})
                    seen_names.add(name.lower())

        return members

    # 2. Extract team members from main page HTML
    result["members"] = _extract_members_from_soup(soup, [])

    # 3. If we found a team/about page URL, fetch it and extract more members
    if result["team_page_url"] and len(result["members"]) < 10:
        try:
            team_url = result["team_page_url"]
            is_about = any(kw in team_url.lower() for kw in ["about", "who-we-are", "who_we_are"])
            logger.info("Following team/about page %s for team members (is_about=%s)", team_url, is_about)
            team_profile = await collect_website_profile(team_url, lightweight=True)
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
        about_paths = ["/about-us", "/about", "/team", "/our-team", "/people"]
        for path in about_paths:
            candidate_url = _urljoin(base_url, path)
            # Skip if we already tried this URL
            if candidate_url == result.get("team_page_url"):
                continue
            try:
                logger.info("Trying common about/team path: %s", candidate_url)
                about_profile = await collect_website_profile(candidate_url, lightweight=True)
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


def _extract_social_handles_from_html(domain_name: str, html: str) -> set[str]:
    """
    Extract brand social media handles from HTML content.
    Looks for patterns like @designzoneksa, href containing handles,
    and social URL slugs already in the HTML.
    """
    handles: set[str] = {domain_name}
    if not html:
        return handles

    # 1. Find handle-like patterns near the domain name
    handle_pattern = re.compile(
        rf'(?:^|["\'/@ ])({re.escape(domain_name)}[a-z0-9_-]{{0,20}})',
        re.IGNORECASE,
    )
    for m in handle_pattern.finditer(html[:100000]):
        h = m.group(1).lower().strip("-_")
        if len(h) > len(domain_name) and len(h) < 30:
            handles.add(h)

    # 2. Extract handles from social media URLs already in the HTML
    social_url_patterns = [
        (r'instagram\.com/([a-zA-Z0-9_.-]+)', "instagram"),
        (r'facebook\.com/([a-zA-Z0-9_.-]+)', "facebook"),
        (r'twitter\.com/([a-zA-Z0-9_]+)', "twitter"),
        (r'x\.com/([a-zA-Z0-9_]+)', "twitter"),
        (r'linkedin\.com/company/([a-zA-Z0-9_-]+)', "linkedin"),
        (r'youtube\.com/@([a-zA-Z0-9_-]+)', "youtube"),
        (r'tiktok\.com/@([a-zA-Z0-9_.-]+)', "tiktok"),
        (r'snapchat\.com/add/([a-zA-Z0-9_.-]+)', "snapchat"),
    ]
    for pattern, _ in social_url_patterns:
        for m in re.finditer(pattern, html[:100000], re.IGNORECASE):
            slug = m.group(1).lower().strip("-_.")
            # Only add if it looks related to the brand
            domain_clean = domain_name.lower().replace("-", "").replace("_", "")
            slug_clean = slug.replace("-", "").replace("_", "").replace(".", "")
            if domain_clean in slug_clean or slug_clean in domain_clean:
                handles.add(slug)
            # Also add the slug as-is if it's not a generic term
            skip_slugs = {"login", "signup", "help", "about", "search", "explore",
                          "settings", "share", "sharer", "intent", "pages", "groups"}
            if slug not in skip_slugs and len(slug) >= 3:
                handles.add(slug)

    # 3. Find @ mentions in visible text
    at_pattern = re.compile(rf'@({re.escape(domain_name)}[a-z0-9_]{{0,20}})', re.IGNORECASE)
    for m in at_pattern.finditer(html[:100000]):
        h = m.group(1).lower().strip("_")
        if len(h) >= 3 and len(h) < 30:
            handles.add(h)

    return handles


async def _verify_social_profile_content(
    platform: str, url: str, domain: str, company_name: str,
    strict: bool = False,
) -> tuple[str, str, bool] | None:
    """
    Verify a social profile URL actually belongs to this company.
    Fetches the page and checks if company domain or name appears in content.

    Returns (platform, url, verified) where verified=True means content match found.
    In strict mode, only returns if content match is found.
    """
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
            })
            if resp.status_code >= 400:
                return None

            # For 200 responses, check if the page content mentions the company
            page_text = resp.text[:50000].lower()
            domain_short = domain.replace("www.", "").lower()
            domain_name = domain_short.split(".")[0]

            # Priority checks: full domain first (most reliable), then shorter forms
            # Full domain match is the strongest signal (e.g. "designzone.com.sa")
            checks_strong = [domain_short]
            if "." in domain_short:
                parts = domain_short.split(".")
                if len(parts) >= 2:
                    checks_strong.append(".".join(parts[:2]))  # designzone.com

            for check in checks_strong:
                if check and len(check) >= 5 and check in page_text:
                    logger.info("Social profile VERIFIED (strong domain match '%s'): %s → %s", check, platform, url)
                    return (platform, url, True)

            # Weaker checks: company name or domain name alone
            # These may match wrong companies with the same name
            checks_weak = []
            if company_name and len(company_name) >= 5:
                checks_weak.append(company_name.lower())

            for check in checks_weak:
                if check and check in page_text:
                    # Also verify it's not just matching the URL slug itself
                    # The social profile URL contains the company name, so we need
                    # to check the page body, not just any text
                    # Remove common social platform boilerplate from check
                    slug = url.rstrip("/").split("/")[-1].lower()
                    # If check equals the URL slug, it's not a real content match
                    if check.replace(" ", "") == slug.replace("-", "").replace("_", ""):
                        continue
                    logger.info("Social profile VERIFIED (weak company name '%s'): %s → %s", check, platform, url)
                    return (platform, url, True)

            if strict:
                logger.info("Social profile REJECTED (no content match, strict): %s → %s", platform, url)
                return None

            # Non-strict: return but mark as unverified
            logger.info("Social profile loaded but no content match: %s → %s", platform, url)
            return (platform, url, False)

    except Exception:
        pass

    # Fallback: HEAD check only (page exists)
    if not strict:
        try:
            async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
                resp = await client.head(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                })
                if resp.status_code < 400:
                    return (platform, url, False)
        except Exception:
            pass

    return None


async def _search_social_profiles(company_name: str, domain: str, html: str = "") -> dict[str, list[str]]:
    """
    Search DuckDuckGo for company social media profiles.
    This bypasses bot-blocked sites by finding indexed social links.
    Uses brand handles extracted from HTML for precision matching.
    Verifies found profiles by checking page content for company references.
    """
    result: dict[str, list[str]] = {
        "linkedin": [], "facebook": [], "instagram": [],
        "twitter": [], "youtube": [], "tiktok": [],
        "pinterest": [], "snapchat": [],
    }

    if not company_name and not domain:
        return result

    domain_short = domain.replace("www.", "")
    domain_name = domain_short.split(".")[0]  # "designzone" from "designzone.com.sa"

    # Extract handles from ALL provided HTML (homepage + subpages)
    handles = _extract_social_handles_from_html(domain_name, html)
    logger.info("Extracted social handles from HTML: %s", handles)

    # Build precise search queries using handles + full domain for disambiguation
    handle_list = sorted(handles, key=len, reverse=True)[:5]
    handle_query = " OR ".join(f'"{h}"' for h in handle_list)

    queries = [
        f'site:linkedin.com/company "{domain_short}" OR {handle_query}',
        f'site:instagram.com "{domain_short}" OR {handle_query}',
        f'site:facebook.com "{domain_short}" OR {handle_query}',
        f'(site:x.com OR site:twitter.com) "{domain_short}" OR {handle_query}',
    ]

    import asyncio

    async def _do_search(query: str) -> list[dict]:
        try:
            return await _search_web(query, max_results=5)
        except Exception:
            return []

    all_results = await asyncio.gather(*[_do_search(q) for q in queries], return_exceptions=True)

    social_patterns = {
        "linkedin": ["linkedin.com/company/", "linkedin.com/in/"],
        "facebook": ["facebook.com/"],
        "instagram": ["instagram.com/"],
        "twitter": ["twitter.com/", "x.com/"],
        "youtube": ["youtube.com/channel/", "youtube.com/c/", "youtube.com/@"],
        "tiktok": ["tiktok.com/@"],
    }

    skip_paths = {"/login", "/signup", "/help", "/about", "/search", "/explore",
                  "/settings", "/p/", "/reel/", "/stories", "/hashtag/", "/directory"}

    # Collect candidates per platform (with quality scoring)
    candidates: dict[str, list[tuple[str, int]]] = {p: [] for p in result}

    for batch in all_results:
        if isinstance(batch, Exception) or not isinstance(batch, list):
            continue
        for sr in batch:
            sr_url = sr.get("url", "").rstrip("/")
            sr_url_lower = sr_url.lower()
            sr_title = sr.get("title", "").lower()
            sr_snippet = sr.get("snippet", "").lower()

            for platform, patterns in social_patterns.items():
                for pattern in patterns:
                    if pattern in sr_url_lower:
                        # Extract the profile slug
                        path_part = sr_url_lower.split(pattern)[-1].strip("/").split("?")[0]
                        if not path_part or len(path_part) < 2:
                            break
                        if any(sp in sr_url_lower for sp in skip_paths):
                            break

                        # Score this candidate
                        score = 0
                        slug_lower = path_part.lower().replace("-", "").replace("_", "")
                        domain_clean = domain_name.lower().replace("-", "").replace("_", "")

                        # Check slug against handles
                        if domain_clean in slug_lower:
                            score += 10
                        for h in handles:
                            h_clean = h.replace("-", "").replace("_", "")
                            if h_clean == slug_lower:
                                score += 20  # Exact handle match
                            elif h_clean in slug_lower:
                                score += 10

                        # Check if search title/snippet mention domain
                        if domain_short in sr_title or domain_short in sr_snippet:
                            score += 15
                        if domain_name in sr_title or domain_name in sr_snippet:
                            score += 5

                        # Check for country/location hints (e.g. "Saudi Arabia", "Jeddah")
                        if any(loc in sr_title + sr_snippet for loc in ["saudi", "jeddah", "riyadh", "ksa"]):
                            score += 5

                        if score > 0:
                            candidates[platform].append((sr_url, score))
                        break

    # Sort candidates by score and take the best
    for platform in candidates:
        if candidates[platform]:
            candidates[platform].sort(key=lambda x: -x[1])
            best_url, best_score = candidates[platform][0]
            result[platform] = [best_url]
            logger.info("DDG social candidate: %s → %s (score=%d)", platform, best_url, best_score)

    # Also try direct URL construction + verification for MISSING platforms
    handle_variants = list(handle_list)
    # Add common country suffixes for disambiguation
    for suffix in ["ksa", "sa", "_ksa", "_sa", "-ksa", "-sa"]:
        variant = domain_name + suffix
        if variant not in handle_variants:
            handle_variants.append(variant)
    # Add hyphenated variants for LinkedIn (e.g. design-zone-ksa from designzone)
    for suffix in ["-ksa", "-sa"]:
        # Try hyphen before suffix
        variant = domain_name + suffix
        if variant not in handle_variants:
            handle_variants.append(variant)
    # Also add underscore variants for Twitter (e.g. designzone_ksa)
    for suffix in ["_ksa", "_sa"]:
        variant = domain_name + suffix
        if variant not in handle_variants:
            handle_variants.append(variant)

    # Build candidate URLs for each empty platform and verify with content check
    verify_tasks = []
    for platform_name, url_template in [
        ("instagram", "https://www.instagram.com/{handle}/"),
        ("facebook", "https://www.facebook.com/{handle}/"),
        ("twitter", "https://x.com/{handle}"),
        ("linkedin", "https://www.linkedin.com/company/{handle}"),
        ("tiktok", "https://www.tiktok.com/@{handle}"),
        ("snapchat", "https://www.snapchat.com/add/{handle}"),
    ]:
        if result.get(platform_name):
            continue  # Already found via search
        for handle in handle_variants[:8]:
            candidate_url = url_template.format(handle=handle)
            verify_tasks.append(
                _verify_social_profile_content(platform_name, candidate_url, domain, company_name)
            )

    if verify_tasks:
        verify_results = await asyncio.gather(*verify_tasks, return_exceptions=True)
        # Prefer content-verified profiles over unverified ones
        verified_found: dict[str, tuple[str, bool]] = {}
        for vr in verify_results:
            if isinstance(vr, tuple) and len(vr) == 3:
                p, u, is_verified = vr
                if p not in verified_found or (is_verified and not verified_found[p][1]):
                    verified_found[p] = (u, is_verified)

        for p, (u, is_verified) in verified_found.items():
            if not result.get(p):
                result[p] = [u]
                logger.info("Social profile via direct URL (%s): %s → %s",
                            "VERIFIED" if is_verified else "unverified", p, u)

    # Cap at 1 per platform
    for p in result:
        result[p] = result[p][:1]

    found = sum(1 for v in result.values() if v)
    if found:
        logger.info("Social profile search found %d platforms for '%s' (handles: %s)", found, domain_short, handle_list)

    return result


def _merge_social(target: dict[str, list[str]], source: dict[str, list[str]]) -> None:
    """Merge social links from source into target, avoiding duplicates."""
    for platform, urls in source.items():
        if not urls:
            continue
        existing = set(target.get(platform, []))
        for u in urls:
            if u and u not in existing:
                target.setdefault(platform, []).append(u)
                existing.add(u)
        # Cap at 2 per platform
        if platform in target:
            target[platform] = target[platform][:2]


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
            contact_profile = await collect_website_profile(contact_url, lightweight=True)
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
                # Also extract social links from contact page (some sites only have them there)
                _merge_social(social, extract_social_links(contact_html, contact_url))
                # Also add contact page HTML to corpus for country/city detection
                html = html + " " + contact_html[:5000]
        except Exception as e:
            logger.info("Contact page follow failed: %s", str(e)[:100])

    # 5c. Proactive subpage crawl — if main page missed key data, fetch key pages
    #     Many sites block bots on the homepage but serve subpages normally.
    import asyncio as _aio
    _main_has_social = any(urls for urls in social.values())
    _main_has_contacts = bool(contacts["phone_numbers"] or contacts["emails"])
    _main_has_title = bool(profile.get("title"))

    if not _main_has_social or not _main_has_contacts or not _main_has_title:
        logger.info("Main page missing data (social=%s contacts=%s title=%s) — crawling subpages",
                     _main_has_social, _main_has_contacts, _main_has_title)
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        subpage_paths = ["/about", "/about-us", "/contact", "/contact-us"]

        async def _fetch_and_extract(path: str):
            try:
                sub_url = urljoin(base, path)
                sub_profile = await collect_website_profile(sub_url, lightweight=True)
                sub_html = sub_profile.get("html", "")
                if sub_html and len(sub_html) > 500:
                    return sub_url, sub_html, sub_profile
            except Exception:
                pass
            return None, None, None

        sub_tasks = [_fetch_and_extract(p) for p in subpage_paths]
        sub_results = await _aio.gather(*sub_tasks, return_exceptions=True)

        for sub_result in sub_results:
            if isinstance(sub_result, Exception) or not sub_result:
                continue
            sub_url, sub_html, sub_profile = sub_result
            if not sub_html:
                continue

            # Extract social links from each subpage
            sub_social = extract_social_links(sub_html, sub_url)
            _merge_social(social, sub_social)

            # Extract contacts from each subpage
            sub_contacts = extract_contacts(sub_html, sub_url)
            seen_phones = set(contacts["phone_numbers"])
            for phone in sub_contacts["phone_numbers"]:
                if phone not in seen_phones:
                    contacts["phone_numbers"].append(phone)
                    seen_phones.add(phone)
            seen_emails = set(contacts["emails"])
            for email in sub_contacts["emails"]:
                if email not in seen_emails:
                    contacts["emails"].append(email)
                    seen_emails.add(email)
            if not contacts["whatsapp_links"]:
                contacts["whatsapp_links"] = sub_contacts["whatsapp_links"]
            if not contacts["contact_pages"] and sub_contacts["contact_pages"]:
                contacts["contact_pages"] = sub_contacts["contact_pages"]

            # Backfill title/OG image from subpages if main page missed them
            if not profile.get("title") and sub_profile.get("title"):
                profile["title"] = sub_profile["title"]
            if not profile.get("og_image") and sub_profile.get("og_image"):
                profile["og_image"] = sub_profile["og_image"]
            if not profile.get("description") and sub_profile.get("description"):
                profile["description"] = sub_profile["description"]

            # Add subpage HTML to corpus (keep more for social handle extraction)
            html = html + " " + sub_html[:20000]

        logger.info(
            "After subpage crawl: social=%d, phones=%d, emails=%d",
            sum(1 for v in social.values() if v),
            len(contacts["phone_numbers"]),
            len(contacts["emails"]),
        )

    # 5d. Social profile search — ALWAYS run to find/verify social profiles
    #     Even if we found some via regex, search can find more and verify accuracy
    _social_count = sum(1 for v in social.values() if v)
    if _social_count < 3:  # Run if we have fewer than 3 platforms
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.replace("www.", "")
            company = profile.get("detected_company_name", "") or domain.split(".")[0]

            # Pass ALL collected HTML (homepage + subpages) for better handle extraction
            search_social = await _aio.wait_for(
                _search_social_profiles(company, domain, html=html),
                timeout=25,
            )
            _merge_social(social, search_social)
            new_count = sum(1 for v in social.values() if v)
            if new_count > _social_count:
                logger.info("Social profile search added %d new platforms (total: %d)", new_count - _social_count, new_count)
        except Exception as e:
            logger.info("Social profile search failed: %s", str(e)[:100])

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

    # 7c. Extract team members (with timeout to avoid slow page fetches)
    try:
        import asyncio as _aio
        team_data = await _aio.wait_for(_extract_team_members(html, url), timeout=15)
    except Exception:
        logger.info("Team extraction timed out for %s", url)
        team_data = {"team_page_url": "", "members": [], "count": 0, "linkedin_search_url": ""}

    # Post-process team: filter out UI text, navigation, and marketing copy
    if team_data.get("members"):
        _ui_indicators = [
            "سجل", "تسجيل", "login", "sign", "register", "account", "order",
            "cart", "basket", "checkout", "newsletter", "subscribe", "cookie",
            "الخدمات", "طلبات", "عرض", "تصفح", "اختر", "ادخل", "حسابك",
            "world of", "est.", "discover", "explore", "learn more", "click",
            "view all", "see more", "load more", "show more",
        ]
        clean_members = []
        for m in team_data["members"]:
            name = m.get("name", "")
            role = m.get("role", "")
            text = (name + " " + role).lower()
            # Skip if name/role contains UI or marketing indicators
            if any(ui in text for ui in _ui_indicators):
                continue
            # Skip if name is too long (likely a sentence, not a person's name)
            if len(name) > 50:
                continue
            # Skip if name doesn't have at least 2 words (first + last)
            if " " not in name.strip() and not any(c in name for c in "\u0600\u06FF"):
                # Allow Arabic names without space detection
                pass
            clean_members.append(m)
        team_data["members"] = clean_members
        team_data["count"] = len(clean_members)

    # 7d. Extract services/products
    detected_services = _extract_services(html, profile.get("headings", []))

    # 7e. Check SEO health
    seo_health = await _check_seo_health(html, url)

    # 8. Discover competitors (AI-powered with static fallback)
    try:
        import asyncio as _aio
        competitors = await _aio.wait_for(
            _discover_competitors_ai(
                company_name=profile.get("detected_company_name", ""),
                industry=industry_result["detected_industry"],
                country=location.get("country", ""),
                city=location.get("city", ""),
                url=url,
                services=detected_services,
            ),
            timeout=25,
        )
    except Exception as e:
        logger.warning("Competitor discovery failed in intake: %s — using static", str(e)[:100])
        competitors = _detect_competitors_static(
            industry_result["detected_industry"],
            location.get("country", ""),
            url,
            detected_services,
        )

    logger.info(
        "Intake regex phase complete for %s: company=%s, industry=%s (%.0f%%), country=%s, city=%s",
        url,
        profile.get("detected_company_name", ""),
        industry_result["detected_industry"],
        industry_result["industry_confidence"] * 100,
        location.get("country", ""),
        location.get("city", ""),
    )

    # ── Pre-build: TLD-based industry + country inference (when regex fails) ──
    tld_industry = industry_result["detected_industry"]
    tld_confidence = industry_result["industry_confidence"]
    parsed_for_tld = urlparse(url)
    tld_parts = parsed_for_tld.netloc.split(".")
    tld = tld_parts[-1].lower() if tld_parts else ""
    tld2 = ".".join(tld_parts[-2:]).lower() if len(tld_parts) >= 2 else ""

    # TLD-based industry inference when regex-based detection fails
    if tld_industry == "other" or tld_confidence < 0.2:
        tld_industry_map = {
            "edu": "education", "edu.sa": "education", "edu.jo": "education",
            "edu.qa": "education", "edu.ae": "education", "edu.eg": "education",
            "ac": "education",
            "gov": "government", "gov.sa": "government", "gov.qa": "government",
            "gov.ae": "government", "gov.jo": "government", "gov.eg": "government",
            "mil": "government",
            "med": "healthcare", "med.sa": "healthcare",
            "health": "healthcare",
        }
        for tld_key in [tld2, tld]:
            if tld_key in tld_industry_map:
                tld_industry = tld_industry_map[tld_key]
                tld_confidence = max(tld_confidence, 0.4)
                logger.info("TLD-based industry override: %s → %s (from .%s)", url, tld_industry, tld_key)
                break

    # TLD-based country inference when location detection fails
    tld_country = location.get("country", "")
    if not tld_country:
        tld_country_map = {
            "sa": "Saudi Arabia", "ae": "UAE", "jo": "Jordan", "qa": "Qatar",
            "kw": "Kuwait", "bh": "Bahrain", "om": "Oman", "eg": "Egypt",
            "lb": "Lebanon", "iq": "Iraq", "ps": "Palestine",
            "com.sa": "Saudi Arabia", "gov.sa": "Saudi Arabia", "edu.sa": "Saudi Arabia",
            "med.sa": "Saudi Arabia", "net.sa": "Saudi Arabia", "org.sa": "Saudi Arabia",
            "co.ae": "UAE", "gov.ae": "UAE", "ac.ae": "UAE",
            "edu.jo": "Jordan", "gov.jo": "Jordan", "com.jo": "Jordan",
            "gov.qa": "Qatar", "edu.qa": "Qatar", "com.qa": "Qatar",
        }
        for tld_key in [tld2, tld]:
            if tld_key in tld_country_map:
                tld_country = tld_country_map[tld_key]
                logger.info("TLD-based country: %s → %s", url, tld_country)
                break

    # ── Pre-build: Validate phone numbers ──
    def _is_valid_phone(phone: str) -> bool:
        digits = re.sub(r"[^\d]", "", phone)
        if len(digits) < 7 or len(digits) > 15:
            return False
        # Reject all-zeros or repeated digits
        if len(set(digits)) <= 2:
            return False
        # Reject numbers that are too short without country code
        if not phone.startswith("+") and not phone.startswith("00") and len(digits) < 8:
            return False
        return True

    valid_phones = [p for p in contacts["phone_numbers"] if _is_valid_phone(p)]

    # ── Pre-build: Clean emails ──
    def _clean_email(email: str) -> str:
        # Fix HTML-encoded prefixes like u003e, \\u003e
        email = re.sub(r'^(?:\\?u[0-9a-f]{4})+', '', email, flags=re.IGNORECASE)
        email = re.sub(r'^[<>]+', '', email)
        try:
            from urllib.parse import unquote
            email = unquote(email)
        except Exception:
            pass
        return email.strip()

    clean_emails = []
    seen_email = set()
    for e in contacts["emails"]:
        cleaned = _clean_email(e)
        if "@" in cleaned and cleaned.lower() not in seen_email and "%" not in cleaned:
            clean_emails.append(cleaned)
            seen_email.add(cleaned.lower())

    # Build initial result dict
    result = {
        "url": url,
        "detected_company_name": profile.get("detected_company_name", ""),
        "detected_industry": tld_industry,
        "industry_confidence": tld_confidence,
        "industry_scores": industry_result["industry_scores"],
        "industry_signals": industry_result["signals_found"],
        "detected_country": tld_country,
        "detected_city": location.get("city", ""),
        "detected_phone_numbers": valid_phones,
        "detected_emails": clean_emails,
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

    # ── 9. AI Deep Extraction — fill gaps with Claude ──
    # Crawls subpages in parallel and uses AI to extract missing data
    try:
        import asyncio as _aio
        ai_data = await _aio.wait_for(
            _ai_deep_extract(url, html, result),
            timeout=45,
        )
        if ai_data:
            result = _merge_ai_results(result, ai_data)
            logger.info(
                "AI deep extract merged — city=%s, phones=%d, emails=%d, services=%d, socials=%d",
                result.get("detected_city", ""),
                len(result.get("detected_phone_numbers", [])),
                len(result.get("detected_emails", [])),
                len(result.get("detected_services", [])),
                sum(1 for v in result.get("detected_social_links", {}).values() if v),
            )
    except Exception as e:
        logger.warning("AI deep extract timed out or failed: %s", str(e)[:100])

    # ── 9b. Generate keywords from services when HTML keywords are empty ──
    if not result.get("detected_keywords") and result.get("detected_services"):
        service_keywords = []
        seen_kw = set()
        for svc in result["detected_services"]:
            # Extract individual words from service names
            words = re.findall(r'\b[a-zA-Z]{3,}\b', svc)
            for w in words:
                wl = w.lower()
                if wl not in seen_kw and wl not in _STOP_WORDS and len(wl) >= 3:
                    service_keywords.append(w.title())
                    seen_kw.add(wl)
        if service_keywords:
            result["detected_keywords"] = service_keywords[:20]
            logger.info("Generated %d keywords from services", len(service_keywords[:20]))

    # ── 10. Verify social URLs ──
    # For each social URL, check if it belongs to this company.
    # Use strict mode for generic slugs (just company name) but lenient for
    # location-specific slugs (e.g. designzoneksa) which are likely correct.
    try:
        import asyncio as _aio
        socials = result.get("detected_social_links", {})
        verify_tasks = []
        parsed_url = urlparse(url)
        _domain = parsed_url.netloc.replace("www.", "")
        _domain_name = _domain.split(".")[0]
        _company = result.get("detected_company_name", "") or _domain_name
        _country_code = ""
        _country = result.get("detected_country", "").lower()
        # Map country to common social media suffixes
        country_suffixes = {
            "saudi arabia": ["ksa", "sa", "saudi"],
            "uae": ["uae", "dubai", "abudhabi"],
            "jordan": ["jo", "jordan"],
            "egypt": ["eg", "egypt"],
            "qatar": ["qa", "qatar"],
            "kuwait": ["kw", "kuwait"],
            "bahrain": ["bh", "bahrain"],
            "oman": ["om", "oman"],
        }
        _suffixes = country_suffixes.get(_country, [])

        for platform, urls in socials.items():
            if urls and isinstance(urls, list) and urls[0]:
                profile_url = urls[0]
                # Extract slug from the profile URL
                slug = profile_url.rstrip("/").split("/")[-1].lower().replace("-", "").replace("_", "")
                domain_clean = _domain_name.lower().replace("-", "").replace("_", "")

                # Check if slug contains location-specific suffix
                has_location_suffix = any(
                    suffix in slug and suffix not in domain_clean
                    for suffix in _suffixes
                )

                # If slug is just the generic domain name (e.g. "designzone"),
                # use strict verification (may match wrong company)
                # If slug has location suffix (e.g. "designzoneksa"), be lenient
                use_strict = not has_location_suffix
                verify_tasks.append(
                    _verify_social_profile_content(
                        platform, profile_url, _domain, _company, strict=use_strict
                    )
                )

        if verify_tasks:
            verify_results = await _aio.wait_for(
                _aio.gather(*verify_tasks, return_exceptions=True),
                timeout=20,
            )
            verified_platforms = set()
            for vr in verify_results:
                if isinstance(vr, tuple) and len(vr) >= 2:
                    verified_platforms.add(vr[0])

            # Remove profiles that failed verification
            removed = []
            for platform in list(socials.keys()):
                if socials.get(platform) and platform not in verified_platforms:
                    removed.append(f"{platform}={socials[platform]}")
                    socials[platform] = []

            if removed:
                logger.info("Removed %d unverified social profiles: %s", len(removed), ", ".join(removed))

            result["detected_social_links"] = socials

            # ── 11. Backfill empty social slots with location-specific handles ──
            # After removing wrong-company profiles, try constructing URLs with
            # country-specific handles (e.g. designzoneksa, designzone_ksa)
            empty_platforms = [p for p in socials if not socials.get(p)]
            if empty_platforms and _suffixes:
                backfill_handles = []
                for sfx in _suffixes[:2]:  # Use top 2 country suffixes
                    backfill_handles.append(f"{_domain_name}{sfx}")       # designzoneksa
                    backfill_handles.append(f"{_domain_name}_{sfx}")      # designzone_ksa
                    backfill_handles.append(f"{_domain_name}-{sfx}")      # designzone-ksa (LinkedIn style)

                backfill_templates = {
                    "instagram": "https://www.instagram.com/{handle}/",
                    "facebook": "https://www.facebook.com/{handle}/",
                    "twitter": "https://x.com/{handle}",
                    "linkedin": "https://www.linkedin.com/company/{handle}",
                    "tiktok": "https://www.tiktok.com/@{handle}",
                }

                backfill_tasks = []
                for platform in empty_platforms:
                    template = backfill_templates.get(platform)
                    if not template:
                        continue
                    for handle in backfill_handles:
                        candidate_url = template.format(handle=handle)
                        backfill_tasks.append(
                            _verify_social_profile_content(
                                platform, candidate_url, _domain, _company, strict=False
                            )
                        )

                if backfill_tasks:
                    try:
                        backfill_results = await _aio.wait_for(
                            _aio.gather(*backfill_tasks, return_exceptions=True),
                            timeout=15,
                        )
                        for vr in backfill_results:
                            if isinstance(vr, tuple) and len(vr) >= 2:
                                p, u = vr[0], vr[1]
                                if not socials.get(p):
                                    socials[p] = [u]
                                    logger.info("Backfilled social profile: %s → %s", p, u)
                        result["detected_social_links"] = socials
                    except Exception:
                        pass

    except Exception as e:
        logger.info("Social verification step failed: %s", str(e)[:100])

    logger.info(
        "Intake COMPLETE for %s: company=%s, industry=%s, country=%s, city=%s, phones=%d, emails=%d, services=%d, socials=%d",
        url,
        result.get("detected_company_name", ""),
        result.get("detected_industry", ""),
        result.get("detected_country", ""),
        result.get("detected_city", ""),
        len(result.get("detected_phone_numbers", [])),
        len(result.get("detected_emails", [])),
        len(result.get("detected_services", [])),
        sum(1 for v in result.get("detected_social_links", {}).values() if v),
    )

    return result


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


# ── AI Deep Extraction ─────────────────────────────────────────────
# Crawls multiple subpages in parallel, then sends combined text to
# Claude for intelligent extraction of ALL company data in one call.

async def _fetch_subpages(url: str) -> dict[str, str]:
    """
    Fetch key subpages (about, contact, services, team) in parallel.
    Returns dict mapping page_type -> visible_text.
    """
    import asyncio
    from urllib.parse import urljoin as _uj

    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"

    # Common subpage paths to try (ordered by priority)
    page_map: dict[str, list[str]] = {
        "about": ["/about", "/about-us", "/about_us", "/who-we-are", "/company"],
        "contact": ["/contact", "/contact-us", "/contact_us", "/get-in-touch", "/reach-us"],
        "services": ["/services", "/our-services", "/what-we-do", "/solutions", "/products"],
        "team": ["/team", "/our-team", "/people", "/leadership", "/staff"],
    }

    async def _try_fetch_page(page_type: str, paths: list[str]) -> tuple[str, str]:
        """Try paths in order, return first successful page text."""
        for path in paths:
            page_url = _uj(base, path)
            try:
                html = await _fetch_subpage_html(page_url)
                if html and len(html) > 500:
                    text = _html_to_text(html)
                    if text and len(text) > 100:
                        return (page_type, text[:8000])
            except Exception:
                continue
        return (page_type, "")

    tasks = [_try_fetch_page(pt, paths) for pt, paths in page_map.items()]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    page_texts: dict[str, str] = {}
    for r in results:
        if isinstance(r, tuple):
            ptype, text = r
            if text:
                page_texts[ptype] = text

    return page_texts


async def _fetch_subpage_html(url: str, timeout: int = 10) -> str | None:
    """Quick fetch of a subpage HTML."""
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
        ) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
            })
            if resp.status_code < 400:
                return resp.text
    except Exception:
        pass
    return None


def _html_to_text(html: str) -> str:
    """Convert HTML to clean visible text, removing scripts/styles/nav."""
    try:
        from bs4 import BeautifulSoup as _BS
        soup = _BS(html, "lxml")
        # Remove non-content elements
        for tag in soup.find_all(["script", "style", "noscript", "svg", "iframe"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Collapse multiple blank lines
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        return "\n".join(lines)
    except Exception:
        # Regex fallback
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()


async def _ai_deep_extract(
    url: str,
    homepage_html: str,
    existing_data: dict,
) -> dict:
    """
    AI-powered deep extraction: crawl subpages + use Claude to extract
    all company data that regex-based extractors missed.

    Only calls Claude if there are significant gaps in the data.
    Returns a dict with fields to merge into the intake result.
    """
    import asyncio
    from app.core.config import get_settings

    settings = get_settings()
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        logger.info("AI deep extract skipped — no ANTHROPIC_API_KEY")
        return {}

    # Check what data is missing
    has_city = bool(existing_data.get("detected_city"))
    has_phone = bool(existing_data.get("detected_phone_numbers"))
    has_email = bool(existing_data.get("detected_emails"))
    has_services = bool(existing_data.get("detected_services"))
    has_team = bool(existing_data.get("detected_team", {}).get("members"))
    has_socials = any(
        urls for urls in existing_data.get("detected_social_links", {}).values()
    )
    has_whatsapp = bool(existing_data.get("detected_whatsapp_links"))

    gaps = []
    if not has_city: gaps.append("city")
    if not has_phone: gaps.append("phone")
    if not has_email: gaps.append("email")
    if not has_services: gaps.append("services")
    if not has_team: gaps.append("team")
    if not has_socials: gaps.append("social_profiles")
    if not has_whatsapp: gaps.append("whatsapp")

    if len(gaps) < 2:
        logger.info("AI deep extract skipped — only %d gaps: %s", len(gaps), gaps)
        return {}

    logger.info("AI deep extract starting for %s — gaps: %s", url, gaps)

    # ── Step 1: Fetch subpages in parallel ──
    try:
        subpages = await asyncio.wait_for(_fetch_subpages(url), timeout=20)
    except Exception as e:
        logger.warning("Subpage fetch failed: %s", str(e)[:100])
        subpages = {}

    logger.info("Fetched %d subpages: %s", len(subpages), list(subpages.keys()))

    # ── Step 2: Build combined text corpus ──
    homepage_text = _html_to_text(homepage_html)

    sections: list[str] = []
    sections.append(f"=== HOMEPAGE ({url}) ===\n{homepage_text[:6000]}")
    for page_type, text in subpages.items():
        sections.append(f"=== {page_type.upper()} PAGE ===\n{text[:6000]}")

    combined_text = "\n\n".join(sections)

    # Truncate to fit in context window (keep it efficient)
    if len(combined_text) > 25000:
        combined_text = combined_text[:25000]

    # ── Step 3: Build targeted extraction prompt ──
    company_name = existing_data.get("detected_company_name", "")
    country = existing_data.get("detected_country", "")

    prompt = (
        f"You are the AEOS Company Intelligence Engine. Analyze the following website content "
        f"and extract all available company information.\n\n"
        f"══ KNOWN DATA ══\n"
        f"Company: {company_name}\n"
        f"Website: {url}\n"
        f"Country: {country or 'unknown'}\n"
        f"Industry: {existing_data.get('detected_industry', 'unknown')}\n\n"
        f"══ WEBSITE CONTENT ══\n"
        f"{combined_text}\n\n"
        f"══ EXTRACT THE FOLLOWING (JSON) ══\n"
        f"Return a JSON object with these fields. Use null for anything not found.\n"
        f"Do NOT guess or fabricate data — only extract what's explicitly on the website.\n\n"
        f'{{\n'
        f'  "city": "City name where company is headquartered",\n'
        f'  "phone_numbers": ["phone1", "phone2"],\n'
        f'  "emails": ["email1@example.com"],\n'
        f'  "whatsapp": "WhatsApp number or wa.me link if found",\n'
        f'  "social_profiles": {{\n'
        f'    "linkedin": "full LinkedIn URL or null",\n'
        f'    "facebook": "full Facebook URL or null",\n'
        f'    "instagram": "full Instagram URL or null",\n'
        f'    "twitter": "full Twitter/X URL or null",\n'
        f'    "youtube": "full YouTube URL or null",\n'
        f'    "tiktok": "full TikTok URL or null",\n'
        f'    "snapchat": "full Snapchat URL or null",\n'
        f'    "pinterest": "full Pinterest URL or null"\n'
        f'  }},\n'
        f'  "social_handles": {{\n'
        f'    "instagram": "Instagram username/handle without @ (e.g. designzoneksa)",\n'
        f'    "facebook": "Facebook page slug (e.g. designzoneksa)",\n'
        f'    "twitter": "Twitter/X handle without @ (e.g. designzone_ksa)",\n'
        f'    "linkedin": "LinkedIn company slug (e.g. design-zone-ksa)",\n'
        f'    "tiktok": "TikTok handle without @ (e.g. designzoneksa)",\n'
        f'    "snapchat": "Snapchat username (e.g. designzoneksa)"\n'
        f'  }},\n'
        f'  "services": ["Service 1", "Service 2", "...up to 12 main services/products"],\n'
        f'  "team_members": [\n'
        f'    {{"name": "Full Name", "role": "Job Title"}}\n'
        f'  ],\n'
        f'  "company_name": "Official full company name (not abbreviation or domain)",\n'
        f'  "industry": "One of: ecommerce, healthcare, travel, restaurant, education, real_estate, '
        f'saas, agency, design_creative, engineering, construction, manufacturing, technology, '
        f'retail, finance, logistics, media_entertainment, nonprofit, professional_services, '
        f'government, telecom, other",\n'
        f'  "country": "Country where company is headquartered",\n'
        f'  "company_description": "One-sentence company description",\n'
        f'  "address": "Full physical address if found"\n'
        f'}}\n\n'
        f"RULES:\n"
        f"- Extract ONLY real data found in the website content above\n"
        f"- company_name: Extract the OFFICIAL company name, not just the domain. "
        f"E.g. for jarir.com → 'Jarir Bookstore' not 'Jarir', for aus.edu → "
        f"'American University of Sharjah' not 'Aus'\n"
        f"- industry: Classify based on what the company DOES, not its TLD\n"
        f"- country: Detect from addresses, phone codes (+966=Saudi, +971=UAE, +962=Jordan, +974=Qatar)\n"
        f"- Phone numbers: include country code (e.g. +966...)\n"
        f"- Social profiles: must be actual full profile URLs found in the content\n"
        f"- Social handles: extract usernames/handles from URLs, @mentions, or text references\n"
        f"  Look for patterns like @companyname, /companyname in social URLs, text mentions\n"
        f"- Services: extract the main service/product offerings, not generic categories\n"
        f"- Team: extract ONLY actual people's names and job titles. "
        f"Do NOT include UI elements, navigation text, slogans, or marketing copy\n"
        f"- Return ONLY valid JSON, no markdown fences, no explanation\n"
    )

    # ── Step 4: Call Claude API ──
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 2000,
                    "system": (
                        "You are the AEOS Company Intelligence Engine. You extract structured "
                        "company data from website content. You ONLY return facts explicitly "
                        "found in the provided text. You respond with ONLY valid JSON, "
                        "no markdown, no explanation, no preamble."
                    ),
                    "messages": [{"role": "user", "content": prompt}],
                },
            )

            if resp.status_code != 200:
                logger.warning("AI deep extract: Claude returned %d", resp.status_code)
                return {}

            data = resp.json()
            ai_text = data.get("content", [{}])[0].get("text", "").strip()
            if not ai_text:
                return {}

            # Parse JSON (handle markdown wrapping)
            if ai_text.startswith("```"):
                ai_text = re.sub(r"^```(?:json)?\s*", "", ai_text)
                ai_text = re.sub(r"\s*```$", "", ai_text)

            extracted = json.loads(ai_text)
            if not isinstance(extracted, dict):
                return {}

            logger.info(
                "AI deep extract success: city=%s, phones=%d, emails=%d, services=%d, team=%d, socials=%d",
                extracted.get("city", ""),
                len(extracted.get("phone_numbers") or []),
                len(extracted.get("emails") or []),
                len(extracted.get("services") or []),
                len(extracted.get("team_members") or []),
                sum(1 for v in (extracted.get("social_profiles") or {}).values() if v),
            )

            return extracted

    except json.JSONDecodeError as e:
        logger.warning("AI deep extract: JSON parse error: %s", str(e)[:100])
        return {}
    except Exception as e:
        logger.warning("AI deep extract failed: %s", str(e)[:100])
        return {}


def _merge_ai_results(intake_result: dict, ai_data: dict) -> dict:
    """
    Merge AI-extracted data into the intake result, filling gaps only.
    AI data does NOT overwrite existing regex-detected data.
    """
    if not ai_data:
        return intake_result

    # Company name — AI provides much better names than domain prefix
    ai_company = ai_data.get("company_name", "").strip()
    existing_company = intake_result.get("detected_company_name", "")
    if ai_company and len(ai_company) > len(existing_company):
        # AI name is longer/better (e.g. "American University of Sharjah" vs "Aus")
        intake_result["detected_company_name"] = ai_company
        logger.info("AI company name upgrade: '%s' → '%s'", existing_company, ai_company)

    # Industry — override if regex got "other" and AI found something
    ai_industry = ai_data.get("industry", "").strip().lower()
    valid_industries = {
        "ecommerce", "healthcare", "travel", "restaurant", "education", "real_estate",
        "saas", "agency", "design_creative", "engineering", "construction",
        "manufacturing", "technology", "retail", "finance", "logistics",
        "media_entertainment", "nonprofit", "professional_services", "government",
        "telecom", "other",
    }
    if ai_industry in valid_industries and ai_industry != "other":
        current_industry = intake_result.get("detected_industry", "other")
        current_confidence = intake_result.get("industry_confidence", 0)
        if current_industry == "other" or current_confidence < 0.3:
            intake_result["detected_industry"] = ai_industry
            intake_result["industry_confidence"] = max(current_confidence, 0.5)
            logger.info("AI industry override: '%s' → '%s'", current_industry, ai_industry)

    # Country — fill or fix wrong detection
    ai_country = ai_data.get("country", "").strip()
    if ai_country and (not intake_result.get("detected_country") or
                       intake_result.get("detected_country") == "Brazil"):  # Known misdetection
        intake_result["detected_country"] = ai_country
        logger.info("AI country: %s", ai_country)

    # City
    if not intake_result.get("detected_city") and ai_data.get("city"):
        intake_result["detected_city"] = ai_data["city"]

    # Phone numbers
    if not intake_result.get("detected_phone_numbers") and ai_data.get("phone_numbers"):
        phones = ai_data["phone_numbers"]
        if isinstance(phones, list):
            intake_result["detected_phone_numbers"] = [p for p in phones if p][:5]

    # Emails
    if not intake_result.get("detected_emails") and ai_data.get("emails"):
        emails = ai_data["emails"]
        if isinstance(emails, list):
            intake_result["detected_emails"] = [e for e in emails if e and "@" in e][:10]

    # WhatsApp
    if not intake_result.get("detected_whatsapp_links") and ai_data.get("whatsapp"):
        wa = ai_data["whatsapp"]
        if wa:
            intake_result["detected_whatsapp_links"] = [wa] if isinstance(wa, str) else wa[:3]

    # Social profiles — fill per-platform gaps from both URLs and handles
    ai_socials = ai_data.get("social_profiles") or {}
    ai_handles = ai_data.get("social_handles") or {}
    if isinstance(ai_socials, dict) or isinstance(ai_handles, dict):
        existing_socials = intake_result.get("detected_social_links", {})

        # Platform URL templates for constructing from handles
        handle_templates = {
            "instagram": "https://www.instagram.com/{handle}/",
            "facebook": "https://www.facebook.com/{handle}/",
            "twitter": "https://x.com/{handle}",
            "linkedin": "https://www.linkedin.com/company/{handle}",
            "youtube": "https://www.youtube.com/@{handle}",
            "tiktok": "https://www.tiktok.com/@{handle}",
            "snapchat": "https://www.snapchat.com/add/{handle}",
            "pinterest": "https://www.pinterest.com/{handle}/",
        }

        for platform in ["linkedin", "facebook", "instagram", "twitter", "youtube",
                         "tiktok", "snapchat", "pinterest"]:
            existing = existing_socials.get(platform, [])
            if existing:
                continue

            # Try AI-extracted full URL first
            if isinstance(ai_socials, dict) and ai_socials.get(platform):
                ai_url = ai_socials[platform]
                if isinstance(ai_url, str) and ai_url.startswith("http"):
                    existing_socials[platform] = [ai_url]
                    continue

            # Fallback: construct URL from AI-extracted handle
            if isinstance(ai_handles, dict) and ai_handles.get(platform):
                handle = ai_handles[platform]
                if isinstance(handle, str) and handle and platform in handle_templates:
                    # Clean up the handle
                    handle = handle.strip().lstrip("@").strip("/")
                    if handle and len(handle) >= 2:
                        constructed_url = handle_templates[platform].format(handle=handle)
                        existing_socials[platform] = [constructed_url]
                        logger.info("Constructed social URL from AI handle: %s → %s", platform, constructed_url)

        intake_result["detected_social_links"] = existing_socials

    # Services
    if not intake_result.get("detected_services") and ai_data.get("services"):
        services = ai_data["services"]
        if isinstance(services, list):
            intake_result["detected_services"] = [s for s in services if s][:12]

    # Team members
    existing_team = intake_result.get("detected_team", {})
    if not existing_team.get("members") and ai_data.get("team_members"):
        members = ai_data["team_members"]
        if isinstance(members, list):
            valid_members = []
            for m in members:
                if isinstance(m, dict) and m.get("name"):
                    valid_members.append({
                        "name": m["name"],
                        "role": m.get("role", ""),
                    })
            if valid_members:
                existing_team["members"] = valid_members[:10]
                existing_team["count"] = len(valid_members[:10])
                intake_result["detected_team"] = existing_team

    # Address (store as extra metadata)
    if ai_data.get("address"):
        intake_result["detected_address"] = ai_data["address"]

    # Company description
    if ai_data.get("company_description"):
        intake_result["detected_description"] = ai_data["company_description"]

    return intake_result
