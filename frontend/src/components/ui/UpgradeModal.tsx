"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, ArrowRight, X, Loader2, Sparkles } from "lucide-react";
import { usePlanGate } from "@/lib/hooks/usePlanGate";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

const plans = [
  { tier: "starter", name: "Starter", price: 0, priceLabel: "Free", tokens: "5K", highlight: false },
  { tier: "growth", name: "Growth", price: 49, priceLabel: "$49/mo", tokens: "50K", highlight: true },
  { tier: "business", name: "Business", price: 149, priceLabel: "$149/mo", tokens: "200K", highlight: false },
  { tier: "enterprise", name: "Enterprise", price: 499, priceLabel: "$499/mo", tokens: "1M", highlight: false },
];

const paidFeatures = [
  "Deploy 22+ AI agents across 9 departments",
  "Full org chart customization",
  "Agent task execution & automation",
  "Advanced strategy & copilot engines",
];

export default function UpgradeModal({ open, onClose, feature, description }: UpgradeModalProps) {
  const router = useRouter();
  const { tier: currentTier } = usePlanGate();
  const { refreshSession } = useAuth();
  const [selectedTier, setSelectedTier] = useState("growth");
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [error, setError] = useState("");

  const tierOrder = ["starter", "growth", "business", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);

  async function handleUpgrade() {
    if (selectedTier === currentTier) return;
    setUpgrading(true);
    setError("");
    try {
      await api.post("/api/v1/billing/change-plan", { plan_tier: selectedTier });
      setUpgraded(true);
      // Refresh session to pick up new plan
      await refreshSession();
      // Auto-close after brief success message
      setTimeout(() => {
        setUpgraded(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Upgrade failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  }

  const selectedPlan = plans.find(p => p.tier === selectedTier);
  const isUpgrade = tierOrder.indexOf(selectedTier) > currentIndex;
  const isDowngrade = tierOrder.indexOf(selectedTier) < currentIndex;
  const isCurrent = selectedTier === currentTier;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
              <button
                onClick={onClose}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Upgrade to unlock {feature}</h3>
                  <p className="text-sm text-white/80">
                    {description || "This feature is available on Growth plan and above."}
                  </p>
                </div>
              </div>
            </div>

            {/* Success state */}
            {upgraded ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
                >
                  <Check size={32} className="text-emerald-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-fg">Upgraded to {selectedPlan?.name}!</h3>
                <p className="text-sm text-fg-muted">Enjoy your new features.</p>
              </div>
            ) : (
              <>
                {/* Content */}
                <div className="px-6 py-5">
                  {/* Features list */}
                  <div className="mb-5 space-y-2">
                    {paidFeatures.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-fg-muted">
                        <Check size={14} className="shrink-0 text-emerald-500" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Plan cards — clickable */}
                  <div className="grid grid-cols-4 gap-2">
                    {plans.map((plan) => {
                      const planIndex = tierOrder.indexOf(plan.tier);
                      const isPlanCurrent = plan.tier === currentTier;
                      const isSelected = plan.tier === selectedTier;
                      const isSelectable = planIndex > currentIndex;

                      return (
                        <button
                          key={plan.tier}
                          type="button"
                          disabled={!isSelectable}
                          onClick={() => isSelectable && setSelectedTier(plan.tier)}
                          className={`relative rounded-xl border p-3 text-center transition ${
                            isSelected && isSelectable
                              ? "border-aeos-400 bg-aeos-50 ring-2 ring-aeos-300 dark:border-aeos-500 dark:bg-aeos-900/30"
                              : isPlanCurrent
                                ? "border-border bg-surface-secondary opacity-60"
                                : isSelectable
                                  ? "border-border bg-surface-secondary hover:border-aeos-300 hover:bg-aeos-50/50 cursor-pointer"
                                  : "border-border bg-surface-secondary opacity-40"
                          }`}
                        >
                          {plan.highlight && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-aeos-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              Recommended
                            </span>
                          )}
                          <p className="text-xs font-bold text-fg">{plan.name}</p>
                          <p className={`mt-1 text-sm font-bold ${
                            isSelected && isSelectable ? "text-aeos-600 dark:text-aeos-400" : "text-fg-muted"
                          }`}>
                            {plan.priceLabel}
                          </p>
                          <p className="mt-0.5 text-2xs text-fg-hint">{plan.tokens} tokens</p>
                          {isPlanCurrent && (
                            <div className="mt-1.5 flex items-center justify-center gap-0.5 text-2xs text-fg-hint">
                              <Check size={8} /> Current
                            </div>
                          )}
                          {isSelected && isSelectable && (
                            <div className="mt-1.5 flex items-center justify-center gap-0.5 text-2xs font-semibold text-aeos-600 dark:text-aeos-400">
                              <Sparkles size={8} /> Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="mt-3 text-center text-xs text-red-500">{error}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 border-t border-border px-6 py-4">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-fg-muted transition hover:bg-surface-secondary"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={isCurrent || upgrading}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-violet-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-aeos-200/30 transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Upgrading...
                      </>
                    ) : isUpgrade ? (
                      <>
                        Upgrade to {selectedPlan?.name}
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    ) : (
                      "View Plans"
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
