"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, CheckCircle2, XCircle, Phone, Mail, Share2, Cpu,
  Sparkles, MessageCircle, ExternalLink, Calendar, ChevronRight, ChevronDown,
  Building2, Bot, Users, Brain, Target, Megaphone, Wallet, Shield,
  Settings, Package, Heart, CalendarDays, Zap, ArrowRight, Check, Rocket,
} from "lucide-react";

const INDUSTRIES = [
  "ecommerce","healthcare","travel","restaurant","education","real_estate","saas",
  "agency","design_creative","engineering","construction","manufacturing","technology",
  "retail","finance","logistics","media_entertainment","nonprofit","professional_services","other",
];
const INDUSTRY_LABELS: Record<string,string> = {
  ecommerce:"E-commerce",healthcare:"Healthcare",travel:"Travel & Tourism",
  restaurant:"Restaurant & Food",education:"Education",real_estate:"Real Estate",
  saas:"SaaS / Software",agency:"Agency / Marketing",design_creative:"Design & Creative",
  engineering:"Engineering & Solutions",construction:"Construction",manufacturing:"Manufacturing",
  technology:"Technology & IT",retail:"Retail",finance:"Finance & Banking",
  logistics:"Logistics & Supply Chain",media_entertainment:"Media & Entertainment",
  nonprofit:"Non-profit",professional_services:"Professional Services",other:"Other",
};
const SOCIAL_LABELS: Record<string,string> = {
  linkedin:"LinkedIn",facebook:"Facebook",instagram:"Instagram",twitter:"X",
  youtube:"YouTube",tiktok:"TikTok",pinterest:"Pinterest",snapchat:"Snapchat",
};
const DEPT_ICONS: Record<string,any> = {
  brain:Brain,target:Target,megaphone:Megaphone,users:Users,wallet:Wallet,
  shield:Shield,settings:Settings,cpu:Cpu,package:Package,heart:Heart,
  calendar:CalendarDays,sparkles:Sparkles,
};
const DEPT_COLORS: Record<string,string> = {
  strategy:"from-violet-500 to-purple-600",sales:"from-orange-500 to-red-500",
  marketing:"from-pink-500 to-rose-500",hr:"from-blue-500 to-indigo-500",
  finance:"from-emerald-500 to-green-600",legal:"from-slate-500 to-gray-600",
  operations:"from-amber-500 to-yellow-600",it:"from-cyan-500 to-teal-500",
  procurement:"from-lime-500 to-green-500",reservations:"from-blue-400 to-blue-600",
  guest_relations:"from-rose-400 to-pink-600",partnerships:"from-teal-500 to-emerald-600",
  patient_care:"from-red-400 to-rose-500",clinical_ops:"from-sky-500 to-blue-600",
  billing:"from-emerald-500 to-green-600",compliance:"from-gray-500 to-slate-600",
  front_house:"from-amber-400 to-orange-500",kitchen_ops:"from-red-500 to-orange-600",
  delivery:"from-blue-500 to-cyan-500",customer_service:"from-pink-400 to-rose-500",
  customer_success:"from-pink-400 to-rose-500",creative:"from-fuchsia-500 to-purple-600",
  project_mgmt:"from-indigo-500 to-blue-600",client_services:"from-orange-400 to-amber-500",
  digital:"from-cyan-500 to-blue-500",technical:"from-slate-500 to-gray-700",
  safety:"from-red-500 to-red-700",product:"from-violet-500 to-indigo-600",
  devops:"from-gray-600 to-gray-800",elearning:"from-blue-400 to-indigo-500",
  academic:"from-emerald-400 to-teal-500",student_services:"from-amber-400 to-orange-500",
  risk:"from-red-500 to-rose-600",production:"from-orange-500 to-amber-600",
  supply_chain:"from-teal-500 to-green-600",rd:"from-purple-500 to-violet-600",
  warehouse:"from-amber-500 to-yellow-600",customs:"from-slate-500 to-gray-600",
  estimating:"from-blue-500 to-indigo-500",property_mgmt:"from-amber-500 to-orange-500",
  valuation:"from-emerald-500 to-teal-500",transactions:"from-slate-500 to-gray-600",
};

interface IntakeResult {
  url:string; detected_company_name:string; detected_industry:string;
  industry_confidence:number; detected_country:string; detected_city:string;
  detected_phone_numbers:string[]; detected_emails:string[];
  detected_social_links:Record<string,string[]>; detected_whatsapp_links:string[];
  detected_contact_pages:string[]; detected_booking_pages:string[];
  detected_tech_stack:string[]; page_title:string; meta_description:string;
}
interface OrgDepartment {
  id:string; name:string; icon:string; status:string; ai_head:string;
  ai_agents:number; ai_roles:string[]; description:string; priority_rank:number;
}
interface OrgChart {
  total_ai_agents:number; total_departments:number;
  departments:OrgDepartment[]; summary:string;
}

/* ── Animated loading screen ──────────────────────────────────── */

const SCAN_STEPS = [
  { icon: Globe, label: "Fetching website", color: "from-blue-500 to-cyan-500" },
  { icon: Building2, label: "Detecting company info", color: "from-violet-500 to-purple-500" },
  { icon: Phone, label: "Extracting contacts & social", color: "from-emerald-500 to-green-500" },
  { icon: Bot, label: "Building your AI org chart", color: "from-aeos-500 to-aeos-700" },
];

function LoadingScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [800, 1800, 2800, 3800].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = Math.min(100, ((step) / SCAN_STEPS.length) * 100);

  return (
    <div className="flex items-center justify-center py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-8 shadow-2xl shadow-slate-200/50">
        {/* Animated icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-full bg-gradient-to-r from-aeos-400/20 via-violet-400/20 to-emerald-400/20 blur-md" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-500 to-aeos-700 shadow-lg shadow-aeos-300/40">
              <Globe size={36} className="text-white" />
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-aeos-100">
              <Loader2 size={16} className="animate-spin text-aeos-600" />
            </motion.div>
          </div>
        </div>

        <h2 className="mb-1 text-center text-lg font-bold text-slate-900">Analyzing your website</h2>
        <p className="mb-6 text-center text-sm text-slate-500">Building your AI-powered company profile</p>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-aeos-500 via-violet-500 to-emerald-500"
            initial={{ width: "5%" }} animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }} />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {SCAN_STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                  active ? "bg-gradient-to-r " + s.color + " bg-opacity-5 shadow-sm ring-1 ring-inset ring-slate-100" :
                  done ? "bg-emerald-50/50" : "opacity-40"
                }`}>
                {done ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
                    <Check size={14} className="text-white" />
                  </motion.div>
                ) : active ? (
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} shadow-sm`}>
                    <Loader2 size={14} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Icon size={14} className="text-slate-400" />
                  </div>
                )}
                <span className={`text-sm ${done ? "font-medium text-emerald-700" : active ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                  {s.label}
                </span>
                {active && (
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-auto text-2xs text-slate-400">Processing...</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main onboarding page ─────────────────────────────────────── */

export default function OnboardingCompany() {
  const router = useRouter();
  const { workspace } = useAuth();

  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<IntakeResult|null>(null);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [orgChart, setOrgChart] = useState<OrgChart|null>(null);
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [expandedDept, setExpandedDept] = useState<string|null>(null);
  const [humanRoles, setHumanRoles] = useState<Record<string, boolean>>({});

  function toggleRole(deptId: string, role: string) {
    const key = `${deptId}:${role}`;
    setHumanRoles(prev => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleHead(deptId: string) {
    const key = `${deptId}:__head__`;
    setHumanRoles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const aiCount = orgChart ? orgChart.departments.reduce((sum, dept) => {
    const headIsHuman = humanRoles[`${dept.id}:__head__`];
    const humanAgents = dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
    return sum + (headIsHuman ? 0 : 1) + (dept.ai_roles.length - humanAgents);
  }, 0) : 0;
  const humanCount = orgChart ? orgChart.departments.reduce((sum, dept) => {
    const headIsHuman = humanRoles[`${dept.id}:__head__`] ? 1 : 0;
    const humanAgents = dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
    return sum + headIsHuman + humanAgents;
  }, 0) : 0;

  useEffect(() => { fetchIntakeResults(); }, []); // eslint-disable-line

  async function fetchIntakeResults() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/onboarding/intake-results");
      applyIntake(res.data);
    } catch {
      if (workspace?.website_url) {
        try { const res = await api.post("/api/v1/onboarding/intake-from-url", { url: workspace.website_url }); applyIntake(res.data); }
        catch { setError("Could not analyze website."); setCompanyName(workspace?.name || ""); }
      } else { setCompanyName(workspace?.name || ""); }
    } finally { setTimeout(() => setLoading(false), 4200); }
  }

  function applyIntake(data: IntakeResult) {
    setIntake(data);
    setCompanyName(data.detected_company_name || workspace?.name || "");
    setIndustry(data.detected_industry || "other");
    if (data.detected_country) setCountry(data.detected_country);
    if (data.detected_city) setCity(data.detected_city);
  }

  useEffect(() => {
    if (industry && industry !== "other") {
      api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${industry}`).then(r => setOrgChart(r.data)).catch(() => {});
    }
  }, [industry]); // eslint-disable-line

  async function handleConfirm() {
    setSaving(true);
    try {
      // Save role assignments (human/AI toggles)
      if (Object.keys(humanRoles).length > 0) {
        await api.put("/api/v1/workspace/role-assignments", { role_map: humanRoles }).catch(() => {});
      }
      await api.post("/api/v1/onboarding/company", { industry, country, city, team_size: orgChart?.total_ai_agents || 1, primary_goal: "" });
      if (intake) {
        const sl: Record<string, string> = {};
        for (const [p, urls] of Object.entries(intake.detected_social_links)) { if (urls.length > 0) sl[p] = urls[0]; }
        await api.post("/api/v1/onboarding/presence", {
          website_url: intake.url || workspace?.website_url || "", social_links: sl,
          whatsapp_link: intake.detected_whatsapp_links[0] || "", contact_page: intake.detected_contact_pages[0] || "",
          phone: intake.detected_phone_numbers[0] || "", google_business_url: "",
        });
      }
      router.push("/app/onboarding/competitors");
    } catch { router.push("/app/onboarding/competitors"); }
    finally { setSaving(false); }
  }

  const socialCount = intake ? Object.values(intake.detected_social_links).filter(u => u.length > 0).length : 0;
  const totalDetected = intake ? (intake.detected_company_name ? 1 : 0) + (intake.detected_industry !== "other" ? 1 : 0) + intake.detected_phone_numbers.length + intake.detected_emails.length + socialCount + intake.detected_whatsapp_links.length + intake.detected_contact_pages.length + intake.detected_tech_stack.length : 0;

  const ic = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-aeos-400 focus:bg-white focus:ring-2 focus:ring-aeos-100 transition-all";

  if (loading) return <LoadingScreen />;

  const visibleDepts = showAllDepts ? (orgChart?.departments || []) : (orgChart?.departments || []).slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="space-y-4">
      {/* Hero banner */}
      {intake && totalDetected > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-aeos-600 via-aeos-500 to-emerald-500 px-5 py-4 text-white shadow-lg shadow-aeos-300/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
          <div className="relative flex items-center gap-4">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles size={24} className="text-white" />
              </div>
            </motion.div>
            <div>
              <p className="text-base font-bold">{totalDetected} items detected from your website</p>
              <p className="text-sm text-white/80">Review your profile and customize your AI team below</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
              <CheckCircle2 size={14} />
              <span className="text-xs font-semibold">Analysis complete</span>
            </div>
          </div>
        </motion.div>
      )}

      {error && !intake && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 border border-amber-200">{error}</motion.div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Company Identity */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-600">
                <Building2 size={15} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Company Identity</h2>
              {intake && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-semibold text-emerald-600 ring-1 ring-emerald-200">
                  Auto-detected
                </motion.span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Company name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" className={ic} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Industry
                  {intake && intake.industry_confidence > 0 && (
                    <span className="ml-1.5 rounded-full bg-aeos-50 px-1.5 py-px text-2xs font-bold text-aeos-600">
                      {Math.round(intake.industry_confidence * 100)}% match
                    </span>
                  )}
                </label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className={ic}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{INDUSTRY_LABELS[i] || i}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                    Country {intake?.detected_country && <CheckCircle2 size={10} className="text-emerald-500" />}
                  </label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Jordan" className={ic} />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                    City {intake?.detected_city && <CheckCircle2 size={10} className="text-emerald-500" />}
                  </label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Amman" className={ic} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contacts & Social */}
          {intake && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Phone size={15} className="text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Contacts & Social</h2>
              </div>

              {/* Contact grid */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                {[
                  { icon: Phone, label: "Phone", value: intake.detected_phone_numbers[0] || "", found: intake.detected_phone_numbers.length > 0 },
                  { icon: Mail, label: "Email", value: intake.detected_emails[0] || "", found: intake.detected_emails.length > 0 },
                  { icon: MessageCircle, label: "WhatsApp", value: intake.detected_whatsapp_links.length ? "Connected" : "", found: intake.detected_whatsapp_links.length > 0 },
                  { icon: ExternalLink, label: "Contact page", value: intake.detected_contact_pages.length ? "Found" : "", found: intake.detected_contact_pages.length > 0 },
                ].map(({ icon: Icon, label, value, found }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                      found ? "bg-emerald-50/70 ring-1 ring-emerald-100" : "bg-slate-50"
                    }`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${found ? "bg-emerald-500" : "bg-slate-200"}`}>
                      <Icon size={12} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xs text-slate-500">{label}</p>
                      <p className={`truncate text-xs ${found ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                        {found ? value : "Not detected"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social profiles */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Social profiles</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(SOCIAL_LABELS).map(([p, label]) => {
                    const urls = intake.detected_social_links[p] || [];
                    const found = urls.length > 0;
                    if (!found) return null;
                    const url = urls[0];
                    const handle = url.replace(/https?:\/\/(www\.)?(linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|tiktok\.com|pinterest\.com|snapchat\.com)\/?/i, "").replace(/\/$/, "") || label;
                    return (
                      <motion.a key={p} href={url} target="_blank" rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100">
                        <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-2xs font-bold text-emerald-700">{label}</p>
                          <p className="truncate text-2xs text-emerald-600/60">{handle.length > 22 ? handle.slice(0, 22) + "..." : handle}</p>
                        </div>
                        <ExternalLink size={10} className="shrink-0 text-emerald-400" />
                      </motion.a>
                    );
                  })}
                </div>
                {/* Not-found pills */}
                {Object.entries(SOCIAL_LABELS).some(([p]) => !(intake.detected_social_links[p]?.length > 0)) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Object.entries(SOCIAL_LABELS).filter(([p]) => !(intake.detected_social_links[p]?.length > 0)).map(([p, label]) => (
                      <span key={p} className="inline-flex items-center gap-0.5 rounded-full bg-slate-50 px-2 py-0.5 text-2xs text-slate-400 ring-1 ring-slate-100">
                        <XCircle size={8} />{label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tech stack */}
              {intake.detected_tech_stack.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-600">Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intake.detected_tech_stack.slice(0, 8).map((t, i) => (
                      <motion.span key={t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.03 }}
                        className="rounded-lg bg-blue-50 px-2 py-0.5 text-2xs font-semibold text-blue-700 ring-1 ring-blue-100">{t}</motion.span>
                    ))}
                    {intake.detected_tech_stack.length > 8 && (
                      <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-2xs text-slate-400">+{intake.detected_tech_stack.length - 8}</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right column: Interactive AI Org Chart Hierarchy */}
        {orgChart && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-100/50">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Bot size={15} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">AI Organization Chart</h2>
              <span className="ml-auto rounded-full bg-slate-50 px-2 py-0.5 text-2xs text-slate-500 ring-1 ring-slate-100">
                Click nodes to toggle
              </span>
            </div>

            {/* Stats bar */}
            <div className="mb-4 flex gap-2">
              <div className="flex-1 rounded-lg bg-gradient-to-r from-aeos-500 to-aeos-600 px-3 py-2 text-white text-center shadow-sm">
                <p className="text-lg font-bold">{aiCount}</p>
                <p className="text-2xs text-white/70">AI Agents</p>
              </div>
              <div className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 text-white text-center shadow-sm">
                <p className="text-lg font-bold">{humanCount}</p>
                <p className="text-2xs text-white/70">Humans</p>
              </div>
              <div className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-700 px-3 py-2 text-white text-center shadow-sm">
                <p className="text-lg font-bold">{orgChart.total_departments}</p>
                <p className="text-2xs text-white/70">Depts</p>
              </div>
            </div>

            {/* ── Visual Org Chart Tree ────────────────────────── */}
            <div className="relative overflow-x-auto pb-2">
              {/* CEO Node at top */}
              <div className="flex flex-col items-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="relative z-10 flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2.5 text-white shadow-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow">
                    <Users size={14} className="text-slate-900" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">CEO / Owner</p>
                    <p className="text-2xs text-slate-400">You</p>
                  </div>
                </motion.div>

                {/* Vertical line from CEO */}
                <div className="h-5 w-px bg-slate-300" />

                {/* Horizontal connector bar */}
                <div className="relative w-full">
                  <div className="mx-auto h-px bg-slate-300" style={{ width: `${Math.min(100, visibleDepts.length * 11)}%` }} />
                </div>

                {/* Department heads grid with vertical lines */}
                <div className="mt-0 grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(visibleDepts.length, 3)}, 1fr)` }}>
                  {visibleDepts.map((dept, idx) => {
                    const Icon = DEPT_ICONS[dept.icon] || Bot;
                    const grad = DEPT_COLORS[dept.id] || "from-gray-500 to-gray-600";
                    const isExpanded = expandedDept === dept.id;
                    const headIsHuman = humanRoles[`${dept.id}:__head__`];
                    const deptHumanCount = (headIsHuman ? 1 : 0) + dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
                    const deptAiCount = (headIsHuman ? 0 : 1) + dept.ai_roles.filter(r => !humanRoles[`${dept.id}:${r}`]).length;

                    return (
                      <motion.div key={dept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + idx * 0.06 }}
                        className="flex flex-col items-center">
                        {/* Vertical connector from horizontal bar */}
                        <div className="h-4 w-px bg-slate-300" />

                        {/* Department head node */}
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                          className={`group relative w-full rounded-xl border p-2.5 text-center transition-all ${
                            isExpanded
                              ? "border-aeos-300 bg-aeos-50/50 shadow-md ring-1 ring-aeos-200"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                          }`}>
                          {/* Dept icon */}
                          <div className={`mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-white shadow-sm`}>
                            <Icon size={16} />
                          </div>
                          {/* Dept name */}
                          <p className="text-2xs font-bold text-slate-900 leading-tight">{dept.name}</p>
                          {/* Head name with AI/Human badge */}
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); toggleHead(dept.id); }}
                            className={`mx-auto mt-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold transition-colors ${
                              headIsHuman
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-aeos-100 text-aeos-700 hover:bg-aeos-200"
                            }`}>
                            {headIsHuman ? <Users size={8} /> : <Bot size={8} />}
                            {dept.ai_head.replace(" AI", "").split(" ").slice(0, 2).join(" ")}
                          </motion.button>
                          {/* Agent count */}
                          <p className="mt-1 text-2xs text-slate-400">{deptAiCount} AI · {deptHumanCount} human</p>
                          {/* Expand indicator */}
                          <ChevronDown size={10} className={`mx-auto mt-0.5 text-slate-300 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </motion.button>

                        {/* Expanded: Team members tree */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                              className="w-full overflow-hidden">
                              {/* Vertical line from dept to team */}
                              <div className="mx-auto h-3 w-px bg-slate-300" />
                              <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                                {dept.ai_roles.map((role, ri) => {
                                  const isHuman = humanRoles[`${dept.id}:${role}`];
                                  return (
                                    <motion.button key={role} whileTap={{ scale: 0.97 }}
                                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: ri * 0.04 }}
                                      onClick={() => toggleRole(dept.id, role)}
                                      className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-all ${
                                        isHuman ? "bg-blue-50 ring-1 ring-blue-200" : "bg-white ring-1 ring-slate-100 hover:ring-slate-200"
                                      }`}>
                                      {/* Connector dot */}
                                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                        isHuman ? "bg-blue-400" : "bg-slate-300"
                                      }`}>
                                        {isHuman ? <Users size={8} className="text-white" /> : <Bot size={8} className="text-white" />}
                                      </div>
                                      <span className="flex-1 truncate text-2xs text-slate-700">{role.replace(" Agent", "")}</span>
                                      <span className={`shrink-0 rounded-full px-1.5 py-px text-2xs font-medium ${
                                        isHuman ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                      }`}>{isHuman ? "👤" : "🤖"}</span>
                                    </motion.button>
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

                {orgChart.departments.length > 6 && !showAllDepts && (
                  <button onClick={() => setShowAllDepts(true)}
                    className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-xs font-medium text-aeos-600 ring-1 ring-slate-100 transition-colors hover:bg-aeos-50 hover:ring-aeos-200">
                    Show all {orgChart.departments.length} departments ↓
                  </button>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-aeos-500">
                  <Bot size={8} className="text-white" />
                </div>
                <span className="text-2xs text-slate-500">AI Agent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                  <Users size={8} className="text-white" />
                </div>
                <span className="text-2xs text-slate-500">Human</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
                  <Users size={8} className="text-slate-900" />
                </div>
                <span className="text-2xs text-slate-500">You (CEO)</span>
              </div>
            </div>

            {humanCount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2.5 ring-1 ring-blue-100">
                <p className="text-xs text-blue-700">
                  <span className="font-bold">{humanCount}</span> position{humanCount > 1 ? "s" : ""} marked as human —
                  AEOS will deploy <span className="font-bold">{aiCount}</span> AI agents for the rest.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Confirm button */}
      <motion.button onClick={handleConfirm} disabled={saving}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-aeos-600 via-aeos-500 to-emerald-500 py-4 text-sm font-bold text-white shadow-xl shadow-aeos-300/30 transition-all hover:shadow-2xl disabled:opacity-50">
        {saving ? (
          <><Loader2 size={18} className="animate-spin" /> Deploying your AI agents...</>
        ) : (
          <><Rocket size={18} /> Confirm and deploy AI agents <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
        )}
      </motion.button>
    </motion.div>
  );
}
