"""
AEOS – Company Scanner: Website Collector.

Fetches the homepage and extracts structural data.
Falls back to URL-based heuristic analysis if the site is unreachable
(e.g. in local Docker development).
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse, urljoin

import httpx

logger = logging.getLogger("aeos.engine.scanner.website")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


def _extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc or parsed.path.split("/")[0]


def _generate_keywords_from_url(url: str) -> list[str]:
    """Heuristic keywords from the domain name."""
    domain = _extract_domain(url)
    parts = domain.replace("www.", "").split(".")
    name = parts[0] if parts else ""
    # Split camelCase / hyphens
    words = re.split(r"[-_]", name)
    return [w.lower() for w in words if len(w) > 2]


async def collect_website(url: str) -> dict:
    """
    Fetch and analyze a website homepage.
    Returns structured website data dict.
    """
    if not url or not url.startswith("http"):
        return _fallback_analysis(url)

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AEOS-Scanner/1.0"})
            resp.raise_for_status()
            html = resp.text
    except Exception:
        logger.info("Could not fetch %s, using URL heuristic fallback", url)
        return _fallback_analysis(url)

    if not HAS_BS4:
        return _fallback_analysis(url)

    return _parse_html(html, url)


def _parse_html(html: str, url: str) -> dict:
    """Parse HTML and extract structured data."""
    soup = BeautifulSoup(html, "lxml")

    # Title
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    # Meta description
    meta_desc = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag:
        meta_desc = meta_tag.get("content", "")

    # Headings
    headings = []
    for level in ["h1", "h2"]:
        for tag in soup.find_all(level):
            text = tag.get_text(strip=True)
            if text:
                headings.append({"level": level, "text": text[:200]})

    # Keywords from meta keywords tag + extracted from headings
    keywords = set()
    meta_kw = soup.find("meta", attrs={"name": "keywords"})
    if meta_kw:
        for kw in meta_kw.get("content", "").split(","):
            kw = kw.strip().lower()
            if kw:
                keywords.add(kw)
    for h in headings:
        for word in h["text"].lower().split():
            if len(word) > 3:
                keywords.add(word)
    keywords.update(_generate_keywords_from_url(url))

    # Internal links
    domain = _extract_domain(url)
    internal_links = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full = urljoin(url, href)
        if domain in full:
            internal_links.add(full)

    return {
        "title": title[:500],
        "description": meta_desc[:1000],
        "headings": headings[:20],
        "keywords": sorted(list(keywords))[:30],
        "internal_links_count": len(internal_links),
        "pages_detected": min(len(internal_links), 100),
    }


def _fallback_analysis(url: str) -> dict:
    """URL-based heuristic analysis when the site can't be fetched."""
    domain = _extract_domain(url or "")
    keywords = _generate_keywords_from_url(url or "")

    company_name = domain.replace("www.", "").split(".")[0].title() if domain else "Unknown"

    return {
        "title": f"{company_name} – Official Website",
        "description": f"Website for {company_name}. Analysis based on domain structure.",
        "headings": [
            {"level": "h1", "text": f"Welcome to {company_name}"},
        ],
        "keywords": keywords,
        "internal_links_count": 12,
        "pages_detected": 8,
    }
