"""
AEOS – Smart Intake Engine: Website Profile Collector.

Fetches and parses a website to extract company name, page title,
meta description, and raw HTML for downstream extractors.

Uses httpx with browser-like headers for reliable fetching.
Lightweight and memory-efficient — no headless browser required.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse, urljoin

import httpx

logger = logging.getLogger("aeos.engine.intake.website")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

# Browser-like headers to avoid being blocked
_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


def _domain_to_name(url: str) -> str:
    """Derive a company name from the domain."""
    parsed = urlparse(url)
    host = parsed.netloc or parsed.path.split("/")[0]
    name = host.replace("www.", "").split(".")[0]
    # Split on hyphens/underscores and title-case
    parts = re.split(r"[-_]", name)
    return " ".join(p.capitalize() for p in parts if p)


async def _fetch_html(url: str, timeout: int = 15) -> str | None:
    """Fetch page HTML with browser-like headers."""
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
        ) as client:
            resp = await client.get(url, headers=_BROWSER_HEADERS)
            resp.raise_for_status()
            return resp.text
    except Exception as e:
        logger.info("Fetch failed for %s: %s", url, str(e)[:100])
        return None


async def collect_website_profile(url: str, lightweight: bool = False) -> dict:
    """
    Fetch website and extract basic profile data.
    Uses httpx with browser-like headers (lightweight, no Chromium).
    The `lightweight` parameter is accepted for API compatibility but
    all fetches are now lightweight by default.
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

    html = await _fetch_html(url)

    if not html:
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
        # Try to extract company name from title (pick the best part)
        for sep in [" | ", " - ", " – ", " — ", " :: ", " : "]:
            if sep in result["title"]:
                parts = [p.strip() for p in result["title"].split(sep) if p.strip()]
                if not parts:
                    continue
                # Pick the part that looks most like a company name:
                # - Shorter part is usually the company name
                # - Part with fewer common words is usually the name
                # - Part that matches domain name is preferred
                _desc_words = {"in", "for", "the", "of", "and", "with", "our", "your",
                               "best", "top", "leading", "official", "welcome", "home"}
                best = parts[0]
                for part in parts:
                    if 2 < len(part) < 60:
                        part_lower_words = set(part.lower().split())
                        desc_overlap = len(part_lower_words & _desc_words)
                        best_lower_words = set(best.lower().split())
                        best_desc_overlap = len(best_lower_words & _desc_words)
                        # Prefer part with fewer descriptive words and shorter length
                        if desc_overlap < best_desc_overlap or (
                            desc_overlap == best_desc_overlap and len(part) < len(best)
                        ):
                            best = part
                if 2 < len(best) < 60:
                    result["detected_company_name"] = best
                break

    # OG image
    og_image_tag = soup.find("meta", attrs={"property": "og:image"})
    if og_image_tag:
        og_img = og_image_tag.get("content", "").strip()
        if og_img:
            result["og_image"] = urljoin(url, og_img)

    # Favicon
    favicon_tag = soup.find("link", rel=lambda r: r and "icon" in r)
    if favicon_tag:
        fav_href = favicon_tag.get("href", "").strip()
        if fav_href:
            result["favicon_url"] = urljoin(url, fav_href)
    if not result.get("favicon_url"):
        result["favicon_url"] = urljoin(url, "/favicon.ico")

    # Detected languages
    languages: list[str] = []
    html_tag = soup.find("html")
    if html_tag:
        lang_attr = html_tag.get("lang", "")
        if lang_attr:
            languages.append(lang_attr.strip().lower().split("-")[0])
    for link_tag in soup.find_all("link", attrs={"hreflang": True}):
        hl = link_tag.get("hreflang", "").strip().lower()
        if hl and hl != "x-default":
            languages.append(hl.split("-")[0])
    content_lang_meta = soup.find("meta", attrs={"http-equiv": lambda v: v and v.lower() == "content-language"})
    if content_lang_meta:
        cl = content_lang_meta.get("content", "").strip().lower()
        if cl:
            languages.append(cl.split(",")[0].strip().split("-")[0])
    result["detected_languages"] = list(dict.fromkeys(languages))  # unique, order-preserving

    # H1/H2 headings for industry inference
    for level in ["h1", "h2"]:
        for tag in soup.find_all(level, limit=5):
            text = tag.get_text(strip=True)
            if text:
                result["headings"].append(text[:200])

    return result
