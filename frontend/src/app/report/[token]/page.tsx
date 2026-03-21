"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Shield,
  Share2,
  Cpu,
  Globe,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Copy,
  Check,
  Lock,
  Gauge,
  Eye,
  FileText,
  Bot,
  Download,
} from "lucide-react";
import api from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────── */

interface ScanReport {
  id: string;
  website_url: string;
  status: string;
  company_name: string;
  page_title: string;
  meta_description: string;
  headings: { level: string; text: string }[];
  detected_keywords: string[];
  internal_links_count: number;
  pages_detected: number;
  pages_crawled: number;
  crawled_pages: { url: string; title: string; status_code: number }[];
  seo_score: number;
  seo_details: Record<string, any>;
  social_presence: Record<string, boolean>;
  tech_stack: string[];
  performance: Record<string, any>;
  security: Record<string, any>;
  accessibility: Record<string, any>;
  structured_data: Record<string, any>;
  crawl_info: Record<string, any>;
  overall_score: number;
  scan_summary: string;
  created_at: string;
}

interface ReportSection {
  title: string;
  content: string;
  data?: Record<string, any>;
}

interface GeneratedReport {
  id: string;
  workspace_id: string;
  report_type: string;
  title: string;
  status: string;
  sections: ReportSection[];
  summary: string;
  share_token: string;
  is_public: boolean;
  metadata: Record<string, any>;
  generated_at: string | null;
  created_at: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  youtube: "YouTube",
};

const SEO_LABELS: Record<string, string> = {
  title: "Page title",
  meta_description: "Meta description",
  h1: "H1 heading",
  h2: "H2 headings",
  keywords: "Keywords",
  internal_links: "Internal links",
  pages: "Page count",
  keyword_in_title: "Keyword in title",
};

const SECURITY_LABELS: Record<string, string> = {
  https: "HTTPS",
  hsts: "HSTS",
  csp: "Content Security Policy",
  x_frame_options: "X-Frame-Options",
  x_content_type_options: "X-Content-Type",
  referrer_policy: "Referrer Policy",
  permissions_policy: "Permissions Policy",
};

/* ── Helpers ───────────────────────────────────────────────── */

function markdownToHtml(md: string): string {
  if (!md) return "<p class='text-slate-400 italic'>No content generated.</p>";
  return md
    .replace(/^### (.+)$/gm, "<h4 class='text-sm font-bold text-slate-900 mt-4 mb-2'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 class='text-base font-bold text-slate-900 mt-5 mb-2'>$1</h3>")
    .replace(/^\*\*(.+?)\*\*/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.+)$/gm, "<li class='ml-4 text-sm text-slate-700'>$1</li>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 text-sm text-slate-700'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 text-sm text-slate-700'><strong>$1.</strong> $2</li>")
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class='space-y-1 my-2'>${match}</ul>`)
    .replace(/\n\n/g, "</p><p class='text-sm text-slate-700 leading-relaxed'>")
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith("<")) return line;
      return `<p class='text-sm text-slate-700 leading-relaxed'>${line}</p>`;
    })
    .replace(/<p class='text-sm text-slate-700 leading-relaxed'>\s*<\/p>/g, "");
}

/* ── Score components ──────────────────────────────────────── */

function ScoreRing({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  const displayLabel = label || (score >= 70 ? "Good" : score >= 45 ? "Fair" : "Needs Work");
  const labelColor = score >= 70 ? "text-emerald-600" : score >= 45 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className={`text-xs font-semibold ${labelColor}`}>{displayLabel}</span>
    </div>
  );
}

function ScoreMini({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "text-emerald-600 bg-emerald-50" : score >= 45 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${color}`}>{score}</span>
      <span className="text-xs text-fg-muted">{label}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
      ) : (
        <XCircle size={16} className="shrink-0 text-fg-hint" />
      )}
      <span className={`text-sm ${value ? "font-medium text-fg" : "text-fg-hint"}`}>{label}</span>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default function PublicReportPage() {
  const params = useParams();
  const token = params.token as string;
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      // Try company scan report first
      try {
        const res = await api.get(`/api/v1/company-scan/report/${token}`);
        setScanReport(res.data);
        setLoading(false);
        return;
      } catch {
        // Not a scan report, try generated report
      }

      // Try generated report (business plan, etc.)
      try {
        const res = await api.get(`/api/v1/public/report/${token}`);
        setGeneratedReport(res.data);
      } catch {
        setError("Report not found or is no longer available.");
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadPdf() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <span className="text-sm text-slate-400">Loading report{"\u2026"}</span>
        </div>
      </div>
    );
  }

  if (error || (!scanReport && !generatedReport)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <XCircle size={40} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-lg font-bold text-slate-900">Report not found</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go to AEOS <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Render generated report (business plan, etc.)
  if (generatedReport) {
    return <GeneratedReportView report={generatedReport} copyLink={copyLink} copied={copied} onDownload={handleDownloadPdf} />;
  }

  // Render scan report
  return <ScanReportView report={scanReport!} copyLink={copyLink} copied={copied} onDownload={handleDownloadPdf} />;
}

/* ── Generated Report View (Business Plan, etc.) ───────────── */

function GeneratedReportView({ report, copyLink, copied, onDownload }: {
  report: GeneratedReport;
  copyLink: () => void;
  copied: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white no-print">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">AEOS Intelligence Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={13} />
              Download PDF
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Share link"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
          {report.summary && (
            <p className="mt-2 text-sm text-slate-500">{report.summary}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Generated by AEOS {report.generated_at ? `on ${new Date(report.generated_at).toLocaleDateString()}` : ""}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {report.sections.map((section, i) => (
            <div key={i} className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${i > 0 ? "print-break" : ""}`}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <FileText size={18} className="text-blue-600" />
                {section.title}
              </h2>
              <div
                className="prose prose-sm prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm no-print">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
            <Zap size={22} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Want deeper insights for your business?
          </h2>
          <p className="mt-2 mx-auto max-w-md text-sm text-slate-500">
            AEOS continuously monitors your digital presence, tracks leads, detects opportunities, and generates strategic roadmaps — powered by AI.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Get your free AEOS workspace
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pb-8 text-center text-xs text-slate-400">
          Powered by AEOS — Autonomous Enterprise Operating System
        </div>
      </main>
    </div>
  );
}

/* ── Scan Report View (original) ───────────────────────────── */

function ScanReportView({ report, copyLink, copied, onDownload }: {
  report: ScanReport;
  copyLink: () => void;
  copied: boolean;
  onDownload: () => void;
}) {
  const socialEntries = Object.entries(report.social_presence || {});
  const socialActive = socialEntries.filter(([, v]) => v).length;
  const seoDetails = Object.entries(report.seo_details || {});
  const perf = report.performance || {};
  const sec = report.security || {};
  const access = report.accessibility || {};
  const struct = report.structured_data || {};
  const crawl = report.crawl_info || {};
  const hasOverall = (report.overall_score ?? 0) > 0;
  const companyName = report.company_name || report.page_title || "Company";

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-border bg-surface no-print">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-fg">AEOS Intelligence Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:bg-surface-secondary"
            >
              <Download size={13} />
              Download PDF
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:bg-surface-secondary"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Share link"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Title section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-fg">
            Where {companyName} Stands Now
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Automated analysis of {report.website_url} · Generated by AEOS
          </p>
        </div>

        {/* Score hero */}
        <div className="mb-8 rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
            <ScoreRing score={hasOverall ? report.overall_score : report.seo_score} size={100} label={hasOverall ? "Overall" : undefined} />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-fg">
                {hasOverall ? "Overall Website Intelligence Score" : "Overall SEO Health"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-secondary">
                {report.scan_summary}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                <span className="rounded-full bg-surface-inset px-3 py-1 text-xs font-medium text-fg-secondary">
                  <Globe size={11} className="mr-1 inline" /> {report.pages_detected} pages detected
                </span>
                {report.pages_crawled > 0 && (
                  <span className="rounded-full bg-surface-inset px-3 py-1 text-xs font-medium text-fg-secondary">
                    {report.pages_crawled} pages crawled
                  </span>
                )}
                <span className="rounded-full bg-surface-inset px-3 py-1 text-xs font-medium text-fg-secondary">
                  {report.internal_links_count} internal links
                </span>
                <span className="rounded-full bg-surface-inset px-3 py-1 text-xs font-medium text-fg-secondary">
                  {report.detected_keywords.length} keywords
                </span>
              </div>
            </div>
          </div>

          {/* Score breakdown row */}
          {hasOverall && (
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border-light pt-6">
              <ScoreMini score={report.seo_score} label="SEO" />
              {perf.score > 0 && <ScoreMini score={perf.score} label="Performance" />}
              {sec.score > 0 && <ScoreMini score={sec.score} label="Security" />}
              {access.score > 0 && <ScoreMini score={access.score} label="Accessibility" />}
              {struct.score > 0 && <ScoreMini score={struct.score} label="Structured Data" />}
              {crawl.score > 0 && <ScoreMini score={crawl.score} label="Crawlability" />}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* SEO breakdown */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-fg">SEO Analysis</h3>
              <span className="ml-auto text-xs font-bold text-fg-muted">{report.seo_score}/100</span>
            </div>
            <div className="space-y-3">
              {seoDetails.map(([key, detail]) => {
                const d = detail as any;
                const pct = d.max > 0 ? (d.score / d.max) * 100 : 0;
                const statusColor =
                  d.status === "good" ? "text-emerald-600" : d.status === "missing" ? "text-red-500" : "text-amber-600";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-fg-muted">
                      {SEO_LABELS[key] ?? key}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-14 text-right text-xs font-semibold ${statusColor}`}>
                      {d.score}/{d.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance */}
          {perf.score > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Gauge size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Performance</h3>
                <span className="ml-auto text-xs font-bold text-fg-muted">{perf.score}/100</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg-muted">Response time</span>
                  <span className={`font-semibold ${perf.response_time_ms <= 1000 ? "text-emerald-600" : perf.response_time_ms <= 2000 ? "text-amber-600" : "text-red-600"}`}>
                    {perf.response_time_ms}ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg-muted">Page size</span>
                  <span className="font-medium text-fg">{perf.page_size_display}</span>
                </div>
                <BoolRow label="Uses compression (gzip/br)" value={perf.uses_compression} />
                <BoolRow label="CDN detected" value={perf.uses_cdn} />
                {perf.redirect_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">Redirects</span>
                    <span className="font-medium text-fg">{perf.redirect_count}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security */}
          {sec.score > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Security Headers</h3>
                <span className="ml-auto text-xs font-bold text-fg-muted">{sec.score}/100</span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(SECURITY_LABELS).map(([key, label]) => (
                  <BoolRow key={key} label={label} value={sec[key] ?? false} />
                ))}
              </div>
            </div>
          )}

          {/* Accessibility */}
          {access.score > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Eye size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Accessibility</h3>
                <span className="ml-auto text-xs font-bold text-fg-muted">{access.score}/100</span>
              </div>
              <div className="space-y-2.5">
                <BoolRow label="Viewport meta tag" value={access.has_viewport_meta} />
                <BoolRow label="Language attribute" value={access.has_lang_attribute} />
                <BoolRow label="Skip navigation link" value={access.has_skip_navigation} />
                {access.images_total > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">Images with alt text</span>
                    <span className={`font-semibold ${access.images_without_alt === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                      {access.images_with_alt}/{access.images_total}
                    </span>
                  </div>
                )}
                {access.aria_landmarks > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">ARIA landmarks</span>
                    <span className="font-medium text-fg">{access.aria_landmarks}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Structured Data */}
          {struct.score > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Structured Data</h3>
                <span className="ml-auto text-xs font-bold text-fg-muted">{struct.score}/100</span>
              </div>
              <div className="space-y-2.5">
                <BoolRow label="Open Graph tags" value={struct.has_open_graph} />
                <BoolRow label="Twitter Cards" value={struct.has_twitter_cards} />
                <BoolRow label="Schema.org markup" value={struct.has_schema_org} />
                <BoolRow label="Favicon" value={struct.has_favicon} />
                <BoolRow label="Canonical URL" value={struct.has_canonical} />
                {struct.schema_types?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {struct.schema_types.map((t: string) => (
                      <span key={t} className="rounded bg-purple-50 px-2 py-0.5 text-2xs font-medium text-purple-700">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Crawlability */}
          {crawl.score > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Bot size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Crawlability</h3>
                <span className="ml-auto text-xs font-bold text-fg-muted">{crawl.score}/100</span>
              </div>
              <div className="space-y-2.5">
                <BoolRow label="robots.txt present" value={crawl.has_robots_txt} />
                <BoolRow label="Allows crawling" value={crawl.robots_allows_crawl} />
                <BoolRow label="Sitemap found" value={crawl.has_sitemap} />
                {crawl.sitemap_page_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">Sitemap pages</span>
                    <span className="font-medium text-fg">{crawl.sitemap_page_count}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social presence */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Share2 size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-fg">Social Presence</h3>
              <span className="ml-auto rounded-full bg-surface-inset px-2 py-0.5 text-xs font-semibold text-fg-muted">
                {socialActive}/{socialEntries.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {socialEntries.map(([platform, active]) => (
                <div key={platform} className="flex items-center gap-3">
                  {active ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="shrink-0 text-fg-hint" />
                  )}
                  <span className={`text-sm ${active ? "font-medium text-fg" : "text-fg-hint"}`}>
                    {SOCIAL_LABELS[platform] ?? platform}
                  </span>
                  {!active && (
                    <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-medium text-amber-700">
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          {report.tech_stack.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Cpu size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Detected Technologies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.tech_stack.map((tech) => (
                  <span key={tech} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {report.detected_keywords.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Globe size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-fg">Detected Keywords</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.detected_keywords.slice(0, 15).map((kw) => (
                  <span key={kw} className="rounded-lg bg-surface-inset px-3 py-1.5 text-xs font-medium text-fg-secondary">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Crawled pages */}
        {report.crawled_pages?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Globe size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-fg">Crawled Pages</h3>
              <span className="ml-auto text-xs text-fg-hint">{report.crawled_pages.length} pages</span>
            </div>
            <div className="space-y-2">
              {report.crawled_pages.map((page, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-secondary px-3 py-2">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-2xs font-bold ${
                    page.status_code === 200 ? "bg-emerald-100 text-emerald-700" :
                    page.status_code >= 400 ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {page.status_code || "ERR"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-fg">{page.title || page.url}</p>
                    {page.title && (
                      <p className="truncate text-2xs text-fg-hint">{page.url}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm no-print">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
            <Zap size={22} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-fg">
            Want deeper insights for your business?
          </h2>
          <p className="mt-2 mx-auto max-w-md text-sm text-fg-muted">
            AEOS continuously monitors your digital presence, tracks leads, detects opportunities, and generates strategic roadmaps — powered by AI.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Get your free AEOS workspace
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pb-8 text-center text-xs text-fg-hint">
          Powered by AEOS — Autonomous Enterprise Operating System
        </div>
      </main>
    </div>
  );
}
