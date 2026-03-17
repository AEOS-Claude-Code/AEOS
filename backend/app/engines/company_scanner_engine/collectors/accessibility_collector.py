"""
AEOS – Company Scanner: Accessibility Analyzer.

Phase 7: Basic accessibility checks — viewport, lang, alt tags, ARIA, skip nav.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("aeos.engine.scanner.accessibility")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


def analyze_accessibility(html: str) -> dict:
    """Analyze basic accessibility metrics from HTML."""
    result = {
        "has_viewport_meta": False,
        "has_lang_attribute": False,
        "images_total": 0,
        "images_with_alt": 0,
        "images_without_alt": 0,
        "has_skip_navigation": False,
        "aria_landmarks": 0,
        "form_labels": 0,
        "forms_without_labels": 0,
        "score": 0,
    }

    if not html or not HAS_BS4:
        return result

    try:
        soup = BeautifulSoup(html, "lxml")

        # Viewport meta
        viewport = soup.find("meta", attrs={"name": "viewport"})
        result["has_viewport_meta"] = viewport is not None

        # Lang attribute on <html>
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            result["has_lang_attribute"] = True

        # Image alt tags
        images = soup.find_all("img")
        result["images_total"] = len(images)
        with_alt = sum(1 for img in images if img.get("alt") is not None and img["alt"].strip())
        result["images_with_alt"] = with_alt
        result["images_without_alt"] = len(images) - with_alt

        # Skip navigation link
        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            text = a.get_text(strip=True).lower()
            if href.startswith("#") and ("skip" in text or "main" in text or "content" in text):
                result["has_skip_navigation"] = True
                break

        # ARIA landmarks
        landmark_roles = {"banner", "navigation", "main", "contentinfo", "complementary", "search", "form"}
        aria_count = 0
        for role in landmark_roles:
            aria_count += len(soup.find_all(attrs={"role": role}))
        # Also count semantic HTML5 elements that serve as landmarks
        for tag in ["header", "nav", "main", "footer", "aside"]:
            aria_count += len(soup.find_all(tag))
        result["aria_landmarks"] = aria_count

        # Form labels
        inputs = soup.find_all(["input", "select", "textarea"])
        inputs = [i for i in inputs if i.get("type") not in ("hidden", "submit", "button")]
        labeled = 0
        for inp in inputs:
            inp_id = inp.get("id")
            if inp_id and soup.find("label", attrs={"for": inp_id}):
                labeled += 1
            elif inp.get("aria-label") or inp.get("aria-labelledby"):
                labeled += 1
            elif inp.find_parent("label"):
                labeled += 1
        result["form_labels"] = labeled
        result["forms_without_labels"] = max(0, len(inputs) - labeled)

        # Score calculation (max 100)
        score = 0
        if result["has_viewport_meta"]:
            score += 20
        if result["has_lang_attribute"]:
            score += 15

        # Alt tags scoring
        if result["images_total"] > 0:
            alt_ratio = result["images_with_alt"] / result["images_total"]
            if alt_ratio >= 0.9:
                score += 25
            elif alt_ratio >= 0.5:
                score += 15
            else:
                score += 5
        else:
            score += 25  # No images = no problem

        if result["has_skip_navigation"]:
            score += 10

        if result["aria_landmarks"] >= 3:
            score += 15
        elif result["aria_landmarks"] >= 1:
            score += 8

        # Form labels
        if result["forms_without_labels"] == 0 and result["form_labels"] > 0:
            score += 15
        elif result["forms_without_labels"] == 0:
            score += 15  # No forms = no problem
        else:
            label_ratio = result["form_labels"] / max(1, result["form_labels"] + result["forms_without_labels"])
            score += int(15 * label_ratio)

        result["score"] = min(100, score)

    except Exception as e:
        logger.warning("Accessibility analysis failed: %s", str(e)[:100])

    return result
