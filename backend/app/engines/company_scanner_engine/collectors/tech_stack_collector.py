"""
AEOS – Company Scanner: Tech Stack Detector.

Detects technologies by scanning HTML source for known signatures.
Falls back to URL-based heuristic when HTML is unavailable.
"""

from __future__ import annotations

from urllib.parse import urlparse


# Pattern → technology name
HTML_SIGNATURES: dict[str, str] = {
    "wp-content": "WordPress",
    "wp-includes": "WordPress",
    "/wp-json/": "WordPress",
    "cdn.shopify.com": "Shopify",
    "myshopify.com": "Shopify",
    "google-analytics.com": "Google Analytics",
    "googletagmanager.com": "Google Tag Manager",
    "gtag/js": "Google Analytics",
    "cloudflare": "Cloudflare",
    "cf-ray": "Cloudflare",
    "react": "React",
    "next/static": "Next.js",
    "__next": "Next.js",
    "vue.min.js": "Vue.js",
    "angular": "Angular",
    "bootstrap": "Bootstrap",
    "tailwind": "Tailwind CSS",
    "jquery": "jQuery",
    "stripe.com": "Stripe",
    "fonts.googleapis.com": "Google Fonts",
    "hotjar.com": "Hotjar",
    "hubspot": "HubSpot",
    "mailchimp": "Mailchimp",
    "intercom": "Intercom",
    "zendesk": "Zendesk",
    "wix.com": "Wix",
    "squarespace.com": "Squarespace",
    "webflow.io": "Webflow",
}

# URL domain patterns → technology
DOMAIN_HINTS: dict[str, list[str]] = {
    "shopify": ["Shopify"],
    "wix": ["Wix"],
    "squarespace": ["Squarespace"],
    "webflow": ["Webflow"],
    "wordpress": ["WordPress"],
    "ghost": ["Ghost"],
}


def detect_tech_from_html(html: str) -> list[str]:
    """Scan HTML for known technology signatures."""
    detected = set()

    if not html:
        return []

    html_lower = html.lower()
    for pattern, tech in HTML_SIGNATURES.items():
        if pattern.lower() in html_lower:
            detected.add(tech)

    return sorted(detected)


def detect_tech_from_url(url: str) -> list[str]:
    """Heuristic tech detection from URL/domain."""
    detected = set()

    if not url:
        return []

    url_lower = url.lower()
    for hint, techs in DOMAIN_HINTS.items():
        if hint in url_lower:
            detected.update(techs)

    return sorted(detected)


def merge_tech(html_stack: list[str], url_stack: list[str]) -> list[str]:
    """Merge tech stacks from both sources."""
    combined = set(html_stack + url_stack)
    return sorted(combined)
