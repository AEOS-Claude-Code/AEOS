"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface Agent {
  id: string; name: string; role: string; department: string;
  agent_type: string; description: string; capabilities: string[];
  status: string; tasks_completed: number; last_active_at: string | null;
}
export interface AgentList {
  agents: Agent[]; total_agents: number; active_agents: number; departments: number;
}
export interface DepartmentGroup {
  department: string; director: Agent | null; specialists: Agent[]; total_tasks: number;
}
export interface TaskResult {
  task_id: string; status: string; result_summary: string; output_data: Record<string, any>; tokens_used: number;
}

export function useAgents() {
  const [data, setData] = useState<AgentList | null>(null);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [agentRes, deptRes] = await Promise.allSettled([
        api.get("/api/v1/agents/list"),
        api.get("/api/v1/agents/departments"),
      ]);
      if (agentRes.status === "fulfilled") setData(agentRes.value.data);
      if (deptRes.status === "fulfilled") setDepartments(deptRes.value.data);
      setError(null);
    } catch { setError("Failed to load agents"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function deploy() {
    setDeploying(true);
    try { await api.post("/api/v1/agents/deploy"); await fetch(); }
    catch (err: any) { setError(err?.response?.data?.detail || "Deploy failed"); }
    finally { setDeploying(false); }
  }

  async function runTask(agentId: string, taskType: string, title: string, description: string): Promise<TaskResult | null> {
    try {
      const res = await api.post("/api/v1/agents/task", {
        agent_id: agentId, task_type: taskType, title, description,
      });
      await fetch();
      return res.data;
    } catch { setError("Task execution failed"); return null; }
  }

  return { data, departments, loading, deploying, error, deploy, runTask, refresh: fetch };
}
