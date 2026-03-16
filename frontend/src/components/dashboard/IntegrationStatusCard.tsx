"use client";

import { Check, X, AlertTriangle, Plug2 } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";

interface Integration {
  name: string;
  status: "connected" | "disconnected" | "recommended";
}

const MOCK_INTEGRATIONS: Integration[] = [
  { name: "Google Analytics", status: "disconnected" },
  { name: "Google Search Console", status: "disconnected" },
  { name: "Google Business", status: "connected" },
  { name: "Facebook", status: "connected" },
  { name: "Instagram", status: "connected" },
  { name: "WordPress", status: "recommended" },
  { name: "Shopify", status: "recommended" },
];

const STATUS_ICON = {
  connected: <Check size={12} className="text-emerald-500" />,
  disconnected: <X size={12} className="text-red-400" />,
  recommended: <AlertTriangle size={12} className="text-amber-400" />,
};

const STATUS_STYLES = {
  connected: "border-emerald-200 bg-emerald-50/50",
  disconnected: "border-red-200 bg-red-50/50",
  recommended: "border-amber-200 bg-amber-50/50",
};

export default function IntegrationStatusCard({
  integrations = MOCK_INTEGRATIONS,
  state = "success",
  error,
  onRetry,
}: {
  integrations?: Integration[];
  state?: CardState;
  error?: string | null;
  onRetry?: () => void;
}) {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const total = integrations.length;
  const pct = total > 0 ? Math.round((connected / total) * 100) : 0;

  return (
    <DashCard
      title="Integration status"
      subtitle={
        state === "success"
          ? `${connected} of ${total} connected`
          : "Platform connections"
      }
      badge={
        state === "success" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
              pct >= 60
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {pct}%
          </span>
        ) : undefined
      }
      delay={180}
    >
      {state === "loading" && <CardLoading lines={4} />}

      {state === "error" && (
        <CardError
          message="Integration data unavailable"
          detail={error ?? undefined}
          onRetry={onRetry}
        />
      )}

      {state === "empty" && (
        <CardEmpty
          icon={<Plug2 size={20} className="text-fg-hint" />}
          title="No integrations configured"
          description="Connect your platforms in Settings to unlock data-driven insights."
        />
      )}

      {state === "success" && (
        <>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-aeos-400 to-emerald-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {integrations.map((integ) => (
              <div
                key={integ.name}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                  STATUS_STYLES[integ.status]
                }`}
              >
                {STATUS_ICON[integ.status]}
                <span className="truncate text-xs-tight font-medium text-slate-700">
                  {integ.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </DashCard>
  );
}
