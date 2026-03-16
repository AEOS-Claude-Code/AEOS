"""
AEOS – Strategic Intelligence Engine: Rules engine.

Pure deterministic logic.  No AI calls.  No randomness.
Evaluates signal map → health scores, priority rankings, risk detections.

Weights and thresholds are configurable per industry via INDUSTRY_PROFILES.
"""

from __future__ import annotations

from .schemas import (
    HealthScore,
    Priority,
    PriorityCategory,
    InitiativeStatus,
    RiskAlert,
    Severity,
    SignalMap,
)

# ── Industry-tuned weight profiles ──────────────────────────────────

DEFAULT_WEIGHTS = {
    "digital_presence": 0.25,
    "lead_generation": 0.25,
    "competitive_position": 0.20,
    "integration_coverage": 0.15,
    "setup_completeness": 0.15,
}

INDUSTRY_PROFILES: dict[str, dict] = {
    "general": {
        "weights": DEFAULT_WEIGHTS,
        "risk_thresholds": {
            "digital_presence_critical": 30,
            "lead_conversion_warning": 1.5,
            "integration_minimum": 2,
            "competitor_gap_warning": 15,
        },
    },
    "ecommerce": {
        "weights": {
            "digital_presence": 0.30,
            "lead_generation": 0.30,
            "competitive_position": 0.20,
            "integration_coverage": 0.10,
            "setup_completeness": 0.10,
        },
        "risk_thresholds": {
            "digital_presence_critical": 40,
            "lead_conversion_warning": 2.0,
            "integration_minimum": 3,
            "competitor_gap_warning": 10,
        },
    },
    "healthcare": {
        "weights": {
            "digital_presence": 0.20,
            "lead_generation": 0.20,
            "competitive_position": 0.15,
            "integration_coverage": 0.25,
            "setup_completeness": 0.20,
        },
        "risk_thresholds": {
            "digital_presence_critical": 25,
            "lead_conversion_warning": 1.0,
            "integration_minimum": 2,
            "competitor_gap_warning": 20,
        },
    },
    "travel": {
        "weights": {
            "digital_presence": 0.30,
            "lead_generation": 0.25,
            "competitive_position": 0.25,
            "integration_coverage": 0.10,
            "setup_completeness": 0.10,
        },
        "risk_thresholds": {
            "digital_presence_critical": 35,
            "lead_conversion_warning": 1.5,
            "integration_minimum": 2,
            "competitor_gap_warning": 12,
        },
    },
}


def _get_profile(industry: str) -> dict:
    """Return industry profile or fall back to general."""
    return INDUSTRY_PROFILES.get(industry.lower(), INDUSTRY_PROFILES["general"])


# ── Health score computation ─────────────────────────────────────────

def compute_health_score(signals: SignalMap) -> HealthScore:
    """
    Compute a composite health score from all available signals.
    Each dimension is 0-100.  Overall is a weighted average.
    """
    dp_score = signals.digital_presence.score

    # Lead generation score: normalized from conversion rate vs benchmark
    benchmark_conv = signals.industry.benchmark_conversion_rate
    if benchmark_conv > 0:
        lead_score = min(100.0, (signals.leads.conversion_rate / benchmark_conv) * 60)
    else:
        lead_score = 50.0
    # Boost for volume
    benchmark_vol = signals.industry.benchmark_lead_volume_30d
    if benchmark_vol > 0:
        vol_ratio = min(1.0, signals.leads.total_leads_30d / benchmark_vol)
        lead_score = min(100.0, lead_score + vol_ratio * 40)

    # Competitive position score
    comp = signals.competitors
    if comp.our_relative_position == "ahead":
        comp_score = 80.0
    elif comp.our_relative_position == "par":
        comp_score = 55.0
    elif comp.our_relative_position == "behind":
        comp_score = 30.0
    else:
        comp_score = 50.0  # unknown → neutral
    if comp.tracked_count == 0:
        comp_score = max(comp_score, 40.0)  # no tracking → penalize slightly

    # Integration coverage
    integ = signals.integrations
    if integ.total_available > 0:
        integ_score = min(100.0, (integ.total_connected / integ.total_available) * 100)
    else:
        integ_score = 50.0
    # Penalize critical missing integrations
    integ_score = max(0.0, integ_score - len(integ.critical_missing) * 10)

    # Setup completeness
    setup_score = 100.0 if signals.workspace.setup_completed else 40.0
    if signals.workspace.website_url:
        setup_score = min(100.0, setup_score + 15)
    if signals.workspace.goals:
        setup_score = min(100.0, setup_score + 15)

    # Weighted overall
    profile = _get_profile(signals.workspace.industry)
    w = profile["weights"]
    overall = (
        dp_score * w["digital_presence"]
        + lead_score * w["lead_generation"]
        + comp_score * w["competitive_position"]
        + integ_score * w["integration_coverage"]
        + setup_score * w["setup_completeness"]
    )

    return HealthScore(
        overall=round(overall, 1),
        digital_presence=round(dp_score, 1),
        lead_generation=round(lead_score, 1),
        competitive_position=round(comp_score, 1),
        integration_coverage=round(integ_score, 1),
        setup_completeness=round(setup_score, 1),
    )


# ── Priority detection ───────────────────────────────────────────────

def detect_priorities(signals: SignalMap, health: HealthScore) -> list[Priority]:
    """
    Deterministic priority detection.
    Returns a ranked list sorted by impact descending.
    """
    priorities: list[Priority] = []
    profile = _get_profile(signals.workspace.industry)
    thresholds = profile["risk_thresholds"]

    # 1. Low digital presence
    if health.digital_presence < 50:
        gap = 50 - health.digital_presence
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.marketing,
            title="Improve digital presence score",
            description=(
                f"Digital presence is at {health.digital_presence:.0f}/100, "
                f"which is {gap:.0f} points below the target threshold. "
                "Focus on website performance, search visibility, and social profiles."
            ),
            impact_score=min(100, gap * 2),
            effort_score=40,
            source_engine="digital_presence_engine",
        ))

    # 2. Lead conversion below benchmark
    benchmark = signals.industry.benchmark_conversion_rate
    if signals.leads.conversion_rate < benchmark:
        gap_pct = benchmark - signals.leads.conversion_rate
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.marketing,
            title="Increase lead conversion rate",
            description=(
                f"Current conversion rate is {signals.leads.conversion_rate:.1f}% "
                f"vs industry benchmark of {benchmark:.1f}%. "
                "Review landing pages, CTAs, and lead nurturing workflows."
            ),
            impact_score=min(100, gap_pct * 25),
            effort_score=55,
            source_engine="lead_intelligence_engine",
        ))

    # 3. Declining lead trend
    if signals.leads.trend == "declining":
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.growth,
            title="Reverse declining lead trend",
            description=(
                "Lead volume is declining over the last 30 days. "
                "Investigate channel performance and consider new acquisition strategies."
            ),
            impact_score=85,
            effort_score=50,
            source_engine="lead_intelligence_engine",
        ))

    # 4. High-impact opportunities waiting
    if signals.opportunities.high_impact_count >= 3:
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.growth,
            title="Act on detected growth opportunities",
            description=(
                f"{signals.opportunities.high_impact_count} high-impact opportunities "
                f"detected. Top opportunity: {signals.opportunities.top_opportunity}."
            ),
            impact_score=80,
            effort_score=35,
            source_engine="opportunity_intelligence_engine",
        ))

    # 5. Falling behind competitors
    if signals.competitors.our_relative_position == "behind":
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.marketing,
            title="Close competitive gap",
            description=(
                f"Positioned behind {signals.competitors.tracked_count} tracked "
                "competitors. Analyze competitor strengths and identify quick wins."
            ),
            impact_score=75,
            effort_score=60,
            source_engine="competitor_intelligence_engine",
        ))

    # 6. Missing critical integrations
    if signals.integrations.critical_missing:
        missing = ", ".join(signals.integrations.critical_missing[:3])
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.technology,
            title="Connect critical integrations",
            description=(
                f"Missing integrations: {missing}. "
                "Connecting these will improve data quality and engine accuracy."
            ),
            impact_score=65,
            effort_score=20,
            source_engine="integrations",
        ))

    # 7. Setup incomplete
    if not signals.workspace.setup_completed:
        priorities.append(Priority(
            rank=0,
            category=PriorityCategory.operations,
            title="Complete AEOS Setup Wizard",
            description=(
                "The onboarding wizard is not fully completed. "
                "Finishing setup unlocks accurate scoring and recommendations."
            ),
            impact_score=60,
            effort_score=10,
            source_engine="workspace",
        ))

    # Sort by impact descending, assign ranks
    priorities.sort(key=lambda p: p.impact_score, reverse=True)
    for i, p in enumerate(priorities, start=1):
        p.rank = i

    return priorities


# ── Risk detection ───────────────────────────────────────────────────

def detect_risks(signals: SignalMap, health: HealthScore) -> list[RiskAlert]:
    """
    Deterministic risk detection based on thresholds.
    Returns a list of active risk alerts sorted by severity.
    """
    risks: list[RiskAlert] = []
    profile = _get_profile(signals.workspace.industry)
    t = profile["risk_thresholds"]
    risk_id = 0

    def _next_id() -> str:
        nonlocal risk_id
        risk_id += 1
        return f"risk-{risk_id:04d}"

    # Critical: very low digital presence
    if signals.digital_presence.score < t["digital_presence_critical"]:
        risks.append(RiskAlert(
            id=_next_id(),
            severity=Severity.critical,
            category="digital_presence",
            title="Digital presence critically low",
            description=(
                f"Score is {signals.digital_presence.score:.0f}/100, "
                f"below critical threshold of {t['digital_presence_critical']}."
            ),
            source_engine="digital_presence_engine",
            recommended_action="Immediate website and SEO audit required.",
        ))

    # High: conversion well below benchmark
    conv_threshold = t["lead_conversion_warning"]
    if signals.leads.conversion_rate < conv_threshold:
        risks.append(RiskAlert(
            id=_next_id(),
            severity=Severity.high,
            category="lead_generation",
            title="Lead conversion rate critically low",
            description=(
                f"Conversion at {signals.leads.conversion_rate:.1f}% "
                f"vs warning threshold of {conv_threshold:.1f}%."
            ),
            source_engine="lead_intelligence_engine",
            recommended_action="Review conversion funnel and landing page UX.",
        ))

    # Medium: not enough integrations
    if signals.integrations.total_connected < t["integration_minimum"]:
        risks.append(RiskAlert(
            id=_next_id(),
            severity=Severity.medium,
            category="integrations",
            title="Insufficient platform integrations",
            description=(
                f"Only {signals.integrations.total_connected} integrations "
                f"connected (minimum recommended: {t['integration_minimum']})."
            ),
            source_engine="integrations",
            recommended_action="Connect Google Analytics, Search Console, and social platforms.",
        ))

    # Medium: no competitors tracked
    if signals.competitors.tracked_count == 0:
        risks.append(RiskAlert(
            id=_next_id(),
            severity=Severity.medium,
            category="competitive_intelligence",
            title="No competitors tracked",
            description="Competitive intelligence is unavailable without tracked competitors.",
            source_engine="competitor_intelligence_engine",
            recommended_action="Add at least 2-3 competitor URLs in the Setup Wizard.",
        ))

    # Low: declining leads
    if signals.leads.trend == "declining":
        risks.append(RiskAlert(
            id=_next_id(),
            severity=Severity.low,
            category="lead_generation",
            title="Lead volume declining",
            description="30-day lead volume shows a declining trend.",
            source_engine="lead_intelligence_engine",
            recommended_action="Investigate traffic sources and marketing spend allocation.",
        ))

    # Sort by severity weight
    sev_order = {Severity.critical: 0, Severity.high: 1, Severity.medium: 2, Severity.low: 3}
    risks.sort(key=lambda r: sev_order.get(r.severity, 99))

    return risks


# ── Strategic headline generation (deterministic) ────────────────────

def generate_headline(health: HealthScore, signals: SignalMap) -> str:
    """
    Produce a one-sentence strategic headline without AI.
    Replaced by AI narrator in Phase 11C.
    """
    company = signals.workspace.company_name or "Your company"

    if health.overall >= 75:
        return f"{company} is performing well — focus on scaling growth opportunities."
    elif health.overall >= 50:
        return f"{company} has a solid foundation with clear areas for improvement."
    elif health.overall >= 30:
        return f"{company} needs attention in several key areas to unlock growth potential."
    else:
        return f"{company} requires immediate strategic action to strengthen business health."


def generate_key_insight(
    health: HealthScore,
    priorities: list[Priority],
    signals: SignalMap,
) -> str:
    """Produce the single most important insight."""
    if not priorities:
        return "Complete the AEOS Setup Wizard to unlock strategic insights."

    top = priorities[0]
    return (
        f"Top priority: {top.title} "
        f"(impact: {top.impact_score:.0f}/100, effort: {top.effort_score:.0f}/100). "
        f"{top.description}"
    )
