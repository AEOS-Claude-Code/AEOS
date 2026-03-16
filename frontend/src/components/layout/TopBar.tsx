"use client";

import { Bell, Coins, Crown, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

interface TopBarProps {
  workspaceName: string;
  plan: string;
  tokensUsed: number;
  tokensTotal: number;
  isLive: boolean;
}

export default function TopBar({
  workspaceName,
  plan,
  tokensUsed,
  tokensTotal,
  isLive,
}: TopBarProps) {
  const { user } = useAuth();
  const tokenPct = tokensTotal > 0 ? (tokensUsed / tokensTotal) * 100 : 0;
  const tokenColor =
    tokenPct > 85 ? "text-red-500" : tokenPct > 60 ? "text-amber-500" : "text-emerald-500";

  const initials = user?.initials || "??";
  const displayName = user?.full_name || "User";
  const displayRole = user?.workspace_role || user?.role || "member";

  return (
    <header
      className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Left – Workspace */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {workspaceName}
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-aeos-50 px-2 py-0.5 text-[10px] font-semibold text-aeos-700">
              <Crown size={10} />
              {plan}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isLive ? "bg-emerald-500 pulse-dot" : "bg-amber-400"
              }`}
            />
            {isLive ? "Live" : "Demo mode"}
          </div>
        </div>
      </div>

      {/* Center – Search */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-400 transition hover:border-slate-300">
          <Search size={14} />
          <span className="text-xs">Ask AEOS anything\u2026</span>
          <kbd className="ml-6 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            /
          </kbd>
        </div>
      </div>

      {/* Right – Tokens, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Token usage */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 sm:flex">
          <Coins size={13} className={tokenColor} />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-400">Tokens</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xs font-bold tabular-nums ${tokenColor}`}>
                {(tokensUsed / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-slate-400">
                / {(tokensTotal / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
          <div className="ml-1 h-5 w-12 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                tokenPct > 85
                  ? "bg-red-500"
                  : tokenPct > 60
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${tokenPct}%` }}
            />
          </div>
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-slate-300 hover:text-slate-600">
          <Bell size={16} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        {/* User avatar – from auth context */}
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition hover:border-slate-300">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-700 text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-xs font-medium text-slate-700">
              {displayName}
            </span>
            <span className="text-[10px] capitalize text-slate-400">
              {displayRole}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
