"""
AEOS – Strategic Intelligence Engine: Priorities module.

Extends the rules-based priority detection with ranking utilities
and filtering helpers used by the API layer.
"""

from __future__ import annotations

from datetime import datetime

from .schemas import (
    HealthScore,
    InitiativeStatus,
    Priority,
    PriorityCategory,
    PriorityList,
    SignalMap,
)
from .rules import detect_priorities


def build_priority_list(
    workspace_id: str,
    signals: SignalMap,
    health: HealthScore,
    *,
    category_filter: PriorityCategory | None = None,
    max_items: int = 10,
) -> PriorityList:
    """
    Generate a ranked, optionally filtered, priority list.

    Parameters
    ----------
    workspace_id : str
        Workspace scope.
    signals : SignalMap
        Aggregated signal map.
    health : HealthScore
        Pre-computed health scores.
    category_filter : PriorityCategory, optional
        If provided, return only priorities in this category.
    max_items : int
        Maximum number of priorities to return.
    """
    priorities = detect_priorities(signals, health)

    if category_filter is not None:
        priorities = [p for p in priorities if p.category == category_filter]

    return PriorityList(
        workspace_id=workspace_id,
        priorities=priorities[:max_items],
        generated_at=datetime.utcnow(),
    )


def quick_wins(priorities: list[Priority], max_items: int = 3) -> list[Priority]:
    """
    Return priorities with high impact and low effort — "quick wins".
    Useful for the Executive Briefing daily card.
    """
    scored = sorted(
        priorities,
        key=lambda p: (p.impact_score - p.effort_score),
        reverse=True,
    )
    return scored[:max_items]
