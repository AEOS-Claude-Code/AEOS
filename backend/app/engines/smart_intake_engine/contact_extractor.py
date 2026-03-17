"""
AEOS – Smart Intake Engine: Contact Extractor.

Extracts phone numbers, email addresses, WhatsApp links,
contact page URLs, and booking page URLs from HTML.
"""

from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


# ── Phone patterns ───────────────────────────────────────────────

PHONE_REGEX = re.compile(
    r"""
    (?:tel:|phone:|call\s*:?\s*)?     # optional prefix
    (?:\+?\d{1,4}[\s.-]?)?            # country code
    \(?\d{1,5}\)?                     # area code
    [\s.-]?\d{2,5}                    # first group
    [\s.-]?\d{2,5}                    # second group
    (?:[\s.-]?\d{1,5})?              # optional extension
    """,
    re.VERBOSE,
)


def _clean_phone(raw: str) -> str:
    """Strip non-digit chars except + for country code."""
    digits = re.sub(r"[^\d+]", "", raw)
    if len(digits) < 7 or len(digits) > 16:
        return ""
    return digits


# ── Email patterns ───────────────────────────────────────────────

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
)

EXCLUDED_EMAIL_DOMAINS = {
    "example.com", "sentry.io", "wixpress.com", "googleapis.com",
    "w3.org", "schema.org", "gravatar.com", "wordpress.org",
}


# ── WhatsApp patterns ────────────────────────────────────────────

WHATSAPP_PATTERNS = [
    re.compile(r"https?://(?:api\.)?wa\.me/[\d+]+", re.IGNORECASE),
    re.compile(r"https?://(?:web\.)?whatsapp\.com/send\?[^\s\"'<>]+", re.IGNORECASE),
    re.compile(r"whatsapp://send\?[^\s\"'<>]+", re.IGNORECASE),
]


# ── Contact / Booking page patterns ─────────────────────────────

CONTACT_PAGE_KEYWORDS = [
    "contact", "kontakt", "contacto", "contato",
    "reach-us", "reach_us", "get-in-touch", "get_in_touch",
    "enquiry", "inquiry", "support",
]

BOOKING_PAGE_KEYWORDS = [
    "book", "booking", "appointment", "schedule", "reserve",
    "reservation", "calendly", "acuity", "cal.com",
]


def extract_contacts(html: str, base_url: str) -> dict:
    """
    Extract all contact information from HTML.
    Returns dict with phones, emails, whatsapp links, contact pages, booking pages.
    """
    result = {
        "phone_numbers": [],
        "emails": [],
        "whatsapp_links": [],
        "contact_pages": [],
        "booking_pages": [],
    }

    if not html:
        return result

    # ── Extract from raw HTML text ──

    # Phones from tel: links and visible text
    tel_links = re.findall(r'href=["\']tel:([^"\']+)', html)
    for raw in tel_links:
        cleaned = _clean_phone(raw)
        if cleaned and cleaned not in result["phone_numbers"]:
            result["phone_numbers"].append(cleaned)

    # Emails (exclude common non-human emails)
    for email in EMAIL_REGEX.findall(html):
        email_lower = email.lower()
        domain = email_lower.split("@")[1] if "@" in email_lower else ""
        if domain not in EXCLUDED_EMAIL_DOMAINS and email_lower not in result["emails"]:
            result["emails"].append(email_lower)

    # WhatsApp links
    for pattern in WHATSAPP_PATTERNS:
        for match in pattern.findall(html):
            if match not in result["whatsapp_links"]:
                result["whatsapp_links"].append(match)

    # ── Extract from parsed HTML (links) ──

    if HAS_BS4:
        soup = BeautifulSoup(html, "lxml")
        domain = urlparse(base_url).netloc

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            full_url = urljoin(base_url, href)
            href_lower = href.lower()
            text_lower = a.get_text(strip=True).lower()

            # Phone from visible phone-like numbers
            if href_lower.startswith("tel:"):
                cleaned = _clean_phone(href[4:])
                if cleaned and cleaned not in result["phone_numbers"]:
                    result["phone_numbers"].append(cleaned)

            # WhatsApp from link text
            if "whatsapp" in href_lower or "wa.me" in href_lower:
                if full_url not in result["whatsapp_links"]:
                    result["whatsapp_links"].append(full_url)

            # Internal links only for contact/booking detection
            if domain not in full_url:
                # External booking platforms
                for kw in BOOKING_PAGE_KEYWORDS:
                    if kw in href_lower:
                        if full_url not in result["booking_pages"]:
                            result["booking_pages"].append(full_url)
                        break
                continue

            # Contact pages
            for kw in CONTACT_PAGE_KEYWORDS:
                if kw in href_lower or kw in text_lower:
                    if full_url not in result["contact_pages"]:
                        result["contact_pages"].append(full_url)
                    break

            # Booking pages
            for kw in BOOKING_PAGE_KEYWORDS:
                if kw in href_lower or kw in text_lower:
                    if full_url not in result["booking_pages"]:
                        result["booking_pages"].append(full_url)
                    break

    # Cap results
    result["phone_numbers"] = result["phone_numbers"][:5]
    result["emails"] = result["emails"][:10]
    result["whatsapp_links"] = result["whatsapp_links"][:3]
    result["contact_pages"] = result["contact_pages"][:3]
    result["booking_pages"] = result["booking_pages"][:3]

    return result
