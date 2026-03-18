"""
AEOS – Smart Intake Engine: Organizational Chart Recommendation.

Generates industry-specific org structures with AI agent allocation.
Each industry gets its own tailored departments and roles.
"""

from __future__ import annotations


# ── Core departments (present in every company) ──────────────────

CORE_DEPARTMENTS = [
    {
        "id": "strategy",
        "name": "Strategy & Business Intelligence",
        "icon": "brain",
        "ai_head": "Strategy Director AI",
        "ai_roles": ["Market Intelligence Agent", "KPI Tracking Agent"],
        "description": "Business plan execution, KPI tracking, strategic advisory",
    },
    {
        "id": "finance",
        "name": "Finance & Accounting",
        "icon": "wallet",
        "ai_head": "Finance Director AI",
        "ai_roles": ["Bookkeeping Agent", "Financial Reporting Agent", "Budget Agent"],
        "description": "Invoicing, reporting, budgets, cash flow monitoring",
    },
    {
        "id": "hr",
        "name": "Human Resources",
        "icon": "users",
        "ai_head": "HR Director AI",
        "ai_roles": ["Recruitment Agent", "Onboarding Agent"],
        "description": "Hiring, onboarding, performance, compliance",
    },
    {
        "id": "legal",
        "name": "Legal & Compliance",
        "icon": "shield",
        "ai_head": "Legal Director AI",
        "ai_roles": ["Contract Review Agent", "Compliance Agent"],
        "description": "Contracts, compliance, regulatory monitoring",
    },
]

# ── Industry-specific department definitions ─────────────────────

INDUSTRY_DEPARTMENTS: dict[str, list[dict]] = {
    "travel": [
        {
            "id": "reservations",
            "name": "Reservations & Booking",
            "icon": "calendar",
            "ai_head": "Reservations Director AI",
            "ai_roles": ["Booking Management Agent", "Availability Agent", "Pricing Agent"],
            "description": "Tour bookings, availability, dynamic pricing, confirmations",
        },
        {
            "id": "guest_relations",
            "name": "Guest Relations & Support",
            "icon": "heart",
            "ai_head": "Guest Relations Director AI",
            "ai_roles": ["Customer Support Agent", "Feedback Agent", "VIP Services Agent"],
            "description": "Guest communication, reviews, complaints, loyalty programs",
        },
        {
            "id": "marketing",
            "name": "Digital Marketing & Sales",
            "icon": "megaphone",
            "ai_head": "Marketing Director AI",
            "ai_roles": ["SEO/SEM Agent", "Social Media Agent", "Content Creator Agent"],
            "description": "Destination marketing, social media, SEO, travel content",
        },
        {
            "id": "operations",
            "name": "Tour Operations",
            "icon": "settings",
            "ai_head": "Operations Director AI",
            "ai_roles": ["Itinerary Planner Agent", "Vendor Coordination Agent", "Quality Agent"],
            "description": "Tour planning, vendor management, transport logistics",
        },
        {
            "id": "partnerships",
            "name": "Partnerships & Procurement",
            "icon": "package",
            "ai_head": "Partnerships Director AI",
            "ai_roles": ["Hotel Sourcing Agent", "Transport Sourcing Agent"],
            "description": "Hotel/airline partnerships, supplier negotiations, contracts",
        },
    ],
    "healthcare": [
        {
            "id": "patient_care",
            "name": "Patient Care Coordination",
            "icon": "heart",
            "ai_head": "Patient Care Director AI",
            "ai_roles": ["Appointment Scheduling Agent", "Patient Follow-up Agent", "Triage Agent"],
            "description": "Scheduling, patient communication, care coordination",
        },
        {
            "id": "clinical_ops",
            "name": "Clinical Operations",
            "icon": "settings",
            "ai_head": "Clinical Ops Director AI",
            "ai_roles": ["Medical Records Agent", "Inventory Agent", "Quality Assurance Agent"],
            "description": "Medical records, equipment, compliance, quality control",
        },
        {
            "id": "billing",
            "name": "Medical Billing & Insurance",
            "icon": "wallet",
            "ai_head": "Billing Director AI",
            "ai_roles": ["Claims Processing Agent", "Insurance Verification Agent"],
            "description": "Insurance claims, billing codes, patient billing, collections",
        },
        {
            "id": "marketing",
            "name": "Patient Acquisition & Marketing",
            "icon": "megaphone",
            "ai_head": "Marketing Director AI",
            "ai_roles": ["SEO Agent", "Reputation Management Agent", "Referral Agent"],
            "description": "Online presence, patient reviews, referral programs",
        },
        {
            "id": "compliance",
            "name": "Regulatory & Compliance",
            "icon": "shield",
            "ai_head": "Compliance Director AI",
            "ai_roles": ["HIPAA/Regulatory Agent", "Audit Agent"],
            "description": "Healthcare regulations, accreditation, data privacy",
        },
    ],
    "restaurant": [
        {
            "id": "front_house",
            "name": "Front of House",
            "icon": "users",
            "ai_head": "FOH Director AI",
            "ai_roles": ["Reservation Agent", "Guest Experience Agent", "Table Management Agent"],
            "description": "Reservations, seating, guest experience, service quality",
        },
        {
            "id": "kitchen_ops",
            "name": "Kitchen & Menu Operations",
            "icon": "settings",
            "ai_head": "Kitchen Operations AI",
            "ai_roles": ["Menu Engineering Agent", "Inventory Agent", "Cost Control Agent"],
            "description": "Menu planning, food cost, inventory, supplier ordering",
        },
        {
            "id": "delivery",
            "name": "Delivery & Online Orders",
            "icon": "package",
            "ai_head": "Delivery Director AI",
            "ai_roles": ["Order Management Agent", "Platform Integration Agent"],
            "description": "Online ordering, delivery platforms, dispatch optimization",
        },
        {
            "id": "marketing",
            "name": "Marketing & Social Media",
            "icon": "megaphone",
            "ai_head": "Marketing Director AI",
            "ai_roles": ["Social Media Agent", "Review Management Agent", "Promotion Agent"],
            "description": "Food photography, social media, reviews, promotions",
        },
        {
            "id": "procurement",
            "name": "Procurement & Supply Chain",
            "icon": "package",
            "ai_head": "Procurement Director AI",
            "ai_roles": ["Vendor Sourcing Agent", "Quality Control Agent"],
            "description": "Supplier management, food sourcing, quality standards",
        },
    ],
    "ecommerce": [
        {
            "id": "marketing",
            "name": "Digital Marketing",
            "icon": "megaphone",
            "ai_head": "Marketing Director AI",
            "ai_roles": ["SEO/SEM Agent", "Email Marketing Agent", "Social Media Agent", "Ads Agent"],
            "description": "SEO, paid ads, email campaigns, social media, content",
        },
        {
            "id": "sales",
            "name": "Sales & Conversion",
            "icon": "target",
            "ai_head": "Sales Director AI",
            "ai_roles": ["Product Listing Agent", "Pricing Agent", "Upsell Agent"],
            "description": "Product optimization, dynamic pricing, conversion rate",
        },
        {
            "id": "operations",
            "name": "Fulfillment & Logistics",
            "icon": "package",
            "ai_head": "Operations Director AI",
            "ai_roles": ["Inventory Agent", "Shipping Agent", "Returns Agent"],
            "description": "Inventory management, shipping, returns, warehouse ops",
        },
        {
            "id": "customer_service",
            "name": "Customer Service",
            "icon": "heart",
            "ai_head": "Customer Service Director AI",
            "ai_roles": ["Live Chat Agent", "Complaints Agent", "Reviews Agent"],
            "description": "Customer support, live chat, returns, review management",
        },
        {
            "id": "it",
            "name": "Technology & Platform",
            "icon": "cpu",
            "ai_head": "Technology Director AI",
            "ai_roles": ["Platform Monitoring Agent", "Analytics Agent"],
            "description": "Website performance, analytics, security, integrations",
        },
    ],
    "design_creative": [
        {
            "id": "creative",
            "name": "Creative & Design",
            "icon": "sparkles",
            "ai_head": "Creative Director AI",
            "ai_roles": ["Visual Design Agent", "Brand Identity Agent", "Motion Graphics Agent"],
            "description": "Visual design, branding, UI/UX, motion graphics",
        },
        {
            "id": "project_mgmt",
            "name": "Project Management",
            "icon": "settings",
            "ai_head": "Project Director AI",
            "ai_roles": ["Timeline Agent", "Resource Allocation Agent", "Client Update Agent"],
            "description": "Project timelines, resource planning, client communication",
        },
        {
            "id": "client_services",
            "name": "Client Services & Sales",
            "icon": "target",
            "ai_head": "Client Services Director AI",
            "ai_roles": ["Proposal Writer Agent", "Account Manager Agent", "Lead Gen Agent"],
            "description": "Client pitches, proposals, account management, upselling",
        },
        {
            "id": "marketing",
            "name": "Marketing & Brand",
            "icon": "megaphone",
            "ai_head": "Marketing Director AI",
            "ai_roles": ["Portfolio Agent", "Social Media Agent", "Content Agent"],
            "description": "Agency portfolio, case studies, social media, thought leadership",
        },
        {
            "id": "digital",
            "name": "Digital & Web Development",
            "icon": "cpu",
            "ai_head": "Digital Director AI",
            "ai_roles": ["Web Development Agent", "QA Agent"],
            "description": "Website builds, digital products, quality assurance",
        },
    ],
    "engineering": [
        {
            "id": "project_mgmt",
            "name": "Project Management",
            "icon": "settings",
            "ai_head": "Project Director AI",
            "ai_roles": ["Planning Agent", "Cost Estimation Agent", "Progress Tracking Agent"],
            "description": "Project planning, budgeting, milestones, reporting",
        },
        {
            "id": "technical",
            "name": "Technical & Engineering",
            "icon": "cpu",
            "ai_head": "Technical Director AI",
            "ai_roles": ["Design Review Agent", "Specifications Agent", "Quality Agent"],
            "description": "Technical specifications, design review, standards compliance",
        },
        {
            "id": "procurement",
            "name": "Procurement & Supply Chain",
            "icon": "package",
            "ai_head": "Procurement Director AI",
            "ai_roles": ["Vendor Sourcing Agent", "RFQ Agent", "Material Tracking Agent"],
            "description": "Vendor management, RFQs, material procurement, cost control",
        },
        {
            "id": "sales",
            "name": "Business Development",
            "icon": "target",
            "ai_head": "Business Dev Director AI",
            "ai_roles": ["Tender Agent", "Proposal Agent", "Client Relations Agent"],
            "description": "Tender submissions, proposals, client acquisition",
        },
        {
            "id": "safety",
            "name": "HSE & Safety",
            "icon": "shield",
            "ai_head": "HSE Director AI",
            "ai_roles": ["Safety Compliance Agent", "Incident Reporting Agent"],
            "description": "Health, safety, environment compliance, incident management",
        },
    ],
    "construction": [
        {
            "id": "project_mgmt",
            "name": "Project Management",
            "icon": "settings",
            "ai_head": "Project Director AI",
            "ai_roles": ["Scheduling Agent", "Cost Control Agent", "Progress Agent"],
            "description": "Project scheduling, budgets, milestones, site coordination",
        },
        {
            "id": "estimating",
            "name": "Estimating & Bidding",
            "icon": "target",
            "ai_head": "Estimating Director AI",
            "ai_roles": ["Quantity Surveyor Agent", "Bid Preparation Agent"],
            "description": "Cost estimation, quantity surveying, tender preparation",
        },
        {
            "id": "procurement",
            "name": "Procurement & Materials",
            "icon": "package",
            "ai_head": "Procurement Director AI",
            "ai_roles": ["Material Sourcing Agent", "Subcontractor Agent", "Logistics Agent"],
            "description": "Material procurement, subcontractor management, deliveries",
        },
        {
            "id": "safety",
            "name": "Health, Safety & Environment",
            "icon": "shield",
            "ai_head": "HSE Director AI",
            "ai_roles": ["Safety Inspector Agent", "Compliance Agent"],
            "description": "Site safety, worker safety, environmental compliance",
        },
        {
            "id": "marketing",
            "name": "Business Development",
            "icon": "megaphone",
            "ai_head": "BD Director AI",
            "ai_roles": ["Tender Research Agent", "Portfolio Agent"],
            "description": "New project acquisition, government tenders, portfolio",
        },
    ],
    "saas": [
        {
            "id": "product",
            "name": "Product & Engineering",
            "icon": "cpu",
            "ai_head": "Product Director AI",
            "ai_roles": ["Feature Research Agent", "Bug Triage Agent", "Analytics Agent"],
            "description": "Product roadmap, feature prioritization, user analytics",
        },
        {
            "id": "marketing",
            "name": "Growth & Marketing",
            "icon": "megaphone",
            "ai_head": "Growth Director AI",
            "ai_roles": ["Content Marketing Agent", "SEO Agent", "Demand Gen Agent"],
            "description": "Content, SEO, demand generation, product marketing",
        },
        {
            "id": "sales",
            "name": "Sales & Revenue",
            "icon": "target",
            "ai_head": "Sales Director AI",
            "ai_roles": ["SDR Agent", "Demo Scheduling Agent", "Pipeline Agent"],
            "description": "Outbound, demos, pipeline management, deal closing",
        },
        {
            "id": "customer_success",
            "name": "Customer Success",
            "icon": "heart",
            "ai_head": "CS Director AI",
            "ai_roles": ["Onboarding Agent", "Churn Prevention Agent", "Support Agent"],
            "description": "User onboarding, retention, support, NPS tracking",
        },
        {
            "id": "devops",
            "name": "DevOps & Infrastructure",
            "icon": "settings",
            "ai_head": "DevOps Director AI",
            "ai_roles": ["Monitoring Agent", "Security Agent"],
            "description": "Uptime monitoring, CI/CD, security, infrastructure",
        },
    ],
    "real_estate": [
        {
            "id": "sales",
            "name": "Sales & Listings",
            "icon": "target",
            "ai_head": "Sales Director AI",
            "ai_roles": ["Listing Agent", "Lead Qualification Agent", "Viewing Scheduler Agent"],
            "description": "Property listings, lead qualification, viewing schedules",
        },
        {
            "id": "marketing",
            "name": "Marketing & Branding",
            "icon": "megaphone",
            "ai_head": "Marketing Director AI",
            "ai_roles": ["Property Marketing Agent", "Social Media Agent", "Virtual Tour Agent"],
            "description": "Property marketing, virtual tours, social media, portals",
        },
        {
            "id": "property_mgmt",
            "name": "Property Management",
            "icon": "settings",
            "ai_head": "Property Mgmt Director AI",
            "ai_roles": ["Tenant Relations Agent", "Maintenance Agent", "Rent Collection Agent"],
            "description": "Tenant management, maintenance requests, rent collection",
        },
        {
            "id": "valuation",
            "name": "Valuation & Research",
            "icon": "brain",
            "ai_head": "Research Director AI",
            "ai_roles": ["Market Analysis Agent", "Comparable Sales Agent"],
            "description": "Property valuation, market analysis, investment analysis",
        },
        {
            "id": "transactions",
            "name": "Transactions & Legal",
            "icon": "shield",
            "ai_head": "Transactions Director AI",
            "ai_roles": ["Contract Agent", "Due Diligence Agent"],
            "description": "Purchase agreements, due diligence, closing coordination",
        },
    ],
    "education": [
        {
            "id": "academic",
            "name": "Academic Programs",
            "icon": "brain",
            "ai_head": "Academic Director AI",
            "ai_roles": ["Curriculum Agent", "Assessment Agent", "Research Agent"],
            "description": "Curriculum development, assessments, academic research",
        },
        {
            "id": "student_services",
            "name": "Student Services",
            "icon": "heart",
            "ai_head": "Student Services Director AI",
            "ai_roles": ["Enrollment Agent", "Advising Agent", "Support Agent"],
            "description": "Enrollment, academic advising, student support",
        },
        {
            "id": "marketing",
            "name": "Admissions & Marketing",
            "icon": "megaphone",
            "ai_head": "Admissions Director AI",
            "ai_roles": ["Lead Nurture Agent", "Event Agent", "Content Agent"],
            "description": "Student recruitment, open days, digital marketing",
        },
        {
            "id": "operations",
            "name": "Campus Operations",
            "icon": "settings",
            "ai_head": "Operations Director AI",
            "ai_roles": ["Scheduling Agent", "Facilities Agent"],
            "description": "Timetabling, facilities management, IT support",
        },
        {
            "id": "elearning",
            "name": "E-Learning & Technology",
            "icon": "cpu",
            "ai_head": "E-Learning Director AI",
            "ai_roles": ["LMS Agent", "Content Digitization Agent"],
            "description": "Learning management, online courses, digital content",
        },
    ],
    "finance": [
        {
            "id": "risk",
            "name": "Risk & Compliance",
            "icon": "shield",
            "ai_head": "Risk Director AI",
            "ai_roles": ["AML/KYC Agent", "Regulatory Agent", "Fraud Detection Agent"],
            "description": "Anti-money laundering, KYC, fraud detection, compliance",
        },
        {
            "id": "client_services",
            "name": "Client Services",
            "icon": "heart",
            "ai_head": "Client Services Director AI",
            "ai_roles": ["Account Agent", "Advisory Agent", "Support Agent"],
            "description": "Client onboarding, advisory, portfolio management",
        },
        {
            "id": "operations",
            "name": "Operations & Processing",
            "icon": "settings",
            "ai_head": "Operations Director AI",
            "ai_roles": ["Transaction Agent", "Reconciliation Agent"],
            "description": "Transaction processing, reconciliation, settlements",
        },
        {
            "id": "marketing",
            "name": "Business Development",
            "icon": "target",
            "ai_head": "BD Director AI",
            "ai_roles": ["Lead Gen Agent", "Proposal Agent"],
            "description": "New client acquisition, product launches, partnerships",
        },
        {
            "id": "it",
            "name": "Technology & Security",
            "icon": "cpu",
            "ai_head": "Technology Director AI",
            "ai_roles": ["Cybersecurity Agent", "Infrastructure Agent"],
            "description": "Banking systems, cybersecurity, data infrastructure",
        },
    ],
    "manufacturing": [
        {
            "id": "production",
            "name": "Production & Quality",
            "icon": "settings",
            "ai_head": "Production Director AI",
            "ai_roles": ["Production Planning Agent", "Quality Control Agent", "Maintenance Agent"],
            "description": "Production scheduling, quality assurance, maintenance",
        },
        {
            "id": "supply_chain",
            "name": "Supply Chain & Logistics",
            "icon": "package",
            "ai_head": "Supply Chain Director AI",
            "ai_roles": ["Procurement Agent", "Inventory Agent", "Shipping Agent"],
            "description": "Raw materials, inventory, warehousing, distribution",
        },
        {
            "id": "sales",
            "name": "Sales & Distribution",
            "icon": "target",
            "ai_head": "Sales Director AI",
            "ai_roles": ["Order Management Agent", "Client Agent", "Pricing Agent"],
            "description": "Order processing, client management, pricing strategy",
        },
        {
            "id": "safety",
            "name": "Safety & Compliance",
            "icon": "shield",
            "ai_head": "Safety Director AI",
            "ai_roles": ["HSE Agent", "ISO Compliance Agent"],
            "description": "Workplace safety, ISO standards, environmental compliance",
        },
        {
            "id": "rd",
            "name": "R&D & Innovation",
            "icon": "brain",
            "ai_head": "R&D Director AI",
            "ai_roles": ["Product Research Agent", "Process Improvement Agent"],
            "description": "New product development, process optimization",
        },
    ],
    "logistics": [
        {
            "id": "operations",
            "name": "Fleet & Operations",
            "icon": "settings",
            "ai_head": "Operations Director AI",
            "ai_roles": ["Route Planning Agent", "Fleet Management Agent", "Dispatch Agent"],
            "description": "Route optimization, fleet tracking, dispatch coordination",
        },
        {
            "id": "warehouse",
            "name": "Warehouse & Inventory",
            "icon": "package",
            "ai_head": "Warehouse Director AI",
            "ai_roles": ["Inventory Agent", "Pick & Pack Agent"],
            "description": "Warehouse operations, inventory management, fulfillment",
        },
        {
            "id": "customs",
            "name": "Customs & Compliance",
            "icon": "shield",
            "ai_head": "Customs Director AI",
            "ai_roles": ["Customs Clearance Agent", "Documentation Agent"],
            "description": "Import/export, customs clearance, trade compliance",
        },
        {
            "id": "sales",
            "name": "Sales & Client Management",
            "icon": "target",
            "ai_head": "Sales Director AI",
            "ai_roles": ["Rate Quotation Agent", "Account Agent"],
            "description": "Rate quotes, client onboarding, account management",
        },
        {
            "id": "it",
            "name": "Technology & Tracking",
            "icon": "cpu",
            "ai_head": "Technology Director AI",
            "ai_roles": ["Tracking System Agent", "Integration Agent"],
            "description": "Shipment tracking, platform integrations, analytics",
        },
    ],
}

# Icon additions for industry-specific departments
EXTRA_ICONS = {"heart", "calendar", "sparkles"}


def generate_org_chart(industry: str = "other", team_size: int = 1) -> dict:
    """
    Generate an industry-specific org chart with AI agent allocation.
    """
    # Get industry-specific departments or use a generic set
    specific_depts = INDUSTRY_DEPARTMENTS.get(industry, [])

    if not specific_depts:
        # Generic fallback for industries not yet mapped
        specific_depts = [
            {
                "id": "sales",
                "name": "Sales & Business Development",
                "icon": "target",
                "ai_head": "Sales Director AI",
                "ai_roles": ["Lead Generation Agent", "Pipeline Agent", "Proposal Agent"],
                "description": "Lead generation, pipeline management, proposals",
            },
            {
                "id": "marketing",
                "name": "Marketing & Communications",
                "icon": "megaphone",
                "ai_head": "Marketing Director AI",
                "ai_roles": ["Content Agent", "SEO Agent", "Social Media Agent"],
                "description": "Brand, content, social media, SEO, campaigns",
            },
            {
                "id": "operations",
                "name": "Operations",
                "icon": "settings",
                "ai_head": "Operations Director AI",
                "ai_roles": ["Process Agent", "Quality Agent"],
                "description": "Process optimization, quality control, project tracking",
            },
            {
                "id": "it",
                "name": "IT & Technology",
                "icon": "cpu",
                "ai_head": "IT Director AI",
                "ai_roles": ["System Management Agent", "Security Agent"],
                "description": "System management, cybersecurity, infrastructure",
            },
            {
                "id": "procurement",
                "name": "Procurement",
                "icon": "package",
                "ai_head": "Procurement Director AI",
                "ai_roles": ["Vendor Sourcing Agent", "PO Agent"],
                "description": "Vendor management, purchasing, cost optimization",
            },
        ]

    # Combine: Strategy (always first) + industry-specific + core departments
    all_departments = []
    seen_ids = set()

    # 1. Strategy always first
    strategy = {
        "id": "strategy",
        "name": "Strategy & Business Intelligence",
        "icon": "brain",
        "ai_head": "Strategy Director AI",
        "ai_roles": ["Market Intelligence Agent", "KPI Tracking Agent"],
        "description": "Business plan execution, KPI tracking, strategic advisory",
    }
    all_departments.append(strategy)
    seen_ids.add("strategy")

    # 2. Industry-specific departments
    for dept in specific_depts:
        if dept["id"] not in seen_ids:
            all_departments.append(dept)
            seen_ids.add(dept["id"])

    # 3. Core departments not already covered
    for dept in CORE_DEPARTMENTS:
        if dept["id"] not in seen_ids:
            all_departments.append(dept)
            seen_ids.add(dept["id"])

    # Build final list with counts
    departments = []
    total_ai = 0

    for idx, dept in enumerate(all_departments):
        ai_count = len(dept["ai_roles"]) + 1  # +1 for head
        departments.append({
            "id": dept["id"],
            "name": dept["name"],
            "icon": dept["icon"],
            "status": "ai_managed",
            "ai_head": dept["ai_head"],
            "ai_agents": ai_count,
            "ai_roles": dept["ai_roles"],
            "description": dept["description"],
            "priority_rank": idx,
        })
        total_ai += ai_count

    # Industry label
    label = industry.replace("_", " ").title() if industry != "other" else "your"

    summary = (
        f"AEOS will deploy {total_ai} AI agents across {len(departments)} departments "
        f"tailored for a {label} company. Each department gets a Director AI and "
        f"specialist agents working alongside your human team."
    )

    return {
        "total_ai_agents": total_ai,
        "total_departments": len(departments),
        "departments": departments,
        "summary": summary,
    }
