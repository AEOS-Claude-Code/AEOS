"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Plug, ExternalLink } from "lucide-react";
import api from "@/lib/api";

const PLATFORMS = [
  { name: "Google Search Console", icon: "🔍", desc: "Search performance", color: "from-blue-500 to-blue-600" },
  { name: "Google Analytics", icon: "📊", desc: "Website analytics", color: "from-amber-500 to-orange-500" },
  { name: "Google Business", icon: "📍", desc: "Local presence", color: "from-green-500 to-emerald-500" },
  { name: "Facebook", icon: "👥", desc: "Social engagement", color: "from-blue-600 to-indigo-600" },
  { name: "Instagram", icon: "📸", desc: "Content metrics", color: "from-pink-500 to-rose-500" },
  { name: "WordPress", icon: "📝", desc: "CMS integration", color: "from-slate-600 to-slate-700" },
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <Plug size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Connect your platforms</h2>
            <p className="text-sm text-slate-500">Unlock deeper insights by connecting your tools. You can always do this later.</p>
          </div>
        </div>

        <div className="space-y-2">
          {PLATFORMS.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                <p className="text-2xs text-slate-500">{p.desc}</p>
              </div>
              <button type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:shadow">
                Connect
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-gradient-to-r from-aeos-50 to-violet-50 p-3 text-center">
          <p className="text-xs text-aeos-700">
            OAuth connections coming soon. You can skip this step and connect later from Settings.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleContinue} disabled={loading}
            className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3 text-sm font-bold text-white shadow-lg shadow-aeos-500/20 transition-all hover:shadow-xl disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>}
          </button>
          <button onClick={() => router.push("/app/onboarding/complete")}
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100">
            Skip
          </button>
        </div>
      </div>
    </motion.div>
  );
}
