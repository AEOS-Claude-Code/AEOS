"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import api from "@/lib/api";

const PLATFORMS = [
  { name: "Google Search Console", icon: "🔍", desc: "Monitor search performance" },
  { name: "Google Analytics", icon: "📊", desc: "Track website visitors" },
  { name: "Google Business", icon: "📍", desc: "Manage local presence" },
  { name: "Facebook", icon: "👥", desc: "Social engagement data" },
  { name: "Instagram", icon: "📸", desc: "Content performance" },
  { name: "WordPress", icon: "📝", desc: "CMS integration" },
  { name: "Shopify", icon: "🛒", desc: "E-commerce data" },
];

export default function OnboardingIntegrations() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/integrations", { acknowledged: true });
      router.push("/app/onboarding/complete");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
      <h2 className="text-lg font-bold text-fg">Connect platforms</h2>
      <p className="mt-1 mb-6 text-sm text-fg-muted">
        Connect your tools to unlock deeper insights. You can always do this later from Integrations.
      </p>

      <div className="space-y-2">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-4 rounded-widget border border-border-light bg-surface-secondary px-4 py-3 transition hover:border-border"
          >
            <span className="text-xl">{p.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-fg">{p.name}</p>
              <p className="text-xs-tight text-fg-muted">{p.desc}</p>
            </div>
            <button
              type="button"
              className="rounded-widget border border-border px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:bg-surface-tertiary"
            >
              Connect
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-widget border border-dashed border-aeos-200 bg-aeos-50/50 p-3">
        <p className="text-xs text-aeos-700">
          OAuth connections will be available in a future update. For now, you can continue and connect later.
        </p>
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="mt-4 w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
      >
        {loading ? "Saving\u2026" : "Continue"}
      </button>
    </div>
  );
}
