"use client";

import { Construction } from "lucide-react";

export default function CompetitorsPage() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Construction size={24} className="text-slate-400" />
      </div>
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-800">Competitors</h1>
        <p className="mt-1 text-sm text-slate-400">
          This module is coming in a future phase.
        </p>
      </div>
    </div>
  );
}
