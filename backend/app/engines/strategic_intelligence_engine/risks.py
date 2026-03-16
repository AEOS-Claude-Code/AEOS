"""
AEOS – Strategic Intelligence Engine: Risks module.

Extends the rules-based risk detection with filtering, acknowledgement
helpers, and response builders used by the API layer.
"""

from __future__ import annotations

from datetime import datetime

from .schemas import (
    HealthScore,
    RiskAlert,
    RiskList,
    Severity,
    SignalMap,
)
from .rules import detect_risks


def build_risk_list(
    workspace_id: str,
    signals: SignalMap,
    health: HealthScore,
    *,
    severity_filter: Severity | None = None,
    include_acknowledged: bool = False,
) -> RiskList:
    """
    Generate a filtered risk list for the workspace.

    Parameters
    ----------
    workspace_id : str
        Workspace scope.
    signals : SignalMap
        Aggregated signal map.
    health : HealthScore
        Pre-computed health scores.
    severity_filter : Severity, optional
        If provided, return only risks at this severity level.
    include_acknowledged : bool
        Whether to include previously acknowledged risks.
    """
    risks = detect_risks(signals, health)

    if severity_filter is not None:
        risks = [r for r in risks if r.severity == severity_filter]

    if not include_acknowledged:
        risks = [r for r in risks if not r.acknowledged]

    return RiskList(
        workspace_id=workspace_id,
        risks=risks,
        generated_at=datetime.utcnow(),
    )


def critical_risk_count(risks: list[RiskAlert]) -> int:
    """Count of critical + high severity risks. Used by dashboard badges."""
    return sum(
        1 for r in risks
        if r.severity in (Severity.critical, Severity.high)
    )
