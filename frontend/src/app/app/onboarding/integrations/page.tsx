"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Plug, CheckCircle2, RefreshCw, Sparkles, Star } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";

interface PlatformDef {
  name: string;
  icon: string;
  desc: string;
  providerId: string;
  /** Which industries benefit from this integration */
  industries?: string[];
  /** If the detected tech stack includes any of these, show this platform */
  techMatch?: string[];
  /** If any of these social platforms were detected, show this */
  socialMatch?: string[];
  /** Always show in the "recommended" section regardless of match */
  alwaysRecommend?: boolean;
  /** Priority for sorting — lower = higher priority */
  priority?: number;
}

/* ── Full platform catalog ────────────────────────────────────── */
const ALL_PLATFORMS: PlatformDef[] = [
  // Analytics & Search — relevant for everyone
  { name: "Google Analytics", icon: "📊", desc: "Website analytics & visitor insights", providerId: "google_analytics", alwaysRecommend: true, priority: 1 },
  { name: "Google Search Console", icon: "🔍", desc: "Search performance & indexing", providerId: "google_search_console", alwaysRecommend: true, priority: 2 },

  // Advertising — relevant for businesses with online presence
  { name: "Google Ads", icon: "📍", desc: "Ad campaigns & PPC", providerId: "google_ads", industries: ["retail", "saas", "real_estate", "travel", "restaurant", "education", "healthcare", "finance", "ecommerce"], priority: 10 },
  { name: "Facebook & Instagram Ads", icon: "👥", desc: "Social ad campaigns", providerId: "meta", socialMatch: ["facebook", "instagram"], industries: ["retail", "restaurant", "travel", "real_estate", "ecommerce"], priority: 11 },

  // Social platforms — show if detected in social links
  { name: "Instagram Business", icon: "📸", desc: "Content metrics & engagement", providerId: "instagram", socialMatch: ["instagram"], priority: 20 },
  { name: "Facebook Pages", icon: "📘", desc: "Page insights & engagement", providerId: "facebook_pages", socialMatch: ["facebook"], priority: 21 },
  { name: "LinkedIn Company", icon: "💼", desc: "Company page analytics", providerId: "linkedin", socialMatch: ["linkedin"], priority: 22 },
  { name: "X (Twitter) Analytics", icon: "𝕏", desc: "Tweet performance & followers", providerId: "twitter", socialMatch: ["twitter"], priority: 23 },
  { name: "YouTube Studio", icon: "▶️", desc: "Video analytics & channel data", providerId: "youtube", socialMatch: ["youtube"], priority: 24 },
  { name: "TikTok Business", icon: "🎵", desc: "Content performance & trends", providerId: "tiktok", socialMatch: ["tiktok"], priority: 25 },

  // CMS & E-commerce — show if detected in tech stack
  { name: "WordPress", icon: "📝", desc: "CMS integration & content management", providerId: "wordpress", techMatch: ["WordPress", "WooCommerce"], priority: 30 },
  { name: "Shopify", icon: "🛒", desc: "E-commerce data & orders", providerId: "shopify", techMatch: ["Shopify"], industries: ["retail", "ecommerce"], priority: 31 },
  { name: "WooCommerce", icon: "🏪", desc: "Store analytics & products", providerId: "woocommerce", techMatch: ["WooCommerce"], priority: 32 },
  { name: "Magento", icon: "🧲", desc: "E-commerce platform data", providerId: "magento", techMatch: ["Magento"], priority: 33 },
  { name: "Wix", icon: "✨", desc: "Website builder analytics", providerId: "wix", techMatch: ["Wix"], priority: 34 },
  { name: "Squarespace", icon: "◼️", desc: "Website analytics", providerId: "squarespace", techMatch: ["Squarespace"], priority: 35 },

  // Industry-specific
  { name: "Booking.com", icon: "🏨", desc: "Booking & reservation data", providerId: "booking", industries: ["travel", "hospitality"], priority: 40 },
  { name: "TripAdvisor", icon: "🦉", desc: "Reviews & reputation", providerId: "tripadvisor", industries: ["travel", "restaurant", "hospitality"], priority: 41 },
  { name: "OpenTable", icon: "🍽️", desc: "Reservations & diner reviews", providerId: "opentable", industries: ["restaurant"], priority: 42 },
  { name: "Zocdoc", icon: "🏥", desc: "Patient appointments", providerId: "zocdoc", industries: ["healthcare"], priority: 43 },
  { name: "Zillow", icon: "🏠", desc: "Property listings & leads", providerId: "zillow", industries: ["real_estate"], priority: 44 },

  // CRM & Business tools
  { name: "HubSpot", icon: "🟠", desc: "CRM & marketing automation", providerId: "hubspot", techMatch: ["HubSpot"], industries: ["saas", "prof_svc", "consulting"], priority: 50 },
  { name: "Salesforce", icon: "☁️", desc: "CRM & sales data", providerId: "salesforce", industries: ["saas", "enterprise", "finance", "telecom"], priority: 51 },
  { name: "Mailchimp", icon: "📧", desc: "Email marketing campaigns", providerId: "mailchimp", techMatch: ["Mailchimp"], industries: ["retail", "ecommerce", "saas"], priority: 52 },

  // Developer & SaaS
  { name: "Stripe", icon: "💳", desc: "Payment analytics & revenue", providerId: "stripe", industries: ["saas", "ecommerce"], techMatch: ["Stripe"], priority: 60 },
  { name: "Intercom", icon: "💬", desc: "Customer messaging & support", providerId: "intercom", techMatch: ["Intercom"], industries: ["saas"], priority: 61 },
  { name: "Zendesk", icon: "🎫", desc: "Support tickets & satisfaction", providerId: "zendesk", techMatch: ["Zendesk"], industries: ["saas", "telecom"], priority: 62 },
];

/* ── Build the recommended list based on intake data ─────────── */
function getRecommendedPlatforms(
  industry: string,
  techStack: string[],
  socialLinks: Record<string, string[]>,
): { recommended: PlatformDef[]; other: PlatformDef[] } {
  const techLower = techStack.map(t => t.toLowerCase());
  const activeSocials = new Set(
    Object.entries(socialLinks)
      .filter(([, urls]) => urls && urls.length > 0)
      .map(([platform]) => platform.toLowerCase())
  );

  const recommended: PlatformDef[] = [];
  const other: PlatformDef[] = [];

  for (const p of ALL_PLATFORMS) {
    let isRecommended = false;

    // Always-recommend platforms
    if (p.alwaysRecommend) isRecommended = true;

    // Industry match
    if (p.industries?.includes(industry)) isRecommended = true;

    // Tech stack match
    if (p.techMatch?.some(t => techLower.some(ts => ts.toLowerCase().includes(t.toLowerCase())))) {
      isRecommended = true;
    }

    // Social link match
    if (p.socialMatch?.some(s => activeSocials.has(s))) isRecommended = true;

    if (isRecommended) {
      recommended.push(p);
    } else {
      other.push(p);
    }
  }

  // Sort by priority
  recommended.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  other.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  return { recommended, other };
}

export default function OnboardingIntegrations() {
  const router = useRouter();
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  // Intake data from cached results
  const [industry, setIndustry] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string[]>>({});

  // Fetch intake data and connection status
  useEffect(() => {
    async function load() {
      try {
        const [intakeRes, integRes] = await Promise.all([
          api.get("/api/v1/onboarding/intake-results").catch(() => null),
          api.get("/api/v1/integrations").catch(() => null),
        ]);

        if (intakeRes?.data) {
          setIndustry(intakeRes.data.detected_industry || workspace?.industry || "other");
          setTechStack(intakeRes.data.detected_tech_stack || []);
          setSocialLinks(intakeRes.data.detected_social_links || {});
        } else {
          // Fallback to workspace data
          setIndustry(workspace?.industry || "other");
        }

        if (integRes?.data?.integrations) {
          const connectedSet = new Set<string>();
          for (const integ of integRes.data.integrations) {
            if (integ.status === "connected") connectedSet.add(integ.provider_id);
          }
          setConnected(connectedSet);
        }
      } catch {
        setIndustry(workspace?.industry || "other");
      }
    }
    load();
  }, [workspace?.industry]);

  const { recommended, other } = useMemo(
    () => getRecommendedPlatforms(industry, techStack, socialLinks),
    [industry, techStack, socialLinks]
  );

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

  function renderPlatform(p: PlatformDef, i: number, isRecommended: boolean) {
    const isConnected = connected.has(p.providerId);
    const isConnecting = connectingId === p.providerId;
    const error = errors[p.providerId];

    return (
      <motion.div key={p.providerId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.04 }}
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
            {isRecommended && !isConnected && (
              <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 ring-1 ring-amber-500/20">
                Recommended
              </span>
            )}
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
            <div className="flex-1">
              <h2 className="text-base font-bold text-fg">Connect your platforms</h2>
              <p className="text-sm text-fg-hint">
                {industry && industry !== "other"
                  ? <>Recommended integrations for <span className="font-medium text-fg-muted capitalize">{industry.replace(/_/g, " ")}</span> based on your scan.</>
                  : "Unlock deeper insights by connecting your tools."
                }
                {" "}You can always do this later.
              </p>
            </div>
            {connectedCount > 0 && (
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                {connectedCount} connected
              </span>
            )}
          </div>
        </div>

        {/* Recommended platforms */}
        <div className="px-6 py-5">
          {recommended.length > 0 && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-fg-muted uppercase tracking-wide">
                  Recommended for you
                </span>
                <span className="text-2xs text-fg-hint">
                  ({recommended.length} platforms)
                </span>
              </div>
              <div className="space-y-2">
                {recommended.map((p, i) => renderPlatform(p, i, true))}
              </div>
            </>
          )}

          {/* Other platforms — expandable */}
          {other.length > 0 && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="mb-3 flex items-center gap-2 text-xs font-bold text-fg-hint uppercase tracking-wide transition hover:text-fg-muted"
              >
                <Star size={14} className="text-fg-hint/50" />
                Other integrations ({other.length})
                <span className="text-fg-hint/50">{showAll ? "▲" : "▼"}</span>
              </button>
              {showAll && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  {other.map((p, i) => renderPlatform(p, i, false))}
                </motion.div>
              )}
            </div>
          )}
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
