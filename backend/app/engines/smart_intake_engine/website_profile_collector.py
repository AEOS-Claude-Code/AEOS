"""
AEOS – Smart Intake Engine: Website Profile Collector.

Fetches and parses a website to extract company name, page title,
meta description, and raw HTML for downstream extractors.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("aeos.engine.intake.website")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


def _domain_to_name(url: str) -> str:
    """Derive a company name from the domain."""
    parsed = urlparse(url)
    host = parsed.netloc or parsed.path.split("/")[0]
    name = host.replace("www.", "").split(".")[0]
    # Split on hyphens/underscores and title-case
    parts = re.split(r"[-_]", name)
    return " ".join(p.capitalize() for p in parts if p)


async def collect_website_profile(url: str) -> dict:
    """
    Fetch website and extract basic profile data.
    Returns dict with: html, title, description, detected_company_name, url.
    """
    result = {
        "url": url,
        "html": "",
        "title": "",
        "description": "",
        "detected_company_name": _domain_to_name(url),
        "og_site_name": "",
        "headings": [],
    }

    if not url or not url.startswith("http"):
        return result

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AEOS-IntakeBot/1.0"})
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        logger.info("Could not fetch %s: %s", url, str(e)[:100])
        return result

    result["html"] = html

    if not HAS_BS4:
        return result

    soup = BeautifulSoup(html, "lxml")

    # Title
    title_tag = soup.find("title")
    if title_tag:
        result["title"] = title_tag.get_text(strip=True)[:500]

    # Meta description
    meta = soup.find("meta", attrs={"name": "description"})
    if meta:
        result["description"] = meta.get("content", "")[:1000]

    # OG site name (often the real company name)
    og_name = soup.find("meta", attrs={"property": "og:site_name"})
    if og_name:
        result["og_site_name"] = og_name.get("content", "").strip()[:200]

    # Derive best company name
    if result["og_site_name"]:
        result["detected_company_name"] = result["og_site_name"]
    elif result["title"]:
        # Try to extract company name from title (before separator)
        for sep in [" | ", " - ", " – ", " — ", " :: ", " : "]:
            if sep in result["title"]:
                candidate = result["title"].split(sep)[0].strip()
                if 2 < len(candidate) < 60:
                    result["detected_company_name"] = candidate
                    break

    # H1/H2 headings for industry inference
    for level in ["h1", "h2"]:
        for tag in soup.find_all(level, limit=5):
            text = tag.get_text(strip=True)
            if text:
                result["headings"].append(text[:200])

    return result
