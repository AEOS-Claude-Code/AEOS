"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RequireAuth, useAuth } from "@/lib/auth/AuthProvider";
import DashboardShell from "@/components/layout/DashboardShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="bg-surface-base min-h-screen">
        <AppShell>{children}</AppShell>
      </div>
    </RequireAuth>
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
      {children}
    </DashboardShell>
  );
}
