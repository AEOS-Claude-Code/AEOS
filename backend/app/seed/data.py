"""
AEOS – Seed data store.

Single source of truth for all demo/seed data used in local development.
Every entity has a fixed ID so resets are idempotent.

This module is pure data — no side effects, no DB access.
"""

from __future__ import annotations

from datetime import datetime, timedelta

# ── IDs ──────────────────────────────────────────────────────────────

WORKSPACE_ID = "ws-demo-001"
OWNER_USER_ID = "usr-demo-001"

# ── Workspace ────────────────────────────────────────────────────────

WORKSPACE = {
    "id": WORKSPACE_ID,
    "name": "Acme Digital",
    "slug": "acme-digital",
    "industry": "ecommerce",
    "country": "US",
    "city": "New York",
    "team_size": 12,
    "website_url": "https://acmedigital.com",
    "social_links": {
        "facebook": "https://facebook.com/acmedigital",
        "instagram": "https://instagram.com/acmedigital",
        "linkedin": "https://linkedin.com/company/acmedigital",
    },
    "whatsapp_link": "https://wa.me/15551234567",
    "booking_url": "https://acmedigital.com/book",
    "competitor_urls": [
        "https://competitor-alpha.com",
        "https://competitor-beta.com",
        "https://competitor-gamma.com",
    ],
    "goals": [
        "Increase online sales by 30%",
        "Improve brand visibility in US market",
        "Expand to European markets by Q4",
    ],
    "plan": "growth",
    "tokens_used": 38420,
    "tokens_total": 150000,
    "setup_completed": True,
    "setup_step": 5,
    "created_at": (datetime.utcnow() - timedelta(days=45)).isoformat(),
}

# ── Owner user ───────────────────────────────────────────────────────

OWNER_USER = {
    "id": OWNER_USER_ID,
    "workspace_id": WORKSPACE_ID,
    "email": "demo@acmedigital.com",
    "full_name": "Dana Chen",
    "initials": "DC",
    "role": "owner",
    "is_active": True,
    "created_at": (datetime.utcnow() - timedelta(days=45)).isoformat(),
}

# ── Leads ────────────────────────────────────────────────────────────

_now = datetime.utcnow()

LEADS = [
    {
        "id": "lead-001",
        "workspace_id": WORKSPACE_ID,
        "name": "Sarah Mitchell",
        "email": "sarah.mitchell@outlook.com",
        "company": "BrightPath Consulting",
        "source": "organic_search",
        "channel": "website_form",
        "status": "qualified",
        "score": 82,
        "page_url": "/pricing",
        "utm_source": "google",
        "utm_medium": "organic",
        "created_at": (_now - timedelta(days=2, hours=5)).isoformat(),
    },
    {
        "id": "lead-002",
        "workspace_id": WORKSPACE_ID,
        "name": "James Rodriguez",
        "email": "j.rodriguez@techvault.io",
        "company": "TechVault",
        "source": "paid_search",
        "channel": "google_ads",
        "status": "new",
        "score": 65,
        "page_url": "/features",
        "utm_source": "google",
        "utm_medium": "cpc",
        "created_at": (_now - timedelta(days=1, hours=12)).isoformat(),
    },
    {
        "id": "lead-003",
        "workspace_id": WORKSPACE_ID,
        "name": "Emily Tanaka",
        "email": "emily.t@greenlane.co",
        "company": "GreenLane Co",
        "source": "social",
        "channel": "instagram",
        "status": "qualified",
        "score": 74,
        "page_url": "/case-studies",
        "utm_source": "instagram",
        "utm_medium": "social",
        "created_at": (_now - timedelta(days=5, hours=8)).isoformat(),
    },
    {
        "id": "lead-004",
        "workspace_id": WORKSPACE_ID,
        "name": "Marcus Webb",
        "email": "marcus@webblabs.com",
        "company": "Webb Labs",
        "source": "referral",
        "channel": "partner",
        "status": "contacted",
        "score": 58,
        "page_url": "/demo",
        "utm_source": "partner",
        "utm_medium": "referral",
        "created_at": (_now - timedelta(days=8, hours=3)).isoformat(),
    },
    {
        "id": "lead-005",
        "workspace_id": WORKSPACE_ID,
        "name": "Lisa Andersen",
        "email": "l.andersen@nordicretail.dk",
        "company": "Nordic Retail",
        "source": "organic_search",
        "channel": "whatsapp",
        "status": "new",
        "score": 71,
        "page_url": "/contact",
        "utm_source": "google",
        "utm_medium": "organic",
        "created_at": (_now - timedelta(hours=6)).isoformat(),
    },
]

# ── Opportunities ────────────────────────────────────────────────────

OPPORTUNITIES = [
    {
        "id": "opp-001",
        "workspace_id": WORKSPACE_ID,
        "title": "Untapped local SEO keywords with high purchase intent",
        "category": "keyword_gaps",
        "impact": "high",
        "impact_score": 92,
        "effort_score": 35,
        "description": (
            "17 high-volume keywords with commercial intent in your niche "
            "have no competing content. Estimated 2,400 monthly visits."
        ),
        "recommended_action": "Create targeted landing pages for top 5 keywords.",
        "source_engine": "opportunity_intelligence_engine",
        "status": "detected",
        "detected_at": (_now - timedelta(days=3)).isoformat(),
    },
    {
        "id": "opp-002",
        "workspace_id": WORKSPACE_ID,
        "title": "Competitor weakness in mobile experience",
        "category": "competitor",
        "impact": "high",
        "impact_score": 85,
        "effort_score": 50,
        "description": (
            "Competitor Alpha scores 34/100 on mobile PageSpeed. "
            "Your mobile score is 61 — small improvements could capture their mobile traffic."
        ),
        "recommended_action": "Optimize Core Web Vitals and mobile UX to outrank on mobile SERPs.",
        "source_engine": "competitor_intelligence_engine",
        "status": "detected",
        "detected_at": (_now - timedelta(days=5)).isoformat(),
    },
    {
        "id": "opp-003",
        "workspace_id": WORKSPACE_ID,
        "title": "Missing Google Business optimization",
        "category": "local_market",
        "impact": "medium",
        "impact_score": 68,
        "effort_score": 15,
        "description": (
            "Your Google Business profile is incomplete — no business hours, "
            "no photos, and only 4 reviews. Competitors average 45 reviews."
        ),
        "recommended_action": "Complete profile, add photos, and launch a review collection campaign.",
        "source_engine": "digital_presence_engine",
        "status": "detected",
        "detected_at": (_now - timedelta(days=7)).isoformat(),
    },
    {
        "id": "opp-004",
        "workspace_id": WORKSPACE_ID,
        "title": "Form conversion rate below benchmark",
        "category": "conversion",
        "impact": "high",
        "impact_score": 78,
        "effort_score": 40,
        "description": (
            "Contact form converts at 2.1% vs 3.2% industry benchmark. "
            "Simplifying from 7 fields to 4 could lift conversion by 40%."
        ),
        "recommended_action": "A/B test a shorter form variant on the top 3 landing pages.",
        "source_engine": "lead_intelligence_engine",
        "status": "detected",
        "detected_at": (_now - timedelta(days=1)).isoformat(),
    },
    {
        "id": "opp-005",
        "workspace_id": WORKSPACE_ID,
        "title": "Instagram Reels driving untapped traffic",
        "category": "social",
        "impact": "medium",
        "impact_score": 62,
        "effort_score": 30,
        "description": (
            "Industry Reels average 12k views. Your account posts "
            "static images only. Video content could double engagement."
        ),
        "recommended_action": "Launch a 4-week Reels content plan with product demos.",
        "source_engine": "digital_presence_engine",
        "status": "detected",
        "detected_at": (_now - timedelta(days=10)).isoformat(),
    },
]

# ── Integrations ─────────────────────────────────────────────────────

INTEGRATIONS = [
    {
        "id": "integ-001",
        "workspace_id": WORKSPACE_ID,
        "platform": "Google Business",
        "status": "connected",
        "connected_at": (_now - timedelta(days=40)).isoformat(),
        "last_sync": (_now - timedelta(hours=2)).isoformat(),
        "health": "healthy",
    },
    {
        "id": "integ-002",
        "workspace_id": WORKSPACE_ID,
        "platform": "Facebook",
        "status": "connected",
        "connected_at": (_now - timedelta(days=38)).isoformat(),
        "last_sync": (_now - timedelta(hours=1)).isoformat(),
        "health": "healthy",
    },
    {
        "id": "integ-003",
        "workspace_id": WORKSPACE_ID,
        "platform": "Instagram",
        "status": "connected",
        "connected_at": (_now - timedelta(days=38)).isoformat(),
        "last_sync": (_now - timedelta(hours=1)).isoformat(),
        "health": "healthy",
    },
    {
        "id": "integ-004",
        "workspace_id": WORKSPACE_ID,
        "platform": "Google Analytics",
        "status": "disconnected",
        "connected_at": None,
        "last_sync": None,
        "health": "not_connected",
    },
]

# Platforms available but not yet connected
RECOMMENDED_INTEGRATIONS = [
    "Google Search Console",
    "WordPress",
    "Shopify",
    "WhatsApp Business",
    "Mailchimp",
]

# ── Summary stats (computed from seed data) ──────────────────────────

LEAD_SUMMARY = {
    "total_leads_30d": len(LEADS),
    "qualified_leads_30d": sum(1 for l in LEADS if l["status"] == "qualified"),
    "conversion_rate": 2.1,
    "top_source": "organic_search",
    "trend": "stable",
}

OPPORTUNITY_SUMMARY = {
    "total_detected": len(OPPORTUNITIES),
    "high_impact_count": sum(1 for o in OPPORTUNITIES if o["impact"] == "high"),
    "categories": list({o["category"] for o in OPPORTUNITIES}),
    "top_opportunity": OPPORTUNITIES[0]["title"],
}

INTEGRATION_SUMMARY = {
    "total_available": len(INTEGRATIONS) + len(RECOMMENDED_INTEGRATIONS),
    "total_connected": sum(1 for i in INTEGRATIONS if i["status"] == "connected"),
    "critical_missing": ["Google Analytics", "Google Search Console"],
}
