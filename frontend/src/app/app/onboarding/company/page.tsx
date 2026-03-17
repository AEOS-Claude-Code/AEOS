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
} from "lucide-react";

const INDUSTRIES = [
  "ecommerce", "healthcare", "travel", "restaurant", "education",
  "real_estate", "saas", "agency", "retail", "professional_services", "other",
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
  retail: "Retail",
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
  const [teamSize, setTeamSize] = useState(1);
  const [saving, setSaving] = useState(false);

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

  async function handleConfirm() {
    setSaving(true);
    try {
      // Save company profile
      await api.post("/api/v1/onboarding/company", {
        industry,
        country,
        city,
        team_size: teamSize,
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
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Saudi Arabia"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Riyadh"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Team size</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={teamSize}
              onChange={(e) => setTeamSize(+e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

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
