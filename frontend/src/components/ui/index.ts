/**
 * AEOS Design System
 *
 * Import everything from one place:
 *   import { Card, Badge, SectionHeader, Metric } from "@/components/ui";
 *
 * Token reference:
 *   import { CATEGORY_STYLES, scoreColor } from "@/components/ui/tokens";
 */

/* ── Cards ────────────────────────────────────────────────────── */
export { Card, CardWithHeader } from "./Card";
export type { CardProps, CardWithHeaderProps } from "./Card";

/* ── Badges ───────────────────────────────────────────────────── */
export { Badge } from "./Badge";

/* ── Section header ───────────────────────────────────────────── */
export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

/* ── Metrics ──────────────────────────────────────────────────── */
export {
  Metric,
  MetricCard,
  ScoreMetric,
  ProgressMetric,
} from "./MetricCard";
export type { MetricProps, MetricCardProps } from "./MetricCard";

/* ── Tokens ───────────────────────────────────────────────────── */
export {
  CATEGORY_STYLES,
  SEVERITY_STYLES,
  DEPARTMENT_CATEGORY,
  TREND_STYLES,
  IMPACT_STYLES,
  scoreColor,
  scoreBarColor,
  scoreHex,
} from "./tokens";

/* ── Card states ──────────────────────────────────────────────── */
export {
  CardLoading,
  CardLoadingFull,
  CardEmpty,
  CardError,
  CardOffline,
  CardSuccess,
  resolveCardState,
} from "./CardStates";
export type { CardState, CardStateInfo } from "./CardStates";
