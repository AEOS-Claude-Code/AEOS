"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, LayoutDashboard, Users, Building2, Activity,
  LogOut, ChevronLeft, Settings, Zap, DollarSign, Cpu,
} from "lucide-react";
import api from "@/lib/api";

interface AdminCtx {
  token: string | null;
  admin: { id: string; email: string; full_name: string } | null;
  logout: () => void;
}

const AdminContext = createContext<AdminCtx>({ token: null, admin: null, logout: () => {} });
export const useAdmin = () => useContext(AdminContext);

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/finance", icon: DollarSign, label: "Finance & Billing" },
  { href: "/admin/workspaces", icon: Building2, label: "Workspaces" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/engines", icon: Cpu, label: "Engines" },
  { href: "/admin/system", icon: Activity, label: "System Health" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginSecret, setLoginSecret] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("aeos_admin_token");
    const a = localStorage.getItem("aeos_admin_user");
    if (t && a) {
      setToken(t);
      setAdmin(JSON.parse(a));
    }
    setReady(true);
  }, []);

  function logout() {
    localStorage.removeItem("aeos_admin_token");
    localStorage.removeItem("aeos_admin_user");
    setToken(null);
    setAdmin(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await api.post("/api/v1/admin/login", {
        email: loginEmail,
        password: loginPass,
        admin_secret: loginSecret,
      });
      const { access_token, admin: adm } = res.data;
      localStorage.setItem("aeos_admin_token", access_token);
      localStorage.setItem("aeos_admin_user", JSON.stringify(adm));
      setToken(access_token);
      setAdmin(adm);
    } catch (err: any) {
      setLoginError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  if (!ready) return null;

  // ── Login screen ──
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-2xl border border-slate-700/50 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AEOS Admin</h1>
              <p className="text-sm text-slate-400">Platform management console</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                placeholder="admin@aeos.com" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Password</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                placeholder="••••••••" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Admin Secret</label>
              <input type="password" value={loginSecret} onChange={e => setLoginSecret(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                placeholder="Platform admin secret key" required />
            </div>

            {loginError && (
              <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs text-red-400 ring-1 ring-red-500/20">{loginError}</div>
            )}

            <button type="submit" disabled={loginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:shadow-xl disabled:opacity-50">
              {loginLoading ? "Authenticating..." : "Access Admin Console"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Admin panel ──
  return (
    <AdminContext.Provider value={{ token, admin, logout }}>
      <div className="flex min-h-screen bg-slate-900">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">AEOS Admin</p>
              <p className="text-2xs text-slate-500">Platform Console</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {NAV.map(n => {
              const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
              return (
                <button key={n.href} onClick={() => router.push(n.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}>
                  <n.icon size={16} />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-700/50 p-3">
            <div className="mb-2 rounded-xl bg-slate-700/30 px-3 py-2">
              <p className="text-xs font-semibold text-white">{admin?.full_name}</p>
              <p className="text-2xs text-slate-500">{admin?.email}</p>
            </div>
            <button onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </AdminContext.Provider>
  );
}
