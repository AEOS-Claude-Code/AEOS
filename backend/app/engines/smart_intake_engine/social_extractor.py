"""
AEOS – Smart Intake Engine: Social Media Extractor.

Detects social media profile URLs from HTML, returning actual URLs
(not just boolean presence like the scanner's social_collector).
"""

from __future__ import annotations

import re
from urllib.parse import urljoin

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


SOCIAL_DOMAINS: dict[str, list[str]] = {
    "linkedin": ["linkedin.com/company/", "linkedin.com/in/"],
    "facebook": ["facebook.com/", "fb.com/"],
    "instagram": ["instagram.com/"],
    "twitter": ["twitter.com/", "x.com/"],
    "youtube": ["youtube.com/", "youtu.be/"],
    "tiktok": ["tiktok.com/@"],
    "pinterest": ["pinterest.com/"],
    "snapchat": ["snapchat.com/add/"],
}


def extract_social_links(html: str, base_url: str = "") -> dict[str, list[str]]:
    """
    Extract social media profile URLs from HTML.
    Returns dict mapping platform -> list of detected URLs.
    """
    result: dict[str, list[str]] = {platform: [] for platform in SOCIAL_DOMAINS}

    if not html:
        return result

    if not HAS_BS4:
        # Fallback: regex on raw HTML
        return _extract_from_raw(html)

    soup = BeautifulSoup(html, "lxml")

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith("#") or href.startswith("javascript:"):
            continue

        full_url = urljoin(base_url, href) if not href.startswith("http") else href
        href_lower = full_url.lower()

        for platform, domains in SOCIAL_DOMAINS.items():
            for domain in domains:
                if domain in href_lower:
                    # Avoid duplicate and generic links
                    if full_url not in result[platform] and len(full_url) > len("https://" + domain):
                        result[platform].append(full_url)
                    break

    # Cap at 2 URLs per platform
    for platform in result:
        result[platform] = result[platform][:2]

    return result


def _extract_from_raw(html: str) -> dict[str, list[str]]:
    """Fallback extraction using regex on raw HTML."""
    result: dict[str, list[str]] = {platform: [] for platform in SOCIAL_DOMAINS}

    url_pattern = re.compile(r'https?://[^\s"\'<>]+')
    for match in url_pattern.findall(html):
        match_lower = match.lower()
        for platform, domains in SOCIAL_DOMAINS.items():
            for domain in domains:
                if domain in match_lower and match not in result[platform]:
                    result[platform].append(match)
                    break

    for platform in result:
        result[platform] = result[platform][:2]

    return result


def flatten_social_links(social: dict[str, list[str]]) -> dict[str, str]:
    """Convert platform -> [urls] to platform -> first_url for profile storage."""
    flat = {}
    for platform, urls in social.items():
        if urls:
            flat[platform] = urls[0]
    return flat
