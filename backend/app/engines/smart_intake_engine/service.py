"""
AEOS – Smart Intake Engine: Service layer.

Orchestrates website profile collection, contact extraction,
social detection, tech stack detection, and industry inference.
"""

from __future__ import annotations

import json
import logging
import re
from urllib.parse import urlparse

from .website_profile_collector import collect_website_profile
from .contact_extractor import extract_contacts
from .social_extractor import extract_social_links
from .industry_inference import infer_industry, detect_location

logger = logging.getLogger("aeos.engine.intake")


# ── Industry competitor lookup ────────────────────────────────────────

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


def _detect_competitors(industry: str, country: str, url: str) -> list[dict]:
    """Return well-known competitors for the given industry, filtering out the scanned company."""
    competitors = INDUSTRY_COMPETITORS.get(industry, [])
    if not competitors:
        return []

    # Filter out the scanned company's own domain
    try:
        scanned_domain = urlparse(url).netloc.replace("www.", "").lower()
    except Exception:
        scanned_domain = ""

    result = []
    for comp in competitors:
        try:
            comp_domain = urlparse(comp["url"]).netloc.replace("www.", "").lower()
        except Exception:
            comp_domain = ""
        if comp_domain and scanned_domain and comp_domain == scanned_domain:
            continue
        result.append(comp)

    return result


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

    # 8. Detect competitors
    competitors = _detect_competitors(
        industry=industry_result["detected_industry"],
        country=location.get("country", ""),
        url=url,
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
