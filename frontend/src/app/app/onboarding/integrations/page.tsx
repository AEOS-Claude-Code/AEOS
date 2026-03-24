"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Loader2, Plug, CheckCircle2, RefreshCw, Sparkles,
  Bot, ChevronDown, ChevronUp,
  Users, DollarSign, Megaphone, HeadphonesIcon, ClipboardList,
  BarChart3, ShoppingBag, Briefcase, Building2, Truck,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";

/* ── Types ────────────────────────────────────────────────────── */

interface PlatformDef {
  name: string;
  icon: string;
  desc: string;
  providerId: string;
  industries?: string[];
  techMatch?: string[];
  socialMatch?: string[];
  alwaysRecommend?: boolean;
  priority?: number;
}

interface DepartmentDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  desc: string;
  /** Industries this department is most relevant for */
  industries: string[];
  /** Always show for any industry */
  universal?: boolean;
  /** Tools available for this department */
  tools: { name: string; icon: string; providerId: string; desc: string; industries?: string[] }[];
}

/* ── Digital / Marketing platform catalog ─────────────────────── */

const DIGITAL_PLATFORMS: PlatformDef[] = [
  // Analytics & Search
  { name: "Google Analytics", icon: "📊", desc: "Website analytics & visitor insights", providerId: "google_analytics", alwaysRecommend: true, priority: 1 },
  { name: "Google Search Console", icon: "🔍", desc: "Search performance & indexing", providerId: "google_search_console", alwaysRecommend: true, priority: 2 },
  // Advertising
  { name: "Google Ads", icon: "📍", desc: "Ad campaigns & PPC", providerId: "google_ads", industries: ["retail", "saas", "real_estate", "travel", "restaurant", "education", "healthcare", "finance", "ecommerce"], priority: 10 },
  { name: "Facebook & Instagram Ads", icon: "👥", desc: "Social ad campaigns", providerId: "meta", socialMatch: ["facebook", "instagram"], industries: ["retail", "restaurant", "travel", "real_estate", "ecommerce"], priority: 11 },
  // Social
  { name: "Instagram Business", icon: "📸", desc: "Content metrics & engagement", providerId: "instagram", socialMatch: ["instagram"], priority: 20 },
  { name: "Facebook Pages", icon: "📘", desc: "Page insights & engagement", providerId: "facebook_pages", socialMatch: ["facebook"], priority: 21 },
  { name: "LinkedIn Company", icon: "💼", desc: "Company page analytics", providerId: "linkedin", socialMatch: ["linkedin"], priority: 22 },
  { name: "X (Twitter) Analytics", icon: "𝕏", desc: "Tweet performance & followers", providerId: "twitter", socialMatch: ["twitter"], priority: 23 },
  { name: "YouTube Studio", icon: "▶️", desc: "Video analytics & channel data", providerId: "youtube", socialMatch: ["youtube"], priority: 24 },
  { name: "TikTok Business", icon: "🎵", desc: "Content performance & trends", providerId: "tiktok", socialMatch: ["tiktok"], priority: 25 },
  // CMS & E-commerce
  { name: "WordPress", icon: "📝", desc: "CMS & content management", providerId: "wordpress", techMatch: ["WordPress", "WooCommerce"], priority: 30 },
  { name: "Shopify", icon: "🛒", desc: "E-commerce data & orders", providerId: "shopify", techMatch: ["Shopify"], industries: ["retail", "ecommerce"], priority: 31 },
  { name: "WooCommerce", icon: "🏪", desc: "Store analytics & products", providerId: "woocommerce", techMatch: ["WooCommerce"], priority: 32 },
  // Industry-specific
  { name: "Booking.com", icon: "🏨", desc: "Booking & reservation data", providerId: "booking", industries: ["travel", "hospitality"], priority: 40 },
  { name: "TripAdvisor", icon: "🦉", desc: "Reviews & reputation", providerId: "tripadvisor", industries: ["travel", "restaurant", "hospitality"], priority: 41 },
  { name: "OpenTable", icon: "🍽️", desc: "Reservations & diner reviews", providerId: "opentable", industries: ["restaurant"], priority: 42 },
];

/* ── Department catalog ───────────────────────────────────────── */

const ALL_DEPARTMENTS: DepartmentDef[] = [
  {
    id: "sales_crm",
    name: "Sales & CRM",
    icon: <Briefcase size={16} />,
    desc: "Customer relationships & sales pipeline",
    industries: ["saas", "real_estate", "finance", "telecom", "prof_svc", "consulting", "enterprise"],
    universal: true,
    tools: [
      { name: "HubSpot", icon: "🟠", providerId: "hubspot", desc: "CRM & marketing automation" },
      { name: "Salesforce", icon: "☁️", providerId: "salesforce", desc: "Enterprise CRM & sales" },
      { name: "Pipedrive", icon: "🟢", providerId: "pipedrive", desc: "Sales pipeline management" },
      { name: "Zoho CRM", icon: "🔴", providerId: "zoho_crm", desc: "CRM & business apps" },
    ],
  },
  {
    id: "hr",
    name: "HR & People",
    icon: <Users size={16} />,
    desc: "Human resources & team management",
    industries: ["saas", "enterprise", "telecom", "finance", "construction", "logistics", "government"],
    universal: true,
    tools: [
      { name: "BambooHR", icon: "🎍", providerId: "bamboohr", desc: "HR management & payroll" },
      { name: "Gusto", icon: "🧑‍💼", providerId: "gusto", desc: "Payroll, benefits & HR" },
      { name: "Workday", icon: "📋", providerId: "workday", desc: "Enterprise HCM", industries: ["enterprise", "finance", "telecom"] },
      { name: "Deel", icon: "🌍", providerId: "deel", desc: "Global payroll & compliance" },
    ],
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    icon: <DollarSign size={16} />,
    desc: "Bookkeeping, invoicing & financial data",
    industries: ["saas", "retail", "restaurant", "construction", "logistics", "prof_svc", "finance"],
    universal: true,
    tools: [
      { name: "QuickBooks", icon: "📗", providerId: "quickbooks", desc: "Accounting & bookkeeping" },
      { name: "Xero", icon: "💙", providerId: "xero", desc: "Cloud accounting" },
      { name: "FreshBooks", icon: "📒", providerId: "freshbooks", desc: "Invoicing & expenses" },
      { name: "Stripe", icon: "💳", providerId: "stripe", desc: "Payments & revenue", industries: ["saas", "ecommerce", "retail"] },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Email",
    icon: <Megaphone size={16} />,
    desc: "Email campaigns & marketing automation",
    industries: ["saas", "retail", "ecommerce", "travel", "real_estate", "restaurant", "education"],
    universal: true,
    tools: [
      { name: "Mailchimp", icon: "📧", providerId: "mailchimp", desc: "Email marketing campaigns" },
      { name: "Brevo (Sendinblue)", icon: "📨", providerId: "brevo", desc: "Email & SMS marketing" },
      { name: "ActiveCampaign", icon: "⚡", providerId: "activecampaign", desc: "Marketing automation" },
      { name: "Constant Contact", icon: "✉️", providerId: "constant_contact", desc: "Email marketing" },
    ],
  },
  {
    id: "support",
    name: "Customer Support",
    icon: <HeadphonesIcon size={16} />,
    desc: "Help desk, tickets & live chat",
    industries: ["saas", "telecom", "retail", "ecommerce", "travel", "finance"],
    universal: false,
    tools: [
      { name: "Zendesk", icon: "🎫", providerId: "zendesk", desc: "Support tickets & knowledge base" },
      { name: "Intercom", icon: "💬", providerId: "intercom", desc: "Live chat & messaging" },
      { name: "Freshdesk", icon: "🟩", providerId: "freshdesk", desc: "Customer support platform" },
      { name: "Crisp", icon: "💭", providerId: "crisp", desc: "Live chat & chatbot" },
    ],
  },
  {
    id: "project",
    name: "Project Management",
    icon: <ClipboardList size={16} />,
    desc: "Task tracking & team collaboration",
    industries: ["saas", "construction", "prof_svc", "consulting", "enterprise", "government"],
    universal: true,
    tools: [
      { name: "Asana", icon: "🔶", providerId: "asana", desc: "Work management & tasks" },
      { name: "Monday.com", icon: "🟣", providerId: "monday", desc: "Work OS & project tracking" },
      { name: "Jira", icon: "🔷", providerId: "jira", desc: "Issue tracking & agile", industries: ["saas", "enterprise"] },
      { name: "Trello", icon: "📌", providerId: "trello", desc: "Boards & task management" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory & Supply Chain",
    icon: <Truck size={16} />,
    desc: "Stock management & supplier tracking",
    industries: ["retail", "restaurant", "ecommerce", "logistics", "construction"],
    universal: false,
    tools: [
      { name: "TradeGecko", icon: "📦", providerId: "tradegecko", desc: "Inventory management" },
      { name: "Cin7", icon: "🏭", providerId: "cin7", desc: "Inventory & order management" },
      { name: "Odoo", icon: "⚙️", providerId: "odoo", desc: "ERP & inventory" },
    ],
  },
  {
    id: "analytics",
    name: "Business Intelligence",
    icon: <BarChart3 size={16} />,
    desc: "Dashboards, reporting & data analytics",
    industries: ["saas", "finance", "enterprise", "telecom", "retail"],
    universal: false,
    tools: [
      { name: "Tableau", icon: "📊", providerId: "tableau", desc: "Data visualization" },
      { name: "Power BI", icon: "📈", providerId: "powerbi", desc: "Microsoft BI dashboards" },
      { name: "Looker", icon: "👁️", providerId: "looker", desc: "Google data analytics" },
    ],
  },
  {
    id: "property",
    name: "Property Management",
    icon: <Building2 size={16} />,
    desc: "Listings, tenants & property data",
    industries: ["real_estate"],
    universal: false,
    tools: [
      { name: "Zillow", icon: "🏠", providerId: "zillow", desc: "Property listings & leads" },
      { name: "Buildium", icon: "🏢", providerId: "buildium", desc: "Property management" },
      { name: "AppFolio", icon: "🔑", providerId: "appfolio", desc: "Property management software" },
    ],
  },
  {
    id: "booking",
    name: "Reservations & Booking",
    icon: <ShoppingBag size={16} />,
    desc: "Online bookings & reservation management",
    industries: ["travel", "hospitality", "restaurant", "healthcare"],
    universal: false,
    tools: [
      { name: "Booking.com", icon: "🏨", providerId: "booking_dept", desc: "OTA reservations", industries: ["travel", "hospitality"] },
      { name: "Rezdy", icon: "🎟️", providerId: "rezdy", desc: "Tour & activity bookings", industries: ["travel"] },
      { name: "Toast POS", icon: "🍞", providerId: "toast", desc: "Restaurant POS & orders", industries: ["restaurant"] },
      { name: "Zocdoc", icon: "🏥", providerId: "zocdoc", desc: "Patient scheduling", industries: ["healthcare"] },
    ],
  },
];

/* ── Helpers ──────────────────────────────────────────────────── */

function getRecommendedPlatforms(
  industry: string,
  techStack: string[],
  socialLinks: Record<string, string[]>,
): PlatformDef[] {
  const techLower = techStack.map(t => t.toLowerCase());
  const activeSocials = new Set(
    Object.entries(socialLinks)
      .filter(([, urls]) => urls && urls.length > 0)
      .map(([platform]) => platform.toLowerCase())
  );

  const recommended: PlatformDef[] = [];
  for (const p of DIGITAL_PLATFORMS) {
    let match = false;
    if (p.alwaysRecommend) match = true;
    if (p.industries?.includes(industry)) match = true;
    if (p.techMatch?.some(t => techLower.some(ts => ts.toLowerCase().includes(t.toLowerCase())))) match = true;
    if (p.socialMatch?.some(s => activeSocials.has(s))) match = true;
    if (match) recommended.push(p);
  }
  recommended.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  return recommended;
}

function getRelevantDepartments(industry: string): DepartmentDef[] {
  return ALL_DEPARTMENTS.filter(
    d => d.universal || d.industries.includes(industry)
  );
}

/* ── Component ────────────────────────────────────────────────── */

export default function OnboardingIntegrations() {
  const router = useRouter();
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Intake data
  const [industry, setIndustry] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string[]>>({});

  // Department choices: "aeos" = let AEOS handle | "connect" = show tools | null = not chosen
  const [deptChoices, setDeptChoices] = useState<Record<string, "aeos" | "connect" | null>>({});
  // Expanded departments (to show tool list)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

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
          setIndustry(workspace?.industry || "other");
        }
        if (integRes?.data?.integrations) {
          const s = new Set<string>();
          for (const integ of integRes.data.integrations) {
            if (integ.status === "connected") s.add(integ.provider_id);
          }
          setConnected(s);
        }
      } catch {
        setIndustry(workspace?.industry || "other");
      }
    }
    load();
  }, [workspace?.industry]);

  const recommended = useMemo(
    () => getRecommendedPlatforms(industry, techStack, socialLinks),
    [industry, techStack, socialLinks]
  );

  const departments = useMemo(
    () => getRelevantDepartments(industry),
    [industry]
  );

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    setErrors((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
    try {
      await api.post("/api/v1/integrations/connect", { provider_id: providerId, simulated_account_name: "" });
      setConnected((prev) => new Set(prev).add(providerId));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [providerId]: err?.response?.data?.detail || "Connection failed" }));
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect(providerId: string) {
    setConnectingId(providerId);
    try {
      await api.post("/api/v1/integrations/disconnect", { provider_id: providerId });
      setConnected((prev) => { const n = new Set(prev); n.delete(providerId); return n; });
    } catch {} finally { setConnectingId(null); }
  }

  function handleDeptChoice(deptId: string, choice: "aeos" | "connect") {
    setDeptChoices(prev => ({ ...prev, [deptId]: prev[deptId] === choice ? null : choice }));
    if (choice === "connect") {
      setExpandedDepts(prev => { const n = new Set(prev); n.add(deptId); return n; });
    } else {
      setExpandedDepts(prev => { const n = new Set(prev); n.delete(deptId); return n; });
    }
  }

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/integrations", {
        acknowledged: true,
        department_choices: deptChoices,
      });
      router.push("/app/onboarding/complete");
    } catch {} finally { setLoading(false); }
  }

  const connectedCount = connected.size;
  const aeosCount = Object.values(deptChoices).filter(c => c === "aeos").length;

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
                  ? <>Recommended for <span className="font-medium text-fg-muted capitalize">{industry.replace(/_/g, " ")}</span>. Connect existing tools or let AEOS AI handle departments.</>
                  : "Connect your existing tools or let AEOS AI handle departments for you."
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {connectedCount > 0 && (
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                  {connectedCount} connected
                </span>
              )}
              {aeosCount > 0 && (
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-400 ring-1 ring-violet-500/20">
                  {aeosCount} AEOS-managed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          {/* ── Section 1: Digital & Marketing Platforms ─────────── */}
          <div className="px-6 pt-5 pb-3">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-fg-muted uppercase tracking-wide">
                Digital & Marketing
              </span>
              <span className="text-2xs text-fg-hint">({recommended.length} recommended)</span>
            </div>
            <div className="space-y-2">
              {recommended.map((p, i) => {
                const isConnected = connected.has(p.providerId);
                const isConnecting = connectingId === p.providerId;
                const error = errors[p.providerId];
                return (
                  <motion.div key={p.providerId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${
                      isConnected ? "border-blue-500/30 bg-blue-500/[0.06]"
                        : error ? "border-red-500/30 bg-red-500/[0.04]"
                          : "border-border bg-surface-secondary hover:bg-surface"
                    }`}>
                    <span className="text-base">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-fg-secondary">{p.name}</p>
                        {isConnected && <CheckCircle2 size={13} className="text-blue-400" />}
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
          </div>

          {/* ── Section 2: Department Tools ────────────────────── */}
          <div className="px-6 pt-4 pb-5">
            <div className="mb-3 flex items-center gap-2">
              <Building2 size={14} className="text-violet-500" />
              <span className="text-xs font-bold text-fg-muted uppercase tracking-wide">
                Department Tools
              </span>
              <span className="text-2xs text-fg-hint">Connect existing or let AEOS AI manage</span>
            </div>

            <div className="space-y-2">
              {departments.map((dept, di) => {
                const choice = deptChoices[dept.id];
                const isExpanded = expandedDepts.has(dept.id);
                // Filter tools by industry if they have industry constraints
                const relevantTools = dept.tools.filter(
                  t => !t.industries || t.industries.includes(industry)
                );
                const deptConnected = relevantTools.filter(t => connected.has(t.providerId)).length;

                return (
                  <motion.div key={dept.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + di * 0.04 }}
                    className={`rounded-xl border transition-all ${
                      choice === "aeos"
                        ? "border-violet-500/30 bg-violet-500/[0.04]"
                        : choice === "connect"
                          ? "border-blue-500/30 bg-blue-500/[0.04]"
                          : "border-border bg-surface-secondary"
                    }`}
                  >
                    {/* Department header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        choice === "aeos" ? "bg-violet-500/15 text-violet-500"
                          : choice === "connect" ? "bg-blue-500/15 text-blue-500"
                            : "bg-surface text-fg-hint"
                      }`}>
                        {dept.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-fg-secondary">{dept.name}</p>
                          {choice === "aeos" && (
                            <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-500 ring-1 ring-violet-500/20">
                              AI Managed
                            </span>
                          )}
                          {deptConnected > 0 && (
                            <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 ring-1 ring-blue-500/20">
                              {deptConnected} connected
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-fg-hint">{dept.desc}</p>
                      </div>

                      {/* Choice buttons */}
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => handleDeptChoice(dept.id, "aeos")}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            choice === "aeos"
                              ? "border-violet-500/40 bg-violet-500 text-white shadow-sm"
                              : "border-border bg-surface text-fg-hint hover:border-violet-500/30 hover:text-violet-500"
                          }`}>
                          <Bot size={12} />
                          AEOS AI
                        </button>
                        <button type="button" onClick={() => handleDeptChoice(dept.id, "connect")}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            choice === "connect"
                              ? "border-blue-500/40 bg-blue-500 text-white shadow-sm"
                              : "border-border bg-surface text-fg-hint hover:border-blue-500/30 hover:text-blue-500"
                          }`}>
                          <Plug size={12} />
                          Connect
                        </button>
                      </div>
                    </div>

                    {/* Expanded tool list */}
                    <AnimatePresence>
                      {choice === "connect" && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 px-4 py-3 space-y-1.5">
                            {relevantTools.map(tool => {
                              const isToolConnected = connected.has(tool.providerId);
                              const isToolConnecting = connectingId === tool.providerId;
                              const toolError = errors[tool.providerId];
                              return (
                                <div key={tool.providerId}
                                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition ${
                                    isToolConnected ? "bg-blue-500/[0.06]" : "bg-surface/50 hover:bg-surface"
                                  }`}>
                                  <span className="text-sm">{tool.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-fg-secondary">{tool.name}</p>
                                    <p className="text-2xs text-fg-hint">
                                      {toolError ? <span className="text-red-400">{toolError}</span> : tool.desc}
                                    </p>
                                  </div>
                                  {isToolConnected ? (
                                    <button type="button" onClick={() => handleDisconnect(tool.providerId)} disabled={isToolConnecting}
                                      className="rounded-md border border-border px-2.5 py-1 text-2xs font-semibold text-fg-hint transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50">
                                      {isToolConnecting ? <Loader2 size={10} className="animate-spin" /> : "Disconnect"}
                                    </button>
                                  ) : (
                                    <button type="button" onClick={() => handleConnect(tool.providerId)} disabled={isToolConnecting}
                                      className="rounded-md border border-border px-2.5 py-1 text-2xs font-semibold text-fg-muted transition hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50">
                                      {isToolConnecting ? <Loader2 size={10} className="animate-spin" /> : "Connect"}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {choice === "aeos" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-violet-500/10 px-4 py-3">
                            <div className="flex items-center gap-2 rounded-lg bg-violet-500/[0.06] px-3 py-2">
                              <Bot size={14} className="text-violet-500 shrink-0" />
                              <p className="text-xs text-violet-600 dark:text-violet-400">
                                AEOS AI will manage <span className="font-semibold">{dept.name}</span> for you — no external tool needed. You can connect a tool later from Settings.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
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
