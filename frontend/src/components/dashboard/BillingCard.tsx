"use client";

import { useEffect, useState } from "react";
import { CreditCard, Zap, Clock, TrendingUp } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";
import api from "@/lib/api";

interface PlanData {
  plan: {
    name: string;
    tier: string;
    price_monthly: number;
    included_tokens: number;
  };
  status: string;
  is_trial: boolean;
  trial_days_remaining: number;
}

interface BalanceData {
  included: number;
  purchased: number;
  used: number;
  available: number;
  total: number;
  usage_pct: number;
}

export default function BillingCard() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [planRes, balRes] = await Promise.all([
          api.get("/api/v1/billing/plan"),
          api.get("/api/v1/billing/token-balance"),
        ]);
        setPlan(planRes.data);
        setBalance(balRes.data);
      } catch (e: any) {
        setError(e?.message || "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const state: CardState = loading
    ? "loading"
    : error
      ? "error"
      : plan
        ? "success"
        : "empty";

  const barColor =
    (balance?.usage_pct ?? 0) >= 90
      ? "bg-status-danger"
      : (balance?.usage_pct ?? 0) >= 70
        ? "bg-status-warning"
        : "bg-aeos-500";

  return (
    <DashCard
      title="Plan & Usage"
      subtitle="Billing overview"
      badge={
        plan?.is_trial ? (
          <span className="flex items-center gap-1 rounded-full bg-status-warning-light px-2 py-0.5 text-2xs font-semibold text-status-warning-text">
            <Clock size={10} />
            Trial: {plan.trial_days_remaining}d left
          </span>
        ) : plan ? (
          <span className="rounded-full bg-aeos-50 px-2 py-0.5 text-2xs font-semibold text-aeos-700">
            {plan.plan.name}
          </span>
        ) : undefined
      }
      delay={300}
    >
      {state === "loading" && <CardLoading lines={4} />}
      {state === "error" && <CardError message="Billing data unavailable" detail={error ?? undefined} />}
      {state === "empty" && (
        <CardEmpty
          icon={<CreditCard size={20} className="text-fg-hint" />}
          title="No billing data"
          description="Billing will appear once your workspace is set up."
        />
      )}

      {state === "success" && plan && balance && (
        <div className="space-y-4">
          {/* Plan info row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-fg">{plan.plan.name}</span>
              <span className="ml-2 text-2xs text-fg-muted">
                {plan.plan.price_monthly === 0 ? "Free" : `$${plan.plan.price_monthly}/mo`}
              </span>
            </div>
            <span className={`rounded-pill px-2 py-0.5 text-2xs font-semibold ${
              plan.status === "active" ? "bg-status-success-light text-status-success-text"
                : plan.status === "trialing" ? "bg-status-warning-light text-status-warning-text"
                  : "bg-surface-secondary text-fg-muted"
            }`}>
              {plan.status === "trialing" ? "Trial" : plan.status}
            </span>
          </div>

          {/* Token gauge */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-2xs font-medium text-fg-muted">
                <Zap size={11} /> Token usage
              </span>
              <span className="text-2xs font-bold tabular-nums text-fg">
                {balance.used.toLocaleString()} / {balance.total.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-pill bg-surface-inset">
              <div
                className={`h-full rounded-pill transition-all ${barColor}`}
                style={{ width: `${Math.min(100, balance.usage_pct)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-2xs text-fg-hint">
              <span>{balance.available.toLocaleString()} remaining</span>
              <span>{balance.usage_pct.toFixed(0)}% used</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-widget bg-surface-secondary px-3 py-2 text-center">
              <span className="text-xs font-bold tabular-nums text-fg">{balance.included.toLocaleString()}</span>
              <span className="block text-2xs text-fg-hint">Included</span>
            </div>
            <div className="rounded-widget bg-surface-secondary px-3 py-2 text-center">
              <span className="text-xs font-bold tabular-nums text-fg">{balance.purchased.toLocaleString()}</span>
              <span className="block text-2xs text-fg-hint">Purchased</span>
            </div>
            <div className="rounded-widget bg-surface-secondary px-3 py-2 text-center">
              <span className="text-xs font-bold tabular-nums text-fg">{balance.used.toLocaleString()}</span>
              <span className="block text-2xs text-fg-hint">Used</span>
            </div>
          </div>
        </div>
      )}
    </DashCard>
  );
}
