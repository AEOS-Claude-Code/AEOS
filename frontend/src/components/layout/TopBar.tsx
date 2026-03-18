"use client";

import { Bell, Coins, Crown, Search, Command } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

interface TopBarProps {
  workspaceName: string;
  plan: string;
  tokensUsed: number;
  tokensTotal: number;
  isLive: boolean;
}

export default function TopBar({ workspaceName, plan, tokensUsed, tokensTotal, isLive }: TopBarProps) {
  const { user } = useAuth();
  const tokenPct = tokensTotal > 0 ? (tokensUsed / tokensTotal) * 100 : 0;
  const tokenColor = tokenPct > 85 ? "text-red-500" : tokenPct > 60 ? "text-amber-500" : "text-emerald-500";
  const barColor = tokenPct > 85 ? "bg-red-500" : tokenPct > 60 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-xl">
      {/* Left – Workspace */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-fg">{workspaceName}</h2>
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-aeos-50 to-violet-50 dark:from-aeos-500/10 dark:to-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-aeos-700 dark:text-aeos-400 ring-1 ring-aeos-200/50">
              <Crown size={9} />
              {plan}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-fg-hint">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-500 pulse-dot" : "bg-amber-400"}`} />
            {isLive ? "Live" : "Demo mode"}
          </div>
        </div>
      </div>

      {/* Center – Search */}
      <div className="hidden md:block">
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2 text-sm text-fg-hint transition hover:border-border-strong hover:shadow-sm">
          <Search size={14} />
          <span className="text-xs">Ask AEOS anything...</span>
          <kbd className="ml-8 flex items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-fg-hint">
            <Command size={9} /> K
          </kbd>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Token usage */}
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 sm:flex">
          <Coins size={13} className={tokenColor} />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-fg-hint">Tokens</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xs font-bold tabular-nums ${tokenColor}`}>
                {(tokensUsed / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-fg-hint">/ {(tokensTotal / 1000).toFixed(0)}k</span>
            </div>
          </div>
          <div className="ml-1 h-4 w-10 overflow-hidden rounded-full bg-surface-inset">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${tokenPct}%` }} />
          </div>
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl border border-border bg-surface p-2 text-fg-hint transition hover:border-border-strong hover:text-fg-secondary hover:shadow-sm">
          <Bell size={15} />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            3
          </span>
        </button>

        {/* User avatar */}
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1 transition hover:border-border-strong hover:shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 text-[10px] font-bold text-white shadow-sm">
            {user?.initials || "??"}
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-semibold text-fg">{user?.full_name || "User"}</span>
            <span className="text-[10px] capitalize text-fg-hint">{user?.workspace_role || "member"}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
