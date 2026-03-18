"""
AEOS – Gap Analysis Engine: Service layer.

Orchestrates gap analysis computation, storage, and retrieval.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import OrgGapAnalysisReport, WorkspaceRoleAssignment
from .scoring import (
    compute_all_gap_scores,
    build_gap_breakdown,
    generate_gap_recommendations,
)

logger = logging.getLogger("aeos.engine.gap_analysis")


async def get_role_assignments(db: AsyncSession, workspace_id: str) -> dict[str, bool]:
    """Get stored human/AI role assignments for a workspace."""
    result = await db.execute(
        select(WorkspaceRoleAssignment).where(
            WorkspaceRoleAssignment.workspace_id == workspace_id
        )
    )
    assignment = result.scalar_one_or_none()
    if assignment and assignment.role_map:
        return assignment.role_map
    return {}


async def save_role_assignments(
    db: AsyncSession, workspace_id: str, role_map: dict[str, bool]
) -> WorkspaceRoleAssignment:
    """Upsert role assignments for a workspace."""
    result = await db.execute(
        select(WorkspaceRoleAssignment).where(
            WorkspaceRoleAssignment.workspace_id == workspace_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.role_map = role_map
        existing.updated_at = datetime.utcnow()
    else:
        existing = WorkspaceRoleAssignment(
            workspace_id=workspace_id,
            role_map=role_map,
        )
        db.add(existing)

    await db.flush()
    return existing


async def compute_gap_analysis(
    db: AsyncSession, workspace_id: str
) -> OrgGapAnalysisReport:
    """Run full gap analysis for a workspace."""
    from app.auth.models import WorkspaceProfile

    # 1. Create report
    report = OrgGapAnalysisReport(workspace_id=workspace_id, status="computing")
    db.add(report)
    await db.flush()

    try:
        # 2. Get workspace profile
        prof_result = await db.execute(
            select(WorkspaceProfile).where(
                WorkspaceProfile.workspace_id == workspace_id
            )
        )
        profile = prof_result.scalar_one_or_none()

        industry = profile.industry if profile else "other"
        team_size = profile.team_size if profile else 1

        # 3. Get role assignments
        role_map = await get_role_assignments(db, workspace_id)

        # 4. Generate ideal org chart
        from app.engines.smart_intake_engine.org_chart_engine import generate_org_chart

        ideal_org = generate_org_chart(industry=industry, team_size=team_size)
        ideal_departments = ideal_org["departments"]

        # 5. Compute scores
        scores = compute_all_gap_scores(ideal_departments, role_map, team_size)

        # 6. Build breakdown
        breakdown = build_gap_breakdown(ideal_departments, role_map)

        # 7. Generate recommendations
        recommendations = generate_gap_recommendations(scores, breakdown, industry)

        # 8. Populate report
        report.status = "completed"
        report.overall_gap_score = scores["overall_gap_score"]
        report.department_coverage_score = scores["department_coverage_score"]
        report.role_coverage_score = scores["role_coverage_score"]
        report.leadership_gap_score = scores["leadership_gap_score"]
        report.critical_function_score = scores["critical_function_score"]
        report.operational_maturity_score = scores["operational_maturity_score"]
        report.gap_breakdown = [dict(d) for d in breakdown]
        report.recommendations = [dict(r) for r in recommendations]
        report.ideal_org_summary = {
            "industry": industry,
            "total_departments": ideal_org["total_departments"],
            "total_ai_agents": ideal_org["total_ai_agents"],
        }
        report.computed_at = datetime.utcnow()

        # 9. Token consumption
        try:
            from app.modules.billing.service import consume_tokens

            await consume_tokens(db, workspace_id, "gap_analysis_compute")
        except Exception:
            logger.warning("Token billing skipped for gap analysis (non-fatal)")

        logger.info(
            "Gap analysis complete: workspace=%s, score=%.1f",
            workspace_id,
            report.overall_gap_score,
        )

    except Exception as e:
        report.status = "failed"
        logger.exception("Gap analysis failed for workspace=%s: %s", workspace_id, e)

    return report


async def get_latest_report(
    db: AsyncSession, workspace_id: str
) -> Optional[OrgGapAnalysisReport]:
    """Get the most recent completed gap analysis report."""
    result = await db.execute(
        select(OrgGapAnalysisReport)
        .where(
            OrgGapAnalysisReport.workspace_id == workspace_id,
            OrgGapAnalysisReport.status == "completed",
        )
        .order_by(OrgGapAnalysisReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_or_compute(
    db: AsyncSession, workspace_id: str
) -> OrgGapAnalysisReport:
    """Get latest report, or compute one if none exists."""
    report = await get_latest_report(db, workspace_id)
    if report:
        return report
    return await compute_gap_analysis(db, workspace_id)
