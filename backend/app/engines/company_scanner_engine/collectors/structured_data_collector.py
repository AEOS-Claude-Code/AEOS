"""
AEOS – Company Scanner: Structured Data Detector.

Phase 7: Detects Open Graph, Twitter Cards, Schema.org, and favicon.
"""

from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger("aeos.engine.scanner.structured_data")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


def detect_structured_data(html: str) -> dict:
    """Detect structured data in HTML."""
    result = {
        "has_open_graph": False,
        "og_tags": {},
        "has_twitter_cards": False,
        "twitter_tags": {},
        "has_schema_org": False,
        "schema_types": [],
        "has_favicon": False,
        "has_canonical": False,
        "canonical_url": "",
        "score": 0,
    }

    if not html or not HAS_BS4:
        return result

    try:
        soup = BeautifulSoup(html, "lxml")

        # Open Graph tags
        og_tags = {}
        for meta in soup.find_all("meta", attrs={"property": re.compile(r"^og:")}):
            prop = meta.get("property", "")
            content = meta.get("content", "")
            if prop and content:
                og_tags[prop] = content[:200]
        result["og_tags"] = og_tags
        result["has_open_graph"] = len(og_tags) > 0

        # Twitter Card tags
        twitter_tags = {}
        for meta in soup.find_all("meta", attrs={"name": re.compile(r"^twitter:")}):
            name = meta.get("name", "")
            content = meta.get("content", "")
            if name and content:
                twitter_tags[name] = content[:200]
        result["twitter_tags"] = twitter_tags
        result["has_twitter_cards"] = len(twitter_tags) > 0

        # Schema.org (JSON-LD)
        schema_types = set()
        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                data = json.loads(script.string or "")
                if isinstance(data, dict):
                    if "@type" in data:
                        schema_types.add(data["@type"])
                    if "@graph" in data and isinstance(data["@graph"], list):
                        for item in data["@graph"]:
                            if isinstance(item, dict) and "@type" in item:
                                schema_types.add(item["@type"])
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and "@type" in item:
                            schema_types.add(item["@type"])
            except (json.JSONDecodeError, TypeError):
                continue

        # Also check for microdata
        for elem in soup.find_all(attrs={"itemtype": True}):
            itemtype = elem.get("itemtype", "")
            if "schema.org" in itemtype:
                type_name = itemtype.rstrip("/").rsplit("/", 1)[-1]
                schema_types.add(type_name)

        result["schema_types"] = sorted(schema_types)
        result["has_schema_org"] = len(schema_types) > 0

        # Favicon
        favicon_selectors = [
            ("link", {"rel": "icon"}),
            ("link", {"rel": "shortcut icon"}),
            ("link", {"rel": "apple-touch-icon"}),
        ]
        for tag, attrs in favicon_selectors:
            if soup.find(tag, attrs=attrs):
                result["has_favicon"] = True
                break

        # Canonical URL
        canonical = soup.find("link", attrs={"rel": "canonical"})
        if canonical and canonical.get("href"):
            result["has_canonical"] = True
            result["canonical_url"] = canonical["href"][:500]

        # Score calculation (max 100)
        score = 0
        if result["has_open_graph"]:
            score += 25
            if len(og_tags) >= 4:  # og:title, og:description, og:image, og:url
                score += 5
        if result["has_twitter_cards"]:
            score += 20
        if result["has_schema_org"]:
            score += 25
        if result["has_favicon"]:
            score += 10
        if result["has_canonical"]:
            score += 15

        result["score"] = min(100, score)

    except Exception as e:
        logger.warning("Structured data detection failed: %s", str(e)[:100])

    return result
