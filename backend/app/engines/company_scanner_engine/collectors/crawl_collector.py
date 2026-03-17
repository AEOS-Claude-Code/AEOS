"""
AEOS – Company Scanner: Robots.txt & Sitemap Analyzer + Multi-Page Crawler.

Phase 7: Checks robots.txt, sitemap.xml, and crawls up to 10 internal pages.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlparse, urljoin

import httpx

logger = logging.getLogger("aeos.engine.scanner.crawl")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

MAX_CRAWL_PAGES = 10
CRAWL_TIMEOUT = 8


async def analyze_crawl_info(url: str) -> dict:
    """Check robots.txt and sitemap.xml."""
    result = {
        "has_robots_txt": False,
        "robots_allows_crawl": True,
        "robots_disallow_paths": [],
        "has_sitemap": False,
        "sitemap_url": "",
        "sitemap_page_count": 0,
        "score": 0,
    }

    if not url or not url.startswith("http"):
        return result

    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            # Check robots.txt
            robots_url = f"{base}/robots.txt"
            try:
                resp = await client.get(robots_url, headers={"User-Agent": "AEOS-Scanner/2.0"})
                if resp.status_code == 200 and "user-agent" in resp.text.lower():
                    result["has_robots_txt"] = True
                    lines = resp.text.lower().splitlines()
                    disallows = [
                        l.split(":", 1)[1].strip()
                        for l in lines
                        if l.strip().startswith("disallow:")
                    ]
                    result["robots_disallow_paths"] = disallows[:20]
                    if "/" in disallows:
                        result["robots_allows_crawl"] = False

                    # Extract sitemap from robots.txt
                    for line in resp.text.splitlines():
                        if line.lower().strip().startswith("sitemap:"):
                            result["sitemap_url"] = line.split(":", 1)[1].strip()
                            result["has_sitemap"] = True
                            break
            except Exception:
                pass

            # Try standard sitemap location if not found in robots.txt
            if not result["has_sitemap"]:
                sitemap_url = f"{base}/sitemap.xml"
                try:
                    resp = await client.get(sitemap_url, headers={"User-Agent": "AEOS-Scanner/2.0"})
                    if resp.status_code == 200 and "<urlset" in resp.text.lower():
                        result["has_sitemap"] = True
                        result["sitemap_url"] = sitemap_url
                        # Count URLs in sitemap
                        loc_count = resp.text.lower().count("<loc>")
                        result["sitemap_page_count"] = loc_count
                except Exception:
                    pass

            # Count sitemap pages if we have a URL but no count yet
            if result["has_sitemap"] and result["sitemap_page_count"] == 0 and result["sitemap_url"]:
                try:
                    resp = await client.get(
                        result["sitemap_url"],
                        headers={"User-Agent": "AEOS-Scanner/2.0"},
                    )
                    if resp.status_code == 200:
                        result["sitemap_page_count"] = resp.text.lower().count("<loc>")
                except Exception:
                    pass

    except Exception as e:
        logger.warning("Crawl info analysis failed for %s: %s", url, str(e)[:100])

    # Score
    score = 0
    if result["has_robots_txt"]:
        score += 35
    if result["robots_allows_crawl"]:
        score += 15
    if result["has_sitemap"]:
        score += 35
        if result["sitemap_page_count"] > 0:
            score += 15

    result["score"] = min(100, score)
    return result


async def crawl_internal_pages(url: str, homepage_html: str = "") -> list[dict]:
    """
    Crawl up to MAX_CRAWL_PAGES internal pages starting from the homepage.
    Returns list of {url, title, status_code}.
    """
    if not url or not url.startswith("http") or not HAS_BS4:
        return []

    parsed = urlparse(url)
    domain = parsed.netloc
    base = f"{parsed.scheme}://{parsed.netloc}"

    # Collect internal links from homepage
    internal_urls: set[str] = set()
    if homepage_html:
        try:
            soup = BeautifulSoup(homepage_html, "lxml")
            for a in soup.find_all("a", href=True):
                href = a["href"].split("#")[0].split("?")[0].rstrip("/")
                if not href:
                    continue
                full = urljoin(url, href)
                full_parsed = urlparse(full)
                if full_parsed.netloc == domain and full != url.rstrip("/"):
                    internal_urls.add(full)
        except Exception:
            pass

    if not internal_urls:
        return []

    # Prioritize important pages
    priority_patterns = [
        "/about", "/contact", "/services", "/products", "/pricing",
        "/blog", "/team", "/careers", "/faq", "/privacy",
    ]
    prioritized = []
    remaining = []
    for link in internal_urls:
        path = urlparse(link).path.lower()
        if any(p in path for p in priority_patterns):
            prioritized.append(link)
        else:
            remaining.append(link)

    urls_to_crawl = (prioritized + remaining)[:MAX_CRAWL_PAGES]

    crawled = []
    async with httpx.AsyncClient(timeout=CRAWL_TIMEOUT, follow_redirects=True) as client:
        for page_url in urls_to_crawl:
            try:
                resp = await client.get(
                    page_url,
                    headers={"User-Agent": "AEOS-Scanner/2.0"},
                )
                title = ""
                if resp.status_code == 200 and HAS_BS4:
                    try:
                        page_soup = BeautifulSoup(resp.text, "lxml")
                        title_tag = page_soup.find("title")
                        title = title_tag.get_text(strip=True)[:200] if title_tag else ""
                    except Exception:
                        pass

                crawled.append({
                    "url": page_url,
                    "title": title,
                    "status_code": resp.status_code,
                })
            except Exception:
                crawled.append({
                    "url": page_url,
                    "title": "",
                    "status_code": 0,
                })

    return crawled
