"""
AEOS – Smart Intake Engine: Website Profile Collector.

Fetches and parses a website to extract company name, page title,
meta description, and raw HTML for downstream extractors.

Uses Playwright (headless Chromium) for full JavaScript rendering
when available, with httpx fallback for lightweight environments.
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


def _domain_to_name(url: str) -> str:
    """Derive a company name from the domain."""
    parsed = urlparse(url)
    host = parsed.netloc or parsed.path.split("/")[0]
    name = host.replace("www.", "").split(".")[0]
    # Split on hyphens/underscores and title-case
    parts = re.split(r"[-_]", name)
    return " ".join(p.capitalize() for p in parts if p)


async def _fetch_with_playwright(url: str) -> str | None:
    """Fetch page with headless Chromium — executes JavaScript."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--single-process",
                    "--disable-extensions",
                    "--disable-background-networking",
                    "--disable-default-apps",
                    "--disable-sync",
                    "--disable-translate",
                    "--no-first-run",
                    "--no-zygote",
                ],
            )
            try:
                page = await browser.new_page(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                await page.goto(url, wait_until="networkidle", timeout=20000)
                # Wait a bit for late-loading JS content
                await page.wait_for_timeout(2000)
                html = await page.content()
                return html
            finally:
                await browser.close()
    except Exception as e:
        logger.info("Playwright fetch failed for %s: %s", url, str(e)[:150])
        return None


async def _fetch_with_httpx(url: str) -> str | None:
    """Simple HTTP fetch — no JavaScript execution."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AEOS-IntakeBot/1.0"})
            resp.raise_for_status()
            return resp.text
    except Exception as e:
        logger.info("httpx fetch failed for %s: %s", url, str(e)[:100])
        return None


async def collect_website_profile(url: str) -> dict:
    """
    Fetch website and extract basic profile data.
    Tries Playwright (full JS rendering) first, falls back to httpx.
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

    # Try Playwright first (full JS rendering), fall back to httpx
    html = await _fetch_with_playwright(url)
    if not html:
        logger.info("Falling back to httpx for %s", url)
        html = await _fetch_with_httpx(url)

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
        # Try to extract company name from title (before separator)
        for sep in [" | ", " - ", " – ", " — ", " :: ", " : "]:
            if sep in result["title"]:
                candidate = result["title"].split(sep)[0].strip()
                if 2 < len(candidate) < 60:
                    result["detected_company_name"] = candidate
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
