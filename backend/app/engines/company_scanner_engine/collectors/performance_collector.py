"""
AEOS – Company Scanner: Performance Analyzer.

Phase 7: Measures response time, page size, compression, and CDN usage.
"""

from __future__ import annotations

import logging
import time

import httpx

logger = logging.getLogger("aeos.engine.scanner.performance")


async def analyze_performance(url: str) -> dict:
    """Measure website performance metrics."""
    result = {
        "response_time_ms": 0,
        "page_size_bytes": 0,
        "page_size_display": "0 KB",
        "uses_compression": False,
        "uses_cdn": False,
        "http_version": "",
        "redirect_count": 0,
        "score": 0,
    }

    if not url or not url.startswith("http"):
        return result

    try:
        start = time.monotonic()
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AEOS-Scanner/2.0"})
            elapsed_ms = int((time.monotonic() - start) * 1000)

        result["response_time_ms"] = elapsed_ms
        result["redirect_count"] = len(resp.history)

        # Page size
        content_length = len(resp.content)
        result["page_size_bytes"] = content_length
        if content_length < 1024:
            result["page_size_display"] = f"{content_length} B"
        elif content_length < 1024 * 1024:
            result["page_size_display"] = f"{content_length / 1024:.1f} KB"
        else:
            result["page_size_display"] = f"{content_length / (1024 * 1024):.1f} MB"

        # Compression
        encoding = resp.headers.get("content-encoding", "").lower()
        result["uses_compression"] = encoding in ("gzip", "br", "deflate", "zstd")

        # CDN detection
        cdn_headers = ["cf-ray", "x-cdn", "x-cache", "x-amz-cf-id", "x-served-by", "via"]
        result["uses_cdn"] = any(h in resp.headers for h in cdn_headers)

        # HTTP version
        result["http_version"] = str(resp.http_version) if hasattr(resp, "http_version") else ""

        # Score calculation (max 100)
        score = 0
        if elapsed_ms <= 500:
            score += 35
        elif elapsed_ms <= 1000:
            score += 25
        elif elapsed_ms <= 2000:
            score += 15
        elif elapsed_ms <= 3000:
            score += 5

        if content_length < 500_000:
            score += 25
        elif content_length < 1_000_000:
            score += 15
        elif content_length < 3_000_000:
            score += 5

        if result["uses_compression"]:
            score += 20

        if result["uses_cdn"]:
            score += 10

        if result["redirect_count"] <= 1:
            score += 10
        elif result["redirect_count"] <= 2:
            score += 5

        result["score"] = min(100, score)

    except Exception as e:
        logger.warning("Performance analysis failed for %s: %s", url, str(e)[:100])

    return result
