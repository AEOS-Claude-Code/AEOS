"use client";

import { RequireAuth, useAuth } from "@/lib/auth/AuthProvider";
import DashboardShell from "@/components/layout/DashboardShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { workspace } = useAuth();

  return (
    <DashboardShell
      workspaceName={workspace?.name || "Workspace"}
      plan={workspace?.plan?.name || "Free"}
      tokensUsed={workspace?.token_usage?.used ?? 0}
      tokensTotal={workspace?.token_usage?.included ?? 0}
      isLive={!!workspace}
    >
      {children}
    </DashboardShell>
  );
}
