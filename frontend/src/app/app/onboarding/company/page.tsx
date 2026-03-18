"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

const INDUSTRIES = [
  "ecommerce", "healthcare", "travel", "restaurant", "education",
  "real_estate", "saas", "agency", "design_creative", "engineering",
  "construction", "manufacturing", "technology", "retail", "finance",
  "logistics", "media_entertainment", "nonprofit", "professional_services", "other",
];

const INDUSTRY_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  healthcare: "Healthcare",
  travel: "Travel & Tourism",
  restaurant: "Restaurant & Food",
  education: "Education",
  real_estate: "Real Estate",
  saas: "SaaS / Software",
  agency: "Agency / Marketing",
  design_creative: "Design & Creative",
  engineering: "Engineering & Solutions",
  construction: "Construction",
  manufacturing: "Manufacturing",
  technology: "Technology & IT",
  retail: "Retail",
  finance: "Finance & Banking",
  logistics: "Logistics & Supply Chain",
  media_entertainment: "Media & Entertainment",
  nonprofit: "Non-profit",
  professional_services: "Professional Services",
  other: "Other",
};

const SOCIAL_ICONS: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
};

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
  id: string;
  name: string;
  icon: string;
  status: string;
  ai_head: string;
  ai_agents: number;
  ai_roles: string[];
  description: string;
  priority_rank: number;
}

interface OrgChart {
  total_ai_agents: number;
  total_departments: number;
  departments: OrgDepartment[];
  summary: string;
}

const DEPT_ICONS: Record<string, any> = {
  brain: Brain,
  target: Target,
  megaphone: Megaphone,
  users: Users,
  wallet: Wallet,
  shield: Shield,
  settings: Settings,
  cpu: Cpu,
  package: Package,
  heart: Heart,
  calendar: CalendarDays,
  sparkles: Sparkles,
};

const DEPT_COLORS: Record<string, string> = {
  strategy: "from-violet-500 to-purple-600",
  sales: "from-orange-500 to-red-500",
  marketing: "from-pink-500 to-rose-500",
  hr: "from-blue-500 to-indigo-500",
  finance: "from-emerald-500 to-green-600",
  legal: "from-slate-500 to-gray-600",
  operations: "from-amber-500 to-yellow-600",
  it: "from-cyan-500 to-teal-500",
  procurement: "from-lime-500 to-green-500",
  reservations: "from-blue-400 to-blue-600",
  guest_relations: "from-rose-400 to-pink-600",
  partnerships: "from-teal-500 to-emerald-600",
  patient_care: "from-red-400 to-rose-500",
  clinical_ops: "from-sky-500 to-blue-600",
  billing: "from-emerald-500 to-green-600",
  compliance: "from-gray-500 to-slate-600",
  front_house: "from-amber-400 to-orange-500",
  kitchen_ops: "from-red-500 to-orange-600",
  delivery: "from-blue-500 to-cyan-500",
  customer_service: "from-pink-400 to-rose-500",
  customer_success: "from-pink-400 to-rose-500",
  creative: "from-fuchsia-500 to-purple-600",
  project_mgmt: "from-indigo-500 to-blue-600",
  client_services: "from-orange-400 to-amber-500",
  digital: "from-cyan-500 to-blue-500",
  technical: "from-slate-500 to-gray-700",
  safety: "from-red-500 to-red-700",
  product: "from-violet-500 to-indigo-600",
  devops: "from-gray-600 to-gray-800",
  elearning: "from-blue-400 to-indigo-500",
  academic: "from-emerald-400 to-teal-500",
  student_services: "from-amber-400 to-orange-500",
  risk: "from-red-500 to-rose-600",
  production: "from-orange-500 to-amber-600",
  supply_chain: "from-teal-500 to-green-600",
  rd: "from-purple-500 to-violet-600",
  warehouse: "from-amber-500 to-yellow-600",
  customs: "from-slate-500 to-gray-600",
  estimating: "from-blue-500 to-indigo-500",
  property_mgmt: "from-amber-500 to-orange-500",
  valuation: "from-emerald-500 to-teal-500",
  transactions: "from-slate-500 to-gray-600",
};

function DetectedItem({ icon: Icon, label, value, found }: {
  icon: any;
  label: string;
  value: string;
  found: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${found ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-medium text-fg-muted">{label}</p>
        <p className={`truncate text-sm ${found ? "text-fg" : "text-fg-hint"}`}>
          {found ? value : "Not detected"}
        </p>
      </div>
      {found ? (
        <CheckCircle2 size={14} className="mt-1 shrink-0 text-emerald-500" />
      ) : (
        <XCircle size={14} className="mt-1 shrink-0 text-slate-300" />
      )}
    </div>
  );
}

export default function OnboardingCompany() {
  const router = useRouter();
  const { workspace } = useAuth();

  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<IntakeResult | null>(null);
  const [error, setError] = useState("");

  // Editable fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  // Org chart
  const [orgChart, setOrgChart] = useState<OrgChart | null>(null);

  // Fetch intake results on mount
  useEffect(() => {
    fetchIntakeResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchIntakeResults() {
    setLoading(true);
    try {
      // Try GET endpoint first (stored results from registration)
      const res = await api.get("/api/v1/onboarding/intake-results");
      const data: IntakeResult = res.data;
      setIntake(data);
      setCompanyName(data.detected_company_name || workspace?.name || "");
      setIndustry(data.detected_industry || "other");
      if (data.detected_country) setCountry(data.detected_country);
      if (data.detected_city) setCity(data.detected_city);
    } catch (err: any) {
      // If no stored results, try POST with workspace URL
      if (workspace?.website_url) {
        try {
          const res = await api.post("/api/v1/onboarding/intake-from-url", {
            url: workspace.website_url,
          });
          const data: IntakeResult = res.data;
          setIntake(data);
          setCompanyName(data.detected_company_name || workspace?.name || "");
          setIndustry(data.detected_industry || "other");
          if (data.detected_country) setCountry(data.detected_country);
          if (data.detected_city) setCity(data.detected_city);
        } catch {
          setError("Could not analyze website. You can fill in details manually.");
          setCompanyName(workspace?.name || "");
        }
      } else {
        setCompanyName(workspace?.name || "");
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch org chart when industry changes
  useEffect(() => {
    if (industry && industry !== "other") {
      fetchOrgChart(industry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  async function fetchOrgChart(ind: string) {
    try {
      const res = await api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${ind}`);
      setOrgChart(res.data);
    } catch {
      // Non-critical — org chart is a nice-to-have
    }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      // Save company profile
      await api.post("/api/v1/onboarding/company", {
        industry,
        country,
        city,
        team_size: orgChart?.total_ai_agents || 1,
        primary_goal: "",
      });

      // Save presence data from intake
      if (intake) {
        const socialLinks: Record<string, string> = {};
        for (const [platform, urls] of Object.entries(intake.detected_social_links)) {
          if (urls.length > 0) socialLinks[platform] = urls[0];
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
    ? (intake.detected_company_name ? 1 : 0) +
      (intake.detected_industry !== "other" ? 1 : 0) +
      intake.detected_phone_numbers.length +
      intake.detected_emails.length +
      socialCount +
      intake.detected_whatsapp_links.length +
      intake.detected_contact_pages.length +
      intake.detected_tech_stack.length
    : 0;

  const inputClass =
    "w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100";

  /* ── Loading: Analyzing website ──────────────────────────────── */

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <div className="flex flex-col items-center gap-5 py-12">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-50 to-aeos-100">
              <Globe size={36} className="text-aeos-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
              <Loader2 size={16} className="animate-spin text-aeos-500" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-fg">Analyzing your website</h2>
            <p className="mt-2 max-w-sm text-sm text-fg-muted">
              AEOS is scanning your website to detect company info, contacts, social profiles, and technology stack...
            </p>
          </div>
          <div className="flex gap-2">
            {["Company info", "Contacts", "Social media", "Tech stack"].map((step) => (
              <span
                key={step}
                className="animate-pulse rounded-full bg-aeos-50 px-3 py-1 text-2xs font-medium text-aeos-600"
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Results: Confirmation screen ────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header with detection summary */}
      {intake && totalDetected > 0 && (
        <div className="rounded-2xl border border-aeos-200 bg-gradient-to-br from-aeos-50/50 to-emerald-50/30 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aeos-100">
              <Sparkles size={20} className="text-aeos-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-aeos-800">
                {totalDetected} items detected from your website
              </h3>
              <p className="text-2xs text-aeos-600">
                AEOS analyzed your website and found the following information
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !intake && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
      )}

      {/* Company identity */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <Building2 size={16} className="text-fg-muted" />
          <h2 className="text-base font-bold text-fg">Company identity</h2>
          {intake && (
            <span className="ml-auto text-2xs text-fg-hint">Edit if needed</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Company name
              {intake?.detected_company_name && (
                <span className="ml-2 text-2xs text-emerald-600">Auto-detected</span>
              )}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Industry
              {intake && intake.industry_confidence > 0 && (
                <span className="ml-2 text-2xs text-emerald-600">
                  {Math.round(intake.industry_confidence * 100)}% confident
                </span>
              )}
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputClass}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {INDUSTRY_LABELS[i] || i}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
                Country
                {intake?.detected_country && (
                  <span className="ml-2 text-2xs text-emerald-600">Auto-detected</span>
                )}
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Saudi Arabia"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
                City
                {intake?.detected_city && (
                  <span className="ml-2 text-2xs text-emerald-600">Auto-detected</span>
                )}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Riyadh"
                className={inputClass}
              />
            </div>
          </div>

        </div>
      </div>

      {/* AI Organizational Chart */}
      {orgChart && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Bot size={16} className="text-aeos-600" />
            <h2 className="text-base font-bold text-fg">Your AI-Powered Organization</h2>
          </div>
          <p className="mb-5 text-sm text-fg-muted">
            {orgChart.summary}
          </p>

          {/* Summary stats */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-aeos-500 to-aeos-700 p-4 text-white">
              <p className="text-2xl font-bold">{orgChart.total_ai_agents}</p>
              <p className="text-xs opacity-80">AI Agents Ready</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white">
              <p className="text-2xl font-bold">{orgChart.total_departments}</p>
              <p className="text-xs opacity-80">Departments Covered</p>
            </div>
          </div>

          {/* Department cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgChart.departments.map((dept, idx) => {
              const IconComponent = DEPT_ICONS[dept.icon] || Bot;
              const gradient = DEPT_COLORS[dept.id] || "from-gray-500 to-gray-600";
              return (
                <div
                  key={dept.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface-secondary p-4 transition hover:border-aeos-300 hover:shadow-md"
                >
                  {/* Priority badge */}
                  {idx < 3 && (
                    <span className="absolute right-2 top-2 rounded-full bg-aeos-50 px-1.5 py-0.5 text-2xs font-bold text-aeos-600">
                      #{idx + 1}
                    </span>
                  )}

                  {/* Department icon + name */}
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white`}>
                      <IconComponent size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-fg">{dept.name}</p>
                      <p className="text-2xs text-fg-hint">{dept.description}</p>
                    </div>
                  </div>

                  {/* AI Head */}
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-aeos-50/50 px-2.5 py-1.5">
                    <Bot size={12} className="text-aeos-600" />
                    <span className="text-2xs font-semibold text-aeos-700">{dept.ai_head}</span>
                  </div>

                  {/* AI Specialist roles */}
                  <div className="space-y-1">
                    {dept.ai_roles.map((role) => (
                      <div key={role} className="flex items-center gap-2 pl-1">
                        <div className="h-1 w-1 rounded-full bg-aeos-400" />
                        <span className="text-2xs text-fg-muted">{role}</span>
                      </div>
                    ))}
                  </div>

                  {/* Agent count */}
                  <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
                    <Bot size={10} className="text-fg-hint" />
                    <span className="text-2xs font-medium text-fg-muted">
                      {dept.ai_agents} AI agent{dept.ai_agents > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detected contact information */}
      {intake && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Phone size={16} className="text-fg-muted" />
            <h2 className="text-base font-bold text-fg">Contact information</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetectedItem
              icon={Phone}
              label="Phone numbers"
              value={intake.detected_phone_numbers.join(", ")}
              found={intake.detected_phone_numbers.length > 0}
            />
            <DetectedItem
              icon={Mail}
              label="Email addresses"
              value={intake.detected_emails.join(", ")}
              found={intake.detected_emails.length > 0}
            />
            <DetectedItem
              icon={MessageCircle}
              label="WhatsApp"
              value={intake.detected_whatsapp_links.join(", ")}
              found={intake.detected_whatsapp_links.length > 0}
            />
            <DetectedItem
              icon={ExternalLink}
              label="Contact pages"
              value={intake.detected_contact_pages.length + " found"}
              found={intake.detected_contact_pages.length > 0}
            />
            <DetectedItem
              icon={Calendar}
              label="Booking pages"
              value={intake.detected_booking_pages.length + " found"}
              found={intake.detected_booking_pages.length > 0}
            />
          </div>
        </div>
      )}

      {/* Social media profiles */}
      {intake && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Share2 size={16} className="text-fg-muted" />
            <h2 className="text-base font-bold text-fg">Social media profiles</h2>
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
                <div
                  key={platform}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                    found
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-border bg-surface-secondary"
                  }`}
                >
                  {found ? (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle size={14} className="shrink-0 text-slate-300" />
                  )}
                  <span className={`text-sm ${found ? "font-medium text-fg" : "text-fg-hint"}`}>
                    {label}
                  </span>
                  {found && (
                    <span className="ml-auto truncate text-2xs text-fg-muted max-w-[120px]">
                      {urls[0].replace(/https?:\/\/(www\.)?/, "").split("/").slice(0, 2).join("/")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech stack */}
      {intake && intake.detected_tech_stack.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Cpu size={16} className="text-fg-muted" />
            <h2 className="text-base font-bold text-fg">Technology stack</h2>
            <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-2xs font-semibold text-blue-700">
              {intake.detected_tech_stack.length} detected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {intake.detected_tech_stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-widget bg-aeos-600 py-3 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Confirm and continue
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
