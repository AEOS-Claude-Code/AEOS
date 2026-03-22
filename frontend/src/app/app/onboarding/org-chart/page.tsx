"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePlanGate } from "@/lib/hooks/usePlanGate";
import UpgradeModal from "@/components/ui/UpgradeModal";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Bot, Users, Brain, Target, Megaphone, Wallet, Shield,
  Settings, Cpu, Package, Heart, CalendarDays, Sparkles, ChevronDown,
  ArrowRight, Crown, Lock, Rocket,
} from "lucide-react";

const DEPT_ICONS: Record<string,any> = {
  brain:Brain,target:Target,megaphone:Megaphone,users:Users,wallet:Wallet,
  shield:Shield,settings:Settings,cpu:Cpu,package:Package,heart:Heart,
  calendar:CalendarDays,sparkles:Sparkles,
};
const DEPT_COLORS: Record<string,string> = {
  strategy:"from-violet-500 to-purple-600",sales:"from-orange-500 to-red-500",
  marketing:"from-pink-500 to-rose-500",hr:"from-blue-500 to-indigo-500",
  finance:"from-emerald-500 to-green-600",legal:"from-slate-400 to-gray-500",
  operations:"from-amber-500 to-yellow-600",it:"from-cyan-500 to-teal-500",
  procurement:"from-lime-500 to-green-500",reservations:"from-blue-400 to-blue-600",
  guest_relations:"from-rose-400 to-pink-600",partnerships:"from-teal-500 to-emerald-600",
  patient_care:"from-red-400 to-rose-500",clinical_ops:"from-sky-500 to-blue-600",
  billing:"from-emerald-500 to-green-600",compliance:"from-gray-400 to-slate-500",
  front_house:"from-amber-400 to-orange-500",kitchen_ops:"from-red-500 to-orange-600",
  delivery:"from-blue-500 to-cyan-500",customer_service:"from-pink-400 to-rose-500",
  customer_success:"from-pink-400 to-rose-500",creative:"from-fuchsia-500 to-purple-600",
  project_mgmt:"from-indigo-500 to-blue-600",client_services:"from-orange-400 to-amber-500",
  digital:"from-cyan-500 to-blue-500",technical:"from-slate-400 to-gray-500",
  safety:"from-red-500 to-red-700",product:"from-violet-500 to-indigo-600",
  devops:"from-gray-500 to-gray-600",elearning:"from-blue-400 to-indigo-500",
  academic:"from-emerald-400 to-teal-500",student_services:"from-amber-400 to-orange-500",
  risk:"from-red-500 to-rose-600",production:"from-orange-500 to-amber-600",
  supply_chain:"from-teal-500 to-green-600",rd:"from-purple-500 to-violet-600",
  warehouse:"from-amber-500 to-yellow-600",customs:"from-slate-400 to-gray-500",
  estimating:"from-blue-500 to-indigo-500",property_mgmt:"from-amber-500 to-orange-500",
  valuation:"from-emerald-500 to-teal-500",transactions:"from-slate-400 to-gray-500",
};

interface OrgDepartment {
  id:string; name:string; icon:string; status:string; ai_head:string;
  ai_agents:number; ai_roles:string[]; description:string; priority_rank:number;
}
interface OrgChart {
  total_ai_agents:number; total_departments:number;
  departments:OrgDepartment[]; summary:string;
}

export default function OnboardingOrgChart() {
  const router = useRouter();
  const { workspace } = useAuth();
  const { isStarter } = usePlanGate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgChart, setOrgChart] = useState<OrgChart|null>(null);
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [expandedDept, setExpandedDept] = useState<string|null>(null);
  const [humanRoles, setHumanRoles] = useState<Record<string, boolean>>({});
  const [orgBuildStep, setOrgBuildStep] = useState(0);

  function toggleRole(deptId: string, role: string) {
    if (isStarter) { setShowUpgrade(true); return; }
    const key = `${deptId}:${role}`;
    setHumanRoles(prev => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleHead(deptId: string) {
    if (isStarter) { setShowUpgrade(true); return; }
    const key = `${deptId}:__head__`;
    setHumanRoles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const aiCount = orgChart ? orgChart.departments.reduce((sum, dept) => {
    const headIsHuman = humanRoles[`${dept.id}:__head__`];
    const humanAgents = dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
    return sum + (headIsHuman ? 0 : 1) + (dept.ai_roles.length - humanAgents);
  }, 0) : 0;
  const humanCount = orgChart ? orgChart.departments.reduce((sum, dept) => {
    const headIsHuman = humanRoles[`${dept.id}:__head__`] ? 1 : 0;
    const humanAgents = dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
    return sum + headIsHuman + humanAgents;
  }, 0) : 0;

  useEffect(() => {
    async function fetchOrgChart() {
      setLoading(true);
      try {
        const industry = workspace?.industry || "";
        if (industry && industry !== "other") {
          const r = await api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${industry}`);
          setOrgChart(r.data);
          setOrgBuildStep(0);
          const depts = r.data?.departments || [];
          depts.forEach((_: any, i: number) => {
            setTimeout(() => setOrgBuildStep(i + 1), 300 + i * 200);
          });
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchOrgChart();
  }, [workspace?.industry]);

  async function handleConfirm() {
    setSaving(true);
    try {
      if (Object.keys(humanRoles).length > 0) {
        await api.put("/api/v1/workspace/role-assignments", { role_map: humanRoles }).catch(() => {});
      }
      router.push("/app/onboarding/competitors");
    } catch { router.push("/app/onboarding/competitors"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  const allDepts = orgChart?.departments || [];
  const visibleDepts2 = showAllDepts ? allDepts : allDepts.slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-5 px-2">
      {/* === AI Org Chart === */}
      {orgChart && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-fg">Your AI Organization</h2>
              <p className="text-xs text-fg-hint">
                {isStarter
                  ? "Preview of your AI org chart — upgrade to customize roles"
                  : "Click any role to toggle between AI agent and human employee"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                <Bot size={12} />{aiCount} AI
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                <Users size={12} />{humanCount} Human
              </span>
              <span className="rounded-xl bg-surface-secondary px-3 py-1.5 text-xs font-bold text-fg-muted ring-1 ring-border">
                {orgChart.total_departments} Depts
              </span>
            </div>
          </div>

          {/* Upgrade banner for starter users */}
          {isStarter && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <Crown size={16} className="shrink-0 text-amber-500" />
              <p className="flex-1 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Upgrade to Growth</span> to customize your AI org chart and deploy agents.
              </p>
              <button onClick={() => setShowUpgrade(true)}
                className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600">
                Upgrade
              </button>
            </div>
          )}

          {/* CEO Node */}
          <div className="flex justify-center mb-2">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-surface-secondary to-surface px-6 py-3 shadow-xl border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20">
                <Users size={18} className="text-slate-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-fg">CEO / Owner</p>
                <p className="text-xs text-fg-hint">You -- overseeing {orgChart.total_departments} departments</p>
              </div>
            </motion.div>
          </div>

          {/* SVG connectors from CEO */}
          <svg width="100%" height="32" className="overflow-visible">
            <line x1="50%" y1="0" x2="50%" y2="16" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="4%" y1="16" x2="96%" y2="16" stroke="var(--color-border)" strokeWidth="2" />
          </svg>

          {/* Department grid */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(allDepts.length, 5)}, 1fr)` }}>
            {visibleDepts2.map((dept, idx) => {
              const Icon = DEPT_ICONS[dept.icon] || Bot;
              const grad = DEPT_COLORS[dept.id] || "from-gray-400 to-gray-500";
              const isExpanded = expandedDept === dept.id;
              const headIsHuman = humanRoles[`${dept.id}:__head__`];
              const deptAi = (headIsHuman ? 0 : 1) + dept.ai_roles.filter(r => !humanRoles[`${dept.id}:${r}`]).length;
              const deptHu = (headIsHuman ? 1 : 0) + dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
              const isBuilt = idx < orgBuildStep;

              return (
                <motion.div key={dept.id}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={isBuilt ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center">
                  <svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="3 2" /></svg>

                  <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                    className={`group relative w-full overflow-hidden rounded-xl border p-3 text-center transition-all duration-300 ${
                      isExpanded ? "border-blue-500/30 bg-blue-500/[0.06] shadow-xl" : "border-border bg-surface-secondary shadow-md hover:bg-surface hover:border-border"
                    }`}>
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${grad}`} />
                    <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-lg`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-xs font-bold text-fg leading-tight mb-1.5">{dept.name}</p>
                    <motion.span whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleHead(dept.id); }}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold cursor-pointer transition-colors ${
                        headIsHuman ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" : "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                      }`}>
                      {headIsHuman ? <Users size={8} /> : <Bot size={8} />}
                      {dept.ai_head.replace(" AI", "").split(" ").slice(0, 2).join(" ")}
                    </motion.span>
                    <div className="mt-1.5 flex items-center justify-center gap-2">
                      <span className="flex items-center gap-0.5 text-2xs font-semibold text-blue-400"><Bot size={8} />{deptAi}</span>
                      <span className="h-3 w-px bg-border" />
                      <span className="flex items-center gap-0.5 text-2xs font-semibold text-blue-400"><Users size={8} />{deptHu}</span>
                    </div>
                    <ChevronDown size={12} className={`mx-auto mt-1 text-fg-hint transition-transform duration-300 ${isExpanded ? "rotate-180 text-blue-400" : ""}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="w-full overflow-hidden">
                        <div className="flex justify-center"><svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="3 2" /></svg></div>
                        <div className="relative rounded-xl border border-border bg-surface-secondary p-2.5">
                          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-border to-transparent" />
                          <div className="space-y-1.5">
                            {dept.ai_roles.map((role, ri) => {
                              const isH = humanRoles[`${dept.id}:${role}`];
                              return (
                                <motion.button key={role} whileTap={{ scale: 0.97 }}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ri * 0.05 }}
                                  onClick={() => toggleRole(dept.id, role)}
                                  className={`relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                                    isH ? "bg-blue-500/[0.08] ring-1 ring-blue-500/20 shadow-sm" : "bg-surface ring-1 ring-border hover:ring-border"
                                  }`}>
                                  <div className="absolute -left-[5px] top-1/2 h-px w-[12px] bg-border" />
                                  <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm ${
                                    isH ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-surface-secondary to-surface"
                                  }`}>
                                    {isH ? <Users size={10} className="text-white" /> : <Bot size={10} className="text-fg-muted" />}
                                  </div>
                                  <span className="flex-1 truncate text-xs text-fg-muted">{role.replace(" Agent", "")}</span>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold ${isH ? "bg-blue-500/10 text-blue-400" : "bg-surface-secondary text-fg-hint"}`}>
                                    {isH ? "Human" : "AI"}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {allDepts.length > 10 && !showAllDepts && (
            <div className="mt-4 flex justify-center">
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowAllDepts(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-5 py-2 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20 hover:bg-blue-500/[0.15]">
                <ChevronDown size={14} /> Show all {allDepts.length} departments
              </motion.button>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-fg-hint"><div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />AI Agent</span>
              <span className="flex items-center gap-1.5 text-xs text-fg-hint"><div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />Human</span>
              <span className="flex items-center gap-1.5 text-xs text-fg-hint"><div className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-300 to-amber-500" />CEO (You)</span>
            </div>
            {humanCount > 0 && (
              <span className="text-xs font-semibold text-blue-400">{humanCount} human positions · {aiCount} AI agents will deploy</span>
            )}
          </div>
        </motion.div>
      )}

      {!orgChart && !loading && (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-lg">
          <Bot size={48} className="mx-auto mb-4 text-fg-hint" />
          <h2 className="text-lg font-bold text-fg mb-2">No org chart available</h2>
          <p className="text-sm text-fg-hint">Please go back and select an industry to generate your AI organization chart.</p>
        </div>
      )}

      {/* === CONFIRM BUTTON === */}
      {isStarter ? (
        <div className="space-y-3">
          <motion.button onClick={handleConfirm} disabled={saving}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50">
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : (
              <><Sparkles size={18} /> Continue <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
            )}
          </motion.button>
          <motion.button onClick={() => setShowUpgrade(true)}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 py-3.5 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <Crown size={16} /> Upgrade to deploy AI agents
          </motion.button>
        </div>
      ) : (
        <motion.button onClick={handleConfirm} disabled={saving}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50">
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving...</>
          ) : (
            <><Rocket size={18} /> Continue <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
          )}
        </motion.button>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="AI Organization Chart" />
    </motion.div>
  );
}
