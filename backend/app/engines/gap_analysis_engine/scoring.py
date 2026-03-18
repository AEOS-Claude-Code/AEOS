"""
AEOS – Gap Analysis Engine: Scoring logic.

5-dimension gap scoring (0-100, higher = more gaps) plus recommendation generator.
"""

from __future__ import annotations


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


# Critical departments that every company should staff with humans
CRITICAL_DEPTS = {"finance", "hr", "legal"}

# Core departments (high priority for any business)
CORE_DEPTS = {"strategy", "sales", "marketing", "operations", "it", "finance", "hr", "legal"}


def score_department_coverage(
    ideal_departments: list[dict],
    role_map: dict[str, bool],
) -> float:
    """
    How many ideal departments have at least one human?
    Score: 0 = all covered, 100 = none covered.
    """
    if not ideal_departments:
        return 0.0

    covered = 0
    for dept in ideal_departments:
        dept_id = dept["id"]
        # Check if any role (head or specialist) is marked as human
        has_human = role_map.get(f"{dept_id}:__head__", False)
        if not has_human:
            for role in dept.get("ai_roles", []):
                if role_map.get(f"{dept_id}:{role}", False):
                    has_human = True
                    break
        if has_human:
            covered += 1

    return _clamp(100.0 - (covered / len(ideal_departments) * 100.0))


def score_role_coverage(
    ideal_departments: list[dict],
    role_map: dict[str, bool],
) -> float:
    """
    What fraction of all roles are filled by humans?
    Score: 0 = all human, 100 = all AI.
    """
    total_roles = 0
    human_roles = 0

    for dept in ideal_departments:
        dept_id = dept["id"]
        # Head role
        total_roles += 1
        if role_map.get(f"{dept_id}:__head__", False):
            human_roles += 1
        # Specialist roles
        for role in dept.get("ai_roles", []):
            total_roles += 1
            if role_map.get(f"{dept_id}:{role}", False):
                human_roles += 1

    if total_roles == 0:
        return 0.0

    return _clamp(100.0 - (human_roles / total_roles * 100.0))


def score_leadership_gaps(
    ideal_departments: list[dict],
    role_map: dict[str, bool],
) -> float:
    """
    How many departments lack a human head?
    Extra penalty for core departments without human leadership.
    """
    if not ideal_departments:
        return 0.0

    total = len(ideal_departments)
    human_heads = 0
    core_missing = 0

    for dept in ideal_departments:
        dept_id = dept["id"]
        if role_map.get(f"{dept_id}:__head__", False):
            human_heads += 1
        elif dept_id in CORE_DEPTS:
            core_missing += 1

    base = 100.0 - (human_heads / total * 100.0)
    penalty = min(30.0, core_missing * 5.0)  # up to +30 for missing core leaders

    return _clamp(base + penalty)


def score_critical_functions(
    ideal_departments: list[dict],
    role_map: dict[str, bool],
) -> float:
    """
    Do critical departments (Legal, Finance, HR) have any human presence?
    Each missing = +33 points.
    """
    present_ids = {d["id"] for d in ideal_departments}
    missing_count = 0

    for crit in CRITICAL_DEPTS:
        if crit not in present_ids:
            # Department not even in the ideal org (some industries skip Legal/HR)
            continue
        # Check if any human in this department
        has_human = role_map.get(f"{crit}:__head__", False)
        if not has_human:
            for dept in ideal_departments:
                if dept["id"] == crit:
                    for role in dept.get("ai_roles", []):
                        if role_map.get(f"{crit}:{role}", False):
                            has_human = True
                            break
                    break
        if not has_human:
            missing_count += 1

    # Score relative to how many critical depts exist
    crit_in_org = sum(1 for c in CRITICAL_DEPTS if c in present_ids)
    if crit_in_org == 0:
        return 50.0  # No critical depts in org = moderate concern

    return _clamp(missing_count / crit_in_org * 100.0)


def score_operational_maturity(
    team_size: int,
    total_ideal_roles: int,
) -> float:
    """
    How does team size compare to ideal org size?
    Low ratio = early stage = high gap score.
    """
    if total_ideal_roles == 0:
        return 50.0

    ratio = team_size / total_ideal_roles

    if ratio >= 0.6:
        return 10.0
    elif ratio >= 0.4:
        return 25.0
    elif ratio >= 0.25:
        return 45.0
    elif ratio >= 0.15:
        return 60.0
    elif ratio >= 0.08:
        return 75.0
    else:
        return 90.0


def compute_all_gap_scores(
    ideal_departments: list[dict],
    role_map: dict[str, bool],
    team_size: int,
) -> dict:
    """
    Compute all 5 gap dimensions and the weighted overall score.
    Returns dict with all scores.
    """
    total_roles = sum(1 + len(d.get("ai_roles", [])) for d in ideal_departments)

    dept_cov = score_department_coverage(ideal_departments, role_map)
    role_cov = score_role_coverage(ideal_departments, role_map)
    leadership = score_leadership_gaps(ideal_departments, role_map)
    critical = score_critical_functions(ideal_departments, role_map)
    maturity = score_operational_maturity(team_size, total_roles)

    overall = _clamp(
        dept_cov * 0.25
        + role_cov * 0.25
        + leadership * 0.20
        + critical * 0.15
        + maturity * 0.15
    )

    return {
        "overall_gap_score": round(overall, 1),
        "department_coverage_score": round(dept_cov, 1),
        "role_coverage_score": round(role_cov, 1),
        "leadership_gap_score": round(leadership, 1),
        "critical_function_score": round(critical, 1),
        "operational_maturity_score": round(maturity, 1),
    }


def build_gap_breakdown(
    ideal_departments: list[dict],
    role_map: dict[str, bool],
) -> list[dict]:
    """Build per-department gap detail."""
    breakdown = []

    for dept in ideal_departments:
        dept_id = dept["id"]
        head_is_human = role_map.get(f"{dept_id}:__head__", False)
        ai_roles_list = dept.get("ai_roles", [])
        total_roles = 1 + len(ai_roles_list)  # head + specialists

        human_roles = []
        ai_roles = []
        if head_is_human:
            human_roles.append(dept.get("ai_head", "Director").replace(" AI", ""))
        else:
            ai_roles.append(dept.get("ai_head", "Director"))

        for role in ai_roles_list:
            if role_map.get(f"{dept_id}:{role}", False):
                human_roles.append(role.replace(" Agent", ""))
            else:
                ai_roles.append(role)

        human_count = len(human_roles)
        ai_count = len(ai_roles)

        # Determine status
        if human_count == total_roles:
            status = "fully_staffed"
            severity = "none"
        elif human_count > 0:
            status = "partially_staffed"
            severity = "low" if human_count >= total_roles / 2 else "medium"
        else:
            status = "ai_only"
            severity = "high" if dept_id in CORE_DEPTS else "medium"

        # Critical departments with no humans = critical severity
        if dept_id in CRITICAL_DEPTS and human_count == 0:
            severity = "critical"

        breakdown.append({
            "department_id": dept_id,
            "department_name": dept["name"],
            "icon": dept.get("icon", ""),
            "status": status,
            "gap_severity": severity,
            "has_human_head": head_is_human,
            "total_ideal_roles": total_roles,
            "human_filled_roles": human_count,
            "ai_filled_roles": ai_count,
            "missing_roles": [],  # All roles are either human or AI
            "human_roles": human_roles,
            "ai_roles": ai_roles,
        })

    return breakdown


def generate_gap_recommendations(
    scores: dict,
    breakdown: list[dict],
    industry: str,
) -> list[dict]:
    """Generate prioritized recommendations based on gap analysis."""
    recs: list[dict] = []
    priority = 0

    # 1. Critical functions missing humans
    for dept in breakdown:
        if dept["department_id"] in CRITICAL_DEPTS and dept["status"] == "ai_only":
            priority += 1
            recs.append({
                "priority": priority,
                "category": dept["department_id"],
                "title": f"Staff {dept['department_name']} with human leadership",
                "description": (
                    f"Your {dept['department_name']} department has no human team members. "
                    f"This is a critical function — consider hiring a {dept['department_name']} lead "
                    f"to oversee AI agents and ensure compliance."
                ),
                "impact": "high",
                "effort": "hard",
            })

    # 2. Core departments with no human head
    for dept in breakdown:
        if (
            dept["department_id"] in CORE_DEPTS
            and dept["department_id"] not in CRITICAL_DEPTS
            and not dept["has_human_head"]
            and dept["status"] == "ai_only"
        ):
            priority += 1
            recs.append({
                "priority": priority,
                "category": dept["department_id"],
                "title": f"Add human oversight to {dept['department_name']}",
                "description": (
                    f"Your {dept['department_name']} is fully AI-managed. "
                    f"Adding a human director ensures strategic alignment and accountability."
                ),
                "impact": "high",
                "effort": "medium",
            })

    # 3. Industry-specific departments with no humans
    for dept in breakdown:
        if (
            dept["department_id"] not in CORE_DEPTS
            and dept["status"] == "ai_only"
        ):
            priority += 1
            recs.append({
                "priority": priority,
                "category": dept["department_id"],
                "title": f"Consider human expertise in {dept['department_name']}",
                "description": (
                    f"As a {industry.replace('_', ' ')} company, {dept['department_name']} "
                    f"benefits from domain expertise. Consider hiring specialists to guide AI agents."
                ),
                "impact": "medium",
                "effort": "medium",
            })

    # 4. Leadership gap recommendation
    if scores.get("leadership_gap_score", 0) > 60:
        priority += 1
        recs.append({
            "priority": priority,
            "category": "general",
            "title": "Strengthen human leadership across departments",
            "description": (
                "Most departments lack human department heads. "
                "Prioritize hiring senior leaders for your top 2-3 departments to improve strategic direction."
            ),
            "impact": "high",
            "effort": "hard",
        })

    # 5. Maturity recommendation
    if scores.get("operational_maturity_score", 0) > 70:
        priority += 1
        recs.append({
            "priority": priority,
            "category": "general",
            "title": "Grow your team to match organizational complexity",
            "description": (
                "Your team size is small relative to your ideal organizational structure. "
                "AEOS AI agents are filling the gaps, but strategic hiring will strengthen execution."
            ),
            "impact": "medium",
            "effort": "hard",
        })

    # 6. Positive note if gaps are low
    if scores.get("overall_gap_score", 100) < 30:
        priority += 1
        recs.append({
            "priority": priority,
            "category": "general",
            "title": "Strong organizational coverage",
            "description": (
                "Your company has good human coverage across departments. "
                "AEOS AI agents complement your team effectively. Focus on optimizing workflows."
            ),
            "impact": "low",
            "effort": "easy",
        })

    return recs[:7]  # Cap at 7 recommendations
