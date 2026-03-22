"""
AEOS – Competitor Intelligence Engine: Scanner.

Lightweight competitor website scanner that reuses the Company Scanner collectors.
"""

from __future__ import annotations

import logging
from datetime import datetime
from urllib.parse import urlparse

logger = logging.getLogger("aeos.engine.competitor.scanner")


async def scan_competitor_website(url: str) -> dict:
    """
    Scan a competitor website using the same collectors as the Company Scanner.
    Returns a flat dict with all scan results.
    """
    if not url:
        return {"error": "No URL provided"}

    if not url.startswith("http"):
        url = "https://" + url

    logger.info("Scanning competitor: %s", url)

    result = {
        "url": url,
        "name": _derive_name(url),
        "seo_score": 0.0,
        "performance_score": 0.0,
        "security_score": 0.0,
        "overall_score": 0.0,
        "tech_stack": [],
        "social_presence": {},
        "keywords": [],
        "page_title": "",
        "meta_description": "",
        "headings": [],
    }

    # 1. Fetch website HTML
    html = ""
    try:
        from app.engines.smart_intake_engine.website_profile_collector import _fetch_html
        html = await _fetch_html(url) or ""
    except Exception as e:
        logger.warning("Failed to fetch %s: %s", url, str(e)[:100])
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "AEOS-CompetitorBot/1.0"})
                html = resp.text
        except Exception:
            return {**result, "error": "Could not fetch website"}

    if not html:
        return {**result, "error": "Empty response from website"}

    # 2. SEO analysis
    try:
        from app.engines.company_scanner_engine.collectors.seo_collector import analyze_seo
        seo = analyze_seo(html, url)
        result["seo_score"] = seo.get("score", 0)
        result["keywords"] = seo.get("keywords", [])
        result["page_title"] = seo.get("title", "")
        result["meta_description"] = seo.get("meta_description", "")
        result["headings"] = seo.get("headings", [])
    except Exception as e:
        logger.warning("SEO analysis failed for %s: %s", url, str(e)[:80])

    # 3. Performance
    try:
        from app.engines.company_scanner_engine.collectors.performance_collector import analyze_performance
        perf = await analyze_performance(url)
        result["performance_score"] = perf.get("score", 0)
    except Exception as e:
        logger.warning("Performance analysis failed for %s: %s", url, str(e)[:80])

    # 4. Security
    try:
        from app.engines.company_scanner_engine.collectors.security_collector import analyze_security
        sec = await analyze_security(url)
        result["security_score"] = sec.get("score", 0)
    except Exception as e:
        logger.warning("Security analysis failed for %s: %s", url, str(e)[:80])

    # 5. Tech stack
    try:
        from app.engines.company_scanner_engine.collectors.tech_stack_collector import (
            detect_tech_from_html,
            detect_tech_from_url,
            merge_tech,
        )
        html_tech = detect_tech_from_html(html)
        url_tech = detect_tech_from_url(url)
        result["tech_stack"] = merge_tech(html_tech, url_tech)
    except Exception as e:
        logger.warning("Tech detection failed for %s: %s", url, str(e)[:80])

    # 6. Social presence
    try:
        from app.engines.smart_intake_engine.social_extractor import extract_social_links
        social = extract_social_links(html, url)
        # Convert to {platform: true/false} for comparison
        result["social_presence"] = {
            platform: len(urls) > 0
            for platform, urls in social.items()
        }
    except Exception as e:
        logger.warning("Social detection failed for %s: %s", url, str(e)[:80])

    # 7. Compute overall score (same weights as Company Scanner)
    scores = [
        (result["seo_score"], 0.30),
        (result["performance_score"], 0.25),
        (result["security_score"], 0.20),
    ]
    social_count = sum(1 for v in result["social_presence"].values() if v)
    social_score = min(100, social_count * 20)  # 5 platforms = 100
    scores.append((social_score, 0.15))
    scores.append((len(result["tech_stack"]) * 10, 0.10))  # tech diversity bonus

    result["overall_score"] = round(
        sum(score * weight for score, weight in scores), 1
    )

    logger.info(
        "Competitor scan complete: %s — SEO=%d, Perf=%d, Sec=%d, Overall=%d",
        url,
        result["seo_score"],
        result["performance_score"],
        result["security_score"],
        result["overall_score"],
    )

    return result


def _derive_name(url: str) -> str:
    """Derive competitor name from URL."""
    try:
        host = urlparse(url).netloc or url
        name = host.replace("www.", "").split(".")[0]
        return name.replace("-", " ").replace("_", " ").title()
    except Exception:
        return url
