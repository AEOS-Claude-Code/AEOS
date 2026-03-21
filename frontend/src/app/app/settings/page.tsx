"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import DashCard from "@/components/dashboard/DashCard";
import BillingCard from "@/components/dashboard/BillingCard";
import { StaggerGrid } from "@/components/ui/StaggerGrid";
import { Settings as SettingsIcon, User, Building2, CreditCard, Bell, Shield, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function SettingsPage() {
  const { user, workspace } = useAuth();

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (newPw.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPwLoading(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        current_password: currentPw,
        new_password: newPw,
      });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to change password.";
      setPwMsg({ type: "error", text: detail });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-fg">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Manage your workspace, account, and billing preferences.
        </p>
      </div>

      <StaggerGrid className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {/* Profile */}
        <DashCard title="Account" subtitle="Your personal information" delay={0}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aeos-50 text-sm font-bold text-aeos-700">
                {user?.full_name?.charAt(0) ?? "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{user?.full_name ?? "User"}</p>
                <p className="text-2xs text-fg-muted">{user?.email ?? ""}</p>
              </div>
            </div>
            <div className="rounded-widget bg-surface-secondary px-3 py-2">
              <span className="text-2xs text-fg-hint">Role</span>
              <span className="ml-2 text-xs font-medium text-fg">Owner</span>
            </div>
          </div>
        </DashCard>

        {/* Workspace */}
        <DashCard title="Workspace" subtitle="Company settings" delay={120}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-widget bg-surface-secondary px-3 py-2.5">
              <Building2 size={14} className="text-fg-secondary" />
              <div>
                <p className="text-xs font-medium text-fg">{workspace?.name ?? "Workspace"}</p>
                <p className="text-2xs text-fg-muted">{workspace?.industry ?? "General"} · {workspace?.city ?? ""} {workspace?.country ?? ""}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-widget bg-surface-secondary px-3 py-2">
                <span className="text-lg font-bold tabular-nums text-fg">{workspace?.team_size ?? 1}</span>
                <span className="block text-2xs text-fg-hint">Team size</span>
              </div>
              <div className="rounded-widget bg-surface-secondary px-3 py-2">
                <span className="text-xs font-bold text-fg">{workspace?.slug ?? ""}</span>
                <span className="block text-2xs text-fg-hint">Slug</span>
              </div>
            </div>
          </div>
        </DashCard>

        {/* Billing */}
        <BillingCard />

        {/* Notifications placeholder */}
        <DashCard title="Notifications" subtitle="Alert preferences" delay={360}>
          <div className="space-y-2.5">
            {["Lead alerts", "Opportunity alerts", "Weekly digest", "Security alerts"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-widget bg-surface-secondary px-3 py-2.5">
                <span className="text-xs text-fg-secondary">{item}</span>
                <div className="h-5 w-9 rounded-full bg-aeos-500 p-0.5">
                  <div className="ml-auto h-4 w-4 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>
        </DashCard>

        {/* Security – Change password */}
        <DashCard title="Security" subtitle="Authentication settings" delay={480}>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {/* Current password */}
            <div>
              <label className="text-2xs font-medium text-fg-hint mb-1 block">Current password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                  className="w-full rounded-widget bg-surface-secondary px-3 py-2 pr-9 text-xs text-fg outline-none ring-1 ring-transparent focus:ring-aeos-400 transition"
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-hint hover:text-fg-secondary">
                  {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="text-2xs font-medium text-fg-hint mb-1 block">New password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-widget bg-surface-secondary px-3 py-2 pr-9 text-xs text-fg outline-none ring-1 ring-transparent focus:ring-aeos-400 transition"
                  placeholder="Min 8 characters"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-hint hover:text-fg-secondary">
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-2xs font-medium text-fg-hint mb-1 block">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                className="w-full rounded-widget bg-surface-secondary px-3 py-2 text-xs text-fg outline-none ring-1 ring-transparent focus:ring-aeos-400 transition"
                placeholder="Re-enter new password"
              />
            </div>

            {/* Status message */}
            {pwMsg && (
              <div className={`flex items-center gap-2 rounded-widget px-3 py-2 text-xs ${pwMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {pwMsg.type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {pwMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading || !currentPw || !newPw || !confirmPw}
              className="w-full rounded-widget bg-aeos-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pwLoading ? "Changing..." : "Change password"}
            </button>

            {/* 2FA teaser */}
            <div className="flex items-center gap-3 rounded-widget bg-surface-secondary px-3 py-2.5 mt-2">
              <Shield size={14} className="text-fg-secondary" />
              <span className="flex-1 text-xs text-fg-secondary">Two-factor auth</span>
              <span className="text-2xs text-fg-hint">Coming soon</span>
            </div>
          </form>
        </DashCard>

        {/* API placeholder */}
        <DashCard title="API access" subtitle="Developer tools" delay={600}>
          <div className="rounded-widget bg-surface-secondary px-3 py-4 text-center">
            <p className="text-xs text-fg-muted">API keys and webhook configuration will be available for Business and Enterprise plans.</p>
          </div>
        </DashCard>
      </StaggerGrid>
    </div>
  );
}
