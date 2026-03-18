"use client";

import type { Roadmap } from "@/lib/hooks/useStrategyData";

const DEPT_COLORS: Record<string, string> = {
  Marketing: "bg-blue-100 text-blue-700",
  "Marketing / Strategy": "bg-emerald-100 text-emerald-700",
  "IT / Engineering": "bg-violet-100 text-violet-700",
  Operations: "bg-amber-100 text-amber-700",
  HR: "bg-pink-100 text-pink-700",
  Finance: "bg-cyan-100 text-cyan-700",
};

function WeekBadge({ week }: { week: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-aeos-50 text-xs font-bold text-aeos-700">
      W{week}
    </span>
  );
}

export default function RoadmapPreviewCard({
  roadmap,
}: {
  roadmap: Roadmap | undefined;
}) {
  if (!roadmap || roadmap.actions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-hint">
          30-day roadmap
        </h3>
        <p className="text-sm text-fg-hint">
          No roadmap available yet. Strategic priorities are needed to generate
          an action plan.
        </p>
      </div>
    );
  }

  const previewActions = roadmap.actions.slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-hint">
          30-day roadmap
        </h3>
        <span className="text-xs text-fg-hint">
          {roadmap.actions.length} action{roadmap.actions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Goals */}
      {roadmap.goals.length > 0 && (
        <div className="mb-4 rounded-xl bg-aeos-50/60 px-4 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-aeos-500">
            Goal
          </span>
          <p className="mt-0.5 text-sm font-medium text-aeos-800">
            {roadmap.goals[0]}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />

        {previewActions.map((action, i) => (
          <div key={i} className="relative flex items-start gap-3 pl-0">
            <WeekBadge week={action.week} />

            <div className="min-w-0 flex-1 rounded-xl border border-border-light bg-surface-secondary px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-fg">
                  {action.action}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    DEPT_COLORS[action.department] ??
                    "bg-surface-inset text-fg-secondary"
                  }`}
                >
                  {action.department}
                </span>
              </div>
            </div>
          </div>
        ))}

        {roadmap.actions.length > 4 && (
          <p className="pl-10 text-xs text-fg-hint">
            + {roadmap.actions.length - 4} more action
            {roadmap.actions.length - 4 > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
