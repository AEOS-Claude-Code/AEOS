"use client";

import { clsx } from "clsx";
import {
  CATEGORY_STYLES,
  SEVERITY_STYLES,
  TREND_STYLES,
} from "./tokens";

/* ── Base badge ──────────────────────────────────────────────── */

export interface BadgeProps {
  children: React.ReactNode;
  /** Visual variant */
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";
  /** Smaller text */
  size?: "sm" | "md";
  /** Lucide icon to prepend */
  icon?: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-surface-secondary text-fg-secondary",
  primary: "bg-aeos-50 text-aeos-700",
  success: "bg-status-success-light text-status-success-text",
  warning: "bg-status-warning-light text-status-warning-text",
  danger: "bg-status-danger-light text-status-danger-text",
  info: "bg-status-info-light text-status-info-text",
  outline: "bg-transparent border border-border text-fg-secondary",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-pill font-semibold",
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs-tight",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ── Category badge (marketing, growth, operations, etc.) ────── */

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: string;
  size?: "sm" | "md";
}) {
  const style = CATEGORY_STYLES[category];
  if (!style) {
    return (
      <Badge variant="default" size={size}>
        {category}
      </Badge>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill font-semibold",
        size === "sm" ? "px-1.5 py-px text-2xs" : "px-2 py-0.5 text-xs-tight",
        style.bg,
        style.text,
      )}
    >
      {category}
    </span>
  );
}

/* ── Severity badge (critical, high, medium, low) ────────────── */

export function SeverityBadge({
  severity,
  size = "sm",
}: {
  severity: string;
  size?: "sm" | "md";
}) {
  const style = SEVERITY_STYLES[severity];
  if (!style) {
    return (
      <Badge variant="default" size={size}>
        {severity}
      </Badge>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill font-bold uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs-tight",
        style.bg,
        style.text,
      )}
    >
      {style.label}
    </span>
  );
}

/* ── Trend badge (rising, stable, declining) ─────────────────── */

export function TrendBadge({
  trend,
  icon,
}: {
  trend: string;
  icon?: React.ReactNode;
}) {
  const style = TREND_STYLES[trend] ?? TREND_STYLES.stable;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-2xs font-semibold",
        style.bg,
        style.text,
      )}
    >
      {icon}
      {style.label}
    </span>
  );
}

/* ── Count badge (numeric indicator) ─────────────────────────── */

export function CountBadge({
  count,
  variant = "default",
}: {
  count: number;
  variant?: "default" | "primary" | "danger";
}) {
  return (
    <Badge variant={variant} size="sm">
      {count}
    </Badge>
  );
}
