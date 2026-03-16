"use client";

import { clsx } from "clsx";

export interface SectionHeaderProps {
  /** Lucide icon element */
  icon?: React.ReactNode;
  /** Section title (rendered uppercase) */
  title: string;
  /** Optional item count shown as a pill */
  count?: number;
  /** Right-aligned action or badge */
  action?: React.ReactNode;
  /** Bottom margin: "sm" = 8px, "md" = 12px (default), "lg" = 16px */
  spacing?: "sm" | "md" | "lg";
  className?: string;
}

const SPACING: Record<string, string> = {
  sm: "mb-2",
  md: "mb-3",
  lg: "mb-4",
};

export function SectionHeader({
  icon,
  title,
  count,
  action,
  spacing = "md",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2",
        SPACING[spacing],
        className,
      )}
    >
      {icon && <span className="text-aeos-600">{icon}</span>}

      <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
        {title}
      </span>

      {count !== undefined && (
        <span className="rounded-pill bg-surface-secondary px-1.5 py-0.5 text-2xs font-semibold text-fg-muted">
          {count}
        </span>
      )}

      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
