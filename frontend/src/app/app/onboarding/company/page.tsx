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
  Edit3,
  Sparkles,
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

function DetectedBadge({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {count > 0 ? (
        <CheckCircle2 size={14} className="text-emerald-500" />
      ) : (
        <XCircle size={14} className="text-slate-300" />
      )}
      <span className={`text-xs ${count > 0 ? "text-fg" : "text-fg-hint"}`}>
        {count > 0 ? `${count} ${label}` : `No ${label}`}
      </span>
    </div>
  );
}

export default function OnboardingCompany() {
  const router = useRouter();
  const { workspace } = useAuth();

  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [intake, setIntake] = useState<IntakeResult | null>(null);

  // Editable fields (prefilled from intake)
  const [companyName, setCompanyName] = useState(workspace?.name || "");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [teamSize, setTeamSize] = useState(1);
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto-trigger intake scan on mount if workspace has a website_url
  useEffect(() => {
    if (workspace?.website_url && !intake && !scanning) {
      runIntakeScan(workspace.website_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.website_url]);

  async function runIntakeScan(url: string) {
    setScanning(true);
    setScanError("");
    try {
      const res = await api.post("/api/v1/onboarding/intake-from-url", { url });
      const data: IntakeResult = res.data;
      setIntake(data);
      // Prefill from detection
      if (data.detected_company_name) setCompanyName(data.detected_company_name);
      if (data.detected_industry) setIndustry(data.detected_industry);
    } catch (err: any) {
      setScanError(
        err?.response?.data?.detail || "Could not scan website. Fill in details manually."
      );
    } finally {
      setScanning(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Step 1: Save company profile
      await api.post("/api/v1/onboarding/company", {
        industry,
        country,
        city,
        team_size: teamSize,
        primary_goal: goal,
      });

      // Step 2: Save presence data from intake
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

        // Skip presence step — go to competitors
        router.push("/app/onboarding/competitors");
      } else {
        router.push("/app/onboarding/presence");
      }
    } catch {
      router.push("/app/onboarding/presence");
    } finally {
      setSaving(false);
    }
  }

  const socialCount = intake
    ? Object.values(intake.detected_social_links).filter((urls) => urls.length > 0).length
    : 0;

  const inputClass =
    "w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100";

  /* ── Scanning in progress ────────────────────────────────────── */

  if (scanning) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-aeos-50">
              <Globe size={28} className="text-aeos-600" />
            </div>
            <Loader2 size={18} className="absolute -bottom-1 -right-1 animate-spin text-aeos-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-fg">Analyzing your website</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Detecting company info, contacts, social profiles, and tech stack...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Results / manual form ───────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Detected info summary */}
      {intake && (
        <div className="rounded-2xl border border-aeos-200 bg-aeos-50/30 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-aeos-600" />
            <span className="text-sm font-semibold text-aeos-700">
              Website scanned successfully
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <DetectedBadge count={intake.detected_phone_numbers.length} label="phone numbers" />
            <DetectedBadge count={intake.detected_emails.length} label="emails" />
            <DetectedBadge count={socialCount} label="social profiles" />
            <DetectedBadge count={intake.detected_whatsapp_links.length} label="WhatsApp links" />
            <DetectedBadge count={intake.detected_contact_pages.length} label="contact pages" />
            <DetectedBadge count={intake.detected_booking_pages.length} label="booking pages" />
            <DetectedBadge count={intake.detected_tech_stack.length} label="technologies" />
          </div>

          {/* Detected details */}
          <div className="mt-3 space-y-2 border-t border-aeos-200 pt-3">
            {intake.detected_emails.length > 0 && (
              <div className="flex items-start gap-2">
                <Mail size={12} className="mt-0.5 text-fg-hint" />
                <span className="text-2xs text-fg-secondary">
                  {intake.detected_emails.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            {intake.detected_phone_numbers.length > 0 && (
              <div className="flex items-start gap-2">
                <Phone size={12} className="mt-0.5 text-fg-hint" />
                <span className="text-2xs text-fg-secondary">
                  {intake.detected_phone_numbers.slice(0, 2).join(", ")}
                </span>
              </div>
            )}
            {socialCount > 0 && (
              <div className="flex items-start gap-2">
                <Share2 size={12} className="mt-0.5 text-fg-hint" />
                <span className="text-2xs text-fg-secondary">
                  {Object.entries(intake.detected_social_links)
                    .filter(([, urls]) => urls.length > 0)
                    .map(([p]) => p.charAt(0).toUpperCase() + p.slice(1))
                    .join(", ")}
                </span>
              </div>
            )}
            {intake.detected_tech_stack.length > 0 && (
              <div className="flex items-start gap-2">
                <Cpu size={12} className="mt-0.5 text-fg-hint" />
                <span className="text-2xs text-fg-secondary">
                  {intake.detected_tech_stack.slice(0, 5).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editable form */}
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <Edit3 size={16} className="text-fg-muted" />
          <h2 className="text-lg font-bold text-fg">
            {intake ? "Confirm your details" : "Company profile"}
          </h2>
        </div>
        {intake && (
          <p className="mb-5 text-sm text-fg-muted">
            We've prefilled what we detected. Edit anything that needs correction.
          </p>
        )}

        {scanError && (
          <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {scanError}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Company name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Digital"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Industry
              {intake && intake.industry_confidence > 0 && (
                <span className="ml-2 text-2xs text-aeos-600">
                  {Math.round(intake.industry_confidence * 100)}% confident
                </span>
              )}
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
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
                placeholder="US"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-secondary">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">
              Primary business goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Increase online sales by 30%"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : intake ? "Confirm and continue" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
