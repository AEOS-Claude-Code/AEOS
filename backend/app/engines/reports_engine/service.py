"""
AEOS – Reports Engine: Service layer.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import GeneratedReport, REPORT_TYPES, REPORT_TITLES
from .builder import build_report

logger = logging.getLogger("aeos.engine.reports")


async def generate_report(
    db: AsyncSession, workspace_id: str, report_type: str, user_id: str = "",
) -> GeneratedReport:
    """Generate an executive report."""
    if report_type not in REPORT_TYPES:
        raise ValueError(f"Invalid report type: {report_type}")

    report = GeneratedReport(
        workspace_id=workspace_id,
        user_id=user_id,
        report_type=report_type,
        title=REPORT_TITLES.get(report_type, report_type),
        status="generating",
    )
    db.add(report)
    await db.flush()

    try:
        result = await build_report(db, workspace_id, report_type)
        report.title = result.get("title", report.title)
        report.summary = result.get("summary", "")
        report.sections = result.get("sections", [])
        report.status = "completed"
        report.generated_at = datetime.utcnow()
        report.metadata_json = {"report_type": report_type, "sections_count": len(report.sections)}
    except Exception as e:
        report.status = "failed"
        logger.exception("Report generation failed: %s", e)

    try:
        from app.modules.billing.service import consume_tokens
        await consume_tokens(db, workspace_id, "report_generation")
    except Exception:
        pass

    return report


async def get_report(db: AsyncSession, report_id: str) -> Optional[GeneratedReport]:
    result = await db.execute(select(GeneratedReport).where(GeneratedReport.id == report_id))
    return result.scalar_one_or_none()


async def get_report_by_token(db: AsyncSession, share_token: str) -> Optional[GeneratedReport]:
    result = await db.execute(
        select(GeneratedReport).where(
            GeneratedReport.share_token == share_token,
            GeneratedReport.is_public == "true",
        )
    )
    return result.scalar_one_or_none()


async def list_reports(db: AsyncSession, workspace_id: str) -> list[GeneratedReport]:
    result = await db.execute(
        select(GeneratedReport)
        .where(GeneratedReport.workspace_id == workspace_id)
        .order_by(GeneratedReport.created_at.desc())
        .limit(50)
    )
    return list(result.scalars().all())


async def update_sharing(db: AsyncSession, report_id: str, is_public: bool) -> GeneratedReport:
    report = await get_report(db, report_id)
    if not report:
        raise ValueError("Report not found")
    report.is_public = "true" if is_public else "false"
    return report
