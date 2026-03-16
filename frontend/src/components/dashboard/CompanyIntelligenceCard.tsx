"use client";

import { Globe, Shield, Share2, Cpu, RefreshCw, ExternalLink } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";

interface ScanReport {
  seo_score: number;
  social_presence: Record<string, boolean>;
  tech_stack: string[];
  scan_summary: string;
  page_title: string;
  pages_detected: number;
  status: string;
  share_token?: string;
}

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  youtube: "YouTube",
};

function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums text-fg">{score}</span>
      </div>
    </div>
  );
}

export default function CompanyIntelligenceCard({
  report,
  state = "success",
  error,
  onRetry,
}: {
  report?: ScanReport | null;
  state?: CardState;
  error?: string | null;
  onRetry?: () => void;
}) {
  const socialEntries = report
    ? Object.entries(report.social_presence).filter(([, v]) => v)
    : [];
  const techList = report?.tech_stack ?? [];

  return (
    <DashCard
      title="Company intelligence"
      subtitle="Website scan report"
      badge={
        report?.status === "completed" ? (
          <span className="rounded-full bg-status-success-light px-2 py-0.5 text-2xs font-semibold text-status-success-text">
            Scanned
          </span>
        ) : report?.status === "scanning" ? (
          <span className="flex items-center gap-1 rounded-full bg-status-warning-light px-2 py-0.5 text-2xs font-semibold text-status-warning-text">
            <RefreshCw size={10} className="animate-spin" /> Scanning
          </span>
        ) : undefined
      }
      delay={240}
    >
      {state === "loading" && <CardLoading lines={4} />}

      {state === "error" && (
        <CardError
          message="Scan data unavailable"
          detail={error ?? undefined}
          onRetry={onRetry}
        />
      )}

      {state === "empty" && (
        <CardEmpty
          icon={<Globe size={20} className="text-fg-hint" />}
          title="No scan results yet"
          description="Add your website URL during onboarding to get a company intelligence report."
        />
      )}

      {state === "success" && report && (
        <div className="space-y-4">
          {/* SEO Score + Title */}
          <div className="flex items-center gap-4">
            <ScoreRing score={report.seo_score} />
            <div className="min-w-0 flex-1">
              <p className="text-sm-tight font-medium text-fg">{report.page_title || "Website"}</p>
              <p className="mt-0.5 text-2xs text-fg-muted">
                SEO score: {report.seo_score}/100 · {report.pages_detected} pages detected
              </p>
            </div>
          </div>

          {/* Social Presence */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Share2 size={12} className="text-fg-hint" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-fg-hint">
                Social presence
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SOCIAL_LABELS).map(([key, label]) => {
                const active = report.social_presence?.[key] ?? false;
                return (
                  <span
                    key={key}
                    className={`rounded-pill px-2 py-0.5 text-2xs font-medium ${
                      active
                        ? "bg-status-success-light text-status-success-text"
                        : "bg-surface-inset text-fg-hint"
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Tech Stack */}
          {techList.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Cpu size={12} className="text-fg-hint" />
                <span className="text-2xs font-semibold uppercase tracking-wider text-fg-hint">
                  Tech stack
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {techList.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-pill bg-aeos-50 px-2 py-0.5 text-2xs font-medium text-aeos-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share report */}
          {report.share_token && (
            <a
              href={`/report/${report.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-widget border border-aeos-200 bg-aeos-50/50 py-2 text-xs font-medium text-aeos-700 transition hover:bg-aeos-100"
            >
              <ExternalLink size={13} />
              Share free report
            </a>
          )}
        </div>
      )}
    </DashCard>
  );
}
