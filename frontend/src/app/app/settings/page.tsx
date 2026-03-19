"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import DashCard from "@/components/dashboard/DashCard";
import BillingCard from "@/components/dashboard/BillingCard";
import { StaggerGrid } from "@/components/ui/StaggerGrid";
import { Settings as SettingsIcon, User, Building2, CreditCard, Bell, Shield, Key } from "lucide-react";

export default function SettingsPage() {
  const { user, workspace } = useAuth();

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

        {/* Security placeholder */}
        <DashCard title="Security" subtitle="Authentication settings" delay={480}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-widget bg-surface-secondary px-3 py-2.5">
              <Key size={14} className="text-fg-secondary" />
              <span className="flex-1 text-xs text-fg-secondary">Change password</span>
              <span className="text-2xs text-fg-hint">Coming soon</span>
            </div>
            <div className="flex items-center gap-3 rounded-widget bg-surface-secondary px-3 py-2.5">
              <Shield size={14} className="text-fg-secondary" />
              <span className="flex-1 text-xs text-fg-secondary">Two-factor auth</span>
              <span className="text-2xs text-fg-hint">Coming soon</span>
            </div>
          </div>
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
