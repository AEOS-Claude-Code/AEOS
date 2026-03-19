# AEOS Landing Page — Harbor-Style Redesign Specification

**Date:** 2026-03-19
**Status:** Approved
**Scope:** Complete landing page restructure following Harbor SEO's layout pattern, with fine-tuned AEOS content

---

## 1. Overview

Restructure the AEOS landing page to follow Harbor SEO's proven conversion-focused layout: split hero with URL input + live preview card, social proof bar, testimonial carousel, stat-driven features section, step-by-step "how it works" cards with checklists, FAQ accordion, and a strong final CTA card. All content is fine-tuned for clarity and customer understanding.

The page remains always-dark (existing `<div className="dark">` wrapper). All existing dark theme tokens and CSS variables are reused.

### Key Decisions

| Decision | Choice |
|---|---|
| Hero layout | Split — left text with URL input, right "live preview" card |
| URL input | Functional — navigates to `/register?url=<input>` on submit |
| Testimonials | Horizontal scrolling carousel with placeholder content |
| FAQ | 2-column accordion with 6 questions |
| Departments section | Keep existing 9-card grid |
| Pricing | Keep existing 3-tier, add monthly/annual toggle |
| Step count | 4 steps (Scan → Evaluate → Plan → Deploy) |

---

## 2. Section Flow

### 2.1 Navigation Bar

Same structure as current, with Harbor-style enhancements:
- Logo: `⚡ AEOS` + tagline `AUTONOMOUS ENTERPRISE OS` (small caps, muted text beside logo)
- Links: Features (`#features`), How it works (`#how-it-works`), Pricing (`#pricing`) — smooth scroll anchors
- Right side: Green/blue badge pill `FREE COMPANY REPORT`, "Log in" text link, "Get Started Free" button

### 2.2 Hero — Split Layout

**Left column (60% width):**
- Badge pill: `✨ Free company report · No credit card required` — green-tinted bg
- Headline: `Turn your website into a fully staffed AI company` — large bold, "AI company" in gradient accent
- Subtext: `AEOS scans your website, builds your company profile, and deploys 27 AI agents across 9 departments — in under 2 minutes. One scan. Real results.`
- URL input group: Rounded container with globe icon + text input placeholder "Enter your website URL or domain" + green/blue "Build my AI team →" submit button
  - On submit: navigate to `/register?url=<encoded_input>`
- Trust line below input: `⚡ Takes under 2 minutes` · `✓ No setup complexity`

**Right column (40% width, hidden on mobile):**
- Card titled "How AEOS thinks" with "LIVE PREVIEW" label
- Pill: `Scan → Evaluate → Deploy`
- 3 inline stat boxes:
  - `SCAN SPEED` / `~2m`
  - `AI CONFIDENCE` / `94%+` (green text)
  - `DEPLOYMENT` / `Ready`
- 3 mini result cards stacked vertically:
  - `🔍 Gap Analysis` — "Missing Finance department" — `92% match` (green)
  - `📊 Strategic Priority` — "Market expansion into GCC" — `88% match` (green)
  - `🤖 AI Agent` — "Deploy Marketing Director AI" — `85% match` (green)

Card styling: `bg-surface border border-border rounded-2xl` with subtle inner cards using `bg-surface-secondary border border-border`.

### 2.3 Social Proof Bar

- Overlapping avatar circles (5-6 placeholder avatars, can use gradient initials)
- Star rating: `⭐⭐⭐⭐⭐ 5.0 rating`
- Text: `Trusted by 500+ companies`
- Centered below hero, subtle separator above/below

### 2.4 Testimonials Carousel

Horizontal auto-scrolling row of testimonial cards (CSS animation, infinite scroll with duplicated items).

Each card:
- 5 green stars
- Quote text (1-3 sentences)
- Name (bold)
- Role/title (muted)
- Avatar (gradient circle with initials)

**Placeholder testimonials (8 cards, duplicated for infinite scroll):**

1. "AEOS completely replaced three consultants we were paying $15k/month. The AI agents are that good." — **Sarah K.** / E-commerce Founder
2. "We went from a 5-person team to having the operational depth of a 50-person company overnight." — **Ahmed R.** / SaaS CEO
3. "The gap analysis alone was worth it. AEOS found blind spots we'd missed for two years." — **David L.** / Agency Owner
4. "I entered my URL and had a complete business plan with financial model in under 10 minutes. Insane." — **Maria C.** / Startup Founder
5. "Our marketing strategy went from guesswork to AI-driven intelligence. Revenue up 40% in 3 months." — **James W.** / Growth Lead
6. "The fact that it deploys AI agents across 9 departments automatically is mind-blowing." — **Priya S.** / Operations Director
7. "Finally, an AI tool that actually understands business operations, not just content generation." — **Tom H.** / Business Consultant
8. "AEOS is what happens when you let AI build your company's operating system. It just works." — **Lina M.** / Tech Entrepreneur

### 2.5 Features Section (`id="features"`)

- Badge pill: `✨ BUILT FOR GROWING COMPANIES`
- Headline: `Everything you need.` + `Nothing you don't.` (accent gradient: `from-aeos-400 to-emerald-400`)
- Subtext: `Enterprise-grade AI infrastructure with zero setup. Move fast without sacrificing intelligence.`

**3 stat cards (inline row):**

| Label | Value |
|---|---|
| `AVG DEPLOYMENT TIME` | `< 2 min` |
| `AI DEPARTMENTS` | `9` |
| `INTELLIGENCE ENGINES` | `15` |

Card style: `bg-surface-secondary border border-border rounded-xl` with uppercase muted label + large bold value.

**6 feature cards (3x2 grid):**

| # | Title | Description | Icon |
|---|---|---|---|
| 1 | Smart Website Analysis | Scans your website to detect company info, tech stack, social profiles, and competitive positioning automatically. | ScanLine |
| 2 | Strategic Intelligence | McKinsey-grade AI analyzes your market, generates a business plan, financial model, and KPI framework. | Brain |
| 3 | AI Department Agents | 27 specialized AI agents across Sales, Marketing, HR, Finance, Legal, Operations, IT, Procurement, and Strategy. | Bot |
| 4 | Lead Intelligence | AI-powered lead scoring, pipeline management, and automated outreach. Your sales team gets AI colleagues from day one. | Target |
| 5 | Gap Analysis | Identifies missing departments, understaffed roles, and operational gaps — then fills them with AI agents. | ArrowLeftRight |
| 6 | Digital Presence | Continuous monitoring of your SEO, social media, and competitor positioning with actionable recommendations. | Globe |

Card style: `bg-surface border border-border rounded-xl p-6` with green-tinted icon container. Match Harbor's clean look.

### 2.6 How It Works — 4 Steps (`id="how-it-works"`)

- Headline: `One scan.` + `Full deployment.` (accent gradient: `from-aeos-400 to-emerald-400`)
- Subtext: `No complexity. No decision fatigue. Just a guided flow that builds your AI organization.`

**4 step cards (responsive: 4-col on desktop, 2x2 on tablet, stacked on mobile):**

| Step | Title | Description | Checkmarks |
|---|---|---|---|
| 01 | Scan | Enter your URL. We analyze your site and auto-detect your company profile, industry, team, and tech stack. | ✓ Site analysis · ✓ Industry detection · ✓ Team mapping |
| 02 | Evaluate | AI runs a 360° audit: competitors, financials, org gaps, market position. You get a strategic intelligence report. | ✓ Gap analysis · ✓ Market research · ✓ Financial health |
| 03 | Plan | AI Strategy Agent generates a board-ready business plan with financial model and KPI framework. | ✓ Business plan · ✓ Financial model · ✓ KPI framework |
| 04 | Deploy | AI agents activate across every department. Director AI + specialists work alongside your human team. | ✓ 27 AI agents · ✓ 9 departments · ✓ 24/7 operations |

Card style: Like Harbor — `bg-surface border border-border rounded-xl p-6` with step number top-right (muted), icon top-left (green-tinted square), checkmarks with green check icons.

### 2.7 AI Departments Showcase

Keep existing 9-department grid (Sales, Marketing, HR, Finance, Legal, Operations, IT & Security, Procurement, Strategy & BI). Update copy to be more outcome-focused:

- Each card: department icon + name + agent count badge + short description
- Descriptions should focus on what the AI does for the customer, not technical details

### 2.8 Pricing (`id="pricing"`)

Keep existing 3-tier structure (Starter Free, Growth $49/mo, Business $149/mo).

Add monthly/annual toggle like Harbor (with "Save 17%" badge on annual). When annual is toggled, show discounted placeholder prices: Starter stays Free, Growth shows $41/mo, Business shows $124/mo. These are display-only — no billing logic changes.

### 2.9 FAQ Accordion (`id="faq"`)

- Headline: `Got questions?` + subtext: `Here are the answers.`
- 2-column layout on desktop, single column on mobile
- 6 questions with expandable answers:

| Question | Answer |
|---|---|
| What does AEOS actually do? | AEOS scans your website, analyzes your business, and deploys AI agents across 9 departments — Sales, Marketing, HR, Finance, Legal, Operations, IT, Procurement, and Strategy. Each department gets a Director AI and specialist agents that work 24/7 alongside your human team. |
| How long does the AI deployment take? | Under 2 minutes. Enter your website URL, and AEOS automatically scans your site, evaluates your business, generates a strategic plan, and deploys AI agents. No setup, no configuration, no technical knowledge required. |
| Do I need technical knowledge? | Not at all. AEOS is designed for business owners and operators, not engineers. If you can enter a URL, you can deploy a full AI workforce. |
| What departments does AEOS cover? | AEOS covers 9 departments: Sales, Marketing, HR, Finance, Legal, Operations, IT & Security, Procurement, and Strategy & Business Intelligence. Each department has specialized AI agents for different functions. |
| Can I try it for free? | Yes. The Starter plan is completely free and includes a full company scan, AI evaluation, and basic AI agent deployment. No credit card required. |
| Is my company data secure? | Absolutely. All data is encrypted in transit and at rest. We follow SOC 2 compliance standards and never share your company data with third parties. |

### 2.10 Final CTA Card

Centered card with border — this is the LAST content section before the footer (after FAQ):
- Badge pill: `✨ READY WHEN YOU ARE`
- Headline: `Ready to build your` + `AI organization?` (accent gradient: `from-aeos-400 to-emerald-400`)
- Subtext: `Join 500+ companies using AEOS to deploy a full AI workforce in under 2 minutes.` (**Note:** "500+ companies" is a placeholder — update with real numbers before public launch)
- Dual CTAs: "Start for free →" (gradient button, links to `/register`) + "Watch demo" (outline button, `href="#"`, shows tooltip "Coming soon" on click)
- 3 trust pills below: `No credit card required` | `Free company report` | `Cancel anytime`

### 2.11 Footer

Keep existing 4-column footer layout (Product, Company, Legal + brand column).

---

## 3. Content Fine-Tuning Guidelines

Throughout the page, apply these copy principles:

1. **Lead with outcomes** — "Turn your website into a fully staffed AI company" not "AI-powered modular business operating system"
2. **Short, punchy headlines** — Harbor's confidence: "One path. Real results." → AEOS: "One scan. Full deployment."
3. **Remove jargon** — no "headless browser", no "modular operating system", no "inference engine"
4. **Specifics over vague** — "27 AI agents across 9 departments" not "comprehensive AI solution"
5. **Trust signals everywhere** — "No credit card", "Under 2 minutes", "500+ companies" repeated in hero, CTA, pricing
6. **Action-oriented CTAs** — "Build my AI team" not "Get started"

---

## 4. Technical Notes

### File
- Single file: `frontend/src/app/page.tsx` (complete rewrite of the landing page component)

### Page Background
- Keep the existing `bg-[#070b18]` hardcoded background (lighter than `--surface-base`/`#020617`)
- Cards use `bg-surface` (which is `#0f172a` in dark mode)
- Inner cards/stat boxes use `bg-surface-secondary` (`#1e293b`)

### Headline Gradient
- All accent-colored headline parts use: `bg-gradient-to-r from-aeos-400 to-emerald-400 bg-clip-text text-transparent`
- This applies to: hero "AI company", features "Nothing you don't.", how-it-works "Full deployment.", CTA "AI organization?"

### New Components
All new components should be defined **inline in page.tsx** (not extracted to separate files). The page is a self-contained landing page and keeping components colocated matches the existing pattern.

- `URLInput` — inline URL input with submit button
- `TestimonialCarousel` — CSS-animated horizontal infinite scroll
- `FAQAccordion` — expandable question/answer pairs with state management

### Dependencies
- Keep Framer Motion for scroll animations
- Keep Lucide React for icons
- No new npm packages needed

### Responsive Behavior
- Hero: stacked on mobile (text above, preview card hidden on `<lg`)
- Features grid: 3-col → 2-col → 1-col
- How it works: 4-col → 2x2 → stacked
- FAQ: 2-col → 1-col
- Testimonials: always horizontal scroll

### URL Input Functionality
- On submit, navigate to `/register?url=<encodeURIComponent(input)>`
- Basic URL validation (must contain a dot)
- Show error state if invalid (red border + "Please enter a valid URL")
- The register page reading the `url` param is a follow-up task (file: `frontend/src/app/(auth)/register/page.tsx`)

### Testimonial Carousel Behavior
- CSS `@keyframes` infinite horizontal scroll (left direction)
- Speed: ~30 seconds per full cycle
- **Pauses on hover** (`:hover` sets `animation-play-state: paused`)
- Not manually scrollable/swipeable (pure CSS animation)
- Items duplicated in DOM for seamless infinite loop

### Social Proof Numbers
- "500+ companies" and "5.0 rating" are **placeholder values** — must be updated with real metrics before public marketing launch. Add an HTML comment: `<!-- PLACEHOLDER: update with real metrics -->`

### Accessibility
- FAQ accordion: each question is a `<button>` with `aria-expanded="true|false"`, answer wrapped in `<div role="region" aria-labelledby="question-id">`
- Testimonial carousel: `aria-label="Customer testimonials"`, individual cards are `aria-roledescription="slide"`
- URL input: proper `<label>` (can be visually hidden), `aria-describedby` for error message
- All interactive elements keyboard-accessible (Tab, Enter, Space)
- Skip decorative avatars with `aria-hidden="true"`

---

## 5. Out of Scope

- Register page URL pre-fill (follow-up)
- Real testimonials (placeholders for now)
- Annual pricing discount calculation (just toggle UI, prices can be same for now)
- Video/demo embed for "Watch demo" button (link to `#` for now)
- Mobile app download links
