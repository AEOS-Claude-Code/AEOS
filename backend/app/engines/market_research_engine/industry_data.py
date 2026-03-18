"""
AEOS – Market Research Engine: Industry Knowledge Base.

Curated market data for 20 industries. Values are estimates based on
publicly available market research reports (2024-2025 data).
"""

from __future__ import annotations


# Regional multipliers for TAM calculation
REGIONAL_MULTIPLIERS = {
    "Saudi Arabia": 0.012, "United Arab Emirates": 0.008, "Qatar": 0.004,
    "Kuwait": 0.003, "Bahrain": 0.002, "Oman": 0.003, "Jordan": 0.002,
    "Egypt": 0.008, "Lebanon": 0.002, "Morocco": 0.004,
    "United Kingdom": 0.045, "Germany": 0.055, "France": 0.040,
    "United States": 0.280, "Canada": 0.025, "Australia": 0.020,
    "India": 0.050, "China": 0.180, "Japan": 0.060,
    "Singapore": 0.005, "Malaysia": 0.008, "Turkey": 0.012,
    "Brazil": 0.025, "Mexico": 0.018,
}
DEFAULT_REGIONAL_MULTIPLIER = 0.005

# GCC region aggregate
GCC_COUNTRIES = {"Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman"}


INDUSTRY_DATABASE: dict[str, dict] = {
    "ecommerce": {
        "label": "E-commerce",
        "global_market_size_b": 6300,
        "annual_growth_rate": 9.5,
        "avg_revenue_per_employee": 320000,
        "avg_digital_maturity": 72,
        "key_growth_drivers": [
            {"title": "Mobile commerce acceleration", "description": "Mobile shopping now exceeds 60% of all e-commerce transactions globally, with GCC leading at 70%+.", "impact": "high", "category": "technology"},
            {"title": "Social commerce expansion", "description": "Instagram, TikTok, and WhatsApp shopping integrations driving new purchase channels.", "impact": "high", "category": "channel"},
            {"title": "AI-powered personalization", "description": "AI recommendation engines increasing average order value by 15-30%.", "impact": "medium", "category": "technology"},
            {"title": "Cross-border e-commerce", "description": "Growing demand for international products, especially in GCC markets.", "impact": "medium", "category": "market"},
        ],
        "key_threats": [
            {"title": "Market saturation", "description": "Increasing competition from global players (Amazon, Noon, Shein) compressing margins.", "severity": "high"},
            {"title": "Customer acquisition costs rising", "description": "Digital advertising costs increasing 15-20% annually across platforms.", "severity": "high"},
            {"title": "Logistics cost pressure", "description": "Last-mile delivery costs remain a major challenge, especially in MENA.", "severity": "medium"},
        ],
        "technology_adoption": ["Shopify", "WooCommerce", "Magento", "Stripe", "PayPal", "Google Analytics"],
    },
    "healthcare": {
        "label": "Healthcare",
        "global_market_size_b": 12100,
        "annual_growth_rate": 7.5,
        "avg_revenue_per_employee": 180000,
        "avg_digital_maturity": 45,
        "key_growth_drivers": [
            {"title": "Telemedicine adoption", "description": "Virtual healthcare visits growing 30%+ annually, accelerated by post-pandemic behavior.", "impact": "high", "category": "technology"},
            {"title": "AI diagnostics", "description": "AI-assisted diagnosis improving accuracy and reducing wait times in radiology, pathology.", "impact": "high", "category": "technology"},
            {"title": "Aging population", "description": "Global demographic shift creating sustained demand for healthcare services.", "impact": "medium", "category": "demographic"},
            {"title": "Health tourism in GCC", "description": "Saudi Arabia and UAE investing heavily in medical tourism infrastructure.", "impact": "medium", "category": "market"},
        ],
        "key_threats": [
            {"title": "Regulatory complexity", "description": "Evolving healthcare regulations across jurisdictions increase compliance costs.", "severity": "high"},
            {"title": "Cybersecurity risks", "description": "Healthcare is the most targeted sector for ransomware attacks.", "severity": "high"},
            {"title": "Talent shortage", "description": "Global shortage of healthcare workers, especially nurses and specialists.", "severity": "medium"},
        ],
        "technology_adoption": ["Epic", "Cerner", "Salesforce Health Cloud", "AWS", "HIPAA tools"],
    },
    "travel": {
        "label": "Travel & Tourism",
        "global_market_size_b": 9500,
        "annual_growth_rate": 11.0,
        "avg_revenue_per_employee": 145000,
        "avg_digital_maturity": 55,
        "key_growth_drivers": [
            {"title": "Post-pandemic travel recovery", "description": "Global travel demand surpassing 2019 levels with strong leisure travel growth.", "impact": "high", "category": "market"},
            {"title": "Experience economy", "description": "Travelers prioritizing unique experiences over traditional packages.", "impact": "high", "category": "consumer"},
            {"title": "Saudi Vision 2030 tourism", "description": "Saudi Arabia targeting 100M visitors by 2030 — massive infrastructure investment.", "impact": "high", "category": "market"},
            {"title": "Digital booking platforms", "description": "AI-powered trip planning and instant booking transforming distribution.", "impact": "medium", "category": "technology"},
        ],
        "key_threats": [
            {"title": "Geopolitical instability", "description": "Regional conflicts and travel advisories impacting tourism flows.", "severity": "high"},
            {"title": "Climate change impact", "description": "Extreme weather events and sustainability concerns affecting destinations.", "severity": "medium"},
            {"title": "OTA dominance", "description": "Booking.com, Expedia controlling distribution channels, compressing agency margins.", "severity": "medium"},
        ],
        "technology_adoption": ["Amadeus", "Sabre", "Booking engines", "WordPress", "Google Ads"],
    },
    "restaurant": {
        "label": "Restaurant & Food",
        "global_market_size_b": 3500,
        "annual_growth_rate": 5.5,
        "avg_revenue_per_employee": 65000,
        "avg_digital_maturity": 38,
        "key_growth_drivers": [
            {"title": "Food delivery boom", "description": "Delivery platforms (Talabat, Deliveroo, Careem) growing 20%+ annually.", "impact": "high", "category": "channel"},
            {"title": "Cloud kitchens", "description": "Virtual restaurants reducing overhead costs by 60%+.", "impact": "medium", "category": "model"},
            {"title": "Health-conscious dining", "description": "Demand for organic, plant-based, and allergen-free options.", "impact": "medium", "category": "consumer"},
        ],
        "key_threats": [
            {"title": "Rising food costs", "description": "Global food inflation impacting ingredient costs and margins.", "severity": "high"},
            {"title": "Labor shortages", "description": "Difficulty retaining kitchen and service staff.", "severity": "high"},
            {"title": "Platform dependency", "description": "High commission fees (15-30%) from delivery platforms.", "severity": "medium"},
        ],
        "technology_adoption": ["POS systems", "Foodics", "iMenu", "Social media marketing"],
    },
    "education": {
        "label": "Education",
        "global_market_size_b": 7300,
        "annual_growth_rate": 8.0,
        "avg_revenue_per_employee": 95000,
        "avg_digital_maturity": 48,
        "key_growth_drivers": [
            {"title": "EdTech explosion", "description": "Online learning platforms growing rapidly with AI tutoring and adaptive learning.", "impact": "high", "category": "technology"},
            {"title": "Corporate upskilling", "description": "Companies investing heavily in employee training and development programs.", "impact": "high", "category": "market"},
            {"title": "Micro-credentials", "description": "Short-form certifications replacing traditional degree programs for skills.", "impact": "medium", "category": "model"},
        ],
        "key_threats": [
            {"title": "AI disruption", "description": "ChatGPT and AI tools challenging traditional education models.", "severity": "high"},
            {"title": "Regulatory changes", "description": "Evolving accreditation and licensing requirements.", "severity": "medium"},
        ],
        "technology_adoption": ["LMS platforms", "Zoom", "Canvas", "Moodle", "Google Classroom"],
    },
    "real_estate": {
        "label": "Real Estate",
        "global_market_size_b": 4200,
        "annual_growth_rate": 5.0,
        "avg_revenue_per_employee": 250000,
        "avg_digital_maturity": 35,
        "key_growth_drivers": [
            {"title": "PropTech innovation", "description": "Virtual tours, AI valuations, and blockchain transactions transforming the industry.", "impact": "high", "category": "technology"},
            {"title": "GCC mega-projects", "description": "NEOM, The Line, and other Saudi/UAE developments creating massive opportunity.", "impact": "high", "category": "market"},
            {"title": "Remote work impact", "description": "Changing office space demand and suburban residential growth.", "impact": "medium", "category": "consumer"},
        ],
        "key_threats": [
            {"title": "Interest rate sensitivity", "description": "Rising rates impacting affordability and transaction volumes.", "severity": "high"},
            {"title": "Oversupply risk", "description": "Certain GCC markets face oversupply in commercial and luxury segments.", "severity": "medium"},
        ],
        "technology_adoption": ["CRM systems", "Bayut/Property Finder", "Virtual tours", "GIS tools"],
    },
    "saas": {
        "label": "SaaS / Software",
        "global_market_size_b": 320,
        "annual_growth_rate": 13.5,
        "avg_revenue_per_employee": 280000,
        "avg_digital_maturity": 85,
        "key_growth_drivers": [
            {"title": "AI integration wave", "description": "Every SaaS product adding AI features — companies without AI falling behind.", "impact": "high", "category": "technology"},
            {"title": "Vertical SaaS growth", "description": "Industry-specific solutions outperforming horizontal tools.", "impact": "high", "category": "model"},
            {"title": "Usage-based pricing", "description": "Shift from seat-based to consumption pricing models.", "impact": "medium", "category": "model"},
        ],
        "key_threats": [
            {"title": "AI commoditization", "description": "AI making it easier to build competing products quickly.", "severity": "high"},
            {"title": "Customer churn pressure", "description": "SME customers highly price-sensitive with low switching costs.", "severity": "medium"},
        ],
        "technology_adoption": ["React", "Next.js", "AWS", "Stripe", "PostgreSQL", "Redis"],
    },
    "agency": {
        "label": "Agency / Marketing",
        "global_market_size_b": 850,
        "annual_growth_rate": 7.0,
        "avg_revenue_per_employee": 120000,
        "avg_digital_maturity": 65,
        "key_growth_drivers": [
            {"title": "AI content creation", "description": "AI tools enabling agencies to produce 10x more content at lower cost.", "impact": "high", "category": "technology"},
            {"title": "Performance marketing", "description": "Shift from brand to measurable ROI-driven campaigns.", "impact": "high", "category": "model"},
            {"title": "Influencer marketing", "description": "Creator economy growing 30%+ annually, especially in GCC.", "impact": "medium", "category": "channel"},
        ],
        "key_threats": [
            {"title": "In-house marketing teams", "description": "Companies building internal capabilities, reducing agency dependency.", "severity": "high"},
            {"title": "AI replacing agency work", "description": "Clients using AI directly for copywriting, design, and analytics.", "severity": "high"},
        ],
        "technology_adoption": ["HubSpot", "Google Ads", "Meta Business", "Canva", "SEMrush"],
    },
    "design_creative": {
        "label": "Design & Creative",
        "global_market_size_b": 280,
        "annual_growth_rate": 8.5,
        "avg_revenue_per_employee": 110000,
        "avg_digital_maturity": 60,
        "key_growth_drivers": [
            {"title": "UX/UI demand surge", "description": "Every company needs digital-first design — massive demand for UX professionals.", "impact": "high", "category": "market"},
            {"title": "AI-assisted design", "description": "Tools like Figma AI, Midjourney accelerating design workflows.", "impact": "high", "category": "technology"},
            {"title": "Brand experience economy", "description": "Companies investing more in brand design and customer experience.", "impact": "medium", "category": "consumer"},
        ],
        "key_threats": [
            {"title": "AI generative design", "description": "AI tools producing designs that match junior designer quality.", "severity": "high"},
            {"title": "Freelancer competition", "description": "Global freelance platforms driving prices down.", "severity": "medium"},
        ],
        "technology_adoption": ["Figma", "Adobe Creative Suite", "Webflow", "Framer", "Canva"],
    },
    "engineering": {
        "label": "Engineering & Solutions",
        "global_market_size_b": 1800,
        "annual_growth_rate": 6.0,
        "avg_revenue_per_employee": 200000,
        "avg_digital_maturity": 40,
        "key_growth_drivers": [
            {"title": "Smart infrastructure", "description": "IoT and AI integration in building management and industrial systems.", "impact": "high", "category": "technology"},
            {"title": "Sustainability mandates", "description": "Green building standards and ESG requirements driving new engineering demand.", "impact": "high", "category": "regulatory"},
            {"title": "Digital twins", "description": "Virtual replicas of physical systems for optimization and predictive maintenance.", "impact": "medium", "category": "technology"},
        ],
        "key_threats": [
            {"title": "Supply chain disruptions", "description": "Material shortages and price volatility impacting project timelines.", "severity": "high"},
            {"title": "Skilled labor shortage", "description": "Aging workforce and insufficient pipeline of new engineers.", "severity": "medium"},
        ],
        "technology_adoption": ["AutoCAD", "BIM", "SAP", "ERP systems", "Project management tools"],
    },
    "construction": {
        "label": "Construction",
        "global_market_size_b": 13500,
        "annual_growth_rate": 5.5,
        "avg_revenue_per_employee": 160000,
        "avg_digital_maturity": 28,
        "key_growth_drivers": [
            {"title": "GCC mega-projects", "description": "NEOM, Diriyah Gate, Expo cities driving unprecedented construction demand.", "impact": "high", "category": "market"},
            {"title": "Modular construction", "description": "Off-site fabrication reducing build times by 30-50%.", "impact": "medium", "category": "technology"},
            {"title": "ConTech adoption", "description": "Drones, BIM, and project management software improving efficiency.", "impact": "medium", "category": "technology"},
        ],
        "key_threats": [
            {"title": "Material cost inflation", "description": "Steel, cement, and lumber prices volatile and trending up.", "severity": "high"},
            {"title": "Labor cost increases", "description": "Saudization and worker welfare regulations increasing labor costs.", "severity": "medium"},
        ],
        "technology_adoption": ["Procore", "BIM 360", "PlanGrid", "SAP", "Primavera"],
    },
    "manufacturing": {
        "label": "Manufacturing",
        "global_market_size_b": 15200,
        "annual_growth_rate": 4.5,
        "avg_revenue_per_employee": 190000,
        "avg_digital_maturity": 35,
        "key_growth_drivers": [
            {"title": "Industry 4.0", "description": "Smart factories with IoT sensors, robotics, and real-time analytics.", "impact": "high", "category": "technology"},
            {"title": "Reshoring and localization", "description": "Countries incentivizing domestic manufacturing for supply chain security.", "impact": "high", "category": "policy"},
            {"title": "Saudi Vision 2030 industrialization", "description": "Massive investment in local manufacturing capacity.", "impact": "high", "category": "market"},
        ],
        "key_threats": [
            {"title": "Energy cost volatility", "description": "Energy prices directly impacting manufacturing costs.", "severity": "high"},
            {"title": "Automation displacement", "description": "Robotics replacing manual jobs, requiring workforce reskilling.", "severity": "medium"},
        ],
        "technology_adoption": ["ERP (SAP/Oracle)", "MES systems", "SCADA", "IoT platforms"],
    },
    "technology": {
        "label": "Technology & IT",
        "global_market_size_b": 5500,
        "annual_growth_rate": 10.0,
        "avg_revenue_per_employee": 300000,
        "avg_digital_maturity": 82,
        "key_growth_drivers": [
            {"title": "AI/ML infrastructure", "description": "Massive enterprise investment in AI capabilities and infrastructure.", "impact": "high", "category": "technology"},
            {"title": "Cybersecurity demand", "description": "Cyber threats driving 15%+ annual growth in security spending.", "impact": "high", "category": "market"},
            {"title": "Cloud migration", "description": "Continued enterprise shift from on-premise to cloud-native.", "impact": "medium", "category": "technology"},
        ],
        "key_threats": [
            {"title": "Talent war", "description": "Fierce competition for AI/ML, cybersecurity, and cloud engineers.", "severity": "high"},
            {"title": "Rapid obsolescence", "description": "Technology cycles shortening, requiring constant reinvention.", "severity": "medium"},
        ],
        "technology_adoption": ["AWS", "Azure", "GCP", "Kubernetes", "Terraform", "Python"],
    },
    "retail": {
        "label": "Retail",
        "global_market_size_b": 28000,
        "annual_growth_rate": 4.0,
        "avg_revenue_per_employee": 85000,
        "avg_digital_maturity": 42,
        "key_growth_drivers": [
            {"title": "Omnichannel integration", "description": "Seamless online-to-offline shopping experience becoming essential.", "impact": "high", "category": "model"},
            {"title": "Personalization at scale", "description": "AI-driven product recommendations and dynamic pricing.", "impact": "medium", "category": "technology"},
            {"title": "Sustainability focus", "description": "Eco-conscious consumers driving demand for sustainable products.", "impact": "medium", "category": "consumer"},
        ],
        "key_threats": [
            {"title": "E-commerce cannibalization", "description": "Online shopping continuing to erode physical retail traffic.", "severity": "high"},
            {"title": "Margin compression", "description": "Price transparency and competition squeezing retail margins.", "severity": "medium"},
        ],
        "technology_adoption": ["POS systems", "Shopify", "SAP Retail", "Loyalty platforms"],
    },
    "finance": {
        "label": "Finance & Banking",
        "global_market_size_b": 26500,
        "annual_growth_rate": 6.0,
        "avg_revenue_per_employee": 350000,
        "avg_digital_maturity": 58,
        "key_growth_drivers": [
            {"title": "Fintech disruption", "description": "Digital-first banking, BNPL, and embedded finance growing rapidly.", "impact": "high", "category": "technology"},
            {"title": "Open banking", "description": "API-driven banking enabling new financial products and services.", "impact": "high", "category": "regulatory"},
            {"title": "Islamic finance growth", "description": "Shariah-compliant financial products growing 15%+ in GCC.", "impact": "medium", "category": "market"},
        ],
        "key_threats": [
            {"title": "Regulatory burden", "description": "Increasing compliance requirements (AML, KYC, data privacy).", "severity": "high"},
            {"title": "Crypto volatility", "description": "Digital asset market uncertainty affecting institutional confidence.", "severity": "medium"},
        ],
        "technology_adoption": ["Core banking systems", "Temenos", "Finastra", "Bloomberg"],
    },
    "logistics": {
        "label": "Logistics & Supply Chain",
        "global_market_size_b": 9400,
        "annual_growth_rate": 6.5,
        "avg_revenue_per_employee": 130000,
        "avg_digital_maturity": 40,
        "key_growth_drivers": [
            {"title": "E-commerce logistics", "description": "Last-mile delivery demand driving logistics innovation.", "impact": "high", "category": "market"},
            {"title": "Supply chain digitization", "description": "Real-time tracking, AI demand forecasting, and blockchain.", "impact": "high", "category": "technology"},
            {"title": "GCC as logistics hub", "description": "Dubai and Saudi Arabia positioning as global logistics centers.", "impact": "medium", "category": "market"},
        ],
        "key_threats": [
            {"title": "Fuel cost volatility", "description": "Energy prices directly impacting transportation costs.", "severity": "high"},
            {"title": "Geopolitical disruptions", "description": "Trade route disruptions (Red Sea, Suez) affecting global supply chains.", "severity": "high"},
        ],
        "technology_adoption": ["TMS", "WMS", "SAP SCM", "Fleet management", "IoT tracking"],
    },
    "media_entertainment": {
        "label": "Media & Entertainment",
        "global_market_size_b": 2800,
        "annual_growth_rate": 8.0,
        "avg_revenue_per_employee": 150000,
        "avg_digital_maturity": 62,
        "key_growth_drivers": [
            {"title": "Streaming growth", "description": "OTT platforms and content creation demand exploding globally.", "impact": "high", "category": "channel"},
            {"title": "Saudi entertainment sector", "description": "Saudi Arabia opening cinemas, events, and entertainment districts.", "impact": "high", "category": "market"},
            {"title": "Creator economy", "description": "Individual content creators building million-dollar businesses.", "impact": "medium", "category": "model"},
        ],
        "key_threats": [
            {"title": "Content saturation", "description": "Oversupply of content making it harder to capture audience attention.", "severity": "medium"},
            {"title": "AI-generated content", "description": "AI disrupting creative roles in writing, design, and video production.", "severity": "high"},
        ],
        "technology_adoption": ["Adobe Suite", "DaVinci Resolve", "YouTube", "Social platforms"],
    },
    "nonprofit": {
        "label": "Non-profit",
        "global_market_size_b": 2400,
        "annual_growth_rate": 4.0,
        "avg_revenue_per_employee": 55000,
        "avg_digital_maturity": 32,
        "key_growth_drivers": [
            {"title": "Digital fundraising", "description": "Online donation platforms and social media campaigns increasing reach.", "impact": "high", "category": "technology"},
            {"title": "Impact measurement", "description": "Donors demanding data-driven proof of impact.", "impact": "medium", "category": "model"},
            {"title": "CSR partnerships", "description": "Corporate social responsibility programs driving funding.", "impact": "medium", "category": "market"},
        ],
        "key_threats": [
            {"title": "Donor fatigue", "description": "Increasing competition for donor attention and funding.", "severity": "medium"},
            {"title": "Regulatory scrutiny", "description": "Tightening regulations on nonprofit transparency and governance.", "severity": "medium"},
        ],
        "technology_adoption": ["Salesforce Nonprofit", "Mailchimp", "WordPress", "Donor CRM"],
    },
    "professional_services": {
        "label": "Professional Services",
        "global_market_size_b": 6200,
        "annual_growth_rate": 6.5,
        "avg_revenue_per_employee": 170000,
        "avg_digital_maturity": 50,
        "key_growth_drivers": [
            {"title": "AI augmentation", "description": "AI tools augmenting consultants, lawyers, and accountants — not replacing.", "impact": "high", "category": "technology"},
            {"title": "Digital transformation consulting", "description": "Every industry needing help with digitalization.", "impact": "high", "category": "market"},
            {"title": "Outsourcing growth", "description": "Companies outsourcing non-core functions to professional firms.", "impact": "medium", "category": "model"},
        ],
        "key_threats": [
            {"title": "AI self-service", "description": "Clients using AI tools directly for tasks previously outsourced.", "severity": "high"},
            {"title": "Price pressure", "description": "Global competition driving hourly rates down.", "severity": "medium"},
        ],
        "technology_adoption": ["CRM", "ERP", "Project management", "Microsoft 365", "Zoom"],
    },
    "other": {
        "label": "General / Other",
        "global_market_size_b": 5000,
        "annual_growth_rate": 5.0,
        "avg_revenue_per_employee": 150000,
        "avg_digital_maturity": 45,
        "key_growth_drivers": [
            {"title": "Digital transformation", "description": "All industries accelerating digital adoption.", "impact": "high", "category": "technology"},
            {"title": "AI integration", "description": "AI tools becoming essential for competitive businesses.", "impact": "high", "category": "technology"},
            {"title": "Global market access", "description": "Digital tools enabling SMEs to compete globally.", "impact": "medium", "category": "market"},
        ],
        "key_threats": [
            {"title": "Economic uncertainty", "description": "Global economic conditions creating business risk.", "severity": "medium"},
            {"title": "Cybersecurity threats", "description": "Increasing sophistication of cyber attacks on businesses.", "severity": "medium"},
        ],
        "technology_adoption": ["WordPress", "Google Workspace", "Microsoft 365", "CRM tools"],
    },
}


def get_industry_data(industry: str) -> dict:
    """Get data for an industry, with fallback to 'other'."""
    return INDUSTRY_DATABASE.get(industry, INDUSTRY_DATABASE["other"])


def get_regional_multiplier(country: str) -> float:
    """Get regional market multiplier for a country."""
    return REGIONAL_MULTIPLIERS.get(country, DEFAULT_REGIONAL_MULTIPLIER)
