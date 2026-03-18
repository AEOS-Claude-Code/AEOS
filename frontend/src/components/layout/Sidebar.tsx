"use client";

import {
  LayoutDashboard, Megaphone, Users, Sparkles, Swords, Plug,
  FileBarChart, Settings, ChevronLeft, Zap, LogOut, Globe, Bot,
  GitCompareArrows, Brain, BarChart3, DollarSign, Activity, Monitor, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/app/dashboard", section: "main" },
  { label: "Marketing", icon: <Megaphone size={18} />, href: "/app/marketing", section: "intelligence" },
  { label: "Leads", icon: <Users size={18} />, href: "/app/leads", section: "intelligence" },
  { label: "Opportunities", icon: <Sparkles size={18} />, href: "/app/opportunities", section: "intelligence" },
  { label: "Digital Presence", icon: <Globe size={18} />, href: "/app/digital-presence", section: "intelligence" },
  { label: "Gap Analysis", icon: <GitCompareArrows size={18} />, href: "/app/gap-analysis", section: "intelligence" },
  { label: "Business Plan", icon: <Brain size={18} />, href: "/app/business-plan", section: "intelligence" },
  { label: "KPI Framework", icon: <Activity size={18} />, href: "/app/kpi-framework", section: "intelligence" },
  { label: "Financial Model", icon: <BarChart3 size={18} />, href: "/app/financial-model", section: "intelligence" },
  { label: "Market Research", icon: <BarChart3 size={18} />, href: "/app/market-research", section: "intelligence" },
  { label: "Financial Health", icon: <DollarSign size={18} />, href: "/app/financial-health", section: "intelligence" },
  { label: "Competitors", icon: <Swords size={18} />, href: "/app/competitors", section: "intelligence" },
  { label: "Command Center", icon: <Monitor size={18} />, href: "/app/command", section: "platform" },
  { label: "AI Agents", icon: <Bot size={18} />, href: "/app/agents", section: "platform" },
  { label: "Integrations", icon: <Plug size={18} />, href: "/app/integrations", section: "platform" },
  { label: "Reports", icon: <FileBarChart size={18} />, href: "/app/reports", section: "platform" },
  { label: "AI Copilot", icon: <Bot size={18} />, href: "/app/copilot", section: "platform" },
  { label: "Admin", icon: <ShieldCheck size={18} />, href: "/app/admin", section: "platform" },
  { label: "Settings", icon: <Settings size={18} />, href: "/app/settings", section: "platform" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const sections = [
    { key: "main", label: "" },
    { key: "intelligence", label: "Intelligence" },
    { key: "platform", label: "Platform" },
  ];

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen flex-col transition-all duration-300"
      style={{
        width: collapsed ? 68 : 252,
        background: "linear-gradient(180deg, #0a1628 0%, #0f1d35 100%)",
      }}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-3 border-b border-white/[0.06] px-4">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 shadow-lg shadow-aeos-500/20">
            <Zap size={15} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">AEOS</span>
              <span className="text-[10px] leading-none text-slate-500">Enterprise OS</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section.key);
          if (!items.length) return null;
          return (
            <div key={section.key} className={section.label ? "mt-5" : ""}>
              {section.label && !collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-aeos-500/15 text-aeos-400"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-aeos-400" />
                      )}
                      <span className={`transition-colors ${isActive ? "text-aeos-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-white/[0.06] p-3">
        {!collapsed && <ThemeToggle />}
        {/* User info */}
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 text-[10px] font-bold text-white">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-300">{user.full_name}</p>
              <p className="truncate text-[10px] text-slate-500">{user.email}</p>
            </div>
          </div>
        )}

        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-red-400">
          <LogOut size={16} />
          {!collapsed && <span>Log out</span>}
        </button>

        <button onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-1.5 text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-400">
          <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}
