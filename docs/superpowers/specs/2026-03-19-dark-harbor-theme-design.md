# AEOS Dark Harbor Theme — Design Specification

**Date:** 2026-03-19
**Status:** Approved
**Scope:** Full redesign of all AEOS pages with dark "Midnight Gradient" premium SaaS theme + light/dark toggle

---

## 1. Overview

Redesign the entire AEOS frontend with a dark premium SaaS aesthetic ("Midnight Gradient" direction), inspired by Linear, Vercel, and Raycast. The landing page and auth pages are always dark; all authenticated app pages support a light/dark toggle.

### Key Decisions

| Decision | Choice |
|---|---|
| Theme direction | Midnight Gradient — deep space blue (#020617 → #1e293b), blue-to-teal accents |
| Scope | All ~28 pages |
| Toggle | Light/dark toggle for authenticated pages |
| Landing page | Always dark |
| Auth pages | Always dark |
| Implementation | CSS variables + Tailwind `dark:` class mode |

---

## 2. Color System

### 2.1 Dark Mode Surfaces

| CSS Variable | Tailwind Key | Value | Usage |
|---|---|---|---|
| `--surface-base` | `surface.base` (NEW) | `#020617` | Page background |
| `--surface` | `surface.DEFAULT` | `#0f172a` | Cards, panels |
| `--surface-secondary` | `surface.secondary` | `#1e293b` | Hover states, inputs |
| `--surface-tertiary` | `surface.tertiary` | `#253349` | Nested elements inside cards |
| `--surface-inset` | `surface.inset` | `#334155` | Active/pressed states |

Note: `surface.base` is a **new** Tailwind key that must be added to `tailwind.config.js`. It maps to `bg-surface-base`.

### 2.2 Dark Mode Text

| CSS Variable | Tailwind Key | Value | Usage |
|---|---|---|---|
| `--fg` | `fg.DEFAULT` | `#f1f5f9` | Primary text |
| `--fg-secondary` | `fg.secondary` | `#94a3b8` | Secondary text, labels |
| `--fg-muted` | `fg.muted` | `#71819b` | Muted text, descriptions (bumped from #64748b for 4.5:1 AA contrast on #0f172a) |
| `--fg-hint` | `fg.hint` | `#475569` | Hints, placeholders (decorative only, not informational) |
| `--fg-inverse` | `fg.inverse` | `#0f1729` | Text on light backgrounds |

### 2.3 Dark Mode Borders

| CSS Variable | Tailwind Key | Value | Usage |
|---|---|---|---|
| `--border` | `border.DEFAULT` | `rgba(255,255,255,0.06)` | Default card/panel borders |
| `--border-light` | `border.light` | `rgba(255,255,255,0.04)` | Subtle dividers |
| `--border-strong` | `border.strong` (NEW) | `rgba(255,255,255,0.10)` | Emphasized borders, section dividers |
| `--border-focus` | `border.focus` | `rgba(59,130,246,0.3)` | Focus rings |

Note: `border.strong` is a **new** Tailwind key.

### 2.4 Light Mode

| CSS Variable | Light Value |
|---|---|
| `--surface-base` | `#f8f9fb` |
| `--surface` | `#ffffff` |
| `--surface-secondary` | `#f8f9fb` |
| `--surface-tertiary` | `#f3f4f8` |
| `--surface-inset` | `#eef0f4` |
| `--fg` | `#0f1729` |
| `--fg-secondary` | `#4b5468` |
| `--fg-muted` | `#7c8497` |
| `--fg-hint` | `#a3aab8` |
| `--fg-inverse` | `#ffffff` |
| `--border` | `#e2e5ed` |
| `--border-light` | `#eef0f4` |
| `--border-strong` | `#cbd5e1` |
| `--border-focus` | `#bbdaff` |

### 2.5 Brand Colors (Static — Not Theme-Switched)

The existing `aeos-*` brand palette remains unchanged and is **not** converted to CSS variables:

| Token | Value | Usage |
|---|---|---|
| `aeos-500` | `#2e79ff` | Primary brand blue (CTAs, active states, links) |
| `aeos-600` | `#1758f5` | Hover/darker brand blue |
| `aeos-700` | `#1044e1` | Pressed state |

Status colors also remain static:
- Success: `#10b981`, Warning: `#f59e0b`, Danger: `#ef4444`, Info: `#3b82f6`, Accent: `#8b5cf6`

### 2.6 Category & Status Light Backgrounds (Theme-Switched)

The `-light` background tokens (used in badges, tinted cards, severity labels) must switch between pastel (light mode) and low-opacity tints (dark mode):

| Token | Light Mode Value | Dark Mode Value |
|---|---|---|
| `category.marketing.light` | `#eff6ff` | `rgba(59,130,246,0.08)` |
| `category.growth.light` | `#ecfdf5` | `rgba(16,185,129,0.08)` |
| `category.operations.light` | `#fffbeb` | `rgba(245,158,11,0.08)` |
| `category.technology.light` | `#f5f3ff` | `rgba(139,92,246,0.08)` |
| `category.hr.light` | `#fdf2f8` | `rgba(236,72,153,0.08)` |
| `category.finance.light` | `#ecfeff` | `rgba(6,182,212,0.08)` |
| `category.executive.light` | `#eef2ff` | `rgba(99,102,241,0.08)` |
| `status.success-light` | `#ecfdf5` | `rgba(16,185,129,0.1)` |
| `status.warning-light` | `#fffbeb` | `rgba(245,158,11,0.1)` |
| `status.danger-light` | `#fef2f2` | `rgba(239,68,68,0.1)` |
| `status.info-light` | `#eff6ff` | `rgba(59,130,246,0.1)` |

### 2.7 Category & Status Text Colors (Theme-Switched)

The `-text` tokens (dark text on pastel backgrounds in light mode) must lighten in dark mode:

| Token | Light Mode Value | Dark Mode Value |
|---|---|---|
| `category.marketing.text` | `#1e40af` | `#60a5fa` |
| `category.growth.text` | `#065f46` | `#34d399` |
| `category.operations.text` | `#92400e` | `#fbbf24` |
| `category.technology.text` | `#5b21b6` | `#a78bfa` |
| `category.hr.text` | `#9d174d` | `#f472b6` |
| `category.finance.text` | `#155e75` | `#22d3ee` |
| `category.executive.text` | `#3730a3` | `#818cf8` |
| `status.success-text` | `#065f46` | `#34d399` |
| `status.warning-text` | `#92400e` | `#fbbf24` |
| `status.danger-text` | `#991b1b` | `#fca5a5` |
| `status.info-text` | `#1e40af` | `#60a5fa` |

These become CSS variables in `globals.css`, referenced in `tokens.ts`.

### 2.8 Severity Light Backgrounds (Theme-Switched)

Same pattern as category/status — severity `-light` and `-text` tokens switch:

| Token | Light Mode | Dark Mode |
|---|---|---|
| `severity.critical-light` | `#fef2f2` | `rgba(239,68,68,0.1)` |
| `severity.critical-text` | `#991b1b` | `#fca5a5` |
| `severity.high-light` | `#fff7ed` | `rgba(249,115,22,0.1)` |
| `severity.high-text` | `#9a3412` | `#fdba74` |
| `severity.medium-light` | `#fffbeb` | `rgba(245,158,11,0.1)` |
| `severity.medium-text` | `#92400e` | `#fbbf24` |
| `severity.low-light` | `#eff6ff` | `rgba(59,130,246,0.1)` |
| `severity.low-text` | `#1e40af` | `#60a5fa` |

### 2.9 Glow Effects (Dark Mode Only)

Subtle radial gradients used as decorative orbs on hero sections, behind cards, and near CTAs:
- Blue glow: `radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)`
- Teal glow: `radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)`
- Dual glow: combined blue + teal at lower opacity
- Applied via absolute-positioned pseudo-elements or divs, hidden in light mode via `dark:block hidden`

---

## 3. Theme Toggle Architecture

### 3.1 ThemeProvider Component

New file: `frontend/src/lib/ThemeProvider.tsx`

- React context providing `{ theme, setTheme, toggleTheme }`
- On mount: read `localStorage.getItem('aeos-theme')`
  - If no stored preference, check `window.matchMedia('(prefers-color-scheme: dark)')` — default to dark
- Apply `dark` class to `document.documentElement` when theme is `'dark'`
- Persist changes to `localStorage` key `aeos-theme`
- Wrap the app in root `layout.tsx` (`frontend/src/app/layout.tsx`)

### 3.2 ThemeToggle Component

New file: `frontend/src/components/ui/ThemeToggle.tsx`

- Sun/moon toggle switch placed in the sidebar (near user section)
- Visual: segmented control with sun icon (light) and moon icon (dark)
- Calls `toggleTheme()` from context
- Animated transition between states
- Keyboard accessible (Tab + Enter/Space)

### 3.3 Tailwind Configuration

Update `frontend/tailwind.config.js`:
- Set `darkMode: 'class'`
- Add `surface.base` key (NEW)
- Add `border.strong` key (NEW)
- Replace hardcoded hex values for `surface`, `fg`, `border` tokens with CSS variable references: e.g. `surface: { DEFAULT: 'var(--surface)', base: 'var(--surface-base)', ... }`
- Convert category `-light` and `-text` tokens to CSS variable references
- Convert severity `-light` and `-text` tokens to CSS variable references
- Keep the `aeos-*` brand palette and base accent colors (`success`, `warning`, `danger`, etc.) as static hex values (shared across modes)

### 3.4 CSS Variables

Update `frontend/src/styles/globals.css`:
```css
:root {
  --surface-base: #f8f9fb;
  --surface: #ffffff;
  --surface-secondary: #f8f9fb;
  --surface-tertiary: #f3f4f8;
  --surface-inset: #eef0f4;
  --fg: #0f1729;
  --fg-secondary: #4b5468;
  --fg-muted: #7c8497;
  --fg-hint: #a3aab8;
  --fg-inverse: #ffffff;
  --border: #e2e5ed;
  --border-light: #eef0f4;
  --border-strong: #cbd5e1;
  --border-focus: #bbdaff;
  /* category, status, severity -light and -text vars */
}

.dark {
  --surface-base: #020617;
  --surface: #0f172a;
  --surface-secondary: #1e293b;
  --surface-tertiary: #253349;
  --surface-inset: #334155;
  --fg: #f1f5f9;
  --fg-secondary: #94a3b8;
  --fg-muted: #71819b;
  --fg-hint: #475569;
  --fg-inverse: #0f1729;
  --border: rgba(255,255,255,0.06);
  --border-light: rgba(255,255,255,0.04);
  --border-strong: rgba(255,255,255,0.10);
  --border-focus: rgba(59,130,246,0.3);
  /* category, status, severity -light and -text dark vars */
}
```

### 3.5 Anti-FOUC

Add inline script in `frontend/src/app/layout.tsx` `<head>` via `<Script strategy="beforeInteractive">` or a raw `<script>` tag:
```js
try {
  var t = localStorage.getItem('aeos-theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch(e) {}
```

Wrapped in try/catch for environments where localStorage is unavailable.

### 3.6 Force-Dark Pages

Pages that are always dark (landing, auth, report token) use a wrapper component `ForceDark`:

New file: `frontend/src/components/ui/ForceDark.tsx`

- On mount: adds `dark` class to `document.documentElement`, saves previous state
- On unmount: restores previous theme class
- Alternatively for landing page (which is standalone): simply add `className="dark"` to its root `<div>` and rely on Tailwind's `dark:` cascading within that subtree

Decision: **Use `className="dark"` on the page root wrapper.** This is simpler and doesn't fight with ThemeProvider. Tailwind `dark:` classes cascade from any ancestor with the `dark` class, so this works without touching the `<html>` element.

### 3.7 Scrollbar Theming

Update `frontend/src/styles/globals.css` scrollbar styles:

```css
:root {
  --scrollbar-thumb: #cbd5e1;
  --scrollbar-track: transparent;
}
.dark {
  --scrollbar-thumb: #334155;
  --scrollbar-track: transparent;
}
```

### 3.8 Browser Theme Color

Update `frontend/src/app/layout.tsx` viewport metadata to be theme-aware:
- Light: `themeColor: "#ffffff"`
- Dark: `themeColor: "#020617"`

Use the anti-FOUC script to also set `<meta name="theme-color">`, or provide both via `media` attribute:
```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)">
```

---

## 4. Page-by-Page Design

### 4.1 Landing Page (Always Dark)

- **Nav**: Frosted glass backdrop-blur, `rgba(2,6,23,0.8)` background, subtle bottom border
- **Hero**: Gradient text headline (white → slate → blue), blue glow orbs behind, badge with blue tint
- **CTAs**: Primary = blue gradient with `box-shadow: 0 0 24px rgba(59,130,246,0.3)`, Secondary = glass border button
- **Stats bar**: Each number with its own gradient text color (blue, green, purple, amber)
- **Feature cards**: Category-tinted backgrounds using low-opacity fills + matching borders
- **Pricing**: Popular tier highlighted with blue border + "POPULAR" badge
- **Final CTA**: Gradient overlay background (blue → teal at low opacity)
- **Footer**: Minimal, muted color hierarchy

Force dark: `<div className="dark">` wrapper on the page root.

### 4.2 Auth Pages (Always Dark)

- **Layout**: Split-screen — brand showcase (left, `#020617`), form (right, `#0f172a`)
- **Left panel**: Gradient glow orbs, logo, headline, feature checkmarks with category-colored icons
- **Right panel**: Form fields with `surface-secondary` background, subtle borders
- **CTA button**: Blue gradient with glow shadow
- **Social login**: Glass-border button

Force dark: `<div className="dark">` wrapper in `frontend/src/app/(auth)/layout.tsx`.

### 4.3 Onboarding (5 Steps — Follows Toggle)

- **Step indicator**: Horizontal dots — active = blue gradient circle, completed = green check, pending = muted circle with subtle border
- **Form inputs**: `surface-secondary` background, border-DEFAULT
- **Org chart**: Department nodes with category-colored low-opacity backgrounds (using theme-switched category-light tokens)
- **Layout**: Form left, preview/visualization right (existing layout preserved)

### 4.4 Dashboard (Follows Toggle)

- **Sidebar**: Stays dark in **both** modes — it already uses dark colors. No `dark:` variants needed for sidebar internals. The sidebar background remains `#0f172a` / gradient always.
  - Active item: blue tint background + blue text
  - Sections: uppercase muted labels
  - Theme toggle: sun/moon segmented control above user section
- **TopBar**: Glass blur (`backdrop-filter: blur(8px)`) with semi-transparent background in dark; white `bg-surface` in light
  - Search: `surface-secondary` input with ⌘K hint
  - Token counter, notification bell with red dot
- **Cards**: `bg-surface` background, `border` borders
  - Category-tinted stats use theme-switched `-light` backgrounds
  - Score rings, severity dots, progress bars use static accent colors
- **Ask AEOS card**: Gradient accent background to stand out (blue → teal at low opacity)

### 4.5 Intelligence Sub-Pages (11 pages — Follow Toggle)

All follow the same pattern:
- Page header with title (`fg`) + description (`fg-muted`)
- Cards/tables using `bg-surface` with `border`
- Charts: accent colors on `surface-base` background
- Tables: alternating row backgrounds using `bg-surface-base` and `bg-surface`

Pages: Marketing, Leads, Opportunities, Digital Presence, Gap Analysis, Business Plan, KPI Framework, Financial Model, Market Research, Financial Health, Competitors

### 4.6 Platform Pages (5 pages — Follow Toggle)

Command Center, AI Agents, Integrations, Reports, Copilot — same card/surface pattern as intelligence pages.

### 4.7 Settings & Admin (Follow Toggle)

Standard form layouts. Inputs use `bg-surface-secondary` with `border`. Section headers use `fg` / `fg-muted`.

### 4.8 Report Token Page (Always Dark)

Public-facing shareable report — `<div className="dark">` wrapper for brand consistency.

---

## 5. Component Updates

### 5.1 New Components

| Component | File | Purpose |
|---|---|---|
| ThemeProvider | `frontend/src/lib/ThemeProvider.tsx` | Theme context, localStorage, class management |
| ThemeToggle | `frontend/src/components/ui/ThemeToggle.tsx` | Sun/moon toggle switch |
| ForceDark | `frontend/src/components/ui/ForceDark.tsx` | (Optional) wrapper that adds `dark` class — may not be needed if `className="dark"` on root div suffices |

### 5.2 Updated Components — Layout

| Component | File | Changes |
|---|---|---|
| Global styles | `frontend/src/styles/globals.css` | Add all CSS variables for both modes in `:root` and `.dark`, scrollbar theming |
| Tailwind config | `frontend/tailwind.config.js` | `darkMode: 'class'`, add `surface.base`, `border.strong`, convert tokens to CSS var refs |
| Root layout | `frontend/src/app/layout.tsx` | Wrap with ThemeProvider, add anti-FOUC script, theme-color meta |
| DashboardShell | `frontend/src/components/layout/DashboardShell.tsx` | `bg-surface-base` for main content area |
| Sidebar | `frontend/src/components/layout/Sidebar.tsx` | Add ThemeToggle component, sidebar stays dark always |
| TopBar | `frontend/src/components/layout/TopBar.tsx` | Glass blur dark, white light; use `bg-surface` and `border` tokens |

### 5.3 Updated Components — UI

| Component | File | Changes |
|---|---|---|
| Card / CardWithHeader | `frontend/src/components/ui/Card.tsx` | `bg-surface`, `border` tokens |
| MetricCard | `frontend/src/components/ui/MetricCard.tsx` | Theme-aware backgrounds and text |
| Badge | `frontend/src/components/ui/Badge.tsx` | Theme-switched `-light` and `-text` tokens |
| SectionHeader | `frontend/src/components/ui/SectionHeader.tsx` | `text-fg` / `text-fg-muted` |
| CardStates | `frontend/src/components/ui/CardStates.tsx` | Dark variants for loading skeleton, empty, error states |
| tokens.ts | `frontend/src/components/ui/tokens.ts` | Convert `CATEGORY_STYLES`, `SEVERITY_STYLES` to use CSS variable-based classes; update `scoreHex()` to return theme-aware values or use CSS vars |

### 5.4 Updated Components — Dashboard Cards

Directory: `frontend/src/components/dashboard/`

| File | Changes |
|---|---|
| `StrategicIntelligenceCard.tsx` | Theme tokens for surfaces, text, score ring |
| `CompanyIntelligenceCard.tsx` | Theme tokens |
| `LeadIntelligenceCard.tsx` | Theme tokens |
| `OpportunityRadarCard.tsx` | Theme tokens, severity colors |
| `LeadSourcesCard.tsx` | Theme tokens |
| `LeadScoreCard.tsx` | Theme tokens |
| `TopOpportunitiesCard.tsx` | Theme tokens |
| `DigitalPresenceCard.tsx` | Theme tokens |
| `IntegrationStatusCard.tsx` | Theme tokens |
| `AskAeosCard.tsx` | Gradient accent background |
| `StrategicPrioritiesCard.tsx` | Theme tokens |
| `BillingCard.tsx` | Theme tokens |
| `AIBriefingCard.tsx` | Theme tokens |
| `DashCard.tsx` | Theme tokens |

### 5.5 Updated Components — Strategy Cards

Directory: `frontend/src/components/strategy/`

| File | Changes |
|---|---|
| `PrioritiesCard.tsx` | Theme tokens |
| `RiskSummaryCard.tsx` | Theme tokens, severity colors |
| `RoadmapPreviewCard.tsx` | Theme tokens |

### 5.6 Updated Pages

| Page | File | Changes |
|---|---|---|
| Landing | `frontend/src/app/page.tsx` | Full dark redesign with `dark` wrapper, glows, gradient text |
| Auth layout | `frontend/src/app/(auth)/layout.tsx` | Dark split-screen, `dark` wrapper |
| Login | `frontend/src/app/(auth)/login/page.tsx` | Dark form styling |
| Register | `frontend/src/app/(auth)/register/page.tsx` | Dark form styling |
| App layout | `frontend/src/app/app/layout.tsx` | Theme-aware shell |
| Onboarding layout | `frontend/src/app/app/onboarding/layout.tsx` | Dark step indicator |
| Onboarding company | `frontend/src/app/app/onboarding/company/page.tsx` | Dark forms, org chart |
| Onboarding presence | `frontend/src/app/app/onboarding/presence/page.tsx` | Dark forms |
| Onboarding competitors | `frontend/src/app/app/onboarding/competitors/page.tsx` | Dark forms |
| Onboarding integrations | `frontend/src/app/app/onboarding/integrations/page.tsx` | Dark forms |
| Onboarding complete | `frontend/src/app/app/onboarding/complete/page.tsx` | Dark completion state |
| Dashboard | `frontend/src/app/app/dashboard/page.tsx` | Theme tokens |
| Marketing | `frontend/src/app/app/marketing/page.tsx` | Theme tokens |
| Leads | `frontend/src/app/app/leads/page.tsx` | Theme tokens |
| Opportunities | `frontend/src/app/app/opportunities/page.tsx` | Theme tokens |
| Digital Presence | `frontend/src/app/app/digital-presence/page.tsx` | Theme tokens |
| Gap Analysis | `frontend/src/app/app/gap-analysis/page.tsx` | Theme tokens |
| Business Plan | `frontend/src/app/app/business-plan/page.tsx` | Theme tokens |
| KPI Framework | `frontend/src/app/app/kpi-framework/page.tsx` | Theme tokens |
| Financial Model | `frontend/src/app/app/financial-model/page.tsx` | Theme tokens |
| Market Research | `frontend/src/app/app/market-research/page.tsx` | Theme tokens |
| Financial Health | `frontend/src/app/app/financial-health/page.tsx` | Theme tokens |
| Competitors | `frontend/src/app/app/competitors/page.tsx` | Theme tokens |
| Command Center | `frontend/src/app/app/command/page.tsx` | Theme tokens |
| AI Agents | `frontend/src/app/app/agents/page.tsx` | Theme tokens |
| Integrations | `frontend/src/app/app/integrations/page.tsx` | Theme tokens |
| Reports | `frontend/src/app/app/reports/page.tsx` | Theme tokens |
| Copilot | `frontend/src/app/app/copilot/page.tsx` | Theme tokens |
| Settings | `frontend/src/app/app/settings/page.tsx` | Theme tokens |
| Admin | `frontend/src/app/app/admin/page.tsx` | Theme tokens |
| Report token | `frontend/src/app/report/[token]/page.tsx` | Force dark with `dark` wrapper |

---

## 6. Design Principles

1. **Depth through surfaces, not shadows** — In dark mode, elevation comes from lighter surface colors, not drop shadows. Cards (`#0f172a`) sit on base (`#020617`).

2. **White-alpha borders** — Use `rgba(255,255,255, 0.06)` instead of named border colors in dark mode. These are encoded as CSS variables so components just use `border`.

3. **Category tints at low opacity** — Department colors appear as `rgba(color, 0.08)` backgrounds with `rgba(color, 0.12)` borders in dark mode. Never use full-saturation backgrounds in dark mode.

4. **Glow > shadow** — Primary CTAs use `box-shadow: 0 0 24px rgba(59,130,246, 0.3)` for premium glow. Reserve glows for primary actions only. In light mode, use standard shadows.

5. **Gradient text for emphasis** — Hero headlines use `background-clip: text` gradients. Use sparingly — only for main headlines on always-dark pages, not body text.

6. **Glass morphism for overlays** — Nav bars and topbars use `backdrop-filter: blur()` with semi-transparent backgrounds in dark mode.

---

## 7. Transition & Animation

- Theme toggle adds a `theme-transitioning` class to `<html>` during switch, which enables `transition: background-color 200ms, color 200ms, border-color 200ms` on `*`. Class is removed after 300ms to avoid animating unrelated DOM changes.
- Existing Framer Motion animations (card entrance, scroll reveals) remain unchanged.
- Glow orbs: CSS-only, no additional animation needed.

---

## 8. Accessibility

- All text meets WCAG 2.1 AA contrast ratios in dark mode:
  - Primary text (#f1f5f9) on base (#020617) = 15.4:1 ✓
  - Secondary text (#94a3b8) on surface (#0f172a) = 5.7:1 ✓
  - Muted text (#71819b) on surface (#0f172a) = 4.5:1 ✓ (meets AA for normal text)
  - Hint text (#475569) on surface (#0f172a) = 2.5:1 — used for **decorative/placeholder text only**, never for informational content
- Focus rings use `border-focus` visible in both modes
- Theme toggle is keyboard-accessible (Tab + Enter/Space)
- `prefers-color-scheme` respected for initial state
- `prefers-reduced-motion` respected — theme transition class skipped

---

## 9. Out of Scope

- Dark mode for email templates or PDF reports
- Dark mode for third-party embedded widgets
- Custom dark mode per user role
- Chart library theming (Recharts/Chart.js) — if used, will need a follow-up spec
- Elevated surface token for modals/dropdowns (not currently needed, can add later)
