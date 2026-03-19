"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import {
  Loader2,
  Inbox,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  WifiOff,
} from "lucide-react";

/* ── State type used across all cards ────────────────────────── */

export type CardState = "loading" | "empty" | "error" | "success";

export interface CardStateInfo {
  state: CardState;
  error?: string;
}

/* ── Loading skeleton ────────────────────────────────────────── */

export function CardLoading({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-3 py-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {i === 0 && (
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-widget bg-surface-inset" />
          )}
          <div className="flex-1 space-y-2">
            <div
              className="h-3 animate-pulse rounded-pill bg-surface-inset"
              style={{ width: `${75 - i * 15}%`, animationDelay: `${i * 80}ms` }}
            />
            <div
              className="h-2 animate-pulse rounded-pill bg-surface-inset"
              style={{ width: `${55 - i * 10}%`, animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Full-card loading overlay ───────────────────────────────── */

export function CardLoadingFull({
  message = "Loading\u2026",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Loader2 size={22} className="animate-spin text-aeos-500" />
      <span className="text-xs-tight text-fg-muted">{message}</span>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */

export function CardEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary">
        {icon ?? <Inbox size={20} className="text-fg-hint" />}
      </div>
      <div>
        <p className="text-sm-tight font-medium text-fg-secondary">{title}</p>
        {description && (
          <p className="mt-1 max-w-[240px] text-xs-tight leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

/* ── Error state ─────────────────────────────────────────────── */

export function CardError({
  message = "Failed to load data",
  detail,
  onRetry,
}: {
  message?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-status-danger-light">
        <AlertCircle size={20} className="text-status-danger" />
      </div>
      <div>
        <p className="text-sm-tight font-medium text-status-danger-text">
          {message}
        </p>
        {detail && (
          <p className="mt-1 max-w-[260px] text-xs-tight leading-relaxed text-fg-muted">
            {detail}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-widget border border-border px-3 py-1.5 text-xs-tight font-medium text-fg-secondary transition hover:bg-surface-secondary"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </motion.div>
  );
}

/* ── Offline state (subset of error) ─────────────────────────── */

export function CardOffline({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-status-warning-light">
        <WifiOff size={20} className="text-status-warning" />
      </div>
      <div>
        <p className="text-sm-tight font-medium text-status-warning-text">
          Backend unavailable
        </p>
        <p className="mt-1 max-w-[240px] text-xs-tight leading-relaxed text-fg-muted">
          Showing cached data. Connect the backend to see live information.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-widget border border-border px-3 py-1.5 text-xs-tight font-medium text-fg-secondary transition hover:bg-surface-secondary"
        >
          <RefreshCw size={12} />
          Reconnect
        </button>
      )}
    </motion.div>
  );
}

/* ── Success indicator (inline) ──────────────────────────────── */

export function CardSuccess({
  message = "Data loaded successfully",
}: {
  message?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 rounded-widget bg-status-success-light px-3 py-2"
    >
      <CheckCircle2 size={14} className="shrink-0 text-status-success" />
      <span className="text-xs-tight font-medium text-status-success-text">
        {message}
      </span>
    </motion.div>
  );
}

/* ── State resolver helper ───────────────────────────────────── */

export function resolveCardState({
  loading,
  error,
  hasData,
}: {
  loading: boolean;
  error: boolean;
  hasData: boolean;
}): CardState {
  if (loading) return "loading";
  if (error) return "error";
  if (!hasData) return "empty";
  return "success";
}
