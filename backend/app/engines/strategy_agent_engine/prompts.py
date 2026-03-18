"""
AEOS – Strategy Agent Engine: Prompt Templates.

McKinsey-grade prompt templates for each business plan section.
System prompt establishes Big 4 consulting methodology.
Section prompts inject relevant company data.
"""

SYSTEM_PROMPT = """You are a senior strategy consultant at a top-tier management consulting firm (McKinsey, BCG, Bain caliber). You are writing a section of a professional strategic business plan for a client company.

Rules:
- Write in third-person professional consulting tone
- Be specific to this company's data — never use generic advice
- Reference actual numbers and metrics from the data provided
- Keep this section between 250-400 words
- Use markdown formatting: **bold** for emphasis, bullet points for lists
- Do NOT include the section title or number — the system adds it
- Ground every recommendation in the company's actual situation
- If data is missing for a metric, note it as an area requiring further analysis
- Write as if presenting to the company's board of directors"""


SECTION_PROMPTS = {
    "executive_summary": """Generate the Executive Summary of the strategic business plan.

Company Intelligence Data:
{context}

This section must include:
1. A compelling one-paragraph positioning statement about the company
2. Key strategic findings (3-4 bullet points citing specific metrics from the data)
3. The company's most critical gaps and opportunities
4. Top 3 strategic recommendations with expected impact
5. A forward-looking conclusion about the company's growth potential

Write 300-400 words. This is the most important section — it sets the tone for the entire plan.""",

    "company_overview": """Generate the Company Overview section.

Company Intelligence Data:
{context}

This section must include:
1. Company profile (industry, location, team size, digital maturity)
2. Current digital infrastructure assessment (website, tech stack, SEO performance)
3. Market positioning based on available data
4. Current strengths (what the company does well based on metrics)
5. Areas requiring development (based on low scores or missing capabilities)

Write 250-350 words. Focus on facts and data, not aspirational statements.""",

    "market_analysis": """Generate the Market Analysis section.

Company Intelligence Data:
{context}

This section must include:
1. Industry landscape overview for the company's sector
2. Competitive positioning analysis (based on available competitor data)
3. Key market trends and opportunities in their industry
4. Threats and challenges facing the company
5. Strategic positioning recommendations

Write 300-400 words. Use the health score, priorities, and risk data to ground the analysis.""",

    "organizational_structure": """Generate the Organizational Structure section.

Company Intelligence Data:
{context}

This section must include:
1. Current organizational assessment (gap scores, department coverage)
2. Recommended organizational structure (departments with human + AI allocation)
3. Critical staffing priorities (which roles need human hires first)
4. AI agent deployment strategy (which departments benefit most from AI)
5. Organizational maturity roadmap (how to grow from current to ideal)

Write 300-400 words. Reference the specific gap scores and department breakdown data.""",

    "marketing_sales_strategy": """Generate the Marketing & Sales Strategy section.

Company Intelligence Data:
{context}

This section must include:
1. Digital marketing assessment (based on digital presence scores)
2. SEO and search visibility strategy
3. Social media strategy (based on detected platforms and gaps)
4. Lead generation and conversion optimization plan
5. Sales pipeline development recommendations
6. Quick-win marketing actions (implementable within 30 days)

Write 300-400 words. Reference specific digital presence scores and gaps.""",

    "operations_plan": """Generate the Operations Plan section.

Company Intelligence Data:
{context}

This section must include:
1. Current technology stack assessment
2. Operational efficiency analysis
3. Key process improvements needed
4. Technology and integration recommendations
5. AI-powered operations optimization opportunities
6. Quality assurance and performance monitoring framework

Write 250-350 words. Focus on actionable improvements based on the tech stack and gap data.""",

    "financial_projections": """Generate the Financial Projections section.

Company Intelligence Data:
{context}

This section must include:
1. Revenue growth assumptions based on the company's industry and size
2. Year 1, Year 2, Year 3 projected growth trajectory
3. Key cost drivers and optimization opportunities
4. Break-even considerations
5. ROI estimate from implementing AEOS AI agents
6. Investment priorities (where to allocate budget first)

Write 300-400 words. Use the team size and industry to make reasonable projections. Note that detailed financial modeling requires additional financial data from the client.""",

    "risk_assessment": """Generate the Risk Assessment section.

Company Intelligence Data:
{context}

This section must include:
1. Strategic risks (market, competitive, regulatory)
2. Operational risks (based on gap analysis and maturity scores)
3. Digital and technology risks (based on security, SEO, digital presence)
4. Organizational risks (leadership gaps, critical function gaps)
5. Risk mitigation strategies for the top 3-5 risks
6. Risk monitoring framework

Write 300-400 words. Reference the specific risk alerts and gap scores from the data.""",

    "implementation_roadmap": """Generate the Implementation Roadmap section.

Company Intelligence Data:
{context}

This section must include:
1. **Days 1-30 (Quick Wins):** 3-4 immediately actionable items
2. **Days 31-60 (Foundation):** 3-4 foundational improvements
3. **Days 61-90 (Growth):** 3-4 growth-focused initiatives
4. **Months 4-6 (Scale):** Strategic scaling priorities
5. Success metrics for each phase
6. Resource requirements and dependencies

Write 300-400 words. Prioritize based on the company's priorities and gaps.""",

    "kpi_framework": """Generate the KPI Framework section.

Company Intelligence Data:
{context}

This section must include:
1. Company-level KPIs (3-4 top-line metrics)
2. Department-level KPIs for each major department (2-3 per department)
3. Digital performance KPIs (website, SEO, social, conversion)
4. Organizational health KPIs (gap scores, maturity metrics)
5. Recommended review cadence (weekly, monthly, quarterly)
6. Dashboard and tracking recommendations

Write 300-400 words. Align KPIs to the company's strategic priorities and goals.""",
}


def get_system_prompt(company_name: str, industry: str, team_size: int, city: str, country: str) -> str:
    """Build the system prompt with company context."""
    return SYSTEM_PROMPT.format(
        company_name=company_name,
        industry=industry.replace("_", " ").title(),
        team_size=team_size,
        city=city or "their city",
        country=country or "their country",
    )


def get_section_prompt(section_key: str, context: str) -> str:
    """Build a section-specific prompt with injected context."""
    template = SECTION_PROMPTS.get(section_key, "Generate this section.\n\n{context}")
    return template.format(context=context)
