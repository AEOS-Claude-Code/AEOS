"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Crown, Check, ArrowRight, X } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

const plans = [
  { tier: "starter", name: "Starter", price: "Free", tokens: "5K", highlight: false },
  { tier: "growth", name: "Growth", price: "$49/mo", tokens: "50K", highlight: true },
  { tier: "business", name: "Business", price: "$149/mo", tokens: "200K", highlight: false },
  { tier: "enterprise", name: "Enterprise", price: "$499/mo", tokens: "1M", highlight: false },
];

const paidFeatures = [
  "Deploy 22+ AI agents across 9 departments",
  "Full org chart customization",
  "Agent task execution & automation",
  "Advanced strategy & copilot engines",
];

export default function UpgradeModal({ open, onClose, feature, description }: UpgradeModalProps) {
  const router = useRouter();

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

              {/* Plan comparison */}
              <div className="grid grid-cols-4 gap-2">
                {plans.map((plan) => (
                  <div
                    key={plan.tier}
                    className={`relative rounded-xl border p-3 text-center transition ${
                      plan.highlight
                        ? "border-aeos-300 bg-aeos-50 ring-1 ring-aeos-200 dark:border-aeos-600 dark:bg-aeos-900/20"
                        : "border-border bg-surface-secondary"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-aeos-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        Recommended
                      </span>
                    )}
                    <p className="text-xs font-bold text-fg">{plan.name}</p>
                    <p className={`mt-1 text-sm font-bold ${plan.highlight ? "text-aeos-600 dark:text-aeos-400" : "text-fg-muted"}`}>
                      {plan.price}
                    </p>
                    <p className="mt-0.5 text-2xs text-fg-hint">{plan.tokens} tokens</p>
                    {plan.tier === "starter" && (
                      <div className="mt-1.5 flex items-center justify-center gap-0.5 text-2xs text-fg-hint">
                        <Lock size={8} /> Current
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                onClick={() => {
                  onClose();
                  router.push("/app/settings");
                }}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-violet-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-aeos-200/30 transition hover:shadow-xl"
              >
                View Plans
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
