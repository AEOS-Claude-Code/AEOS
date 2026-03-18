"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Plug, Info } from "lucide-react";
import api from "@/lib/api";

const PLATFORMS = [
  { name: "Google Search Console", icon: "🔍", desc: "Search performance", color: "from-blue-500 to-blue-600" },
  { name: "Google Analytics", icon: "📊", desc: "Website analytics", color: "from-amber-500 to-orange-500" },
  { name: "Google Business", icon: "📍", desc: "Local presence", color: "from-green-500 to-emerald-500" },
  { name: "Facebook", icon: "👥", desc: "Social engagement", color: "from-blue-600 to-indigo-600" },
  { name: "Instagram", icon: "📸", desc: "Content metrics", color: "from-pink-500 to-rose-500" },
  { name: "WordPress", icon: "📝", desc: "CMS integration", color: "from-slate-500 to-slate-600" },
  { name: "Shopify", icon: "🛒", desc: "E-commerce data", color: "from-green-600 to-green-700" },
];

export default function OnboardingIntegrations() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/integrations", { acknowledged: true });
      router.push("/app/onboarding/complete");
    } catch {} finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <Plug size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Connect your platforms</h2>
              <p className="text-sm text-fg-hint">Unlock deeper insights by connecting your tools. You can always do this later.</p>
            </div>
          </div>
        </div>

        {/* Platforms list */}
        <div className="space-y-2 px-6 py-5">
          {PLATFORMS.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3 transition-all hover:border-border hover:bg-surface">
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg-secondary">{p.name}</p>
                <p className="text-2xs text-fg-hint">{p.desc}</p>
              </div>
              <button type="button"
                className="rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-fg-muted shadow-sm transition hover:bg-surface hover:text-fg-secondary">
                Connect
              </button>
            </motion.div>
          ))}
        </div>

        {/* Info banner */}
        <div className="mx-6 mb-5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
          <div className="flex items-center gap-2 text-center justify-center">
            <Info size={12} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400/80">
              OAuth connections coming soon. You can skip this step and connect later from Settings.
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={handleContinue} disabled={loading}
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>}
            </button>
            <button onClick={() => router.push("/app/onboarding/complete")}
              className="rounded-xl px-5 py-3 text-sm font-medium text-fg-hint transition hover:bg-surface-secondary hover:text-fg-muted">
              Skip
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
