"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RequireAuth, useAuth } from "@/lib/auth/AuthProvider";
import DashboardShell from "@/components/layout/DashboardShell";
import api from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="bg-surface-base min-h-screen">
        <AppShell>{children}</AppShell>
      </div>
    </RequireAuth>
  );
}

function UsageAlertBanner() {
  const [alerts, setAlerts] = useState<any[]>([]);
  useEffect(() => {
    api.get("/api/v1/billing/alerts").then(r => setAlerts(r.data || [])).catch(() => {});
  }, []);

  if (alerts.length === 0) return null;
  const top = alerts[0]; // Highest severity

  const colors: Record<string, string> = {
    exhausted: "bg-red-500/10 border-red-500/30 text-red-400",
    critical: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };

  async function dismiss(id: string) {
    await api.put(`/api/v1/billing/alerts/${id}/acknowledge`).catch(() => {});
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className={`mx-4 mb-4 flex items-center justify-between rounded-xl border px-4 py-3 ${colors[top.alert_type] || colors.info}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{top.message}</span>
      </div>
      <div className="flex items-center gap-2">
        <a href="/app/settings" className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/20 transition">
          Upgrade Plan
        </a>
        <button onClick={() => dismiss(top.id)} className="text-xs opacity-60 hover:opacity-100 transition">
          Dismiss
        </button>
      </div>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { workspace } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isOnboarding = pathname.startsWith("/app/onboarding");
  const setupCompleted = workspace?.setup?.completed ?? false;

  /* Redirect to onboarding if setup is not completed */
  useEffect(() => {
    if (workspace && !setupCompleted && !isOnboarding) {
      const step = workspace.setup?.current_step ?? 1;
      const stepRoutes: Record<number, string> = {
        1: "/app/onboarding/company",
        2: "/app/onboarding/presence",
        3: "/app/onboarding/competitors",
        4: "/app/onboarding/integrations",
        5: "/app/onboarding/complete",
      };
      router.replace(stepRoutes[step] || "/app/onboarding/company");
    }
  }, [workspace, setupCompleted, isOnboarding, router]);

  /* Onboarding pages use their own layout (no sidebar) */
  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      workspaceName={workspace?.name || "Workspace"}
      plan={workspace?.plan?.name || "Starter"}
      tokensUsed={workspace?.token_usage?.used ?? 0}
      tokensTotal={(workspace?.token_usage?.included ?? 0) + (workspace?.token_usage?.purchased ?? 0)}
      isLive={!!workspace}
    >
      <UsageAlertBanner />
      {children}
    </DashboardShell>
  );
}
