"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardShellProps {
  children: React.ReactNode;
  workspaceName?: string;
  plan?: string;
  tokensUsed?: number;
  tokensTotal?: number;
  isLive?: boolean;
}

export default function DashboardShell({
  children,
  workspaceName = "Demo Company",
  plan = "Growth",
  tokensUsed = 38420,
  tokensTotal = 150000,
  isLive = false,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col" style={{ marginLeft: 252 }}>
        <TopBar
          workspaceName={workspaceName}
          plan={plan}
          tokensUsed={tokensUsed}
          tokensTotal={tokensTotal}
          isLive={isLive}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
