"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Plug, LayoutDashboard, ExternalLink, Sparkles, Bot, Zap } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function OnboardingComplete() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [readiness, setReadiness] = useState(0);
  const [marked, setMarked] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

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
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        {/* Success icon with glow */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30">
            <CheckCircle2 size={40} className="text-white" />
          </div>
        </div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-slate-900">
          Your AI organization is ready!
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-slate-500">
          AEOS has deployed your AI agents and is ready to start working for you.
        </motion.p>

        {/* Readiness gauge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mx-auto mt-6 max-w-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Readiness</span>
            <span className="font-bold text-emerald-600">{readiness}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-aeos-500 to-emerald-500"
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
            { icon: Bot, value: "22+", label: "AI Agents", color: "from-aeos-500 to-aeos-700" },
            { icon: Sparkles, value: "9", label: "Departments", color: "from-violet-500 to-purple-600" },
            { icon: Zap, value: "24/7", label: "Active", color: "from-emerald-500 to-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-slate-50 p-3">
              <div className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon size={14} className="text-white" />
              </div>
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              <p className="text-2xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Free report */}
        {shareToken && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="mx-auto mt-6 max-w-sm rounded-xl bg-gradient-to-r from-aeos-50 to-violet-50 p-4 ring-1 ring-aeos-200/50">
            <p className="text-sm font-bold text-aeos-800">Your free intelligence report is ready!</p>
            <p className="mt-1 text-xs text-aeos-600">Share it with your team to showcase your digital presence.</p>
            <a href={`/report/${shareToken}`} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-aeos-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-aeos-700">
              <ExternalLink size={12} /> View report
            </a>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="mt-8 space-y-3">
          <button onClick={() => router.push("/app/dashboard")}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-aeos-500/20 transition-all hover:shadow-2xl">
            <LayoutDashboard size={16} />
            Open your AI dashboard
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => router.push("/app/integrations")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:shadow-sm">
            <Plug size={14} />
            Connect integrations
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
