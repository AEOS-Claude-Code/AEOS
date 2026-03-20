"""
AEOS – Strategy Agent Engine: Service layer.

Orchestrates business plan generation: context gathering → prompt building →
Claude API calls → section storage → completion.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import BusinessPlan, SECTION_KEYS, SECTION_TITLES
from .context_builder import build_full_context, build_section_context
from .prompts import get_system_prompt, get_section_prompt
from .generator import generate_section

logger = logging.getLogger("aeos.engine.strategy_agent")


async def generate_business_plan(
    db: AsyncSession,
    workspace_id: str,
    user_id: str = "",
) -> BusinessPlan:
    """
    Generate a complete AI-powered business plan.
    Sections are generated sequentially and stored progressively.
    """
    from app.modules.billing.service import enforce_token_budget
    await enforce_token_budget(db, workspace_id, "business_plan_generation")

    # Check for existing generating plan
    existing = await db.execute(
        select(BusinessPlan).where(
            BusinessPlan.workspace_id == workspace_id,
            BusinessPlan.status == "generating",
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("A business plan is already being generated for this workspace.")

    # Get version number
    version_result = await db.execute(
        select(BusinessPlan)
        .where(BusinessPlan.workspace_id == workspace_id)
        .order_by(BusinessPlan.version.desc())
        .limit(1)
    )
    prev = version_result.scalar_one_or_none()
    version = (prev.version + 1) if prev else 1

    # Build context
    ctx = await build_full_context(db, workspace_id)
    company = ctx.get("company", {})

    # Create plan
    plan = BusinessPlan(
        workspace_id=workspace_id,
        user_id=user_id,
        status="generating",
        version=version,
        title=f"Strategic Business Plan — {company.get('name', 'Company')} v{version}",
        sections={
            key: {"status": "pending", "content": "", "word_count": 0, "generated_at": None}
            for key in SECTION_KEYS
        },
        context_snapshot=ctx,
        sections_completed=0,
        sections_total=len(SECTION_KEYS),
        started_at=datetime.utcnow(),
    )
    db.add(plan)
    await db.flush()

    # Bill tokens
    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "business_plan_generation")
    except Exception:
        logger.warning("Token billing skipped for business plan (non-fatal)")

    # Build system prompt
    system_prompt = get_system_prompt(
        company_name=company.get("name", "the company"),
        industry=company.get("industry", "general"),
        team_size=company.get("team_size", 1),
        city=company.get("city", ""),
        country=company.get("country", ""),
    )

    # Generate each section
    total_tokens = 0
    for i, section_key in enumerate(SECTION_KEYS):
        try:
            plan.current_section = section_key

            # Update section status
            sections = dict(plan.sections)
            sections[section_key] = {
                "status": "generating",
                "content": "",
                "word_count": 0,
                "generated_at": None,
            }
            plan.sections = sections
            await db.flush()

            # Build section context and prompt
            section_context = build_section_context(ctx, section_key)
            section_prompt = get_section_prompt(section_key, section_context)

            # Generate via Claude
            content, tokens_used = await generate_section(
                section_key=section_key,
                system_prompt=system_prompt,
                section_prompt=section_prompt,
            )
            total_tokens += tokens_used

            # Store result
            word_count = len(content.split()) if content else 0
            sections = dict(plan.sections)
            sections[section_key] = {
                "status": "completed",
                "content": content,
                "word_count": word_count,
                "generated_at": datetime.utcnow().isoformat(),
            }
            plan.sections = sections
            plan.sections_completed = i + 1
            await db.flush()

            logger.info(
                "Section %s generated: %d words, %d tokens",
                section_key, word_count, tokens_used,
            )

        except Exception as e:
            logger.exception("Failed to generate section %s: %s", section_key, e)
            sections = dict(plan.sections)
            sections[section_key] = {
                "status": "failed",
                "content": f"Generation failed: {str(e)[:100]}",
                "word_count": 0,
                "generated_at": datetime.utcnow().isoformat(),
            }
            plan.sections = sections
            plan.sections_completed = i + 1
            await db.flush()

    # Complete
    plan.status = "completed"
    plan.current_section = None
    plan.completed_at = datetime.utcnow()
    plan.metadata_json = {
        "total_tokens_used": total_tokens,
        "model": "claude-sonnet-4-20250514",
        "generation_time_seconds": (
            (plan.completed_at - plan.started_at).total_seconds()
            if plan.started_at else 0
        ),
    }

    logger.info(
        "Business plan completed: workspace=%s, version=%d, tokens=%d",
        workspace_id, version, total_tokens,
    )

    return plan


async def get_latest_plan(
    db: AsyncSession, workspace_id: str
) -> Optional[BusinessPlan]:
    """Get most recent completed business plan."""
    result = await db.execute(
        select(BusinessPlan)
        .where(
            BusinessPlan.workspace_id == workspace_id,
            BusinessPlan.status.in_(["completed", "generating"]),
        )
        .order_by(BusinessPlan.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_plan_by_id(
    db: AsyncSession, plan_id: str
) -> Optional[BusinessPlan]:
    """Get a specific business plan by ID."""
    result = await db.execute(
        select(BusinessPlan).where(BusinessPlan.id == plan_id)
    )
    return result.scalar_one_or_none()


async def list_plans(
    db: AsyncSession, workspace_id: str
) -> list[BusinessPlan]:
    """List all business plans for a workspace."""
    result = await db.execute(
        select(BusinessPlan)
        .where(BusinessPlan.workspace_id == workspace_id)
        .order_by(BusinessPlan.created_at.desc())
        .limit(20)
    )
    return list(result.scalars().all())


async def regenerate_section(
    db: AsyncSession, plan_id: str, section_key: str
) -> BusinessPlan:
    """Regenerate a single section of an existing plan."""
    plan = await get_plan_by_id(db, plan_id)
    if not plan:
        raise ValueError("Plan not found")
    if section_key not in SECTION_KEYS:
        raise ValueError(f"Invalid section: {section_key}")

    ctx = plan.context_snapshot or {}
    company = ctx.get("company", {})

    system_prompt = get_system_prompt(
        company_name=company.get("name", "the company"),
        industry=company.get("industry", "general"),
        team_size=company.get("team_size", 1),
        city=company.get("city", ""),
        country=company.get("country", ""),
    )

    section_context = build_section_context(ctx, section_key)
    section_prompt = get_section_prompt(section_key, section_context)

    content, tokens_used = await generate_section(
        section_key=section_key,
        system_prompt=system_prompt,
        section_prompt=section_prompt,
    )

    word_count = len(content.split()) if content else 0
    sections = dict(plan.sections)
    sections[section_key] = {
        "status": "completed",
        "content": content,
        "word_count": word_count,
        "generated_at": datetime.utcnow().isoformat(),
    }
    plan.sections = sections

    # Bill for section regen
    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, plan.workspace_id, "business_plan_section_regen")
    except Exception:
        pass

    return plan
