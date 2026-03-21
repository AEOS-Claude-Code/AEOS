"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Plug, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import api from "@/lib/api";

interface PlatformDef {
  name: string;
  icon: string;
  desc: string;
  color: string;
  providerId: string;
}

const PLATFORMS: PlatformDef[] = [
  { name: "Google Search Console", icon: "🔍", desc: "Search performance", color: "from-blue-500 to-blue-600", providerId: "google_search_console" },
  { name: "Google Analytics", icon: "📊", desc: "Website analytics", color: "from-amber-500 to-orange-500", providerId: "google_analytics" },
  { name: "Google Ads", icon: "📍", desc: "Ad campaigns", color: "from-green-500 to-emerald-500", providerId: "google_ads" },
  { name: "Facebook & Instagram Ads", icon: "👥", desc: "Social engagement", color: "from-blue-600 to-indigo-600", providerId: "meta" },
  { name: "Instagram Business", icon: "📸", desc: "Content metrics", color: "from-pink-500 to-rose-500", providerId: "instagram" },
  { name: "WordPress", icon: "📝", desc: "CMS integration", color: "from-slate-500 to-slate-600", providerId: "wordpress" },
  { name: "Shopify", icon: "🛒", desc: "E-commerce data", color: "from-green-600 to-green-700", providerId: "shopify" },
];

export default function OnboardingIntegrations() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing connection status on mount
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/integrations");
      const connectedSet = new Set<string>();
      for (const integ of res.data.integrations || []) {
        if (integ.status === "connected") connectedSet.add(integ.provider_id);
      }
      setConnected(connectedSet);
    } catch {
      // ignore - fresh workspace may not have integrations
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    setErrors((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
    try {
      await api.post("/api/v1/integrations/connect", {
        provider_id: providerId,
        simulated_account_name: "",
      });
      setConnected((prev) => new Set(prev).add(providerId));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [providerId]: err?.response?.data?.detail || "Connection failed",
      }));
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect(providerId: string) {
    setConnectingId(providerId);
    try {
      await api.post("/api/v1/integrations/disconnect", { provider_id: providerId });
      setConnected((prev) => {
        const n = new Set(prev);
        n.delete(providerId);
        return n;
      });
    } catch {
      // ignore
    } finally {
      setConnectingId(null);
    }
  }

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/integrations", { acknowledged: true });
      router.push("/app/onboarding/complete");
    } catch {} finally { setLoading(false); }
  }

  const connectedCount = connected.size;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
              <Plug size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-fg">Connect your platforms</h2>
              <p className="text-sm text-fg-hint">Unlock deeper insights by connecting your tools. You can always do this later.</p>
            </div>
            {connectedCount > 0 && (
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                {connectedCount} connected
              </span>
            )}
          </div>
        </div>

        {/* Platforms list */}
        <div className="space-y-2 px-6 py-5">
          {PLATFORMS.map((p, i) => {
            const isConnected = connected.has(p.providerId);
            const isConnecting = connectingId === p.providerId;
            const error = errors[p.providerId];

            return (
              <motion.div key={p.providerId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  isConnected
                    ? "border-blue-500/30 bg-blue-500/[0.06]"
                    : error
                      ? "border-red-500/30 bg-red-500/[0.04]"
                      : "border-border bg-surface-secondary hover:border-border hover:bg-surface"
                }`}>
                <span className="text-lg">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-fg-secondary">{p.name}</p>
                    {isConnected && <CheckCircle2 size={14} className="text-blue-400" />}
                  </div>
                  <p className="text-2xs text-fg-hint">
                    {error ? <span className="text-red-400">{error}</span> : isConnected ? "Connected" : p.desc}
                  </p>
                </div>
                {isConnected ? (
                  <button type="button" onClick={() => handleDisconnect(p.providerId)} disabled={isConnecting}
                    className="rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-fg-hint shadow-sm transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50">
                    {isConnecting ? <Loader2 size={12} className="animate-spin" /> : "Disconnect"}
                  </button>
                ) : (
                  <button type="button" onClick={() => handleConnect(p.providerId)} disabled={isConnecting}
                    className="rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-fg-muted shadow-sm transition hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-50">
                    {isConnecting ? <Loader2 size={12} className="animate-spin" /> : error ? <><RefreshCw size={10} /> Retry</> : "Connect"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={handleContinue} disabled={loading}
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50">
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
