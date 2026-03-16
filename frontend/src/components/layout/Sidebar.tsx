"use client";

import {
  LayoutDashboard,
  Megaphone,
  Users,
  Sparkles,
  Swords,
  Plug,
  FileBarChart,
  Settings,
  ChevronLeft,
  Zap,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/app/dashboard" },
  { label: "Marketing", icon: <Megaphone size={18} />, href: "/app/marketing" },
  { label: "Leads", icon: <Users size={18} />, href: "/app/leads", badge: "5" },
  { label: "Opportunities", icon: <Sparkles size={18} />, href: "/app/opportunities", badge: "5" },
  { label: "Competitors", icon: <Swords size={18} />, href: "/app/competitors" },
  { label: "Integrations", icon: <Plug size={18} />, href: "/app/integrations" },
  { label: "Reports", icon: <FileBarChart size={18} />, href: "/app/reports" },
  { label: "Settings", icon: <Settings size={18} />, href: "/app/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-white/5 transition-all duration-300"
      style={{
        width: collapsed ? 68 : 252,
        background: "var(--sidebar-bg)",
      }}
    >
      {/* Brand */}
      <div className="flex h-[60px] items-center gap-3 border-b border-white/5 px-5">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-700">
            <Zap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">
                AEOS
              </span>
              <span className="text-[10px] leading-none text-slate-500">
                Enterprise OS
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-aeos-600/20 text-aeos-400"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-aeos-500" />
                )}

                <span className={isActive ? "text-aeos-400" : "text-slate-500 group-hover:text-slate-300"}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-aeos-600/30 text-aeos-300"
                            : "bg-white/[0.06] text-slate-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: logout + collapse */}
      <div className="space-y-1 border-t border-white/5 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-red-400"
        >
          <LogOut size={18} />
          {!collapsed && <span>Log out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300"
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
