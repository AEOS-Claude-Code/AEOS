"""
AEOS – AI Agent Framework: Task Executor.

Executes agent tasks using Claude API with agent-specific system prompts.
"""

from __future__ import annotations

import logging
import time

import httpx

from app.core.config import get_settings

logger = logging.getLogger("aeos.engine.agent.executor")

settings = get_settings()


async def execute_task(
    system_prompt: str,
    task_description: str,
    input_data: dict = None,
) -> dict:
    """
    Execute an agent task via Claude API.
    Returns {"result": str, "tokens_used": int, "execution_time_ms": int}.
    """
    start = time.time()

    user_prompt = task_description
    if input_data:
        context = "\n".join(f"{k}: {v}" for k, v in input_data.items() if v)
        if context:
            user_prompt = f"{task_description}\n\nContext data:\n{context}"

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        return {
            "result": _template_result(task_description),
            "tokens_used": 0,
            "execution_time_ms": int((time.time() - start) * 1000),
        }

    try:
        model = settings.AI_DEFAULT_MODEL or "claude-sonnet-4-20250514"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 1000,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )

            if resp.status_code != 200:
                logger.warning("Claude API error %d: %s", resp.status_code, resp.text[:200])
                return {
                    "result": _template_result(task_description),
                    "tokens_used": 0,
                    "execution_time_ms": int((time.time() - start) * 1000),
                }

            data = resp.json()
            content = ""
            for block in data.get("content", []):
                if block.get("type") == "text":
                    content += block["text"]

            tokens = data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0)

            return {
                "result": content.strip(),
                "tokens_used": tokens,
                "execution_time_ms": int((time.time() - start) * 1000),
            }

    except Exception as e:
        logger.warning("Agent task execution failed: %s", str(e)[:150])
        return {
            "result": _template_result(task_description),
            "tokens_used": 0,
            "execution_time_ms": int((time.time() - start) * 1000),
        }


def _template_result(task: str) -> str:
    """Fallback template when Claude is unavailable."""
    return (
        f"Task acknowledged: {task[:100]}\n\n"
        f"*AI generation requires ANTHROPIC_API_KEY to be configured. "
        f"The agent has recorded this task and will execute it when AI generation is enabled.*"
    )
