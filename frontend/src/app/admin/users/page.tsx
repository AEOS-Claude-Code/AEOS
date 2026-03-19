"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../layout";
import { motion } from "framer-motion";
import {
  Users, Trash2, Shield, ShieldOff, UserCheck, UserX,
  Loader2, Search, RefreshCw, AlertTriangle,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserItem {
  id: string; email: string; full_name: string; role: string;
  is_active: boolean; workspace_name: string; workspace_id: string;
  workspace_role: string; created_at: string; last_login_at: string | null;
}

export default function AdminUsersPage() {
  const { token } = useAdmin();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/admin/users?limit=200");
      setUsers(res.data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchUsers(); }, [token]); // eslint-disable-line

  async function handleDelete(userId: string) {
    setDeleting(userId);
    try {
      await api.delete(`/api/v1/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDelete(null);
    } catch {} finally { setDeleting(null); }
  }

  async function toggleActive(userId: string, active: boolean) {
    try {
      await api.put(`/api/v1/admin/users/${userId}/active`, { is_active: active });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: active } : u));
    } catch {}
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    try {
      await api.put(`/api/v1/admin/users/${userId}/role`, { role: isAdmin ? "platform_admin" : "user" });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: isAdmin ? "platform_admin" : "user" } : u));
    } catch {}
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.workspace_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-slate-400">{users.length} total users on platform</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/30 focus:ring-2 focus:ring-red-500/10"
          placeholder="Search by email, name, or workspace..." />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Workspace</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filtered.map(u => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-slate-800/30 hover:bg-slate-700/30 transition">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-white">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-300">{u.workspace_name || "—"}</p>
                  <p className="text-2xs text-slate-500">{u.workspace_role}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-2xs font-bold ${
                    u.role === "platform_admin"
                      ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                      : "bg-slate-700/50 text-slate-400"
                  }`}>
                    {u.role === "platform_admin" ? "Admin" : "User"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-2xs font-bold ${
                    u.is_active
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                  }`}>
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleAdmin(u.id, u.role !== "platform_admin")}
                      title={u.role === "platform_admin" ? "Remove admin" : "Make admin"}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-amber-400 transition">
                      {u.role === "platform_admin" ? <ShieldOff size={14} /> : <Shield size={14} />}
                    </button>
                    <button onClick={() => toggleActive(u.id, !u.is_active)}
                      title={u.is_active ? "Disable user" : "Enable user"}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-blue-400 transition">
                      {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    {confirmDelete === u.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                          className="rounded-lg bg-red-500/20 px-2 py-1 text-2xs font-bold text-red-400 hover:bg-red-500/30 transition">
                          {deleting === u.id ? "..." : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="rounded-lg px-2 py-1 text-2xs text-slate-500 hover:text-white transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)}
                        title="Delete user"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">No users found</div>
        )}
      </div>
    </div>
  );
}
