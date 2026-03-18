"use client";

import { usePathname } from "next/navigation";
import { Zap, Check } from "lucide-react";
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-700 shadow-sm shadow-aeos-500/20">
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">AEOS</span>
        </Link>

        {/* Horizontal step indicators */}
        <div className="hidden items-center gap-1 sm:flex">
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.num} className="flex items-center">
                <div className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 text-2xs font-semibold transition-all ${
                  done ? "bg-emerald-50 text-emerald-700" : active ? "bg-aeos-50 text-aeos-700 ring-1 ring-aeos-200" : "text-slate-400"
                }`}>
                  {done ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                      <Check size={10} className="text-white" />
                    </div>
                  ) : (
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      active ? "bg-aeos-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}>{step.num}</span>
                  )}
                  {step.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-1 h-px w-4 ${done ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <span className="text-2xs text-slate-400 sm:hidden">Step {(currentIdx >= 0 ? currentIdx : 0) + 1}/5</span>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
