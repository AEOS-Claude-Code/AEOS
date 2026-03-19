"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { staggerItem, hoverLift } from "@/lib/motion";

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
    <motion.div
      variants={staggerItem}
      whileHover={hoverLift}
      transition={{ delay: delay / 1000 }}
      className={clsx(
        "rounded-card border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover",
        !noPadding && "p-5",
        className,
      )}
    >
      {children}
    </motion.div>
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
    <motion.div
      variants={staggerItem}
      whileHover={hoverLift}
      transition={{ delay: delay / 1000 }}
      className={clsx(
        "rounded-card border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
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
    </motion.div>
  );
}
