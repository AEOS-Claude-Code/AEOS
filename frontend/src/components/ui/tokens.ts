/**
 * AEOS Design System – Token reference.
 *
 * These constants mirror the Tailwind config and are for use in
 * JS/TS contexts where Tailwind classes aren't available (e.g.
 * dynamic style objects, SVG attributes, chart configs).
 *
 * For all other cases, use the Tailwind classes directly:
 *   bg-surface, text-fg-secondary, border-border, etc.
 */

/* ── Category colors ─────────────────────────────────────────── */

export const CATEGORY_STYLES: Record<
  string,
  { dot: string; bg: string; text: string; border: string }
> = {
  marketing: {
    dot: "bg-category-marketing",
    bg: "bg-category-marketing-light",
    text: "text-category-marketing-text",
    border: "border-blue-200",
  },
  growth: {
    dot: "bg-category-growth",
    bg: "bg-category-growth-light",
    text: "text-category-growth-text",
    border: "border-emerald-200",
  },
  operations: {
    dot: "bg-category-operations",
    bg: "bg-category-operations-light",
    text: "text-category-operations-text",
    border: "border-amber-200",
  },
  technology: {
    dot: "bg-category-technology",
    bg: "bg-category-technology-light",
    text: "text-category-technology-text",
    border: "border-violet-200",
  },
  hr: {
    dot: "bg-category-hr",
    bg: "bg-category-hr-light",
    text: "text-category-hr-text",
    border: "border-pink-200",
  },
  finance: {
    dot: "bg-category-finance",
    bg: "bg-category-finance-light",
    text: "text-category-finance-text",
    border: "border-cyan-200",
  },
  executive: {
    dot: "bg-category-executive",
    bg: "bg-category-executive-light",
    text: "text-category-executive-text",
    border: "border-indigo-200",
  },
};

/* ── Severity colors ─────────────────────────────────────────── */

export const SEVERITY_STYLES: Record<
  string,
  { dot: string; bg: string; text: string; border: string; label: string }
> = {
  critical: {
    dot: "bg-severity-critical",
    bg: "bg-severity-critical-light",
    text: "text-severity-critical-text",
    border: "border-red-200",
    label: "Critical",
  },
  high: {
    dot: "bg-severity-high",
    bg: "bg-severity-high-light",
    text: "text-severity-high-text",
    border: "border-amber-200",
    label: "High",
  },
  medium: {
    dot: "bg-severity-medium",
    bg: "bg-severity-medium-light",
    text: "text-severity-medium-text",
    border: "border-yellow-200",
    label: "Medium",
  },
  low: {
    dot: "bg-severity-low",
    bg: "bg-severity-low-light",
    text: "text-severity-low-text",
    border: "border-slate-200",
    label: "Low",
  },
};

/* ── Department → category mapping ───────────────────────────── */

export const DEPARTMENT_CATEGORY: Record<string, string> = {
  Marketing: "marketing",
  "Marketing / Strategy": "growth",
  "IT / Engineering": "technology",
  Operations: "operations",
  HR: "hr",
  Finance: "finance",
  General: "operations",
};

/* ── Score thresholds ────────────────────────────────────────── */

export function scoreColor(value: number): string {
  if (value >= 70) return "text-status-success";
  if (value >= 45) return "text-status-warning";
  return "text-status-danger";
}

export function scoreBarColor(value: number): string {
  if (value >= 65) return "bg-status-success";
  if (value >= 40) return "bg-status-warning";
  return "bg-status-danger";
}

export function scoreHex(value: number): string {
  if (value >= 70) return "#10b981";
  if (value >= 45) return "#f59e0b";
  return "#ef4444";
}

/* ── Impact → badge style ────────────────────────────────────── */

export const IMPACT_STYLES: Record<string, string> = {
  high: "bg-severity-critical-light text-severity-critical-text border-red-200",
  medium: "bg-severity-high-light text-severity-high-text border-amber-200",
  low: "bg-surface-secondary text-fg-secondary border-border",
};

/* ── Trend → color ───────────────────────────────────────────── */

export const TREND_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  rising: { bg: "bg-status-success-light", text: "text-status-success-text", label: "Rising" },
  stable: { bg: "bg-status-warning-light", text: "text-status-warning-text", label: "Stable" },
  declining: { bg: "bg-status-danger-light", text: "text-status-danger-text", label: "Declining" },
};
