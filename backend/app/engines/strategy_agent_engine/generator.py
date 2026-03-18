"""
AEOS – Strategy Agent Engine: Claude API Generator.

Calls Claude API to generate each business plan section.
Falls back to template-based content when no API key is available.
"""

from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger("aeos.engine.strategy_agent.generator")

settings = get_settings()


async def generate_section(
    section_key: str,
    system_prompt: str,
    section_prompt: str,
) -> tuple[str, int]:
    """
    Generate a single business plan section via Claude API.
    Returns (content, tokens_used).
    Falls back to template if no API key.
    """
    api_key = settings.ANTHROPIC_API_KEY

    if not api_key:
        logger.info("No ANTHROPIC_API_KEY — using template fallback for %s", section_key)
        return _template_fallback(section_key, section_prompt), 0

    try:
        content, tokens = await _call_claude(system_prompt, section_prompt, api_key)
        if content:
            return content, tokens
    except Exception as e:
        logger.warning("Claude API call failed for %s: %s", section_key, str(e)[:200])

    # Fallback on error
    return _template_fallback(section_key, section_prompt), 0


async def _call_claude(
    system_prompt: str,
    user_prompt: str,
    api_key: str,
) -> tuple[str, int]:
    """Call Claude API via httpx (matching executive copilot pattern)."""
    model = settings.AI_DEFAULT_MODEL or "claude-sonnet-4-20250514"

    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 800,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )

        if resp.status_code != 200:
            logger.warning("Claude API returned %d: %s", resp.status_code, resp.text[:300])
            return "", 0

        data = resp.json()
        content = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                content += block["text"]

        tokens_used = data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0)

        logger.info("Claude generated %d chars, %d tokens for section", len(content), tokens_used)
        return content.strip(), tokens_used


def _template_fallback(section_key: str, prompt: str) -> str:
    """Generate template-based content when Claude is unavailable."""
    # Extract company data from the prompt text
    lines = prompt.split("\n")

    return (
        f"*This section requires AI generation to produce a full strategic analysis. "
        f"Please configure your ANTHROPIC_API_KEY to enable the AI Strategy Agent.*\n\n"
        f"**Section: {section_key.replace('_', ' ').title()}**\n\n"
        f"Based on the available company data, this section will analyze:\n\n"
        f"- Current operational metrics and performance indicators\n"
        f"- Industry-specific strategic recommendations\n"
        f"- Data-driven action items with measurable outcomes\n"
        f"- Implementation timeline and resource requirements\n\n"
        f"*Enable AI generation for a detailed, McKinsey-grade analysis tailored to your company.*"
    )
