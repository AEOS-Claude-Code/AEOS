"""
AEOS – Company Scanner: Security Analyzer.

Phase 7: Checks HTTPS, security headers, and common security best practices.
"""

from __future__ import annotations

import logging
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("aeos.engine.scanner.security")

SECURITY_HEADERS = {
    "strict-transport-security": "hsts",
    "content-security-policy": "csp",
    "x-frame-options": "x_frame_options",
    "x-content-type-options": "x_content_type_options",
    "referrer-policy": "referrer_policy",
    "permissions-policy": "permissions_policy",
}


async def analyze_security(url: str) -> dict:
    """Analyze website security posture."""
    result = {
        "https": False,
        "hsts": False,
        "csp": False,
        "x_frame_options": False,
        "x_content_type_options": False,
        "referrer_policy": False,
        "permissions_policy": False,
        "headers_present": [],
        "headers_missing": [],
        "score": 0,
    }

    if not url or not url.startswith("http"):
        return result

    parsed = urlparse(url)
    result["https"] = parsed.scheme == "https"

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.head(url, headers={"User-Agent": "AEOS-Scanner/2.0"})
            headers_lower = {k.lower(): v for k, v in resp.headers.items()}

        for header_name, field_name in SECURITY_HEADERS.items():
            if header_name in headers_lower:
                result[field_name] = True
                result["headers_present"].append(header_name)
            else:
                result["headers_missing"].append(header_name)

    except Exception as e:
        logger.warning("Security analysis failed for %s: %s", url, str(e)[:100])
        # Still score HTTPS even if headers fetch fails
        result["score"] = 30 if result["https"] else 0
        return result

    # Score calculation (max 100)
    score = 0
    if result["https"]:
        score += 30
    if result["hsts"]:
        score += 15
    if result["csp"]:
        score += 15
    if result["x_frame_options"]:
        score += 10
    if result["x_content_type_options"]:
        score += 10
    if result["referrer_policy"]:
        score += 10
    if result["permissions_policy"]:
        score += 10

    result["score"] = min(100, score)
    return result
