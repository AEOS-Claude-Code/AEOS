# Dark Harbor Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Midnight Gradient dark theme across all ~28 AEOS pages with light/dark toggle support.

**Architecture:** CSS variables define light and dark color values in `globals.css`. Tailwind references these variables via `darkMode: 'class'`. A `ThemeProvider` context manages the `dark` class on `<html>`. Always-dark pages (landing, auth, report) use a `dark` class wrapper div.

**Tech Stack:** Next.js 14, Tailwind CSS, React Context, localStorage, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-19-dark-harbor-theme-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|---|---|
| `frontend/src/lib/ThemeProvider.tsx` | React context for theme state, localStorage persistence, `dark` class management |
| `frontend/src/components/ui/ThemeToggle.tsx` | Sun/moon segmented toggle control |

> **Note:** The spec lists `ForceDark.tsx` as optional (§5.1). Per spec §3.6 decision, we use `className="dark"` wrappers on always-dark page root divs instead. No `ForceDark.tsx` component is needed.

### Modified Files — Foundation
| File | Changes |
|---|---|
| `frontend/src/styles/globals.css` | Add `:root` and `.dark` CSS variable blocks for all semantic tokens, scrollbar theming, theme transition class |
| `frontend/tailwind.config.js` | `darkMode: 'class'`, add `surface.base`, `border.strong`, convert semantic tokens to CSS var refs, convert category/status/severity `-light` and `-text` to CSS var refs |
| `frontend/src/app/layout.tsx` | Wrap with ThemeProvider, add anti-FOUC script, update themeColor meta |

### Modified Files — Components
| File | Changes |
|---|---|
| `frontend/src/components/ui/tokens.ts` | Update `CATEGORY_STYLES` border classes to use dark-aware borders, update `SEVERITY_STYLES` borders, update `IMPACT_STYLES`. `TREND_STYLES` needs no changes (already uses CSS-var-backed tokens). Add note about `scoreHex()` for chart contexts. |
| `frontend/src/components/ui/Card.tsx` | No changes needed — already uses `bg-surface`, `border-border`, `text-fg` tokens |
| `frontend/src/components/ui/Badge.tsx` | Replace hardcoded `bg-slate-100`, `bg-emerald-50` etc. with theme-aware classes |
| `frontend/src/components/ui/CardStates.tsx` | No changes needed — already uses semantic tokens |
| `frontend/src/components/ui/SectionHeader.tsx` | Verify uses semantic tokens |
| `frontend/src/components/ui/MetricCard.tsx` | Update any hardcoded colors |
| `frontend/src/components/layout/Sidebar.tsx` | Add ThemeToggle, sidebar stays dark always (already is) |
| `frontend/src/components/layout/TopBar.tsx` | Replace `bg-white`, `border-slate-200`, `text-slate-*` with semantic tokens |
| `frontend/src/components/layout/DashboardShell.tsx` | Replace `bg-white`, `border-slate-200` with semantic tokens in MobileNav |

### Modified Files — Pages
| File | Changes |
|---|---|
| `frontend/src/app/page.tsx` | Wrap in `dark` class div, full dark redesign with glows, gradient text |
| `frontend/src/app/(auth)/layout.tsx` | Wrap in `dark` class div, already mostly dark — update right panel |
| `frontend/src/app/(auth)/login/page.tsx` | Dark form inputs, dark backgrounds |
| `frontend/src/app/(auth)/register/page.tsx` | Dark form inputs, dark backgrounds |
| `frontend/src/app/app/layout.tsx` | Add `bg-surface-base` to shell |
| `frontend/src/app/app/onboarding/layout.tsx` | Already dark bg — convert to use theme tokens |
| `frontend/src/app/app/onboarding/company/page.tsx` | Theme-aware form inputs |
| `frontend/src/app/app/onboarding/presence/page.tsx` | Theme-aware form inputs |
| `frontend/src/app/app/onboarding/competitors/page.tsx` | Theme-aware form inputs |
| `frontend/src/app/app/onboarding/integrations/page.tsx` | Theme-aware form inputs |
| `frontend/src/app/app/onboarding/complete/page.tsx` | Theme-aware completion |
| `frontend/src/app/app/dashboard/page.tsx` | Theme tokens |
| All 14 dashboard card files in `frontend/src/components/dashboard/` | Theme tokens |
| All 3 strategy card files in `frontend/src/components/strategy/` | Theme tokens |
| 11 intelligence pages | Theme tokens |
| 5 platform pages + settings + admin | Theme tokens |
| `frontend/src/app/report/[token]/page.tsx` | Wrap in `dark` class div |

---

## Task 1: CSS Variables & Tailwind Config

**Files:**
- Modify: `frontend/src/styles/globals.css`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Add CSS variables to globals.css**

Add the full `:root` (light) and `.dark` block after the existing `:root` block. Keep existing sidebar vars. Add scrollbar theming and transition class.

```css
/* ── Theme color tokens ─────────────────────────────────────── */
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

  /* Category light backgrounds */
  --cat-marketing-light: #eff6ff;
  --cat-growth-light: #ecfdf5;
  --cat-operations-light: #fffbeb;
  --cat-technology-light: #f5f3ff;
  --cat-hr-light: #fdf2f8;
  --cat-finance-light: #ecfeff;
  --cat-executive-light: #eef2ff;

  /* Category text */
  --cat-marketing-text: #1e40af;
  --cat-growth-text: #065f46;
  --cat-operations-text: #92400e;
  --cat-technology-text: #5b21b6;
  --cat-hr-text: #9d174d;
  --cat-finance-text: #155e75;
  --cat-executive-text: #3730a3;

  /* Status light backgrounds */
  --status-success-light: #ecfdf5;
  --status-warning-light: #fffbeb;
  --status-danger-light: #fef2f2;
  --status-info-light: #eff6ff;

  /* Status text */
  --status-success-text: #065f46;
  --status-warning-text: #92400e;
  --status-danger-text: #991b1b;
  --status-info-text: #1e40af;

  /* Severity light backgrounds (per spec Section 2.8) */
  --sev-critical-light: #fef2f2;
  --sev-high-light: #fff7ed;
  --sev-medium-light: #fffbeb;
  --sev-low-light: #eff6ff;

  /* Severity text (per spec Section 2.8) */
  --sev-critical-text: #991b1b;
  --sev-high-text: #9a3412;
  --sev-medium-text: #92400e;
  --sev-low-text: #1e40af;

  /* Scrollbar */
  --scrollbar-thumb: #cbd5e1;
  --scrollbar-track: transparent;
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

  /* Category light backgrounds */
  --cat-marketing-light: rgba(59,130,246,0.08);
  --cat-growth-light: rgba(16,185,129,0.08);
  --cat-operations-light: rgba(245,158,11,0.08);
  --cat-technology-light: rgba(139,92,246,0.08);
  --cat-hr-light: rgba(236,72,153,0.08);
  --cat-finance-light: rgba(6,182,212,0.08);
  --cat-executive-light: rgba(99,102,241,0.08);

  /* Category text */
  --cat-marketing-text: #60a5fa;
  --cat-growth-text: #34d399;
  --cat-operations-text: #fbbf24;
  --cat-technology-text: #a78bfa;
  --cat-hr-text: #f472b6;
  --cat-finance-text: #22d3ee;
  --cat-executive-text: #818cf8;

  /* Status light backgrounds */
  --status-success-light: rgba(16,185,129,0.1);
  --status-warning-light: rgba(245,158,11,0.1);
  --status-danger-light: rgba(239,68,68,0.1);
  --status-info-light: rgba(59,130,246,0.1);

  /* Status text */
  --status-success-text: #34d399;
  --status-warning-text: #fbbf24;
  --status-danger-text: #fca5a5;
  --status-info-text: #60a5fa;

  /* Severity light backgrounds (per spec Section 2.8) */
  --sev-critical-light: rgba(239,68,68,0.1);
  --sev-high-light: rgba(249,115,22,0.1);
  --sev-medium-light: rgba(245,158,11,0.1);
  --sev-low-light: rgba(59,130,246,0.1);

  /* Severity text (per spec Section 2.8) */
  --sev-critical-text: #fca5a5;
  --sev-high-text: #fdba74;
  --sev-medium-text: #fbbf24;
  --sev-low-text: #60a5fa;

  /* Scrollbar */
  --scrollbar-thumb: #334155;
  --scrollbar-track: transparent;
}

/* Theme transition (only during toggle, not page load) */
@media (prefers-reduced-motion: no-preference) {
  .theme-transitioning,
  .theme-transitioning * {
    transition: background-color 200ms, color 200ms, border-color 200ms !important;
  }
}
```

Update existing scrollbar rules to use CSS vars:
```css
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb); opacity: 0.8; }
```

Remove the duplicate `--surface` from the existing `:root` block (line ~22 of current file) since it's now in the theme block.

- [ ] **Step 2: Update Tailwind config**

In `frontend/tailwind.config.js`:

1. Add `darkMode: 'class'` at the top level (sibling to `content` and `theme`)
2. Replace `surface` colors with CSS var refs:
```js
surface: {
  base: "var(--surface-base)",
  DEFAULT: "var(--surface)",
  secondary: "var(--surface-secondary)",
  tertiary: "var(--surface-tertiary)",
  inset: "var(--surface-inset)",
},
```
3. Replace `border` colors (this stays under `theme.extend.colors.border`, matching the existing config location — not under `borderColor`):
```js
border: {
  DEFAULT: "var(--border)",
  light: "var(--border-light)",
  strong: "var(--border-strong)",
  focus: "var(--border-focus)",
},
```
4. Replace `fg` colors:
```js
fg: {
  DEFAULT: "var(--fg)",
  secondary: "var(--fg-secondary)",
  muted: "var(--fg-muted)",
  hint: "var(--fg-hint)",
  inverse: "var(--fg-inverse)",
},
```
5. Replace category `-light` and `-text` with CSS vars:
```js
category: {
  marketing: { DEFAULT: "#3b82f6", light: "var(--cat-marketing-light)", text: "var(--cat-marketing-text)" },
  growth: { DEFAULT: "#10b981", light: "var(--cat-growth-light)", text: "var(--cat-growth-text)" },
  operations: { DEFAULT: "#f59e0b", light: "var(--cat-operations-light)", text: "var(--cat-operations-text)" },
  technology: { DEFAULT: "#8b5cf6", light: "var(--cat-technology-light)", text: "var(--cat-technology-text)" },
  hr: { DEFAULT: "#ec4899", light: "var(--cat-hr-light)", text: "var(--cat-hr-text)" },
  finance: { DEFAULT: "#06b6d4", light: "var(--cat-finance-light)", text: "var(--cat-finance-text)" },
  executive: { DEFAULT: "#6366f1", light: "var(--cat-executive-light)", text: "var(--cat-executive-text)" },
},
```
6. Replace status `-light` and `-text`:
```js
status: {
  success: "#10b981",
  "success-light": "var(--status-success-light)",
  "success-text": "var(--status-success-text)",
  warning: "#f59e0b",
  "warning-light": "var(--status-warning-light)",
  "warning-text": "var(--status-warning-text)",
  danger: "#ef4444",
  "danger-light": "var(--status-danger-light)",
  "danger-text": "var(--status-danger-text)",
  info: "#3b82f6",
  "info-light": "var(--status-info-light)",
  "info-text": "var(--status-info-text)",
},
```
7. Replace severity `-light` and `-text`:
```js
severity: {
  critical: { DEFAULT: "#ef4444", light: "var(--sev-critical-light)", text: "var(--sev-critical-text)" },
  high: { DEFAULT: "#f59e0b", light: "var(--sev-high-light)", text: "var(--sev-high-text)" },
  medium: { DEFAULT: "#eab308", light: "var(--sev-medium-light)", text: "var(--sev-medium-text)" },
  low: { DEFAULT: "#94a3b8", light: "var(--sev-low-light)", text: "var(--sev-low-text)" },
},
```

Keep `aeos`, `sidebar` palettes unchanged (static hex values).

- [ ] **Step 3: Verify the app still compiles**

Run: `cd frontend && npx next build 2>&1 | head -20` (or `npm run dev` and check for errors)
Expected: Build succeeds or dev server starts without CSS errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles/globals.css frontend/tailwind.config.js
git commit -m "feat: add dark theme CSS variables and Tailwind config"
```

---

## Task 2: ThemeProvider & Anti-FOUC

**Files:**
- Create: `frontend/src/lib/ThemeProvider.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create ThemeProvider**

```tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("aeos-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else if (!window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("light");
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("aeos-theme", t);
    const root = document.documentElement;
    // Only animate if user hasn't requested reduced motion
    const prefersMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersMotion) root.classList.add("theme-transitioning");
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (prefersMotion) setTimeout(() => root.classList.remove("theme-transitioning"), 300);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: Update root layout.tsx**

In `frontend/src/app/layout.tsx`:

1. Import `ThemeProvider`:
```tsx
import { ThemeProvider } from "@/lib/ThemeProvider";
```

2. Add anti-FOUC `<script>` inside `<head>` (use Next.js `<Script>` or raw dangerouslySetInnerHTML):
```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `try{var t=localStorage.getItem("aeos-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}`,
    }}
  />
</head>
```

3. Update viewport themeColor — remove static `themeColor: "#4f46e5"` and instead add two `<meta>` tags in `<head>`:
```tsx
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />
```

4. Wrap children with ThemeProvider:
```tsx
<body>
  <ThemeProvider>
    <AuthProvider>{children}</AuthProvider>
  </ThemeProvider>
</body>
```

- [ ] **Step 3: Verify anti-FOUC works**

Run the dev server, open browser, toggle theme to dark, refresh page.
Expected: No flash of light theme on reload when dark is set.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/ThemeProvider.tsx frontend/src/app/layout.tsx
git commit -m "feat: add ThemeProvider with anti-FOUC and theme-color meta"
```

---

## Task 3: ThemeToggle Component

**Files:**
- Create: `frontend/src/components/ui/ThemeToggle.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create ThemeToggle**

```tsx
"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="flex w-full items-center rounded-lg bg-white/[0.06] p-0.5"
    >
      <span
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
          theme === "light"
            ? "bg-aeos-500/15 text-aeos-400"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        <Sun size={12} />
        <span>Light</span>
      </span>
      <span
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
          theme === "dark"
            ? "bg-aeos-500/15 text-aeos-400"
            : "text-slate-500 hover:text-slate-400"
        }`}
      >
        <Moon size={12} />
        <span>Dark</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Add ThemeToggle to Sidebar**

In `frontend/src/components/layout/Sidebar.tsx`, in the bottom section (before the user info block), add:

```tsx
import { ThemeToggle } from "@/components/ui/ThemeToggle";
```

Insert the ThemeToggle inside the bottom `<div>` before the user info:
```tsx
{!collapsed && <ThemeToggle />}
```

- [ ] **Step 3: Verify toggle works**

Open the app in the browser, click the theme toggle.
Expected: Theme switches between light and dark, sidebar stays dark in both modes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/ThemeToggle.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: add theme toggle to sidebar"
```

---

## Task 4: TopBar & DashboardShell Dark Mode

**Files:**
- Modify: `frontend/src/components/layout/TopBar.tsx`
- Modify: `frontend/src/components/layout/DashboardShell.tsx`

- [ ] **Step 1: Update TopBar**

Replace hardcoded light colors with semantic tokens. Key replacements:

| Current | Replace with |
|---|---|
| `bg-white/80` | `bg-surface/80` |
| `border-slate-200/80` | `border-border` |
| `text-slate-900` | `text-fg` |
| `text-slate-400` | `text-fg-hint` |
| `text-slate-800` | `text-fg` |
| `bg-slate-50/70` | `bg-surface-secondary` |
| `border-slate-200` | `border-border` |
| `bg-white` | `bg-surface` |
| `bg-slate-100` | `bg-surface-inset` |
| `hover:border-slate-300` | `hover:border-border-strong` |
| `hover:text-slate-600` | `hover:text-fg-secondary` |

The `backdrop-blur-xl` stays (works in both modes).

- [ ] **Step 2: Update DashboardShell MobileNav**

Replace hardcoded light colors in `MobileNav`:

| Current | Replace with |
|---|---|
| `border-slate-200` | `border-border` |
| `bg-white/95` | `bg-surface/95` |
| `text-slate-400` | `text-fg-hint` |

- [ ] **Step 3: Add bg-surface-base to app layout**

In `frontend/src/app/app/layout.tsx`, the `DashboardShell` wrapper or the main `<div>` should have `bg-surface-base` so the page background switches with theme.

- [ ] **Step 4: Verify TopBar looks correct in both modes**

Toggle theme. Check that TopBar and MobileNav look correct in light and dark.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/TopBar.tsx frontend/src/components/layout/DashboardShell.tsx frontend/src/app/app/layout.tsx
git commit -m "feat: theme-aware TopBar, MobileNav, and app shell"
```

---

## Task 5: Badge & tokens.ts Updates

**Files:**
- Modify: `frontend/src/components/ui/Badge.tsx`
- Modify: `frontend/src/components/ui/tokens.ts`

- [ ] **Step 1: Update Badge variant styles**

Replace hardcoded colors with semantic tokens:

```tsx
const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-secondary text-fg-secondary",
  // primary uses dark: prefix because aeos-* colors are static hex (not CSS vars)
  primary: "bg-aeos-50 text-aeos-700 dark:bg-aeos-500/10 dark:text-aeos-400",
  success: "bg-status-success-light text-status-success-text",
  warning: "bg-status-warning-light text-status-warning-text",
  danger: "bg-status-danger-light text-status-danger-text",
  info: "bg-status-info-light text-status-info-text",
  outline: "border border-border text-fg-secondary bg-surface",
};
```

The `status-*-light` and `status-*-text` classes now reference CSS vars that auto-switch. The `primary` variant uses explicit `dark:` overrides because `aeos-*` brand colors are static hex values per spec §2.5.

- [ ] **Step 2: Update tokens.ts border classes**

In `CATEGORY_STYLES`, replace hardcoded `border-*-200` with dark-aware variants:

```ts
marketing: {
  dot: "bg-category-marketing",
  bg: "bg-category-marketing-light",
  text: "text-category-marketing-text",
  border: "border-blue-200 dark:border-blue-500/20",
},
```

Apply same pattern to all 7 categories and all 4 severity levels.

In `IMPACT_STYLES`:
```ts
export const IMPACT_STYLES: Record<string, string> = {
  high: "bg-severity-critical-light text-severity-critical-text border-red-200 dark:border-red-500/20",
  medium: "bg-severity-high-light text-severity-high-text border-amber-200 dark:border-amber-500/20",
  low: "bg-surface-secondary text-fg-secondary border-border",
};
```

- [ ] **Step 3: Add scoreHex() dark-mode note**

`scoreHex()` returns hardcoded hex strings used in SVG/chart contexts (e.g., score rings). The status accent colors (#10b981, #f59e0b, #ef4444) are the same in both modes per spec Section 2.5, so `scoreHex()` does NOT need changes. Add a comment in `tokens.ts`:

```ts
/** Score hex values — these accent colors are the same in light and dark mode (spec §2.5). */
```

`TREND_STYLES` also needs no changes — it already uses `bg-status-success-light` etc. which are now CSS-var-backed and auto-switch.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/Badge.tsx frontend/src/components/ui/tokens.ts
git commit -m "feat: theme-aware Badge and design tokens"
```

---

## Task 6: Landing Page Dark Redesign

**Files:**
- Modify: `frontend/src/app/page.tsx`

This is the largest single-file change. The landing page becomes always-dark.

- [ ] **Step 1: Wrap page in dark class**

Add `<div className="dark">` as the outermost wrapper of the landing page return, and `</div>` at the end.

- [ ] **Step 2: Redesign navigation**

Replace the current nav background/text colors:
- Nav container: `bg-surface/80 backdrop-blur-xl border-b border-border`
- Logo text: `text-fg`
- Nav links: `text-fg-secondary hover:text-fg`
- CTA button: keep `bg-gradient-to-r from-aeos-500 to-aeos-600`
- Login link: `text-fg-secondary`

- [ ] **Step 3: Redesign hero section**

- Background: `bg-surface-base` (which is #020617 in dark)
- Add glow orbs: absolute-positioned divs with `radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)`
- Badge: `bg-aeos-500/10 text-aeos-400 border border-aeos-500/20`
- Headline: gradient text using `bg-gradient-to-r from-fg via-fg-secondary to-aeos-400 bg-clip-text text-transparent`
- Subtext: `text-fg-muted`
- Primary CTA: add `shadow-[0_0_24px_rgba(59,130,246,0.3)]`
- Secondary CTA: `bg-surface-secondary/50 border border-border text-fg-secondary`
- Trust bar: `text-fg-hint`

- [ ] **Step 4: Redesign stats bar**

- Background: `bg-surface-secondary/50 border-y border-border`
- Each stat number: gradient text (blue, green, purple, amber)
- Labels: `text-fg-muted`

- [ ] **Step 5: Redesign features section**

- Section bg: `bg-surface-base`
- Title: `text-fg`
- Each card: category-tinted background using `bg-category-{name}-light border border-{color}-500/10`
- Card title: `text-fg`
- Card description: `text-fg-muted`

- [ ] **Step 6: Redesign journey, departments, pricing, CTA, footer**

Apply same pattern throughout:
- All backgrounds: `bg-surface-base` or `bg-surface`
- All text: use `text-fg`, `text-fg-secondary`, `text-fg-muted`, `text-fg-hint`
- All borders: `border-border`
- Pricing popular card: `border-aeos-500/30 bg-aeos-500/5`
- Final CTA: gradient overlay `bg-gradient-to-r from-aeos-500/10 to-emerald-500/5`
- Footer: `border-t border-border` with muted text hierarchy

- [ ] **Step 7: Verify landing page**

Run dev server, visit `/`. Check all sections render correctly in dark.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: landing page dark Harbor redesign with glows and gradient text"
```

---

## Task 7: Auth Pages Dark Redesign

**Files:**
- Modify: `frontend/src/app/(auth)/layout.tsx`
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Update auth layout**

Wrap the layout return in `<div className="dark">`. The left panel already uses dark gradient — update to use `bg-surface-base`. Right panel: change from `bg-white` to `bg-surface` (which is `#0f172a` in dark).

- [ ] **Step 2: Update login page**

Replace form input colors:
- Input background: `bg-surface-secondary`
- Input border: `border-border`
- Input text: `text-fg`
- Labels: `text-fg-secondary`
- Placeholder text: `text-fg-hint`
- Error text: `text-status-danger`
- Links: `text-aeos-400`
- Submit button: keep gradient, add glow shadow
- "or" divider: `border-border text-fg-hint`
- Bottom text: `text-fg-muted`

- [ ] **Step 3: Update register page**

Same pattern as login — replace all hardcoded `text-slate-*`, `bg-white`, `border-gray-*` with semantic tokens.

- [ ] **Step 4: Verify auth pages**

Visit `/login` and `/register`. Verify both render in dark mode correctly.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/\(auth\)/layout.tsx frontend/src/app/\(auth\)/login/page.tsx frontend/src/app/\(auth\)/register/page.tsx
git commit -m "feat: auth pages dark redesign"
```

---

## Task 8: Onboarding Pages

**Files:**
- Modify: `frontend/src/app/app/onboarding/layout.tsx`
- Modify: `frontend/src/app/app/onboarding/company/page.tsx`
- Modify: `frontend/src/app/app/onboarding/presence/page.tsx`
- Modify: `frontend/src/app/app/onboarding/competitors/page.tsx`
- Modify: `frontend/src/app/app/onboarding/integrations/page.tsx`
- Modify: `frontend/src/app/app/onboarding/complete/page.tsx`

- [ ] **Step 1: Update onboarding layout**

The layout already uses dark bg `#0B0F1A`. Convert hardcoded hex colors to semantic tokens:
- Background: `bg-surface-base`
- Step indicator active: `bg-aeos-500 text-white`
- Step indicator pending: `bg-surface-secondary border border-border text-fg-hint`
- Step indicator completed: `bg-status-success text-white`
- Connector lines: `bg-border`
- Header text: `text-fg`, `text-fg-secondary`

- [ ] **Step 2: Update company page**

Replace hardcoded colors in form inputs, org chart, industry selector, country/city dropdowns:
- Input bg: `bg-surface-secondary`
- Input border: `border-border`
- Input text: `text-fg`
- Select dropdowns: same input pattern
- Org chart nodes: use category-colored low-opacity backgrounds (already have theme-switched CSS vars)
- Section headers: `text-fg`, `text-fg-muted`

- [ ] **Step 3: Update remaining 4 onboarding pages**

Apply same input/background pattern to presence, competitors, integrations, and complete pages.

- [ ] **Step 4: Verify onboarding flow**

Navigate through all 5 steps. Toggle theme at each step. Verify everything switches correctly.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/app/onboarding/
git commit -m "feat: onboarding pages theme-aware styling"
```

---

## Task 9: Dashboard Page & Dashboard Cards

**Files:**
- Modify: `frontend/src/app/app/dashboard/page.tsx`
- Modify: All 14 files in `frontend/src/components/dashboard/`

- [ ] **Step 1: Update dashboard page**

Replace any hardcoded colors in the dashboard page:
- Page background inherits from shell (`bg-surface-base`)
- Section headers: `text-fg`, `text-fg-muted`
- Any grid gap or spacing stays the same

- [ ] **Step 2: Update dashboard cards (batch 1: 7 cards)**

Update `StrategicIntelligenceCard.tsx`, `CompanyIntelligenceCard.tsx`, `LeadIntelligenceCard.tsx`, `OpportunityRadarCard.tsx`, `LeadSourcesCard.tsx`, `LeadScoreCard.tsx`, `TopOpportunitiesCard.tsx`.

For each card, replace:
- `bg-white` → `bg-surface`
- `text-slate-*` → `text-fg` / `text-fg-secondary` / `text-fg-muted`
- `border-slate-*` → `border-border`
- Hardcoded pastel backgrounds → semantic tokens (already theme-switched via CSS vars)

- [ ] **Step 3: Update dashboard cards (batch 2: 7 cards)**

Update `DigitalPresenceCard.tsx`, `IntegrationStatusCard.tsx`, `AskAeosCard.tsx`, `StrategicPrioritiesCard.tsx`, `BillingCard.tsx`, `AIBriefingCard.tsx`, `DashCard.tsx`.

Same replacement pattern.

- [ ] **Step 4: Update strategy cards**

Update all 3 files in `frontend/src/components/strategy/`:
`PrioritiesCard.tsx`, `RiskSummaryCard.tsx`, `RoadmapPreviewCard.tsx`.

Same replacement pattern.

- [ ] **Step 5: Verify dashboard in both modes**

Toggle theme on dashboard. Verify all cards render correctly in both modes.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/app/dashboard/page.tsx frontend/src/components/dashboard/ frontend/src/components/strategy/
git commit -m "feat: dashboard and strategy cards theme-aware styling"
```

---

## Task 10: Intelligence Sub-Pages (11 pages)

**Files:**
- Modify: `frontend/src/app/app/marketing/page.tsx`
- Modify: `frontend/src/app/app/leads/page.tsx`
- Modify: `frontend/src/app/app/opportunities/page.tsx`
- Modify: `frontend/src/app/app/digital-presence/page.tsx`
- Modify: `frontend/src/app/app/gap-analysis/page.tsx`
- Modify: `frontend/src/app/app/business-plan/page.tsx`
- Modify: `frontend/src/app/app/kpi-framework/page.tsx`
- Modify: `frontend/src/app/app/financial-model/page.tsx`
- Modify: `frontend/src/app/app/market-research/page.tsx`
- Modify: `frontend/src/app/app/financial-health/page.tsx`
- Modify: `frontend/src/app/app/competitors/page.tsx`

- [ ] **Step 1: Audit each page for hardcoded colors**

Read each file, note any `text-slate-*`, `bg-white`, `bg-gray-*`, `border-gray-*`, etc. that need replacement.

- [ ] **Step 2: Update all 11 pages**

For each page, apply the standard replacement pattern:
- `bg-white` → `bg-surface`
- `text-slate-900/800` → `text-fg`
- `text-slate-600/500` → `text-fg-secondary`
- `text-slate-400` → `text-fg-muted` or `text-fg-hint`
- `bg-slate-50/100` → `bg-surface-secondary`
- `border-slate-200` → `border-border`
- `bg-gray-*` → appropriate `bg-surface-*`
- Table alternating rows: `even:bg-surface-base odd:bg-surface`

- [ ] **Step 3: Verify a sample of pages**

Check marketing, leads, and gap-analysis in both modes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/app/marketing/ frontend/src/app/app/leads/ frontend/src/app/app/opportunities/ frontend/src/app/app/digital-presence/ frontend/src/app/app/gap-analysis/ frontend/src/app/app/business-plan/ frontend/src/app/app/kpi-framework/ frontend/src/app/app/financial-model/ frontend/src/app/app/market-research/ frontend/src/app/app/financial-health/ frontend/src/app/app/competitors/
git commit -m "feat: intelligence sub-pages theme-aware styling"
```

---

## Task 11: Platform Pages, Settings, Admin, Report

**Files:**
- Modify: `frontend/src/app/app/command/page.tsx`
- Modify: `frontend/src/app/app/agents/page.tsx`
- Modify: `frontend/src/app/app/integrations/page.tsx`
- Modify: `frontend/src/app/app/reports/page.tsx`
- Modify: `frontend/src/app/app/copilot/page.tsx`
- Modify: `frontend/src/app/app/settings/page.tsx`
- Modify: `frontend/src/app/app/admin/page.tsx`
- Modify: `frontend/src/app/report/[token]/page.tsx`

- [ ] **Step 1: Update 5 platform pages**

Same replacement pattern as intelligence pages.

- [ ] **Step 2: Update settings and admin**

Same replacement pattern for form inputs and layouts.

- [ ] **Step 3: Update report token page**

Wrap in `<div className="dark">` for always-dark, and replace any hardcoded light colors.

- [ ] **Step 4: Verify platform pages**

Check command center and copilot in both modes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/app/command/ frontend/src/app/app/agents/ frontend/src/app/app/integrations/ frontend/src/app/app/reports/ frontend/src/app/app/copilot/ frontend/src/app/app/settings/ frontend/src/app/app/admin/ frontend/src/app/report/
git commit -m "feat: platform pages, settings, admin, and report token dark theme"
```

---

## Task 12: MetricCard & SectionHeader Audit

**Files:**
- Modify: `frontend/src/components/ui/MetricCard.tsx` (if hardcoded colors found)
- Modify: `frontend/src/components/ui/SectionHeader.tsx` (if hardcoded colors found)

- [ ] **Step 1: Read and audit both files**

Check for any `text-slate-*`, `bg-white`, `bg-gray-*`, or other hardcoded colors.

- [ ] **Step 2: Update if needed**

Apply same token replacements. If already using semantic tokens, no changes needed.

- [ ] **Step 3: Commit if changes made**

```bash
git add frontend/src/components/ui/MetricCard.tsx frontend/src/components/ui/SectionHeader.tsx
git commit -m "feat: MetricCard and SectionHeader theme-aware styling"
```

---

## Task 13: Final Verification & Cleanup

- [ ] **Step 1: Full visual check**

Run dev server. Check every major page in dark mode:
1. Landing page (always dark)
2. Login / Register (always dark)
3. Onboarding step 1 (toggle both modes)
4. Dashboard (toggle both modes)
5. At least 3 intelligence pages (toggle both modes)
6. Settings page (toggle both modes)

- [ ] **Step 2: Check for missed hardcoded colors**

Run a search for remaining hardcoded light-mode colors that should have been replaced:

```bash
cd frontend/src
grep -rn "bg-white\|bg-slate-\|text-slate-\|border-slate-\|border-gray-\|bg-gray-" --include="*.tsx" | grep -v "node_modules" | grep -v ".next"
```

Fix any remaining instances.

- [ ] **Step 3: Check for broken contrast**

Verify key text/background combinations meet WCAG AA:
- Primary text on surface: #f1f5f9 on #0f172a ✓
- Secondary text on surface: #94a3b8 on #0f172a ✓
- Muted text: #71819b on #0f172a ✓

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: dark theme cleanup and missed color replacements"
```

---

## Execution Order Summary

| Task | Description | Dependencies |
|---|---|---|
| 1 | CSS Variables & Tailwind Config | None |
| 2 | ThemeProvider & Anti-FOUC | Task 1 |
| 3 | ThemeToggle Component | Task 2 |
| 4 | TopBar & DashboardShell | Tasks 1, 2 (shares `app/layout.tsx`) |
| 5 | Badge & tokens.ts | Task 1 |
| 6 | Landing Page | Task 1 |
| 7 | Auth Pages | Task 1 |
| 8 | Onboarding Pages | Task 1 |
| 9 | Dashboard & Cards | Tasks 1, 4, 5 |
| 10 | Intelligence Sub-Pages | Tasks 1, 4 |
| 11 | Platform Pages & Report | Tasks 1, 4 |
| 12 | MetricCard & SectionHeader Audit | Task 1 |
| 13 | Final Verification | All |

Tasks 5-8 can run in parallel after Task 1. Task 4 depends on Tasks 1 and 2 (both modify `app/layout.tsx`). Tasks 9-12 can run in parallel after their deps.
