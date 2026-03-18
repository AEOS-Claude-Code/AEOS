"""
AEOS – AI Agent Framework: Department Task Templates.

Predefined task types for each department with prompts and expected outputs.
Phases 19-27: HR, Finance, Legal, Sales, Marketing, Operations, IT, Procurement, Strategy.
"""

from __future__ import annotations


TASK_TEMPLATES: dict[str, list[dict]] = {
    "hr": [
        {
            "id": "write_job_description",
            "name": "Write Job Description",
            "description": "Draft a professional job description for a role",
            "prompt": "Write a professional job description for the role: {input}. Include: job title, responsibilities (5-7 bullets), required qualifications, preferred qualifications, and a compelling company description.",
            "input_label": "Role title and key requirements",
            "input_placeholder": "e.g. Marketing Manager — 3+ years experience, digital marketing focus",
            "category": "recruitment",
        },
        {
            "id": "screen_candidate",
            "name": "Screen Candidate Resume",
            "description": "Evaluate a candidate against job requirements",
            "prompt": "Evaluate this candidate for the position. Score fit (1-10), identify strengths, gaps, and interview questions to ask.\n\nCandidate info: {input}",
            "input_label": "Candidate details and job requirements",
            "input_placeholder": "Paste candidate summary and target role",
            "category": "recruitment",
        },
        {
            "id": "onboarding_plan",
            "name": "Draft Onboarding Plan",
            "description": "Create a 30/60/90 day onboarding plan for a new hire",
            "prompt": "Create a detailed 30/60/90 day onboarding plan for a new {input}. Include: first week activities, key milestones, training schedule, and success metrics.",
            "input_label": "Role and department",
            "input_placeholder": "e.g. Sales Associate joining the Sales team",
            "category": "onboarding",
        },
    ],
    "finance": [
        {
            "id": "generate_invoice",
            "name": "Generate Invoice",
            "description": "Create a professional invoice template",
            "prompt": "Generate a professional invoice for: {input}. Include: invoice number, date, billing details, line items, subtotal, tax, and total. Format as a clean text template.",
            "input_label": "Client and service details",
            "input_placeholder": "e.g. Client: ABC Corp, Service: Website Development, Amount: $5,000",
            "category": "accounting",
        },
        {
            "id": "expense_report",
            "name": "Expense Report Summary",
            "description": "Summarize and categorize expenses",
            "prompt": "Organize and summarize these expenses into categories. Calculate totals per category and flag any unusual items.\n\nExpenses: {input}",
            "input_label": "List of expenses",
            "input_placeholder": "List expenses with amounts and dates",
            "category": "accounting",
        },
        {
            "id": "budget_forecast",
            "name": "Budget Forecast",
            "description": "Create a quarterly budget forecast",
            "prompt": "Create a quarterly budget forecast based on: {input}. Include: revenue projections, major cost categories, net income estimate, and key assumptions.",
            "input_label": "Current financials and assumptions",
            "input_placeholder": "e.g. Q1 revenue $50K, expected 15% growth, major costs: rent $3K, salaries $25K",
            "category": "planning",
        },
    ],
    "legal": [
        {
            "id": "draft_nda",
            "name": "Draft NDA",
            "description": "Generate a non-disclosure agreement template",
            "prompt": "Draft a mutual Non-Disclosure Agreement (NDA) for: {input}. Include: parties, definition of confidential information, obligations, term (2 years), exclusions, and remedies. Use professional legal language.",
            "input_label": "Parties and context",
            "input_placeholder": "e.g. Between our company and XYZ Corp for a potential partnership",
            "category": "contracts",
        },
        {
            "id": "contract_review",
            "name": "Review Contract",
            "description": "Analyze a contract for risks and key terms",
            "prompt": "Review this contract and provide: 1) Key terms summary, 2) Risk flags, 3) Missing clauses, 4) Negotiation recommendations.\n\nContract: {input}",
            "input_label": "Contract text or key terms",
            "input_placeholder": "Paste contract text or describe key terms",
            "category": "contracts",
        },
        {
            "id": "compliance_checklist",
            "name": "Compliance Checklist",
            "description": "Generate a regulatory compliance checklist",
            "prompt": "Create a compliance checklist for a {input}. Include: regulatory requirements, documentation needed, deadlines, and responsible parties.",
            "input_label": "Industry and compliance area",
            "input_placeholder": "e.g. E-commerce company in Saudi Arabia — data protection and consumer rights",
            "category": "compliance",
        },
    ],
    "sales": [
        {
            "id": "write_proposal",
            "name": "Write Sales Proposal",
            "description": "Draft a client proposal for a deal",
            "prompt": "Write a professional sales proposal for: {input}. Include: executive summary, proposed solution, scope of work, timeline, pricing, and next steps.",
            "input_label": "Client needs and proposed solution",
            "input_placeholder": "e.g. Client needs website redesign, budget $10K, timeline 6 weeks",
            "category": "proposals",
        },
        {
            "id": "outreach_email",
            "name": "Lead Outreach Email",
            "description": "Write a personalized outreach email to a prospect",
            "prompt": "Write a personalized cold outreach email to: {input}. Be concise (under 150 words), mention a specific pain point, and include a clear CTA. No generic templates.",
            "input_label": "Prospect details",
            "input_placeholder": "e.g. CEO of a hotel chain, struggling with online bookings, found via LinkedIn",
            "category": "outreach",
        },
        {
            "id": "pipeline_report",
            "name": "Pipeline Status Report",
            "description": "Generate a sales pipeline summary",
            "prompt": "Generate a sales pipeline status report based on: {input}. Include: deals by stage, total pipeline value, expected close dates, and recommended actions for stuck deals.",
            "input_label": "Current pipeline data",
            "input_placeholder": "Describe active deals, stages, and values",
            "category": "reporting",
        },
    ],
    "marketing": [
        {
            "id": "social_posts",
            "name": "Create Social Media Posts",
            "description": "Generate social media content for multiple platforms",
            "prompt": "Create social media posts for: {input}. Generate posts for LinkedIn, Instagram, and Twitter/X. Each post should be platform-appropriate in tone and length. Include hashtag suggestions.",
            "input_label": "Topic or announcement",
            "input_placeholder": "e.g. We just launched a new product line for sustainable packaging",
            "category": "content",
        },
        {
            "id": "blog_outline",
            "name": "Blog Post Outline",
            "description": "Create a structured blog post outline with SEO focus",
            "prompt": "Create a detailed blog post outline for: {input}. Include: title options (3), target keyword, H2/H3 structure, key points per section, CTA, and estimated word count.",
            "input_label": "Topic and target audience",
            "input_placeholder": "e.g. 'Benefits of AI in hospitality' targeting hotel managers",
            "category": "content",
        },
        {
            "id": "seo_brief",
            "name": "SEO Content Brief",
            "description": "Generate an SEO-optimized content brief",
            "prompt": "Create an SEO content brief for: {input}. Include: primary keyword, secondary keywords, search intent, competitor analysis points, content structure, and optimization checklist.",
            "input_label": "Target keyword and topic",
            "input_placeholder": "e.g. 'best CRM for small business' — informational guide",
            "category": "seo",
        },
        {
            "id": "email_campaign",
            "name": "Email Campaign Draft",
            "description": "Draft an email marketing campaign sequence",
            "prompt": "Draft a 3-email marketing campaign for: {input}. Include: subject lines, preview text, body copy, and CTAs for each email. Space them 3-5 days apart.",
            "input_label": "Campaign goal and audience",
            "input_placeholder": "e.g. Product launch announcement to existing customers",
            "category": "email",
        },
    ],
    "operations": [
        {
            "id": "write_sop",
            "name": "Write SOP",
            "description": "Create a Standard Operating Procedure document",
            "prompt": "Write a Standard Operating Procedure (SOP) for: {input}. Include: purpose, scope, responsibilities, step-by-step procedure, quality checks, and revision history template.",
            "input_label": "Process name and details",
            "input_placeholder": "e.g. Customer complaint handling process for the support team",
            "category": "process",
        },
        {
            "id": "process_improvement",
            "name": "Process Improvement Analysis",
            "description": "Analyze a process and suggest improvements",
            "prompt": "Analyze this process and suggest improvements: {input}. Identify: bottlenecks, redundancies, automation opportunities, estimated time savings, and implementation steps.",
            "input_label": "Current process description",
            "input_placeholder": "Describe the current process step by step",
            "category": "process",
        },
        {
            "id": "project_status",
            "name": "Project Status Report",
            "description": "Generate a project status update",
            "prompt": "Generate a project status report for: {input}. Include: progress summary, milestones achieved, upcoming tasks, risks/blockers, and resource needs.",
            "input_label": "Project details and current status",
            "input_placeholder": "e.g. Website redesign project — 60% complete, on track for March deadline",
            "category": "reporting",
        },
    ],
    "it": [
        {
            "id": "security_audit",
            "name": "Security Audit Report",
            "description": "Generate a security assessment summary",
            "prompt": "Generate a security audit summary for: {input}. Include: vulnerabilities found, risk ratings, compliance status, and remediation recommendations prioritized by severity.",
            "input_label": "System or website to audit",
            "input_placeholder": "e.g. Company website at example.com — check for common vulnerabilities",
            "category": "security",
        },
        {
            "id": "tech_recommendation",
            "name": "Technology Recommendation",
            "description": "Evaluate and recommend technology solutions",
            "prompt": "Evaluate and recommend technology solutions for: {input}. Compare 3 options with: features, pricing, pros/cons, integration complexity, and your recommendation with rationale.",
            "input_label": "Technology need",
            "input_placeholder": "e.g. Need a CRM system for 15-person sales team, budget $200/mo",
            "category": "evaluation",
        },
    ],
    "procurement": [
        {
            "id": "rfq_draft",
            "name": "Draft RFQ",
            "description": "Create a Request for Quotation document",
            "prompt": "Draft a Request for Quotation (RFQ) for: {input}. Include: project overview, scope of work, requirements, evaluation criteria, timeline, and submission instructions.",
            "input_label": "Service or product needed",
            "input_placeholder": "e.g. IT infrastructure setup for new office — servers, networking, security",
            "category": "sourcing",
        },
        {
            "id": "vendor_comparison",
            "name": "Vendor Comparison Report",
            "description": "Compare vendors and recommend the best option",
            "prompt": "Create a vendor comparison report for: {input}. Compare on: pricing, quality, reliability, support, and alignment with our needs. Provide a final recommendation.",
            "input_label": "Vendors and evaluation criteria",
            "input_placeholder": "e.g. Compare 3 web hosting providers: AWS, DigitalOcean, Hetzner",
            "category": "evaluation",
        },
    ],
    "strategy": [
        {
            "id": "market_brief",
            "name": "Market Intelligence Brief",
            "description": "Summarize market trends and implications",
            "prompt": "Write a market intelligence brief on: {input}. Include: key trends, market size data, competitive dynamics, opportunities, threats, and strategic implications for our company.",
            "input_label": "Market or industry topic",
            "input_placeholder": "e.g. AI adoption in the hospitality industry in the GCC region",
            "category": "intelligence",
        },
        {
            "id": "kpi_report",
            "name": "KPI Performance Report",
            "description": "Generate a KPI tracking report",
            "prompt": "Generate a KPI performance report based on: {input}. Include: current vs target for each KPI, trend analysis, areas of concern, and recommended actions.",
            "input_label": "KPI data and targets",
            "input_placeholder": "List KPIs with current values and targets",
            "category": "reporting",
        },
        {
            "id": "strategic_memo",
            "name": "Strategic Memo",
            "description": "Draft an executive strategic memo",
            "prompt": "Draft a strategic memo to leadership on: {input}. Include: situation analysis, options considered, recommended approach, expected outcomes, resource requirements, and timeline.",
            "input_label": "Strategic topic or decision",
            "input_placeholder": "e.g. Should we expand into the UAE market in Q3?",
            "category": "advisory",
        },
    ],
}


def get_department_tasks(department: str) -> list[dict]:
    """Get task templates for a department."""
    return TASK_TEMPLATES.get(department, [])


def get_all_task_templates() -> dict[str, list[dict]]:
    """Get all task templates grouped by department."""
    return TASK_TEMPLATES


def get_task_template(department: str, task_id: str) -> dict | None:
    """Get a specific task template."""
    for task in TASK_TEMPLATES.get(department, []):
        if task["id"] == task_id:
            return task
    return None
