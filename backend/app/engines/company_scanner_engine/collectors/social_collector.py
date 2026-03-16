"""
AEOS – Company Scanner: Social Media Detector.

Detects social media presence from HTML links and workspace profile data.
"""

from __future__ import annotations

import re

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


SOCIAL_PATTERNS: dict[str, list[str]] = {
    "linkedin": ["linkedin.com"],
    "facebook": ["facebook.com", "fb.com"],
    "instagram": ["instagram.com"],
    "twitter": ["twitter.com", "x.com"],
    "youtube": ["youtube.com", "youtu.be"],
}


def detect_social_from_html(html: str) -> dict[str, bool]:
    """Scan HTML for social media links."""
    result = {platform: False for platform in SOCIAL_PATTERNS}

    if not html:
        return result

    html_lower = html.lower()
    for platform, domains in SOCIAL_PATTERNS.items():
        for domain in domains:
            if domain in html_lower:
                result[platform] = True
                break

    return result


def detect_social_from_profile(social_links: dict | None) -> dict[str, bool]:
    """Detect social presence from workspace profile social_links field."""
    result = {platform: False for platform in SOCIAL_PATTERNS}

    if not social_links:
        return result

    for key, value in social_links.items():
        if not value:
            continue
        key_lower = key.lower()
        value_lower = str(value).lower()

        for platform, domains in SOCIAL_PATTERNS.items():
            if platform in key_lower:
                result[platform] = True
                break
            for domain in domains:
                if domain in value_lower:
                    result[platform] = True
                    break

    return result


def merge_social(html_result: dict[str, bool], profile_result: dict[str, bool]) -> dict[str, bool]:
    """Merge social detection from both sources (OR logic)."""
    merged = {}
    for platform in SOCIAL_PATTERNS:
        merged[platform] = html_result.get(platform, False) or profile_result.get(platform, False)
    return merged
