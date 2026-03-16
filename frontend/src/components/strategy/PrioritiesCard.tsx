"use client";

import type { Priority } from "@/lib/hooks/useStrategyData";

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "bg-blue-100 text-blue-800",
  growth: "bg-emerald-100 text-emerald-800",
  operations: "bg-amber-100 text-amber-800",
  technology: "bg-violet-100 text-violet-800",
  hr: "bg-pink-100 text-pink-800",
  finance: "bg-cyan-100 text-cyan-800",
};

function ImpactBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));
  const color =
    width >= 75
      ? "bg-red-500"
      : width >= 50
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{value.toFixed(0)}</span>
    </div>
  );
}

export default function PrioritiesCard({
  priorities,
}: {
  priorities: Priority[];
}) {
  const top3 = priorities.slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Top priorities
        </h3>
        <span className="rounded-full bg-aeos-100 px-2.5 py-0.5 text-xs font-medium text-aeos-700">
          {priorities.length} total
        </span>
      </div>

      {top3.length === 0 ? (
        <p className="text-sm text-slate-400">
          No priorities detected yet. Complete the Setup Wizard to unlock
          insights.
        </p>
      ) : (
        <div className="space-y-3">
          {top3.map((p) => (
            <div
              key={p.rank}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aeos-600 text-xs font-bold text-white">
                {p.rank}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">
                    {p.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      CATEGORY_COLORS[p.category] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.category}
                  </span>
                </div>

                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {p.description}
                </p>

                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium uppercase text-slate-400">
                      Impact
                    </span>
                    <ImpactBar value={p.impact_score} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium uppercase text-slate-400">
                      Effort
                    </span>
                    <ImpactBar value={p.effort_score} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
