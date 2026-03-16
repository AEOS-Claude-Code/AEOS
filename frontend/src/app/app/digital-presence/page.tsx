"use client";

import { useEngineData } from "@/lib/hooks/useEngineData";
import { useStrategyData } from "@/lib/hooks/useStrategyData";
import { resolveCardState } from "@/components/ui/CardStates";
import CompanyIntelligenceCard from "@/components/dashboard/CompanyIntelligenceCard";
import DigitalPresenceCard from "@/components/dashboard/DigitalPresenceCard";
import DashCard from "@/components/dashboard/DashCard";
import { CardEmpty } from "@/components/ui/CardStates";
import { Globe, Shield, Share2, Cpu, RefreshCw } from "lucide-react";

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram",
  twitter: "Twitter / X", youtube: "YouTube",
};

export default function DigitalPresencePage() {
  const { companyScan, loading: engineLoading, errors, refresh } = useEngineData();
  const { summary, loading: stratLoading, error: stratError } = useStrategyData();

  const scanState = resolveCardState({
    loading: engineLoading,
    error: !!errors.scan,
    hasData: !!companyScan && companyScan.status === "completed",
  });

  const strategyState = resolveCardState({
    loading: stratLoading,
    error: !!stratError,
    hasData: !!summary,
  });

  const social = companyScan?.social_presence ?? {};
  const techStack = companyScan?.tech_stack ?? [];
  const keywords = (companyScan as any)?.detected_keywords ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-fg">Digital Presence</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Website analysis, SEO health, social footprint, and technology detection.
        </p>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DigitalPresenceCard health={summary.health_score} state={strategyState} error={stratError} onRetry={refresh} />
        <CompanyIntelligenceCard report={companyScan} state={scanState} error={errors.scan} onRetry={refresh} />

        {/* Social details */}
        <DashCard title="Social presence" subtitle="Platform coverage" delay={240}>
          {Object.keys(social).length === 0 ? (
            <CardEmpty icon={<Share2 size={20} className="text-fg-hint" />} title="No social data" description="Run a company scan to detect social media presence." />
          ) : (
            <div className="space-y-2.5">
              {Object.entries(SOCIAL_LABELS).map(([key, label]) => {
                const active = social[key] ?? false;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-status-success" : "bg-surface-inset"}`} />
                    <span className={`flex-1 text-xs ${active ? "font-medium text-fg" : "text-fg-hint"}`}>{label}</span>
                    <span className={`text-2xs font-semibold ${active ? "text-status-success-text" : "text-fg-hint"}`}>
                      {active ? "Detected" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Tech stack */}
        <DashCard title="Technology stack" subtitle={`${techStack.length} technologies detected`} delay={0}>
          {techStack.length === 0 ? (
            <CardEmpty icon={<Cpu size={20} className="text-fg-hint" />} title="No tech data" description="Run a company scan to detect technologies." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech: string) => (
                <span key={tech} className="rounded-widget bg-aeos-50 px-3 py-1.5 text-xs font-medium text-aeos-700">{tech}</span>
              ))}
            </div>
          )}
        </DashCard>

        {/* Keywords */}
        <DashCard title="Detected keywords" subtitle={`${keywords.length} keywords found`} delay={120}>
          {keywords.length === 0 ? (
            <CardEmpty icon={<Globe size={20} className="text-fg-hint" />} title="No keywords detected" description="Keywords are extracted during the company website scan." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 20).map((kw: string) => (
                <span key={kw} className="rounded-widget bg-surface-secondary px-3 py-1.5 text-xs text-fg-secondary">{kw}</span>
              ))}
            </div>
          )}
        </DashCard>
      </div>
    </div>
  );
}
