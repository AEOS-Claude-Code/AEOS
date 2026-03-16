"""
AEOS – Company Scanner: SEO Analyzer.

Computes a basic SEO health score (0-100) from website structural data.
Pure deterministic logic – no external API calls.
"""

from __future__ import annotations


def analyze_seo(website_data: dict) -> dict:
    """
    Analyze SEO quality and return score + details breakdown.

    Scoring:
    - Title present and 30-60 chars:    15 pts
    - Meta description present, >80 chars: 15 pts
    - At least 1 H1:                    10 pts
    - Multiple H2s:                     10 pts
    - Keywords detected:                15 pts
    - Internal links > 5:               10 pts
    - Pages detected > 3:               10 pts
    - Title contains keyword:           15 pts
    """
    score = 0
    details: dict[str, dict] = {}

    title = website_data.get("title", "")
    description = website_data.get("description", "")
    headings = website_data.get("headings", [])
    keywords = website_data.get("keywords", [])
    internal_links = website_data.get("internal_links_count", 0)
    pages = website_data.get("pages_detected", 0)

    h1s = [h for h in headings if h.get("level") == "h1"]
    h2s = [h for h in headings if h.get("level") == "h2"]

    # Title
    title_len = len(title)
    if 30 <= title_len <= 60:
        title_score = 15
        title_status = "good"
    elif title_len > 0:
        title_score = 8
        title_status = "needs_improvement"
    else:
        title_score = 0
        title_status = "missing"
    score += title_score
    details["title"] = {"score": title_score, "max": 15, "status": title_status, "length": title_len}

    # Meta description
    desc_len = len(description)
    if desc_len >= 80:
        desc_score = 15
        desc_status = "good"
    elif desc_len > 0:
        desc_score = 7
        desc_status = "too_short"
    else:
        desc_score = 0
        desc_status = "missing"
    score += desc_score
    details["meta_description"] = {"score": desc_score, "max": 15, "status": desc_status, "length": desc_len}

    # H1 presence
    if len(h1s) == 1:
        h1_score = 10
        h1_status = "good"
    elif len(h1s) > 1:
        h1_score = 6
        h1_status = "multiple"
    else:
        h1_score = 0
        h1_status = "missing"
    score += h1_score
    details["h1"] = {"score": h1_score, "max": 10, "status": h1_status, "count": len(h1s)}

    # H2 headings
    if len(h2s) >= 3:
        h2_score = 10
        h2_status = "good"
    elif len(h2s) >= 1:
        h2_score = 5
        h2_status = "few"
    else:
        h2_score = 0
        h2_status = "missing"
    score += h2_score
    details["h2"] = {"score": h2_score, "max": 10, "status": h2_status, "count": len(h2s)}

    # Keywords
    kw_count = len(keywords)
    if kw_count >= 5:
        kw_score = 15
        kw_status = "good"
    elif kw_count >= 2:
        kw_score = 8
        kw_status = "few"
    else:
        kw_score = 0
        kw_status = "missing"
    score += kw_score
    details["keywords"] = {"score": kw_score, "max": 15, "status": kw_status, "count": kw_count}

    # Internal links
    if internal_links > 5:
        links_score = 10
        links_status = "good"
    elif internal_links > 0:
        links_score = 5
        links_status = "few"
    else:
        links_score = 0
        links_status = "none"
    score += links_score
    details["internal_links"] = {"score": links_score, "max": 10, "status": links_status, "count": internal_links}

    # Pages
    if pages > 3:
        pages_score = 10
        pages_status = "good"
    elif pages > 0:
        pages_score = 5
        pages_status = "few"
    else:
        pages_score = 0
        pages_status = "none"
    score += pages_score
    details["pages"] = {"score": pages_score, "max": 10, "status": pages_status, "count": pages}

    # Keyword in title
    title_lower = title.lower()
    keyword_in_title = any(kw in title_lower for kw in keywords) if keywords else False
    if keyword_in_title:
        kt_score = 15
        kt_status = "good"
    else:
        kt_score = 0
        kt_status = "missing"
    score += kt_score
    details["keyword_in_title"] = {"score": kt_score, "max": 15, "status": kt_status}

    return {
        "score": min(100, score),
        "details": details,
    }
