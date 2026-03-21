"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Coins, Crown, Search, Command, Settings, CreditCard, HelpCircle, LogOut, ExternalLink, Check } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface TopBarProps {
  workspaceName: string;
  plan: string;
  tokensUsed: number;
  tokensTotal: number;
  isLive: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TopBar({ workspaceName, plan, tokensUsed, tokensTotal, isLive }: TopBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const tokenPct = tokensTotal > 0 ? (tokensUsed / tokensTotal) * 100 : 0;
  const tokenColor = tokenPct > 85 ? "text-red-500" : tokenPct > 60 ? "text-amber-500" : "text-emerald-500";
  const barColor = tokenPct > 85 ? "bg-red-500" : tokenPct > 60 ? "bg-amber-500" : "bg-emerald-500";

  // Notifications state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and every 30s
  useEffect(() => {
    let cancelled = false;
    function fetchCount() {
      api.get("/api/v1/notifications/count")
        .then((r) => { if (!cancelled) setUnreadCount(r.data.count ?? 0); })
        .catch(() => {});
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Fetch full list when panel opens
  useEffect(() => {
    if (showNotifPanel) {
      api.get("/api/v1/notifications?limit=10")
        .then((r) => setNotifications(r.data || []))
        .catch(() => {});
    }
  }, [showNotifPanel]);

  // Click outside to close (avatar)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    if (avatarOpen || showNotifPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [avatarOpen, showNotifPanel]);

  async function markNotifRead(id: string) {
    await api.put(`/api/v1/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function handleNotifClick(n: NotificationItem) {
    if (!n.read) markNotifRead(n.id);
    if (n.link) {
      setShowNotifPanel(false);
      router.push(n.link);
    }
  }

  const notifTypeColors: Record<string, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    action: "bg-blue-500",
    info: "bg-aeos-500",
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-xl">
      {/* Left – Workspace */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-fg">{workspaceName}</h2>
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-aeos-50 to-violet-50 px-2 py-0.5 text-[10px] font-bold text-aeos-700 ring-1 ring-aeos-200/50">
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
        <motion.button whileHover={{ scale: 1.02 }} className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2 text-sm text-fg-hint transition hover:border-border-strong hover:shadow-sm">
          <Search size={14} />
          <span className="text-xs">Ask AEOS anything...</span>
          <kbd className="ml-8 flex items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-fg-hint">
            <Command size={9} /> K
          </kbd>
        </motion.button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Token usage – clickable, navigates to settings */}
        <button
          onClick={() => router.push("/app/settings")}
          className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 sm:flex transition hover:border-border-strong hover:shadow-sm cursor-pointer"
        >
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
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${tokenPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifPanel((v) => !v)}
            className="relative rounded-xl border border-border bg-surface p-2 text-fg-hint transition hover:border-border-strong hover:text-fg-secondary hover:shadow-sm"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Notification dropdown panel */}
          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface shadow-xl z-50"
              >
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-bold text-fg">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={20} className="mx-auto mb-2 text-fg-hint" />
                    <p className="text-xs text-fg-muted">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 transition hover:bg-surface-secondary ${!n.read ? "bg-aeos-50/30" : ""}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notifTypeColors[n.type] || notifTypeColors.info}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${!n.read ? "text-fg" : "text-fg-secondary"}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-fg-muted mt-0.5 line-clamp-2">{n.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-fg-hint">{timeAgo(n.created_at)}</span>
                              {n.link && <ExternalLink size={9} className="text-fg-hint" />}
                              {n.read && <Check size={9} className="text-emerald-500" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar + dropdown */}
        <div className="relative" ref={avatarRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1 transition hover:border-border-strong hover:shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-400 to-aeos-600 text-[10px] font-bold text-white shadow-sm">
              {user?.initials || "??"}
            </div>
            <div className="hidden flex-col md:flex">
              <span className="text-xs font-semibold text-fg">{user?.full_name || "User"}</span>
              <span className="text-[10px] capitalize text-fg-hint">{user?.workspace_role || "member"}</span>
            </div>
          </motion.button>

          <AnimatePresence>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/10"
              >
                {/* User info */}
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-fg">{user?.full_name || "User"}</p>
                  <p className="text-xs text-fg-hint truncate">{user?.email || ""}</p>
                </div>

                {/* Links */}
                <div className="py-1.5">
                  <Link
                    href="/app/settings"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-fg-secondary transition hover:bg-surface-secondary hover:text-fg"
                  >
                    <Settings size={14} className="text-fg-hint" />
                    Settings
                  </Link>
                  <Link
                    href="/app/billing"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-fg-secondary transition hover:bg-surface-secondary hover:text-fg"
                  >
                    <CreditCard size={14} className="text-fg-hint" />
                    Billing & Plan
                  </Link>
                  <Link
                    href="/app/settings"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-fg-secondary transition hover:bg-surface-secondary hover:text-fg"
                  >
                    <HelpCircle size={14} className="text-fg-hint" />
                    Help & Support
                  </Link>
                </div>

                {/* Divider + Sign out */}
                <div className="border-t border-border py-1.5">
                  <button
                    onClick={() => { setAvatarOpen(false); logout(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
