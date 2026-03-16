"""
AEOS – Strategic Intelligence Engine: Roadmap generator.

Builds 30 / 60 / 90-day roadmaps from detected priorities.
Deterministic: maps priority category + effort → week slot + department.

AI narrative wording is a placeholder for Phase 11C.
"""

from __future__ import annotations

from datetime import datetime

from .schemas import (
    HealthScore,
    Priority,
    PriorityCategory,
    Roadmap,
    RoadmapAction,
    RoadmapResponse,
    SignalMap,
)

# ── Department mapping ───────────────────────────────────────────────

CATEGORY_DEPARTMENT: dict[PriorityCategory, str] = {
    PriorityCategory.marketing: "Marketing",
    PriorityCategory.growth: "Marketing / Strategy",
    PriorityCategory.operations: "Operations",
    PriorityCategory.hr: "HR",
    PriorityCategory.finance: "Finance",
    PriorityCategory.technology: "IT / Engineering",
}


# ── Week slot assignment ─────────────────────────────────────────────

def _assign_week(priority: Priority, horizon_weeks: int) -> int:
    """
    Assign a target week based on effort score.
    Low effort → early weeks.  High effort → later weeks.
    """
    if priority.effort_score <= 20:
        return min(1, horizon_weeks)
    elif priority.effort_score <= 40:
        return min(2, horizon_weeks)
    elif priority.effort_score <= 60:
        return min(max(3, horizon_weeks // 2), horizon_weeks)
    else:
        return min(max(horizon_weeks - 2, 1), horizon_weeks)


def _goal_for_category(category: PriorityCategory) -> str:
    """Generate a standard goal statement per category."""
    goals = {
        PriorityCategory.marketing: "Strengthen digital presence and marketing effectiveness",
        PriorityCategory.growth: "Accelerate lead generation and revenue growth",
        PriorityCategory.operations: "Improve operational efficiency and platform setup",
        PriorityCategory.hr: "Optimize team structure and workforce alignment",
        PriorityCategory.finance: "Improve financial visibility and cost efficiency",
        PriorityCategory.technology: "Enhance technology integrations and data quality",
    }
    return goals.get(category, "Improve overall business performance")


# ── Roadmap builder ──────────────────────────────────────────────────

def _build_single_roadmap(
    workspace_id: str,
    priorities: list[Priority],
    horizon_days: int,
) -> Roadmap:
    """Build one roadmap for a specific horizon."""
    horizon_weeks = horizon_days // 7

    # Collect goals from unique categories present in priorities
    seen_categories: set[PriorityCategory] = set()
    goals: list[str] = []
    actions: list[RoadmapAction] = []

    for p in priorities:
        # Only include priorities whose effort fits within this horizon
        min_weeks_needed = max(1, int(p.effort_score / 15))
        if min_weeks_needed > horizon_weeks:
            continue

        if p.category not in seen_categories:
            seen_categories.add(p.category)
            goals.append(_goal_for_category(p.category))

        week = _assign_week(p, horizon_weeks)
        department = CATEGORY_DEPARTMENT.get(p.category, "General")

        actions.append(RoadmapAction(
            week=week,
            action=p.title,
            department=department,
            expected_outcome=p.description,
            priority_rank=p.rank,
        ))

    # Sort actions by week
    actions.sort(key=lambda a: (a.week, a.priority_rank or 99))

    if not goals:
        goals = ["Establish baseline performance metrics"]

    return Roadmap(
        workspace_id=workspace_id,
        horizon_days=horizon_days,
        goals=goals,
        actions=actions,
        narrative="",  # Placeholder for AI narrator (Phase 11C)
        generated_at=datetime.utcnow(),
    )


def build_roadmaps(
    workspace_id: str,
    priorities: list[Priority],
    signals: SignalMap,
    health: HealthScore,
) -> RoadmapResponse:
    """
    Build the full 30/60/90 day roadmap set.

    Parameters
    ----------
    workspace_id : str
        Workspace scope.
    priorities : list[Priority]
        Ranked priorities from the rules engine.
    signals : SignalMap
        Aggregated signals (used for context in future narrative).
    health : HealthScore
        Pre-computed health scores.
    """
    return RoadmapResponse(
        workspace_id=workspace_id,
        roadmaps={
            "30": _build_single_roadmap(workspace_id, priorities, 30),
            "60": _build_single_roadmap(workspace_id, priorities, 60),
            "90": _build_single_roadmap(workspace_id, priorities, 90),
        },
        generated_at=datetime.utcnow(),
    )
