"use client";

import { useEffect, useState } from "react";
import { CreditCard, Zap, Clock, TrendingUp, ShoppingCart, Loader2, CheckCircle2 } from "lucide-react";
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

const TOKEN_PACKS = [
  { amount: 5000, price: 9.99, label: "5K", popular: false },
  { amount: 25000, price: 39.99, label: "25K", popular: true },
  { amount: 100000, price: 129.99, label: "100K", popular: false },
  { amount: 500000, price: 499.99, label: "500K", popular: false },
];

function TokenPurchase({ onPurchased }: { onPurchased: (amount: number) => void }) {
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPacks, setShowPacks] = useState(false);

  async function handleBuy(amount: number, price: number) {
    setBuying(true);
    setSuccess(null);
    try {
      await api.post("/api/v1/billing/purchase-tokens", { amount });
      setSuccess(`${amount.toLocaleString()} tokens added!`);
      onPurchased(amount);
      setTimeout(() => { setSuccess(null); setShowPacks(false); }, 3000);
    } catch {} finally { setBuying(false); }
  }

  return (
    <div className="border-t border-border pt-3">
      {!showPacks ? (
        <button onClick={() => setShowPacks(true)}
          className="flex w-full items-center justify-center gap-2 rounded-widget bg-aeos-50 py-2.5 text-xs font-bold text-aeos-700 transition hover:bg-aeos-100">
          <ShoppingCart size={14} /> Buy Extra Tokens
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-fg-secondary">Select a token pack:</p>
          <div className="grid grid-cols-2 gap-2">
            {TOKEN_PACKS.map(pack => (
              <button key={pack.amount} onClick={() => handleBuy(pack.amount, pack.price)} disabled={buying}
                className={`relative rounded-widget border px-3 py-2.5 text-left transition hover:border-aeos-400 ${
                  pack.popular ? "border-aeos-300 bg-aeos-50/50" : "border-border bg-surface-secondary"
                } disabled:opacity-50`}>
                {pack.popular && (
                  <span className="absolute -top-2 right-2 rounded-full bg-aeos-500 px-2 py-0.5 text-2xs font-bold text-white">Popular</span>
                )}
                <p className="text-sm font-bold text-fg">{pack.label} tokens</p>
                <p className="text-2xs text-fg-muted">${pack.price}</p>
              </button>
            ))}
          </div>
          {success && (
            <div className="flex items-center gap-2 rounded-widget bg-status-success-light px-3 py-2 text-xs text-status-success-text">
              <CheckCircle2 size={12} /> {success}
            </div>
          )}
          {buying && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-fg-muted">
              <Loader2 size={12} className="animate-spin" /> Processing...
            </div>
          )}
          <button onClick={() => setShowPacks(false)} className="w-full text-center text-2xs text-fg-hint hover:text-fg-muted transition">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
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

          {/* Buy Extra Tokens */}
          <TokenPurchase onPurchased={(amt) => setBalance(b => b ? { ...b, purchased: b.purchased + amt, available: b.available + amt, total: b.total + amt } : b)} />
        </div>
      )}
    </DashCard>
  );
}
