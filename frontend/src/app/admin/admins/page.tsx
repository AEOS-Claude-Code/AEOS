"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  UserCog, Shield, ShieldOff, Loader2, RefreshCw, Plus, Mail,
  Calendar, CheckCircle2,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserItem {
  id: string; email: string; full_name: string; role: string;
  is_active: boolean; workspace_name: string; workspace_id: string;
  workspace_role: string; created_at: string; last_login_at: string | null;
}

export default function AdminProfilesPage() {
  const { token, admin } = useAdmin();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/admin/users?limit=200");
      setUsers(res.data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchUsers(); }, [token]); // eslint-disable-line

  const admins = users.filter(u => u.role === "platform_admin");
  const regularUsers = users.filter(u => u.role !== "platform_admin");

  async function promoteToAdmin(userId: string) {
    setPromoting(userId);
    try {
      await api.put(`/api/v1/admin/users/${userId}/role`, { role: "platform_admin" });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: "platform_admin" } : u));
    } catch {} finally { setPromoting(null); }
  }

  async function demoteAdmin(userId: string) {
    if (userId === admin?.id) return; // Can't demote yourself
    setPromoting(userId);
    try {
      await api.put(`/api/v1/admin/users/${userId}/role`, { role: "user" });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: "user" } : u));
    } catch {} finally { setPromoting(null); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Profiles</h1>
          <p className="text-sm text-slate-400">{admins.length} platform admin{admins.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Current Admin Profile */}
      {admin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-2xl font-bold text-white shadow-lg shadow-red-500/20">
              {admin.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{admin.full_name}</h2>
              <p className="text-sm text-slate-400">{admin.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400">
                <Shield size={10} /> Platform Admin (You)
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* All Admins */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
          <Shield size={18} className="text-red-400" /> Platform Admins
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-red-500/20 bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-sm font-bold text-red-400">
                  {u.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.full_name}</p>
                  <p className="text-2xs text-slate-500 truncate">{u.email}</p>
                </div>
                {u.id !== admin?.id && (
                  <button onClick={() => demoteAdmin(u.id)} disabled={promoting === u.id}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                    title="Remove admin access">
                    <ShieldOff size={14} />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-2xs text-slate-600">
                <span className="flex items-center gap-1"><Mail size={10} /> {u.workspace_name || "—"}</span>
                <span className="flex items-center gap-1"><Calendar size={10} /> {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add New Admin */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
          <Plus size={18} className="text-blue-400" /> Promote User to Admin
        </h2>
        <p className="mb-3 text-sm text-slate-500">Select a registered user to grant platform admin access.</p>
        {regularUsers.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">User</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Workspace</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Joined</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {regularUsers.map(u => (
                  <tr key={u.id} className="bg-slate-800/30 hover:bg-slate-700/30 transition">
                    <td className="px-4 py-2">
                      <p className="text-sm font-semibold text-white">{u.full_name}</p>
                      <p className="text-2xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-400">{u.workspace_name || "—"}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => promoteToAdmin(u.id)} disabled={promoting === u.id}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition ml-auto">
                        {promoting === u.id ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                        Make Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No regular users to promote</p>
        )}
      </div>
    </div>
  );
}
