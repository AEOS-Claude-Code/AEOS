"""
AEOS – Smart Intake Engine: Contact Extractor.

Extracts phone numbers, email addresses, WhatsApp links,
contact page URLs, and booking page URLs from HTML.

Enhanced extraction:
- Scans footer and header sections specifically
- Extracts from Schema.org JSON-LD structured data
- Detects phone numbers from visible text (not just tel: links)
- Extracts addresses and physical location info
"""

from __future__ import annotations

import json
import logging
import re
from urllib.parse import urljoin, urlparse, unquote

logger = logging.getLogger("aeos.engine.intake.contacts")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


# ── Phone patterns ───────────────────────────────────────────────

# International phone pattern: matches +971-XX-XXX-XXXX, (966) 5XX XXX XXXX, etc.
PHONE_REGEX = re.compile(
    r"""
    (?:                            # start group
      (?:\+|00)                    # + or 00 prefix
      \d{1,4}                      # country code (1-4 digits)
      [\s.\-()]*                   # separator
    )?
    (?:\(?\d{1,5}\)?)              # area code with optional parens
    [\s.\-]*                       # separator
    \d{2,5}                        # first number group
    [\s.\-]*                       # separator
    \d{2,5}                        # second number group
    (?:[\s.\-]*\d{1,5})?           # optional third group
    """,
    re.VERBOSE,
)

# Stricter pattern for phone numbers in visible text (requires country code or min 8 digits)
STRICT_PHONE_REGEX = re.compile(
    r"""
    (?:                            # country code required
      (?:\+|00)
      \d{1,4}
      [\s.\-()]*
    )
    (?:\(?\d{1,5}\)?)              # area code
    [\s.\-]*
    \d{2,5}
    [\s.\-]*
    \d{2,5}
    (?:[\s.\-]*\d{1,5})?
    """,
    re.VERBOSE,
)


def _clean_phone(raw: str) -> str:
    """Strip non-digit chars except + for country code."""
    # Keep the original format for display but validate
    digits = re.sub(r"[^\d+]", "", raw)
    if len(digits) < 7 or len(digits) > 16:
        return ""
    # Return a nicely formatted version
    return raw.strip()


def _normalize_phone(raw: str) -> str:
    """Get just digits+plus for dedup."""
    return re.sub(r"[^\d+]", "", raw)


# ── Email patterns ───────────────────────────────────────────────

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
)

EXCLUDED_EMAIL_DOMAINS = {
    "example.com", "sentry.io", "wixpress.com", "googleapis.com",
    "w3.org", "schema.org", "gravatar.com", "wordpress.org",
    "sentry-next.wixpress.com", "googleusercontent.com",
    "gstatic.com", "fonts.googleapis.com", "jquery.com",
    "cloudflare.com", "bootstrapcdn.com",
}

EXCLUDED_EMAIL_PREFIXES = {
    "noreply", "no-reply", "donotreply", "mailer-daemon",
    "postmaster", "webmaster", "admin@localhost",
}


# ── WhatsApp patterns ────────────────────────────────────────────

WHATSAPP_PATTERNS = [
    re.compile(r"https?://(?:api\.)?wa\.me/[\d+]+[^\s\"'<>]*", re.IGNORECASE),
    re.compile(r"https?://(?:web\.)?whatsapp\.com/send\?[^\s\"'<>]+", re.IGNORECASE),
    re.compile(r"whatsapp://send\?[^\s\"'<>]+", re.IGNORECASE),
]


# ── Contact / Booking page patterns ─────────────────────────────

CONTACT_PAGE_KEYWORDS = [
    "contact", "kontakt", "contacto", "contato", "اتصل",
    "reach-us", "reach_us", "get-in-touch", "get_in_touch",
    "enquiry", "inquiry", "support", "about-us", "about_us",
    "connect", "talk-to-us",
]

BOOKING_PAGE_KEYWORDS = [
    "book", "booking", "appointment", "schedule", "reserve",
    "reservation", "calendly", "acuity", "cal.com",
    "demo", "free-trial", "consultation",
]


def _extract_schema_org(html: str) -> dict:
    """Extract contact info from Schema.org JSON-LD structured data."""
    result = {"phones": [], "emails": [], "address": "", "name": ""}

    try:
        # Find all JSON-LD blocks
        for match in re.finditer(
            r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html,
            re.DOTALL | re.IGNORECASE,
        ):
            try:
                data = json.loads(match.group(1).strip())
                _extract_from_jsonld(data, result)
            except (json.JSONDecodeError, ValueError):
                continue
    except Exception:
        pass

    return result


def _extract_from_jsonld(data: dict | list, result: dict) -> None:
    """Recursively extract contact info from JSON-LD data."""
    if isinstance(data, list):
        for item in data:
            _extract_from_jsonld(item, result)
        return

    if not isinstance(data, dict):
        return

    # Phone number
    for key in ["telephone", "phone", "contactPoint"]:
        val = data.get(key)
        if isinstance(val, str) and val.strip():
            result["phones"].append(val.strip())
        elif isinstance(val, dict):
            phone = val.get("telephone", "")
            if phone:
                result["phones"].append(phone)
        elif isinstance(val, list):
            for item in val:
                if isinstance(item, str):
                    result["phones"].append(item)
                elif isinstance(item, dict) and item.get("telephone"):
                    result["phones"].append(item["telephone"])

    # Email
    for key in ["email"]:
        val = data.get(key)
        if isinstance(val, str) and "@" in val:
            result["emails"].append(val.strip())
        elif isinstance(val, list):
            for item in val:
                if isinstance(item, str) and "@" in item:
                    result["emails"].append(item.strip())

    # Address
    addr = data.get("address")
    if isinstance(addr, dict):
        parts = []
        for k in ["streetAddress", "addressLocality", "addressRegion", "addressCountry", "postalCode"]:
            v = addr.get(k, "")
            if v:
                parts.append(str(v))
        if parts:
            result["address"] = ", ".join(parts)
    elif isinstance(addr, str) and addr.strip():
        result["address"] = addr.strip()

    # Name
    name = data.get("name", "")
    if isinstance(name, str) and name.strip() and not result["name"]:
        result["name"] = name.strip()

    # Recurse into nested structures
    for key, val in data.items():
        if isinstance(val, (dict, list)):
            _extract_from_jsonld(val, result)


def _extract_from_footer(soup) -> dict:
    """Extract contact info specifically from footer, header, and contact sections."""
    result = {"phones": [], "emails": [], "text": ""}

    # Target footer, header, and contact-related sections
    selectors = [
        "footer",
        "[class*='footer']",
        "[id*='footer']",
        "[class*='contact']",
        "[id*='contact']",
        "[class*='header']",
        "[class*='topbar']",
        "[class*='top-bar']",
        "[class*='info-bar']",
    ]

    texts = []
    for sel in selectors:
        for el in soup.select(sel):
            text = el.get_text(separator=" ", strip=True)
            texts.append(text)

            # Look for tel: links within these sections
            for a in el.find_all("a", href=True):
                href = a["href"].strip()
                if href.startswith("tel:"):
                    phone = href[4:].strip()
                    if phone:
                        result["phones"].append(phone)
                elif href.startswith("mailto:"):
                    email = unquote(href[7:]).strip().split("?")[0]
                    if "@" in email:
                        result["emails"].append(email.lower())

    result["text"] = " ".join(texts)

    # Extract phones from footer text using strict regex
    for text in texts:
        for match in STRICT_PHONE_REGEX.finditer(text):
            phone = match.group().strip()
            cleaned = _normalize_phone(phone)
            if 7 <= len(cleaned.replace("+", "")) <= 15:
                result["phones"].append(phone)

    # Extract emails from footer text
    for text in texts:
        for email in EMAIL_REGEX.findall(text):
            result["emails"].append(email.lower())

    return result


def extract_contacts(html: str, base_url: str) -> dict:
    """
    Extract all contact information from HTML.
    Uses multiple strategies: tel: links, footer scanning, Schema.org, regex.
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

    seen_phones: set[str] = set()
    seen_emails: set[str] = set()

    def add_phone(raw: str) -> None:
        norm = _normalize_phone(raw)
        if norm and norm not in seen_phones and 7 <= len(norm.replace("+", "")) <= 15:
            seen_phones.add(norm)
            # Store the original formatted version
            result["phone_numbers"].append(raw.strip())

    def add_email(email: str) -> None:
        # URL-decode (handles %20, %40, etc. from mailto: links)
        email = unquote(email).strip().lower()
        if email in seen_emails:
            return
        domain = email.split("@")[1] if "@" in email else ""
        prefix = email.split("@")[0] if "@" in email else ""
        if domain in EXCLUDED_EMAIL_DOMAINS:
            return
        if prefix in EXCLUDED_EMAIL_PREFIXES:
            return
        # Skip emails that look like CSS/JS artifacts
        if len(email) > 80 or ".min." in email or "bundle" in email:
            return
        seen_emails.add(email)
        result["emails"].append(email)

    # ── 1. Extract from Schema.org JSON-LD ──
    schema_data = _extract_schema_org(html)
    for phone in schema_data["phones"]:
        add_phone(phone)
    for email in schema_data["emails"]:
        add_email(email)

    # ── 2. Extract from tel: and mailto: links in raw HTML ──
    for match in re.finditer(r'href=["\']tel:([^"\']+)', html):
        add_phone(match.group(1))

    for match in re.finditer(r'href=["\']mailto:([^"\'?]+)', html):
        add_email(match.group(1))

    # ── 3. WhatsApp links ──
    for pattern in WHATSAPP_PATTERNS:
        for match in pattern.findall(html):
            if match not in result["whatsapp_links"]:
                result["whatsapp_links"].append(match)

    # ── 4. Parse HTML with BeautifulSoup ──
    if HAS_BS4:
        soup = BeautifulSoup(html, "lxml")
        domain = urlparse(base_url).netloc

        # 4a. Extract from footer/header/contact sections
        footer_data = _extract_from_footer(soup)
        for phone in footer_data["phones"]:
            add_phone(phone)
        for email in footer_data["emails"]:
            add_email(email)

        # 4b. Extract from all links
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            full_url = urljoin(base_url, href)
            href_lower = href.lower()
            text_lower = a.get_text(strip=True).lower()

            # Phone from tel: links
            if href_lower.startswith("tel:"):
                add_phone(href[4:])

            # Email from mailto: links
            if href_lower.startswith("mailto:"):
                email = href[7:].split("?")[0]
                add_email(email)

            # WhatsApp from links
            if "whatsapp" in href_lower or "wa.me" in href_lower:
                if full_url not in result["whatsapp_links"]:
                    result["whatsapp_links"].append(full_url)

            # Internal links only for contact/booking detection
            if domain not in full_url:
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

        # 4c. Scan for phone numbers in visible text near phone-related keywords
        for el in soup.find_all(string=re.compile(r'(?:phone|tel|call|mobile|fax|whatsapp|واتساب|هاتف|جوال)', re.I)):
            parent = el.parent
            if parent:
                nearby_text = parent.get_text(separator=" ", strip=True)
                for match in STRICT_PHONE_REGEX.finditer(nearby_text):
                    add_phone(match.group())

        # 4d. Look for emails in visible text near email-related keywords
        for el in soup.find_all(string=re.compile(r'(?:email|mail|e-mail|بريد)', re.I)):
            parent = el.parent
            if parent:
                nearby_text = parent.get_text(separator=" ", strip=True)
                for email in EMAIL_REGEX.findall(nearby_text):
                    add_email(email)

    # ── 5. Fallback: scan visible text for phones with country codes ──
    if not result["phone_numbers"]:
        # If nothing found yet, search entire visible text
        if HAS_BS4:
            visible_text = soup.get_text(separator=" ", strip=True)
        else:
            visible_text = re.sub(r'<[^>]+>', ' ', html)

        for match in STRICT_PHONE_REGEX.finditer(visible_text):
            add_phone(match.group())

    # ── 6. Extra fallback: look for any clickable phone-like patterns in HTML ──
    if not result["phone_numbers"]:
        # Some sites hide phones in onclick, data attributes, or JS
        for match in re.finditer(r'["\']((?:\+|00)\d[\d\s\-().]{6,18}\d)["\']', html):
            candidate = match.group(1).strip()
            digits = re.sub(r"[^\d]", "", candidate)
            if 8 <= len(digits) <= 15:
                add_phone(candidate)
                if len(result["phone_numbers"]) >= 3:
                    break

    # Cap results
    result["phone_numbers"] = result["phone_numbers"][:5]
    result["emails"] = result["emails"][:10]
    result["whatsapp_links"] = result["whatsapp_links"][:3]
    result["contact_pages"] = result["contact_pages"][:3]
    result["booking_pages"] = result["booking_pages"][:3]

    logger.info(
        "Contact extraction: %d phones, %d emails, %d whatsapp, %d contact pages",
        len(result["phone_numbers"]),
        len(result["emails"]),
        len(result["whatsapp_links"]),
        len(result["contact_pages"]),
    )

    return result
