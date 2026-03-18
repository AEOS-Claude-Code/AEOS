"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";
import {
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Share2,
  Cpu,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Calendar,
  ChevronRight,
  Building2,
  Bot,
  Users,
  Brain,
  Target,
  Megaphone,
  Wallet,
  Shield,
  Settings,
  Package,
  Heart,
  CalendarDays,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";

/* ── Constants ────────────────────────────────────────────────── */

const INDUSTRIES = [
  "ecommerce", "healthcare", "travel", "restaurant", "education",
  "real_estate", "saas", "agency", "design_creative", "engineering",
  "construction", "manufacturing", "technology", "retail", "finance",
  "logistics", "media_entertainment", "nonprofit", "professional_services", "other",
];

const INDUSTRY_LABELS: Record<string, string> = {
  ecommerce: "E-commerce", healthcare: "Healthcare", travel: "Travel & Tourism",
  restaurant: "Restaurant & Food", education: "Education", real_estate: "Real Estate",
  saas: "SaaS / Software", agency: "Agency / Marketing", design_creative: "Design & Creative",
  engineering: "Engineering & Solutions", construction: "Construction",
  manufacturing: "Manufacturing", technology: "Technology & IT", retail: "Retail",
  finance: "Finance & Banking", logistics: "Logistics & Supply Chain",
  media_entertainment: "Media & Entertainment", nonprofit: "Non-profit",
  professional_services: "Professional Services", other: "Other",
};

const SOCIAL_ICONS: Record<string, string> = {
  linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram",
  twitter: "X (Twitter)", youtube: "YouTube", tiktok: "TikTok",
  pinterest: "Pinterest", snapchat: "Snapchat",
};

const DEPT_ICONS: Record<string, any> = {
  brain: Brain, target: Target, megaphone: Megaphone, users: Users,
  wallet: Wallet, shield: Shield, settings: Settings, cpu: Cpu,
  package: Package, heart: Heart, calendar: CalendarDays, sparkles: Sparkles,
};

const DEPT_COLORS: Record<string, string> = {
  strategy: "from-violet-500 to-purple-600", sales: "from-orange-500 to-red-500",
  marketing: "from-pink-500 to-rose-500", hr: "from-blue-500 to-indigo-500",
  finance: "from-emerald-500 to-green-600", legal: "from-slate-500 to-gray-600",
  operations: "from-amber-500 to-yellow-600", it: "from-cyan-500 to-teal-500",
  procurement: "from-lime-500 to-green-500", reservations: "from-blue-400 to-blue-600",
  guest_relations: "from-rose-400 to-pink-600", partnerships: "from-teal-500 to-emerald-600",
  patient_care: "from-red-400 to-rose-500", clinical_ops: "from-sky-500 to-blue-600",
  billing: "from-emerald-500 to-green-600", compliance: "from-gray-500 to-slate-600",
  front_house: "from-amber-400 to-orange-500", kitchen_ops: "from-red-500 to-orange-600",
  delivery: "from-blue-500 to-cyan-500", customer_service: "from-pink-400 to-rose-500",
  customer_success: "from-pink-400 to-rose-500", creative: "from-fuchsia-500 to-purple-600",
  project_mgmt: "from-indigo-500 to-blue-600", client_services: "from-orange-400 to-amber-500",
  digital: "from-cyan-500 to-blue-500", technical: "from-slate-500 to-gray-700",
  safety: "from-red-500 to-red-700", product: "from-violet-500 to-indigo-600",
  devops: "from-gray-600 to-gray-800", elearning: "from-blue-400 to-indigo-500",
  academic: "from-emerald-400 to-teal-500", student_services: "from-amber-400 to-orange-500",
  risk: "from-red-500 to-rose-600", production: "from-orange-500 to-amber-600",
  supply_chain: "from-teal-500 to-green-600", rd: "from-purple-500 to-violet-600",
  warehouse: "from-amber-500 to-yellow-600", customs: "from-slate-500 to-gray-600",
  estimating: "from-blue-500 to-indigo-500", property_mgmt: "from-amber-500 to-orange-500",
  valuation: "from-emerald-500 to-teal-500", transactions: "from-slate-500 to-gray-600",
};

/* ── Types ────────────────────────────────────────────────────── */

interface IntakeResult {
  url: string;
  detected_company_name: string;
  detected_industry: string;
  industry_confidence: number;
  detected_country: string;
  detected_city: string;
  detected_phone_numbers: string[];
  detected_emails: string[];
  detected_social_links: Record<string, string[]>;
  detected_whatsapp_links: string[];
  detected_contact_pages: string[];
  detected_booking_pages: string[];
  detected_tech_stack: string[];
  page_title: string;
  meta_description: string;
}

interface OrgDepartment {
  id: string; name: string; icon: string; status: string;
  ai_head: string; ai_agents: number; ai_roles: string[];
  description: string; priority_rank: number;
}

interface OrgChart {
  total_ai_agents: number; total_departments: number;
  departments: OrgDepartment[]; summary: string;
}

/* ── Animated counter hook ────────────────────────────────────── */

function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let start = 0;
    const step = Math.max(1, Math.floor(target / (duration / 30)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ── Scanning step component ──────────────────────────────────── */

function ScanStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 transition-all duration-500 ${done ? "opacity-100" : active ? "opacity-100" : "opacity-40"}`}>
      {done ? (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
          <Check size={12} className="text-white" />
        </div>
      ) : active ? (
        <Loader2 size={18} className="animate-spin text-aeos-500" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
      )}
      <span className={`text-sm ${done ? "font-medium text-emerald-700" : active ? "font-medium text-aeos-700" : "text-fg-hint"}`}>
        {label}
      </span>
    </div>
  );
}

/* ── Section wrapper with fade-in ─────────────────────────────── */

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      {children}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export default function OnboardingCompany() {
  const router = useRouter();
  const { workspace } = useAuth();

  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<IntakeResult | null>(null);
  const [error, setError] = useState("");

  // Scanning animation steps
  const [scanStep, setScanStep] = useState(0);

  // Editable fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  // Org chart
  const [orgChart, setOrgChart] = useState<OrgChart | null>(null);

  // Scanning animation
  useEffect(() => {
    if (!loading) return;
    const steps = [800, 1800, 3000, 4500];
    const timers = steps.map((ms, i) => setTimeout(() => setScanStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // Fetch intake results on mount
  useEffect(() => {
    fetchIntakeResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchIntakeResults() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/onboarding/intake-results");
      const data: IntakeResult = res.data;
      applyIntake(data);
    } catch {
      if (workspace?.website_url) {
        try {
          const res = await api.post("/api/v1/onboarding/intake-from-url", { url: workspace.website_url });
          applyIntake(res.data);
        } catch {
          setError("Could not analyze website. You can fill in details manually.");
          setCompanyName(workspace?.name || "");
        }
      } else {
        setCompanyName(workspace?.name || "");
      }
    } finally {
      // Brief delay so scan animation completes
      setTimeout(() => setLoading(false), 1000);
    }
  }

  function applyIntake(data: IntakeResult) {
    setIntake(data);
    setCompanyName(data.detected_company_name || workspace?.name || "");
    setIndustry(data.detected_industry || "other");
    if (data.detected_country) setCountry(data.detected_country);
    if (data.detected_city) setCity(data.detected_city);
  }

  // Fetch org chart when industry changes
  useEffect(() => {
    if (industry && industry !== "other") fetchOrgChart(industry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  async function fetchOrgChart(ind: string) {
    try {
      const res = await api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${ind}`);
      setOrgChart(res.data);
    } catch { /* non-critical */ }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await api.post("/api/v1/onboarding/company", {
        industry, country, city, team_size: orgChart?.total_ai_agents || 1, primary_goal: "",
      });
      if (intake) {
        const socialLinks: Record<string, string> = {};
        for (const [p, urls] of Object.entries(intake.detected_social_links)) {
          if (urls.length > 0) socialLinks[p] = urls[0];
        }
        await api.post("/api/v1/onboarding/presence", {
          website_url: intake.url || workspace?.website_url || "",
          social_links: socialLinks,
          whatsapp_link: intake.detected_whatsapp_links[0] || "",
          contact_page: intake.detected_contact_pages[0] || "",
          phone: intake.detected_phone_numbers[0] || "",
          google_business_url: "",
        });
      }
      router.push("/app/onboarding/competitors");
    } catch {
      router.push("/app/onboarding/competitors");
    } finally {
      setSaving(false);
    }
  }

  const socialCount = intake
    ? Object.values(intake.detected_social_links).filter((u) => u.length > 0).length
    : 0;

  const totalDetected = intake
    ? (intake.detected_company_name ? 1 : 0) + (intake.detected_industry !== "other" ? 1 : 0) +
      intake.detected_phone_numbers.length + intake.detected_emails.length + socialCount +
      intake.detected_whatsapp_links.length + intake.detected_contact_pages.length +
      intake.detected_tech_stack.length
    : 0;

  const animatedAgents = useAnimatedCount(orgChart?.total_ai_agents || 0);
  const animatedDepts = useAnimatedCount(orgChart?.total_departments || 0);

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100 transition-all";

  /* ── Loading: Animated scanning ──────────────────────────────── */

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <div className="flex flex-col items-center gap-6 py-10">
          {/* Animated globe */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-aeos-400 to-aeos-700 shadow-lg shadow-aeos-200">
              <Globe size={44} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
              <Loader2 size={20} className="animate-spin text-aeos-500" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 -m-4 animate-ping rounded-3xl border-2 border-aeos-200 opacity-30" />
            <div className="absolute inset-0 -m-8 animate-ping rounded-3xl border border-aeos-100 opacity-20" style={{ animationDelay: "0.5s" }} />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-fg">AEOS is analyzing your website</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Our AI is scanning every page to build your company profile
            </p>
          </div>

          {/* Scanning steps */}
          <div className="w-full max-w-xs space-y-3">
            <ScanStep label="Fetching website content" done={scanStep >= 1} active={scanStep === 0} />
            <ScanStep label="Detecting company info" done={scanStep >= 2} active={scanStep === 1} />
            <ScanStep label="Extracting contacts & social" done={scanStep >= 3} active={scanStep === 2} />
            <ScanStep label="Building your AI org chart" done={scanStep >= 4} active={scanStep === 3} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Results ─────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      {intake && totalDetected > 0 && (
        <FadeIn>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-aeos-600 via-aeos-500 to-emerald-500 p-6 text-white shadow-lg shadow-aeos-200">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <Zap size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {totalDetected} items detected from your website
                </h3>
                <p className="mt-0.5 text-sm text-white/80">
                  AEOS analyzed your website and built a complete company profile
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {error && !intake && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      {/* Company identity */}
      <FadeIn delay={100}>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <Building2 size={16} className="text-aeos-600" />
            <h2 className="text-base font-bold text-fg">Company Identity</h2>
            {intake && (
              <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-medium text-emerald-600">
                Auto-detected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Company name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
                Industry
                {intake && intake.industry_confidence > 0 && (
                  <span className="ml-2 rounded-full bg-aeos-50 px-2 py-0.5 text-2xs font-semibold text-aeos-700">
                    {Math.round(intake.industry_confidence * 100)}% match
                  </span>
                )}
              </label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{INDUSTRY_LABELS[i] || i}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
                  Country
                  {intake?.detected_country && <span className="ml-1 text-2xs text-emerald-600">detected</span>}
                </label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Saudi Arabia" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
                  City
                  {intake?.detected_city && <span className="ml-1 text-2xs text-emerald-600">detected</span>}
                </label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Riyadh" className={inputClass} />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* AI Organizational Chart */}
      {orgChart && (
        <FadeIn delay={200}>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Bot size={16} className="text-aeos-600" />
              <h2 className="text-base font-bold text-fg">Your AI-Powered Organization</h2>
            </div>
            <p className="mb-5 text-sm text-fg-muted">{orgChart.summary}</p>

            {/* Animated stats */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700 p-5 text-white shadow-md shadow-aeos-200/50">
                <p className="text-3xl font-bold tabular-nums">{animatedAgents}</p>
                <p className="mt-0.5 text-xs font-medium text-white/70">AI Agents Ready to Deploy</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-md shadow-emerald-200/50">
                <p className="text-3xl font-bold tabular-nums">{animatedDepts}</p>
                <p className="mt-0.5 text-xs font-medium text-white/70">Departments Covered</p>
              </div>
            </div>

            {/* Department cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orgChart.departments.map((dept, idx) => {
                const IconComp = DEPT_ICONS[dept.icon] || Bot;
                const gradient = DEPT_COLORS[dept.id] || "from-gray-500 to-gray-600";
                return (
                  <FadeIn key={dept.id} delay={300 + idx * 80}>
                    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface-secondary p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-aeos-300 hover:shadow-lg">
                      {idx < 3 && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-aeos-100 text-2xs font-bold text-aeos-700">
                          {idx + 1}
                        </span>
                      )}
                      <div className="mb-3 flex items-center gap-2.5">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
                          <IconComp size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-fg leading-tight">{dept.name}</p>
                        </div>
                      </div>
                      <p className="mb-2.5 text-2xs leading-relaxed text-fg-muted">{dept.description}</p>

                      {/* AI Head */}
                      <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-aeos-50 px-2 py-1.5">
                        <Bot size={11} className="text-aeos-600" />
                        <span className="text-2xs font-semibold text-aeos-700">{dept.ai_head}</span>
                      </div>

                      {/* Roles */}
                      <div className="space-y-0.5">
                        {dept.ai_roles.map((role) => (
                          <div key={role} className="flex items-center gap-1.5 pl-0.5">
                            <div className="h-1 w-1 rounded-full bg-aeos-300" />
                            <span className="text-2xs text-fg-muted">{role}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-center gap-1 border-t border-border/50 pt-2">
                        <Bot size={10} className="text-fg-hint" />
                        <span className="text-2xs font-medium text-fg-hint">
                          {dept.ai_agents} AI agent{dept.ai_agents > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Contact information */}
      {intake && (
        <FadeIn delay={300}>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Phone size={16} className="text-aeos-600" />
              <h2 className="text-base font-bold text-fg">Contact Information</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Phone, label: "Phone numbers", value: intake.detected_phone_numbers.join(", "), found: intake.detected_phone_numbers.length > 0 },
                { icon: Mail, label: "Email addresses", value: intake.detected_emails.join(", "), found: intake.detected_emails.length > 0 },
                { icon: MessageCircle, label: "WhatsApp", value: intake.detected_whatsapp_links.length + " found", found: intake.detected_whatsapp_links.length > 0 },
                { icon: ExternalLink, label: "Contact pages", value: intake.detected_contact_pages.length + " found", found: intake.detected_contact_pages.length > 0 },
                { icon: Calendar, label: "Booking pages", value: intake.detected_booking_pages.length + " found", found: intake.detected_booking_pages.length > 0 },
              ].map(({ icon: Icon, label, value, found }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary p-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${found ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs font-medium text-fg-muted">{label}</p>
                    <p className={`truncate text-sm ${found ? "text-fg" : "text-fg-hint"}`}>
                      {found ? value : "Not detected"}
                    </p>
                  </div>
                  {found && <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Social media */}
      {intake && (
        <FadeIn delay={400}>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Share2 size={16} className="text-aeos-600" />
              <h2 className="text-base font-bold text-fg">Social Media</h2>
              {socialCount > 0 && (
                <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-semibold text-emerald-700">
                  {socialCount} found
                </span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(SOCIAL_ICONS).map(([platform, label]) => {
                const urls = intake.detected_social_links[platform] || [];
                const found = urls.length > 0;
                return (
                  <div key={platform} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                    found ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-surface-secondary"
                  }`}>
                    {found ? <CheckCircle2 size={14} className="shrink-0 text-emerald-500" /> : <XCircle size={14} className="shrink-0 text-slate-300" />}
                    <span className={`text-sm ${found ? "font-medium text-fg" : "text-fg-hint"}`}>{label}</span>
                    {found && <span className="ml-auto max-w-[100px] truncate text-2xs text-fg-muted">{urls[0].replace(/https?:\/\/(www\.)?/, "").split("/").slice(0, 2).join("/")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Tech stack */}
      {intake && intake.detected_tech_stack.length > 0 && (
        <FadeIn delay={500}>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-aeos-600" />
              <h2 className="text-base font-bold text-fg">Technology Stack</h2>
              <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-2xs font-semibold text-blue-700">
                {intake.detected_tech_stack.length} detected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {intake.detected_tech_stack.map((tech) => (
                <span key={tech} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Confirm button */}
      <FadeIn delay={600}>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-4 text-sm font-bold text-white shadow-lg shadow-aeos-200/50 transition-all hover:shadow-xl hover:shadow-aeos-300/50 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Deploying your AI organization...
            </>
          ) : (
            <>
              Confirm and deploy AI agents
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </FadeIn>
    </div>
  );
}
