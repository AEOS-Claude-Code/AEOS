"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Plug, LayoutDashboard, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function OnboardingComplete() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [readiness, setReadiness] = useState(0);
  const [marked, setMarked] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    async function complete() {
      try {
        await api.post("/api/v1/onboarding/complete");
        const res = await api.get("/api/v1/workspaces/current/readiness");
        setReadiness(res.data.percentage ?? 100);
        await refreshSession();

        // Fetch the scan report to get the share token
        try {
          const scanRes = await api.get("/api/v1/company-scan/latest");
          if (scanRes.data?.share_token) {
            setShareToken(scanRes.data.share_token);
          }
        } catch {
          // No scan available — that's fine
        }
      } catch {
        setReadiness(80);
      }
      setMarked(true);
    }
    complete();
  }, [refreshSession]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-card text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-success-light">
        <CheckCircle2 size={32} className="text-status-success" />
      </div>

      <h2 className="text-xl font-bold text-fg">Your workspace is ready!</h2>
      <p className="mt-2 text-sm text-fg-muted">
        AEOS has everything it needs to start analyzing your business.
      </p>

      {/* Readiness gauge */}
      <div className="mx-auto mt-6 max-w-xs">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>Readiness</span>
          <span className="font-bold text-status-success">{readiness}%</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-pill bg-surface-inset">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-aeos-500 to-status-success transition-all duration-1000"
            style={{ width: marked ? `${readiness}%` : "0%" }}
          />
        </div>
      </div>

      {/* Free report banner */}
      {shareToken && (
        <div className="mx-auto mt-6 max-w-xs rounded-widget border border-aeos-200 bg-aeos-50/50 p-4">
          <p className="text-sm font-semibold text-aeos-800">Your free report is ready!</p>
          <p className="mt-1 text-xs text-aeos-600">
            Share it with your team or clients to showcase your digital intelligence.
          </p>
          <a
            href={`/report/${shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-widget bg-aeos-600 py-2 text-xs font-semibold text-white transition hover:bg-aeos-700"
          >
            <ExternalLink size={13} />
            View shareable report
          </a>
        </div>
      )}

      {/* Next actions */}
      <div className="mt-8 space-y-3">
        <button
          onClick={() => router.push("/app/dashboard")}
          className="flex w-full items-center justify-center gap-2 rounded-widget bg-aeos-600 py-3 text-sm font-semibold text-white transition hover:bg-aeos-700"
        >
          <LayoutDashboard size={16} />
          Open dashboard
          <ArrowRight size={16} />
        </button>

        <button
          onClick={() => router.push("/app/integrations")}
          className="flex w-full items-center justify-center gap-2 rounded-widget border border-border py-3 text-sm font-medium text-fg-secondary transition hover:bg-surface-secondary"
        >
          <Plug size={16} />
          Connect integrations
        </button>
      </div>
    </div>
  );
}
