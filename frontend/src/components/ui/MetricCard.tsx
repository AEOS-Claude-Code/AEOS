"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { staggerItem, hoverLift } from "@/lib/motion";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { scoreColor } from "./tokens";

/* ── Single metric ───────────────────────────────────────────── */

export interface MetricProps {
  /** Metric label (small caps) */
  label: string;
  /** Display value (pre-formatted string) */
  value: string;
  /** Optional sub-label below value */
  sub?: string;
  /** Optional trend or context to the right of value */
  aside?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const VALUE_SIZE: Record<string, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

export function Metric({
  label,
  value,
  sub,
  aside,
  size = "md",
}: MetricProps) {
  // Attempt to animate if value is a pure number
  const numericValue = Number(value);
  const isNumeric = !isNaN(numericValue) && value.trim() !== "";
  const animatedValue = useAnimatedNumber(
    isNumeric ? numericValue : 0,
    800,
    isNumeric,
  );

  return (
    <div className="flex flex-col">
      <span className="text-2xs font-medium uppercase tracking-wider text-fg-hint">
        {label}
      </span>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span
          className={clsx(
            "font-bold tabular-nums text-fg",
            VALUE_SIZE[size],
          )}
        >
          {isNumeric ? animatedValue : value}
        </span>
        {aside}
      </div>
      {sub && (
        <span className="text-2xs text-fg-hint">{sub}</span>
      )}
    </div>
  );
}

/* ── Metric card (self-contained card with single metric) ────── */

export interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  /** Animate entrance */
  delay?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  icon,
  trend,
  delay = 0,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={hoverLift}
      transition={{ delay: delay / 1000 }}
      className={clsx(
        "flex items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-card",
        className,
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-widget bg-surface-secondary text-fg-muted">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <span className="text-2xs font-medium uppercase tracking-wider text-fg-hint">
          {label}
        </span>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-xl font-bold tabular-nums text-fg">
            {value}
          </span>
          {trend}
        </div>
        {sub && (
          <span className="mt-0.5 text-2xs text-fg-hint">{sub}</span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Score metric (with color threshold) ─────────────────────── */

export function ScoreMetric({
  label,
  score,
  maxScore = 100,
  sub,
  size = "md",
}: {
  label: string;
  score: number;
  maxScore?: number;
  sub?: string;
  size?: "sm" | "md" | "lg";
}) {
  const animatedScore = useAnimatedNumber(score);

  return (
    <div className="flex flex-col">
      <span className="text-2xs font-medium uppercase tracking-wider text-fg-hint">
        {label}
      </span>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={clsx(
            "font-bold tabular-nums",
            scoreColor(score),
            VALUE_SIZE[size],
          )}
        >
          {animatedScore}
        </span>
        <span className="text-2xs text-fg-hint">/ {maxScore}</span>
      </div>
      {sub && (
        <span className="text-2xs text-fg-hint">{sub}</span>
      )}
    </div>
  );
}

/* ── Progress bar metric ─────────────────────────────────────── */

export function ProgressMetric({
  label,
  value,
  max,
  unit = "",
  barColorClass,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  barColorClass?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const defaultBar =
    pct >= 60 ? "bg-status-success" : pct >= 30 ? "bg-status-warning" : "bg-status-danger";

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs-tight text-fg-secondary">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-inset">
        <motion.div
          className={clsx("h-full rounded-pill", barColorClass ?? defaultBar)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="w-10 text-right text-xs-tight font-semibold tabular-nums text-fg-secondary">
        {value.toFixed(0)}{unit}
      </span>
    </div>
  );
}
