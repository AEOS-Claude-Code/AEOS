"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Loader2, Rocket, Users, ChevronDown, Play, CheckCircle2,
  Brain, Target, Megaphone, Wallet, Shield, Settings, Cpu, Package,
  Heart, Sparkles, Zap, Clock, Send,
} from "lucide-react";
import { useAgents, type Agent, type DepartmentGroup, type TaskResult } from "@/lib/hooks/useAgents";

const DEPT_ICONS: Record<string, any> = {
  strategy: Brain, sales: Target, marketing: Megaphone, hr: Users,
  finance: Wallet, operations: Settings, it: Cpu, legal: Shield,
  procurement: Package, guest_relations: Heart, reservations: Sparkles,
};
const DEPT_COLORS: Record<string, string> = {
  strategy: "from-violet-500 to-purple-600", sales: "from-orange-500 to-red-500",
  marketing: "from-pink-500 to-rose-500", hr: "from-blue-500 to-indigo-500",
  finance: "from-emerald-500 to-green-600", operations: "from-amber-500 to-yellow-600",
  it: "from-cyan-500 to-teal-500", legal: "from-slate-500 to-gray-600",
  procurement: "from-lime-500 to-green-500",
};

function AgentCard({ agent, onRun }: { agent: Agent; onRun: (a: Agent) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100 transition-all hover:ring-aeos-200 hover:shadow-sm">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${agent.agent_type === "director" ? "bg-aeos-500" : "bg-slate-400"}`}>
        <Bot size={14} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-900">{agent.name}</p>
        <p className="text-2xs text-slate-500">{agent.tasks_completed} tasks completed</p>
      </div>
      <button onClick={() => onRun(agent)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-aeos-50 hover:text-aeos-600">
        <Play size={12} />
      </button>
    </div>
  );
}

function DeptSection({ group, onRunAgent }: { group: DepartmentGroup; onRunAgent: (a: Agent) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DEPT_ICONS[group.department] || Bot;
  const color = DEPT_COLORS[group.department] || "from-slate-500 to-gray-600";
  const allAgents = [group.director, ...group.specialists].filter(Boolean) as Agent[];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      <button onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{group.department.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
          <p className="text-2xs text-slate-500">{allAgents.length} agents · {group.total_tasks} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {allAgents.slice(0, 3).map((a, i) => (
            <div key={a.id} className={`flex h-6 w-6 items-center justify-center rounded-full ${a.agent_type === "director" ? "bg-aeos-100 text-aeos-600" : "bg-slate-100 text-slate-500"}`}
              style={{ marginLeft: i > 0 ? "-4px" : 0 }}>
              <Bot size={10} />
            </div>
          ))}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-1.5 border-t border-slate-100 px-5 py-3">
              {allAgents.map(a => <AgentCard key={a.id} agent={a} onRun={onRunAgent} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AgentsPage() {
  const { data, departments, loading, deploying, error, deploy, runTask } = useAgents();
  const [taskModal, setTaskModal] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState("");
  const [taskRunning, setTaskRunning] = useState(false);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);

  async function handleRunTask() {
    if (!taskModal || !taskInput.trim()) return;
    setTaskRunning(true);
    setTaskResult(null);
    const result = await runTask(taskModal.id, "user_request", taskInput, taskInput);
    setTaskResult(result);
    setTaskRunning(false);
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-aeos-500" /></div>;

  const hasAgents = data && data.total_agents > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aeos-500 to-violet-600 shadow-lg shadow-aeos-200/40">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">AI Agents</h1>
            <p className="text-xs text-slate-500">
              {hasAgents ? `${data.total_agents} agents across ${data.departments} departments` : "Deploy your AI organization"}
            </p>
          </div>
        </div>
        <button onClick={deploy} disabled={deploying}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-aeos-200/30 transition hover:shadow-xl disabled:opacity-50">
          {deploying ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
          {hasAgents ? "Redeploy" : "Deploy Agents"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</div>}

      {/* Stats */}
      {hasAgents && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-aeos-500 to-aeos-700 px-5 py-4 text-white shadow-lg shadow-aeos-200/40">
            <p className="text-3xl font-bold">{data.total_agents}</p>
            <p className="text-xs text-white/70">AI Agents</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 px-5 py-4 text-white shadow-lg shadow-violet-200/40">
            <p className="text-3xl font-bold">{data.departments}</p>
            <p className="text-xs text-white/70">Departments</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 px-5 py-4 text-white shadow-lg shadow-emerald-200/40">
            <p className="text-3xl font-bold">{data.active_agents}</p>
            <p className="text-xs text-white/70">Active</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAgents && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Bot size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="mb-2 text-lg font-bold text-slate-900">No agents deployed yet</h2>
          <p className="mb-6 text-sm text-slate-500">Click "Deploy Agents" to create your AI organization based on your company profile.</p>
        </div>
      )}

      {/* Department groups */}
      {departments.length > 0 && (
        <div className="space-y-3">
          {departments.map(g => (
            <DeptSection key={g.department} group={g} onRunAgent={setTaskModal} />
          ))}
        </div>
      )}

      {/* Task modal */}
      <AnimatePresence>
        {taskModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setTaskModal(null); setTaskResult(null); setTaskInput(""); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aeos-500">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{taskModal.name}</p>
                  <p className="text-2xs text-slate-500">{taskModal.description}</p>
                </div>
              </div>

              <div className="mb-3">
                <textarea value={taskInput} onChange={e => setTaskInput(e.target.value)}
                  placeholder="Describe the task for this agent..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-aeos-400 focus:ring-2 focus:ring-aeos-100"
                  rows={3} />
              </div>

              <button onClick={handleRunTask} disabled={taskRunning || !taskInput.trim()}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-aeos-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {taskRunning ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {taskRunning ? "Running..." : "Run Task"}
              </button>

              {taskResult && (
                <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={14} /> Task Complete
                    {taskResult.tokens_used > 0 && <span className="ml-auto text-2xs text-emerald-500">{taskResult.tokens_used} tokens</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-slate-700">{taskResult.result_summary}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
