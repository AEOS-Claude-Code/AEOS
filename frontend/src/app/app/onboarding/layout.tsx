"use client";

import { usePathname } from "next/navigation";
import { Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/lib/auth/AuthProvider";

const STEPS = [
  { path: "/app/onboarding/company", label: "Company", num: 1 },
  { path: "/app/onboarding/presence", label: "Presence", num: 2 },
  { path: "/app/onboarding/competitors", label: "Competitors", num: 3 },
  { path: "/app/onboarding/integrations", label: "Integrations", num: 4 },
  { path: "/app/onboarding/complete", label: "Ready", num: 5 },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <OnboardingShell>{children}</OnboardingShell>
    </RequireAuth>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIdx = STEPS.findIndex((s) => pathname.startsWith(s.path));
  const currentStep = currentIdx >= 0 ? currentIdx + 1 : 1;

  return (
    <div className="flex min-h-screen flex-col bg-surface-tertiary">
      {/* Top bar */}
      <header className="flex h-15 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-700">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-fg">AEOS Setup Wizard</span>
        </div>
        <span className="text-xs-tight text-fg-muted">Step {currentStep} of 5</span>
      </header>

      {/* Step progress */}
      <div className="border-b border-border-light bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.num} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-status-success text-white"
                      : active
                        ? "bg-aeos-600 text-white"
                        : "bg-surface-inset text-fg-hint"
                  }`}
                >
                  {done ? <CheckCircle2 size={14} /> : step.num}
                </div>
                <span
                  className={`hidden text-xs-tight font-medium sm:block ${
                    active ? "text-fg" : "text-fg-hint"
                  }`}
                >
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 ${done ? "bg-status-success" : "bg-border-light"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
