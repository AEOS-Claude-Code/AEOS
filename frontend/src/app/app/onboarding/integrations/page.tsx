"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, Plug, CheckCircle2, RefreshCw, Sparkles,
  Bot, X,
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
  color: string;       // tailwind color prefix, e.g. "blue", "violet"
  desc: string;
  industries: string[];
  tools: { name: string; icon: string; providerId: string; desc: string; industries?: string[] }[];
}

/* ── Digital / Marketing platform catalog ─────────────────────── */

const DIGITAL_PLATFORMS: PlatformDef[] = [
  { name: "Google Analytics", icon: "📊", desc: "Website analytics", providerId: "google_analytics", alwaysRecommend: true, priority: 1 },
  { name: "Search Console", icon: "🔍", desc: "Search indexing", providerId: "google_search_console", alwaysRecommend: true, priority: 2 },
  { name: "Google Ads", icon: "📍", desc: "Ad campaigns", providerId: "google_ads", industries: ["retail", "saas", "real_estate", "travel", "restaurant", "education", "healthcare", "finance", "ecommerce"], priority: 10 },
  { name: "Meta Ads", icon: "👥", desc: "Social ads", providerId: "meta", socialMatch: ["facebook", "instagram"], industries: ["retail", "restaurant", "travel", "real_estate", "ecommerce"], priority: 11 },
  { name: "Instagram", icon: "📸", desc: "Content metrics", providerId: "instagram", socialMatch: ["instagram"], priority: 20 },
  { name: "Facebook Pages", icon: "📘", desc: "Page insights", providerId: "facebook_pages", socialMatch: ["facebook"], priority: 21 },
  { name: "LinkedIn", icon: "💼", desc: "Company analytics", providerId: "linkedin", socialMatch: ["linkedin"], priority: 22 },
  { name: "X (Twitter)", icon: "𝕏", desc: "Tweet analytics", providerId: "twitter", socialMatch: ["twitter"], priority: 23 },
  { name: "YouTube", icon: "▶️", desc: "Video analytics", providerId: "youtube", socialMatch: ["youtube"], priority: 24 },
  { name: "TikTok", icon: "🎵", desc: "Content trends", providerId: "tiktok", socialMatch: ["tiktok"], priority: 25 },
  { name: "WordPress", icon: "📝", desc: "CMS management", providerId: "wordpress", techMatch: ["WordPress", "WooCommerce"], priority: 30 },
  { name: "Shopify", icon: "🛒", desc: "E-commerce", providerId: "shopify", techMatch: ["Shopify"], industries: ["retail", "ecommerce"], priority: 31 },
  { name: "WooCommerce", icon: "🏪", desc: "Store analytics", providerId: "woocommerce", techMatch: ["WooCommerce"], priority: 32 },
  { name: "Booking.com", icon: "🏨", desc: "Reservations", providerId: "booking", industries: ["travel", "hospitality"], priority: 40 },
  { name: "TripAdvisor", icon: "🦉", desc: "Reviews", providerId: "tripadvisor", industries: ["travel", "restaurant", "hospitality"], priority: 41 },
  { name: "OpenTable", icon: "🍽️", desc: "Reservations", providerId: "opentable", industries: ["restaurant"], priority: 42 },
];

/* ── Department catalog ───────────────────────────────────────── */

const ALL_DEPARTMENTS: DepartmentDef[] = [
  {
    id: "booking", name: "Reservations & Booking", color: "rose",
    icon: <ShoppingBag size={18} />, desc: "Online bookings & reservation management",
    industries: ["travel", "hospitality", "restaurant", "healthcare"],
    tools: [
      { name: "Booking.com", icon: "🏨", providerId: "booking_dept", desc: "OTA reservations", industries: ["travel", "hospitality"] },
      { name: "Rezdy", icon: "🎟️", providerId: "rezdy", desc: "Tour & activity bookings", industries: ["travel"] },
      { name: "Toast POS", icon: "🍞", providerId: "toast", desc: "Restaurant POS & orders", industries: ["restaurant"] },
      { name: "Zocdoc", icon: "🏥", providerId: "zocdoc", desc: "Patient scheduling", industries: ["healthcare"] },
    ],
  },
  {
    id: "sales_crm", name: "Sales & CRM", color: "orange",
    icon: <Briefcase size={18} />, desc: "Customer relationships & sales pipeline",
    industries: ["saas", "real_estate", "finance", "telecom", "prof_svc", "consulting", "enterprise", "travel", "retail", "ecommerce"],
    tools: [
      { name: "HubSpot", icon: "🟠", providerId: "hubspot", desc: "CRM & marketing automation" },
      { name: "Salesforce", icon: "☁️", providerId: "salesforce", desc: "Enterprise CRM & sales" },
      { name: "Pipedrive", icon: "🟢", providerId: "pipedrive", desc: "Sales pipeline management" },
      { name: "Zoho CRM", icon: "🔴", providerId: "zoho_crm", desc: "CRM & business apps" },
    ],
  },
  {
    id: "marketing", name: "Marketing & Email", color: "amber",
    icon: <Megaphone size={18} />, desc: "Email campaigns & marketing automation",
    industries: ["saas", "retail", "ecommerce", "travel", "real_estate", "restaurant", "education", "hospitality"],
    tools: [
      { name: "Mailchimp", icon: "📧", providerId: "mailchimp", desc: "Email marketing campaigns" },
      { name: "Brevo", icon: "📨", providerId: "brevo", desc: "Email & SMS marketing" },
      { name: "ActiveCampaign", icon: "⚡", providerId: "activecampaign", desc: "Marketing automation" },
      { name: "Constant Contact", icon: "✉️", providerId: "constant_contact", desc: "Email marketing" },
    ],
  },
  {
    id: "support", name: "Customer Support", color: "cyan",
    icon: <HeadphonesIcon size={18} />, desc: "Help desk, tickets & live chat",
    industries: ["saas", "telecom", "retail", "ecommerce", "travel", "finance", "hospitality"],
    tools: [
      { name: "Zendesk", icon: "🎫", providerId: "zendesk", desc: "Support tickets & knowledge base" },
      { name: "Intercom", icon: "💬", providerId: "intercom", desc: "Live chat & messaging" },
      { name: "Freshdesk", icon: "🟩", providerId: "freshdesk", desc: "Customer support platform" },
      { name: "Crisp", icon: "💭", providerId: "crisp", desc: "Live chat & chatbot" },
    ],
  },
  {
    id: "finance", name: "Finance & Accounting", color: "emerald",
    icon: <DollarSign size={18} />, desc: "Bookkeeping, invoicing & financial data",
    industries: ["saas", "retail", "restaurant", "construction", "logistics", "prof_svc", "finance", "travel", "ecommerce", "real_estate", "enterprise"],
    tools: [
      { name: "QuickBooks", icon: "📗", providerId: "quickbooks", desc: "Accounting & bookkeeping" },
      { name: "Xero", icon: "💙", providerId: "xero", desc: "Cloud accounting" },
      { name: "FreshBooks", icon: "📒", providerId: "freshbooks", desc: "Invoicing & expenses" },
      { name: "Stripe", icon: "💳", providerId: "stripe", desc: "Payments & revenue", industries: ["saas", "ecommerce", "retail"] },
    ],
  },
  {
    id: "hr", name: "HR & People", color: "pink",
    icon: <Users size={18} />, desc: "Human resources & team management",
    industries: ["saas", "enterprise", "telecom", "finance", "construction", "logistics", "government", "travel", "retail", "hospitality"],
    tools: [
      { name: "BambooHR", icon: "🎍", providerId: "bamboohr", desc: "HR management & payroll" },
      { name: "Gusto", icon: "🧑‍💼", providerId: "gusto", desc: "Payroll, benefits & HR" },
      { name: "Workday", icon: "📋", providerId: "workday", desc: "Enterprise HCM", industries: ["enterprise", "finance", "telecom"] },
      { name: "Deel", icon: "🌍", providerId: "deel", desc: "Global payroll & compliance" },
    ],
  },
  {
    id: "project", name: "Project Management", color: "indigo",
    icon: <ClipboardList size={18} />, desc: "Task tracking & team collaboration",
    industries: ["saas", "construction", "prof_svc", "consulting", "enterprise", "government"],
    tools: [
      { name: "Asana", icon: "🔶", providerId: "asana", desc: "Work management & tasks" },
      { name: "Monday.com", icon: "🟣", providerId: "monday", desc: "Work OS & project tracking" },
      { name: "Jira", icon: "🔷", providerId: "jira", desc: "Issue tracking & agile", industries: ["saas", "enterprise"] },
      { name: "Trello", icon: "📌", providerId: "trello", desc: "Boards & task management" },
    ],
  },
  {
    id: "inventory", name: "Inventory & Supply Chain", color: "lime",
    icon: <Truck size={18} />, desc: "Stock management & supplier tracking",
    industries: ["retail", "restaurant", "ecommerce", "logistics", "construction"],
    tools: [
      { name: "TradeGecko", icon: "📦", providerId: "tradegecko", desc: "Inventory management" },
      { name: "Cin7", icon: "🏭", providerId: "cin7", desc: "Inventory & order management" },
      { name: "Odoo", icon: "⚙️", providerId: "odoo", desc: "ERP & inventory" },
    ],
  },
  {
    id: "analytics", name: "Business Intelligence", color: "sky",
    icon: <BarChart3 size={18} />, desc: "Dashboards, reporting & data analytics",
    industries: ["saas", "finance", "enterprise", "telecom", "retail"],
    tools: [
      { name: "Tableau", icon: "📊", providerId: "tableau", desc: "Data visualization" },
      { name: "Power BI", icon: "📈", providerId: "powerbi", desc: "Microsoft BI dashboards" },
      { name: "Looker", icon: "👁️", providerId: "looker", desc: "Google data analytics" },
    ],
  },
  {
    id: "property", name: "Property Management", color: "teal",
    icon: <Building2 size={18} />, desc: "Listings, tenants & property data",
    industries: ["real_estate"],
    tools: [
      { name: "Zillow", icon: "🏠", providerId: "zillow", desc: "Property listings & leads" },
      { name: "Buildium", icon: "🏢", providerId: "buildium", desc: "Property management" },
      { name: "AppFolio", icon: "🔑", providerId: "appfolio", desc: "Property management software" },
    ],
  },
];

/* ── Color map for departments ───────────────────────────────── */

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string; activeBg: string; activeBorder: string }> = {
  orange:  { bg: "bg-orange-500/[0.04]", border: "border-orange-500/20", text: "text-orange-600", iconBg: "bg-orange-500/10", activeBg: "bg-orange-500", activeBorder: "border-orange-500/40" },
  pink:    { bg: "bg-pink-500/[0.04]", border: "border-pink-500/20", text: "text-pink-600", iconBg: "bg-pink-500/10", activeBg: "bg-pink-500", activeBorder: "border-pink-500/40" },
  emerald: { bg: "bg-emerald-500/[0.04]", border: "border-emerald-500/20", text: "text-emerald-600", iconBg: "bg-emerald-500/10", activeBg: "bg-emerald-500", activeBorder: "border-emerald-500/40" },
  amber:   { bg: "bg-amber-500/[0.04]", border: "border-amber-500/20", text: "text-amber-600", iconBg: "bg-amber-500/10", activeBg: "bg-amber-500", activeBorder: "border-amber-500/40" },
  cyan:    { bg: "bg-cyan-500/[0.04]", border: "border-cyan-500/20", text: "text-cyan-600", iconBg: "bg-cyan-500/10", activeBg: "bg-cyan-500", activeBorder: "border-cyan-500/40" },
  indigo:  { bg: "bg-indigo-500/[0.04]", border: "border-indigo-500/20", text: "text-indigo-600", iconBg: "bg-indigo-500/10", activeBg: "bg-indigo-500", activeBorder: "border-indigo-500/40" },
  lime:    { bg: "bg-lime-500/[0.04]", border: "border-lime-500/20", text: "text-lime-600", iconBg: "bg-lime-500/10", activeBg: "bg-lime-500", activeBorder: "border-lime-500/40" },
  sky:     { bg: "bg-sky-500/[0.04]", border: "border-sky-500/20", text: "text-sky-600", iconBg: "bg-sky-500/10", activeBg: "bg-sky-500", activeBorder: "border-sky-500/40" },
  teal:    { bg: "bg-teal-500/[0.04]", border: "border-teal-500/20", text: "text-teal-600", iconBg: "bg-teal-500/10", activeBg: "bg-teal-500", activeBorder: "border-teal-500/40" },
  rose:    { bg: "bg-rose-500/[0.04]", border: "border-rose-500/20", text: "text-rose-600", iconBg: "bg-rose-500/10", activeBg: "bg-rose-500", activeBorder: "border-rose-500/40" },
  violet:  { bg: "bg-violet-500/[0.04]", border: "border-violet-500/20", text: "text-violet-600", iconBg: "bg-violet-500/10", activeBg: "bg-violet-500", activeBorder: "border-violet-500/40" },
};

/* ── Helpers ──────────────────────────────────────────────────── */

function getRecommendedPlatforms(
  industry: string, techStack: string[], socialLinks: Record<string, string[]>,
): PlatformDef[] {
  const techLower = techStack.map(t => t.toLowerCase());
  const activeSocials = new Set(
    Object.entries(socialLinks).filter(([, urls]) => urls && urls.length > 0).map(([p]) => p.toLowerCase())
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
  // Only show departments whose industries list includes the detected industry
  return ALL_DEPARTMENTS.filter(d => d.industries.includes(industry));
}

/* ── Component ────────────────────────────────────────────────── */

export default function OnboardingIntegrations() {
  const router = useRouter();
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [industry, setIndustry] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string[]>>({});
  const [deptChoices, setDeptChoices] = useState<Record<string, "aeos" | "connect" | null>>({});
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

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

  const recommended = useMemo(() => getRecommendedPlatforms(industry, techStack, socialLinks), [industry, techStack, socialLinks]);
  const departments = useMemo(() => getRelevantDepartments(industry), [industry]);

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    setErrors(prev => { const n = { ...prev }; delete n[providerId]; return n; });
    try {
      await api.post("/api/v1/integrations/connect", { provider_id: providerId, simulated_account_name: "" });
      setConnected(prev => new Set(prev).add(providerId));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [providerId]: err?.response?.data?.detail || "Connection failed" }));
    } finally { setConnectingId(null); }
  }

  async function handleDisconnect(providerId: string) {
    setConnectingId(providerId);
    try {
      await api.post("/api/v1/integrations/disconnect", { provider_id: providerId });
      setConnected(prev => { const n = new Set(prev); n.delete(providerId); return n; });
    } catch {} finally { setConnectingId(null); }
  }

  function handleDeptChoice(deptId: string, choice: "aeos" | "connect") {
    setDeptChoices(prev => ({ ...prev, [deptId]: prev[deptId] === choice ? null : choice }));
    if (choice === "connect") setExpandedDept(deptId);
    else setExpandedDept(null);
  }

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/integrations", { acknowledged: true, department_choices: deptChoices });
      router.push("/app/onboarding/org-chart");
    } catch {} finally { setLoading(false); }
  }

  const connectedCount = connected.size;
  const aeosCount = Object.values(deptChoices).filter(c => c === "aeos").length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="mx-auto max-w-[1200px] space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <Plug size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-fg">Connect your platforms</h1>
            <p className="text-sm text-fg-muted">
              {industry && industry !== "other"
                ? <>Tailored for <span className="font-semibold capitalize text-fg">{industry.replace(/_/g, " ")}</span> — connect tools or let AEOS AI manage.</>
                : "Connect your tools or let AEOS AI manage departments."
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connectedCount > 0 && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-500 ring-1 ring-blue-500/20">
              {connectedCount} connected
            </span>
          )}
          {aeosCount > 0 && (
            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-500 ring-1 ring-violet-500/20">
              {aeosCount} AI-managed
            </span>
          )}
        </div>
      </div>

      {/* ── Section 1: Digital & Marketing — Card Grid ──────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-amber-500" />
          <h2 className="text-sm font-bold text-fg">Digital & Marketing</h2>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-2xs font-bold text-amber-600 ring-1 ring-amber-500/20">
            {recommended.length} recommended
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {recommended.map((p, i) => {
            const isConnected = connected.has(p.providerId);
            const isConnecting = connectingId === p.providerId;
            const error = errors[p.providerId];
            return (
              <motion.div key={p.providerId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer ${
                  isConnected
                    ? "border-blue-500/30 bg-blue-500/[0.06] shadow-sm shadow-blue-500/5"
                    : error
                      ? "border-red-500/30 bg-red-500/[0.04]"
                      : "border-border bg-white hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 dark:bg-surface-secondary"
                }`}
                onClick={() => !isConnecting && (isConnected ? handleDisconnect(p.providerId) : handleConnect(p.providerId))}
              >
                {isConnected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={16} className="text-blue-500" />
                  </div>
                )}
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <p className="text-xs font-bold text-fg">{p.name}</p>
                  <p className="text-2xs text-fg-muted">{error ? <span className="text-red-500">{error}</span> : p.desc}</p>
                </div>
                {isConnecting && (
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                )}
                {!isConnected && !isConnecting && (
                  <span className="text-2xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition">
                    Click to connect
                  </span>
                )}
                {isConnected && !isConnecting && (
                  <span className="text-2xs font-semibold text-blue-500">Connected</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Department Tools — Card Grid ────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Building2 size={15} className="text-violet-500" />
          <h2 className="text-sm font-bold text-fg">Department Tools</h2>
          <span className="text-xs text-fg-muted">Connect existing tools or let AEOS AI manage</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, di) => {
            const choice = deptChoices[dept.id];
            const colors = COLOR_MAP[dept.color] || COLOR_MAP.violet;
            const relevantTools = dept.tools.filter(t => !t.industries || t.industries.includes(industry));
            const deptConnectedCount = relevantTools.filter(t => connected.has(t.providerId)).length;
            const isOpen = expandedDept === dept.id && choice === "connect";

            return (
              <motion.div key={dept.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + di * 0.04 }}
                className={`rounded-xl border overflow-hidden transition-all ${
                  choice === "aeos"
                    ? `${colors.border} ${colors.bg}`
                    : choice === "connect"
                      ? "border-blue-500/30 bg-blue-500/[0.03]"
                      : "border-border bg-white dark:bg-surface-secondary hover:shadow-md"
                }`}
              >
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      choice === "aeos" ? `${colors.iconBg} ${colors.text}` : choice === "connect" ? "bg-blue-500/10 text-blue-600" : `${colors.iconBg} ${colors.text}`
                    }`}>
                      {dept.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-fg">{dept.name}</h3>
                        {choice === "aeos" && (
                          <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 ring-1 ring-violet-500/20">
                            AI
                          </span>
                        )}
                        {deptConnectedCount > 0 && (
                          <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">
                            {deptConnectedCount} linked
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-fg-muted leading-relaxed">{dept.desc}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleDeptChoice(dept.id, "aeos")}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition ${
                        choice === "aeos"
                          ? "border-violet-500/40 bg-violet-500 text-white shadow-md shadow-violet-500/20"
                          : "border-border bg-white text-fg-muted hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:bg-surface dark:hover:bg-violet-500/10"
                      }`}>
                      <Bot size={13} />
                      AEOS AI
                    </button>
                    <button type="button" onClick={() => handleDeptChoice(dept.id, "connect")}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition ${
                        choice === "connect"
                          ? "border-blue-500/40 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "border-border bg-white text-fg-muted hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-surface dark:hover:bg-blue-500/10"
                      }`}>
                      <Plug size={13} />
                      Connect Tool
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {choice === "aeos" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t border-violet-500/10 bg-violet-500/[0.03] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Bot size={14} className="text-violet-500 shrink-0" />
                          <p className="text-xs text-violet-700 dark:text-violet-400">
                            AEOS will handle <strong>{dept.name}</strong> autonomously. Connect a tool later from Settings.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t border-blue-500/10 bg-blue-500/[0.02] p-3 space-y-1.5">
                        {relevantTools.map(tool => {
                          const isToolConn = connected.has(tool.providerId);
                          const isToolLoading = connectingId === tool.providerId;
                          return (
                            <div key={tool.providerId}
                              onClick={() => !isToolLoading && (isToolConn ? handleDisconnect(tool.providerId) : handleConnect(tool.providerId))}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition ${
                                isToolConn
                                  ? "bg-blue-500/[0.08] ring-1 ring-blue-500/20"
                                  : "bg-white hover:bg-blue-50 dark:bg-surface dark:hover:bg-blue-500/10"
                              }`}>
                              <span className="text-base">{tool.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-fg">{tool.name}</p>
                                <p className="text-2xs text-fg-muted">{tool.desc}</p>
                              </div>
                              {isToolLoading ? (
                                <Loader2 size={14} className="animate-spin text-blue-500" />
                              ) : isToolConn ? (
                                <CheckCircle2 size={16} className="text-blue-500" />
                              ) : (
                                <span className="text-2xs font-semibold text-blue-500">Connect</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Action Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={() => router.push("/app/onboarding/competitors")}
          className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-fg-muted transition hover:bg-surface-secondary hover:text-fg"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <button onClick={handleContinue} disabled={loading}
          className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (
            <>
              <Sparkles size={14} />
              Continue
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <button onClick={() => router.push("/app/onboarding/org-chart")}
          className="rounded-xl px-5 py-3.5 text-sm font-semibold text-fg-muted transition hover:bg-surface hover:text-fg">
          Skip
        </button>
      </div>
    </motion.div>
  );
}
