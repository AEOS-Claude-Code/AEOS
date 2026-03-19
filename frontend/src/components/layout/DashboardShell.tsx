"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Brain, Bot, BarChart3, Settings } from "lucide-react";

function MobileNav() {
  const pathname = usePathname();
  const items = [
    { icon: LayoutDashboard, href: "/app/dashboard", label: "Home" },
    { icon: Brain, href: "/app/business-plan", label: "Plan" },
    { icon: Bot, href: "/app/agents", label: "Agents" },
    { icon: BarChart3, href: "/app/command", label: "Command" },
    { icon: Settings, href: "/app/settings", label: "More" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-surface/95 backdrop-blur-sm px-2 py-1.5 safe-area-pb lg:hidden">
      {items.map(({ icon: Icon, href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${active ? "text-aeos-600" : "text-fg-hint"}`}>
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

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
  workspaceName = "",
  plan = "",
  tokensUsed = 0,
  tokensTotal = 0,
  isLive = false,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col lg:ml-[252px]">
        <TopBar
          workspaceName={workspaceName}
          plan={plan}
          tokensUsed={tokensUsed}
          tokensTotal={tokensTotal}
          isLive={isLive}
        />

        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeUp}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
