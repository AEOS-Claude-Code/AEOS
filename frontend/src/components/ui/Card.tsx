"use client";

import { clsx } from "clsx";

/* ── Card ─────────────────────────────────────────────────────── */

export interface CardProps {
  children: React.ReactNode;
  /** Optional entrance animation delay in ms */
  delay?: number;
  /** Remove default padding (for custom layouts) */
  noPadding?: boolean;
  /** Additional classes */
  className?: string;
}

export function Card({ children, delay = 0, noPadding, className }: CardProps) {
  return (
    <div
      className={clsx(
        "animate-card-in rounded-card border border-border bg-surface shadow-card",
        !noPadding && "p-5",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Card with header ─────────────────────────────────────────── */

export interface CardWithHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function CardWithHeader({
  title,
  subtitle,
  badge,
  children,
  delay = 0,
  className,
}: CardWithHeaderProps) {
  return (
    <div
      className={clsx(
        "animate-card-in rounded-card border border-border bg-surface shadow-card",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between border-b border-border-light px-5 py-4">
        <div>
          <h3 className="text-sm-tight font-semibold text-fg">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs-tight text-fg-muted">{subtitle}</p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
