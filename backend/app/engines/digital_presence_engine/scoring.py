"""
AEOS – Digital Presence Engine: Scoring model.

Deterministic, rule-based scoring across 5 categories.
Weights: Website Performance 25%, Search Visibility 25%,
Social Presence 20%, Reputation 15%, Conversion Readiness 15%.
"""

from __future__ import annotations

from typing import Any, Optional


WEIGHTS = {
    "website_performance": 0.25,
    "search_visibility": 0.25,
    "social_presence": 0.20,
    "reputation": 0.15,
    "conversion_readiness": 0.15,
}

SOCIAL_PLATFORMS = ["linkedin", "facebook", "instagram", "twitter", "youtube"]


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, round(value, 1)))


def score_website_performance(scan: Optional[dict]) -> tuple[float, list[dict]]:
    """Score based on scanner performance + overall score."""
    if not scan:
        return 0.0, [{"check": "No scan data", "passed": False}]

    perf = scan.get("performance", {})
    perf_score = perf.get("score", 0)
    overall = scan.get("overall_score", 0)

    # Weighted average: 60% perf score, 40% overall scanner score
    score = perf_score * 0.6 + overall * 0.4

    items = []
    response_ms = perf.get("response_time_ms", 0)
    items.append({"check": f"Response time: {response_ms}ms", "passed": response_ms < 2000})
    items.append({"check": f"Page size: {perf.get('page_size_kb', 0):.0f}KB", "passed": perf.get("page_size_kb", 0) < 3000})
    items.append({"check": "Compression enabled", "passed": perf.get("compression", False)})
    items.append({"check": "CDN detected", "passed": perf.get("cdn_detected", False)})

    return _clamp(score), items


def score_search_visibility(scan: Optional[dict]) -> tuple[float, list[dict]]:
    """Score based on SEO + crawlability."""
    if not scan:
        return 0.0, [{"check": "No scan data", "passed": False}]

    seo = scan.get("seo_score", 0)
    crawl = scan.get("crawl_info", {})
    crawl_score = crawl.get("score", 0)

    # SEO 70% + crawlability 30%
    score = seo * 0.7 + crawl_score * 0.3

    items = []
    seo_details = scan.get("seo_details", {})
    items.append({"check": f"SEO score: {seo}/100", "passed": seo >= 50})
    items.append({"check": "Meta description present", "passed": bool(scan.get("meta_description"))})
    items.append({"check": "robots.txt found", "passed": crawl.get("robots_txt_found", False)})
    items.append({"check": "Sitemap detected", "passed": crawl.get("sitemap_found", False)})
    pages = scan.get("pages_crawled", 0)
    items.append({"check": f"{pages} pages crawled", "passed": pages >= 3})

    return _clamp(score), items


def score_social_presence(scan: Optional[dict], profile_social: Optional[dict] = None) -> tuple[float, list[dict]]:
    """Score based on detected social platforms."""
    social = {}
    if scan:
        social = scan.get("social_presence", {})
    if profile_social:
        for k, v in profile_social.items():
            if v and k in SOCIAL_PLATFORMS:
                social[k] = True

    detected = [p for p in SOCIAL_PLATFORMS if social.get(p)]
    count = len(detected)
    # Base: count / total * 80, bonus 20 if >= 3 platforms
    score = (count / len(SOCIAL_PLATFORMS)) * 80
    if count >= 3:
        score += 20

    items = []
    for platform in SOCIAL_PLATFORMS:
        present = social.get(platform, False)
        items.append({"check": platform.title(), "passed": bool(present)})

    return _clamp(score), items


def score_reputation(scan: Optional[dict]) -> tuple[float, list[dict]]:
    """
    Placeholder scoring — future phases will add review aggregation.
    Base 50, bonus for HTTPS, security headers, structured data.
    """
    score = 50.0
    items = []

    if not scan:
        return score, [{"check": "Baseline score (no scan data)", "passed": True}]

    security = scan.get("security", {})
    if security.get("https"):
        score += 15
        items.append({"check": "HTTPS enabled", "passed": True})
    else:
        items.append({"check": "HTTPS enabled", "passed": False})

    sec_score = security.get("score", 0)
    if sec_score >= 60:
        score += 10
        items.append({"check": f"Security headers ({sec_score}/100)", "passed": True})
    else:
        items.append({"check": f"Security headers ({sec_score}/100)", "passed": False})

    struct = scan.get("structured_data", {})
    if struct.get("has_schema_org"):
        score += 10
        items.append({"check": "Schema.org markup", "passed": True})
    else:
        items.append({"check": "Schema.org markup", "passed": False})

    # Trust signals from structured data
    if struct.get("has_open_graph"):
        score += 5
        items.append({"check": "Open Graph tags", "passed": True})
    else:
        items.append({"check": "Open Graph tags", "passed": False})

    return _clamp(score), items


def score_conversion_readiness(scan: Optional[dict]) -> tuple[float, list[dict]]:
    """Score based on structured data, accessibility, and page coverage."""
    if not scan:
        return 0.0, [{"check": "No scan data", "passed": False}]

    struct = scan.get("structured_data", {})
    access = scan.get("accessibility", {})
    struct_score = struct.get("score", 0)
    access_score = access.get("score", 0)

    # Structured data 40% + accessibility 30% + page coverage 30%
    pages = scan.get("pages_crawled", 0)
    page_score = min(100, pages * 15)  # 6+ pages → 90+
    score = struct_score * 0.4 + access_score * 0.3 + page_score * 0.3

    items = []
    items.append({"check": f"Structured data: {struct_score}/100", "passed": struct_score >= 40})
    items.append({"check": f"Accessibility: {access_score}/100", "passed": access_score >= 50})
    items.append({"check": "Canonical URL set", "passed": bool(struct.get("canonical_url"))})
    items.append({"check": "Favicon present", "passed": bool(struct.get("has_favicon"))})
    items.append({"check": f"{pages} pages indexed", "passed": pages >= 3})

    return _clamp(score), items


def compute_all_scores(
    scan_data: Optional[dict],
    profile_social: Optional[dict] = None,
) -> dict[str, Any]:
    """Compute all 5 sub-scores + overall + breakdown + recommendations."""
    wp_score, wp_items = score_website_performance(scan_data)
    sv_score, sv_items = score_search_visibility(scan_data)
    sp_score, sp_items = score_social_presence(scan_data, profile_social)
    rep_score, rep_items = score_reputation(scan_data)
    cr_score, cr_items = score_conversion_readiness(scan_data)

    scores = {
        "website_performance": wp_score,
        "search_visibility": sv_score,
        "social_presence": sp_score,
        "reputation": rep_score,
        "conversion_readiness": cr_score,
    }

    overall = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    overall = _clamp(overall)

    breakdown = [
        {
            "category": "website_performance",
            "score": wp_score,
            "weight": WEIGHTS["website_performance"],
            "label": "Website Performance",
            "explanation": "Speed, size, compression, and CDN usage",
            "items": wp_items,
        },
        {
            "category": "search_visibility",
            "score": sv_score,
            "weight": WEIGHTS["search_visibility"],
            "label": "Search Visibility",
            "explanation": "SEO health, meta tags, robots.txt, and sitemap",
            "items": sv_items,
        },
        {
            "category": "social_presence",
            "score": sp_score,
            "weight": WEIGHTS["social_presence"],
            "label": "Social Presence",
            "explanation": "Coverage across major social platforms",
            "items": sp_items,
        },
        {
            "category": "reputation",
            "score": rep_score,
            "weight": WEIGHTS["reputation"],
            "label": "Reputation & Trust",
            "explanation": "Security, HTTPS, structured data trust signals",
            "items": rep_items,
        },
        {
            "category": "conversion_readiness",
            "score": cr_score,
            "weight": WEIGHTS["conversion_readiness"],
            "label": "Conversion Readiness",
            "explanation": "Accessibility, structured data, and page depth",
            "items": cr_items,
        },
    ]

    recommendations = generate_recommendations(scores, scan_data)

    return {
        "overall_score": overall,
        "scores": scores,
        "breakdown": breakdown,
        "recommendations": recommendations,
    }


def generate_recommendations(
    scores: dict[str, float],
    scan_data: Optional[dict],
) -> list[dict]:
    """Generate prioritized, actionable recommendations."""
    recs: list[dict] = []
    priority = 1

    # ── Website Performance ──
    if scores["website_performance"] < 50:
        perf = (scan_data or {}).get("performance", {})
        if perf.get("response_time_ms", 0) > 3000:
            recs.append({
                "priority": priority,
                "category": "website_performance",
                "title": "Improve server response time",
                "description": f"Your site takes {perf.get('response_time_ms', 0)}ms to respond. Aim for under 2 seconds by optimizing server configuration or upgrading hosting.",
                "impact": "high",
                "effort": "medium",
            })
            priority += 1
        if not perf.get("compression"):
            recs.append({
                "priority": priority,
                "category": "website_performance",
                "title": "Enable compression (gzip/brotli)",
                "description": "Your server is not compressing responses. Enable gzip or brotli to reduce page load times by 60-80%.",
                "impact": "high",
                "effort": "easy",
            })
            priority += 1
        if not perf.get("cdn_detected"):
            recs.append({
                "priority": priority,
                "category": "website_performance",
                "title": "Use a CDN for faster delivery",
                "description": "No CDN was detected. A content delivery network like Cloudflare can reduce load times globally.",
                "impact": "medium",
                "effort": "easy",
            })
            priority += 1

    # ── Search Visibility ──
    if scores["search_visibility"] < 60:
        seo = (scan_data or {}).get("seo_score", 0)
        if seo < 50:
            recs.append({
                "priority": priority,
                "category": "search_visibility",
                "title": "Improve SEO fundamentals",
                "description": f"SEO score is {seo}/100. Add unique meta descriptions, optimize title tags, and use proper heading hierarchy on all pages.",
                "impact": "high",
                "effort": "medium",
            })
            priority += 1
        crawl = (scan_data or {}).get("crawl_info", {})
        if not crawl.get("sitemap_found"):
            recs.append({
                "priority": priority,
                "category": "search_visibility",
                "title": "Create an XML sitemap",
                "description": "No sitemap.xml was found. An XML sitemap helps search engines discover and index all your pages.",
                "impact": "medium",
                "effort": "easy",
            })
            priority += 1
        if not crawl.get("robots_txt_found"):
            recs.append({
                "priority": priority,
                "category": "search_visibility",
                "title": "Add a robots.txt file",
                "description": "No robots.txt was found. This file guides search engine crawlers on which pages to index.",
                "impact": "medium",
                "effort": "easy",
            })
            priority += 1

    # ── Social Presence ──
    if scores["social_presence"] < 60:
        social = (scan_data or {}).get("social_presence", {})
        missing = [p.title() for p in SOCIAL_PLATFORMS if not social.get(p)]
        if missing:
            recs.append({
                "priority": priority,
                "category": "social_presence",
                "title": "Expand social media presence",
                "description": f"Missing profiles on: {', '.join(missing[:3])}. Active social profiles increase brand visibility and trust.",
                "impact": "medium",
                "effort": "easy",
            })
            priority += 1

    # ── Reputation ──
    sec = (scan_data or {}).get("security", {})
    if not sec.get("https"):
        recs.append({
            "priority": 1,  # Critical — override priority
            "category": "reputation",
            "title": "Enable HTTPS immediately",
            "description": "Your site does not use HTTPS. This is critical for user trust, SEO rankings, and data security.",
            "impact": "high",
            "effort": "easy",
        })
    elif scores["reputation"] < 70:
        if sec.get("score", 0) < 50:
            recs.append({
                "priority": priority,
                "category": "reputation",
                "title": "Add security headers",
                "description": "Missing important security headers (CSP, HSTS, X-Frame-Options). These protect users and signal trust to browsers.",
                "impact": "medium",
                "effort": "medium",
            })
            priority += 1

    # ── Conversion Readiness ──
    if scores["conversion_readiness"] < 50:
        struct = (scan_data or {}).get("structured_data", {})
        if not struct.get("has_open_graph"):
            recs.append({
                "priority": priority,
                "category": "conversion_readiness",
                "title": "Add Open Graph meta tags",
                "description": "Open Graph tags control how your pages appear when shared on social media, improving click-through rates.",
                "impact": "medium",
                "effort": "easy",
            })
            priority += 1
        access = (scan_data or {}).get("accessibility", {})
        if access.get("score", 0) < 50:
            recs.append({
                "priority": priority,
                "category": "conversion_readiness",
                "title": "Improve accessibility basics",
                "description": "Low accessibility score. Add alt text to images, proper form labels, and ARIA landmarks to reach more users.",
                "impact": "medium",
                "effort": "medium",
            })
            priority += 1

    # Sort by priority
    recs.sort(key=lambda r: r["priority"])
    return recs[:7]  # Cap at 7 recommendations
