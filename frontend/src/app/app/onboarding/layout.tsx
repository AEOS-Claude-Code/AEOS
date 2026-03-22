"use client";

import { usePathname } from "next/navigation";
import { Zap, Check } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/lib/auth/AuthProvider";

const STEPS = [
  { path: "/app/onboarding/company", label: "Company", num: 1 },
  { path: "/app/onboarding/org-chart", label: "Org Chart", num: 2 },
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

  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20">
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide text-fg">AEOS</span>
        </Link>

        {/* Horizontal step indicators */}
        <div className="hidden items-center gap-1 sm:flex">
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-2xs font-semibold transition-all ${
                    done
                      ? "bg-status-success/10 text-status-success"
                      : active
                        ? "bg-surface-secondary text-fg ring-1 ring-border"
                        : "text-fg-hint"
                  }`}
                >
                  {done ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-status-success">
                      <Check size={10} className="text-white" />
                    </div>
                  ) : (
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                        active
                          ? "bg-aeos-500 text-white"
                          : "bg-surface-secondary border border-border text-fg-hint"
                      }`}
                    >
                      {step.num}
                    </span>
                  )}
                  {step.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-px w-5 ${done ? "bg-status-success/40" : "bg-border"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <span className="text-2xs text-fg-hint sm:hidden">
          Step {(currentIdx >= 0 ? currentIdx : 0) + 1}/5
        </span>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-6 py-8">
        <div className="w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
