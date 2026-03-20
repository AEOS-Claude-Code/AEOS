"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Plug, LayoutDashboard, ExternalLink, Sparkles, Bot, Zap, Crown, Lock } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePlanGate } from "@/lib/hooks/usePlanGate";
import UpgradeModal from "@/components/ui/UpgradeModal";

export default function OnboardingComplete() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { isStarter } = usePlanGate();
  const [readiness, setReadiness] = useState(0);
  const [marked, setMarked] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    async function complete() {
      try {
        await api.post("/api/v1/onboarding/complete");
        const res = await api.get("/api/v1/workspaces/current/readiness");
        setReadiness(res.data.percentage ?? 100);
        await refreshSession();
        try {
          const scanRes = await api.get("/api/v1/company-scan/latest");
          if (scanRes.data?.share_token) setShareToken(scanRes.data.share_token);
        } catch {}
      } catch { setReadiness(80); }
      setMarked(true);
    }
    complete();
  }, [refreshSession]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-8 text-center">
        {/* Success icon with glow */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 size={40} className="text-white" />
          </div>
        </div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-fg">
          {isStarter ? "Your free intelligence report is ready!" : "Your AI organization is ready!"}
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-fg-hint">
          {isStarter
            ? "Upgrade to deploy 22+ AI agents across 9 departments."
            : "AEOS has deployed your AI agents and is ready to start working for you."}
        </motion.p>

        {/* Readiness gauge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mx-auto mt-6 max-w-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-hint">Readiness</span>
            <span className="font-bold text-emerald-400">{readiness}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-secondary">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: marked ? `${readiness}%` : "0%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
          {[
            { icon: Bot, value: "22+", label: "AI Agents", color: "from-emerald-500 to-emerald-700" },
            { icon: Sparkles, value: "9", label: "Departments", color: "from-violet-500 to-purple-600" },
            { icon: Zap, value: "24/7", label: "Active", color: "from-cyan-500 to-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className={`relative rounded-xl border border-border bg-surface-secondary p-3 ${isStarter ? "opacity-50" : ""}`}>
              {isStarter && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface-secondary/60">
                  <Lock size={16} className="text-fg-hint" />
                </div>
              )}
              <div className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} shadow-sm`}>
                <stat.icon size={14} className="text-white" />
              </div>
              <p className="text-lg font-bold text-fg">{stat.value}</p>
              <p className="text-2xs text-fg-hint">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Upgrade CTA for starter users */}
        {isStarter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mx-auto mt-6 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
              <Crown size={16} /> Unlock your full AI organization
            </div>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Deploy AI agents, customize your org chart, and automate across 9 departments.
            </p>
            <button onClick={() => setShowUpgrade(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition hover:shadow-md">
              <Crown size={12} /> Upgrade to Growth — $49/mo
            </button>
          </motion.div>
        )}

        {/* Free report */}
        {shareToken && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="mx-auto mt-6 max-w-sm rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <p className="text-sm font-bold text-fg">Your free intelligence report is ready!</p>
            <p className="mt-1 text-xs text-fg-hint">Share it with your team to showcase your digital presence.</p>
            <a href={`/report/${shareToken}`} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600">
              <ExternalLink size={12} /> View report
            </a>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="mt-8 space-y-3">
          <button onClick={() => router.push("/app/dashboard")}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:shadow-2xl hover:shadow-emerald-500/30">
            <LayoutDashboard size={16} />
            Open your AI dashboard
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => router.push("/app/integrations")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-fg-hint transition hover:bg-surface-secondary hover:text-fg-muted">
            <Plug size={14} />
            Connect integrations
          </button>
        </motion.div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="AI Agent Deployment" />
    </motion.div>
  );
}
