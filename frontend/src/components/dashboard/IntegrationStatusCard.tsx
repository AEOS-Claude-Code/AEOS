"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Plug2 } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";
import api from "@/lib/api";

interface Integration {
  provider_name: string;
  status: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  connected: <Check size={12} className="text-emerald-500" />,
  disconnected: <X size={12} className="text-red-400" />,
  connecting: <AlertTriangle size={12} className="text-amber-400" />,
  error: <AlertTriangle size={12} className="text-red-500" />,
};

const STATUS_STYLES: Record<string, string> = {
  connected: "border-emerald-200 bg-status-success-light",
  disconnected: "border-border bg-surface-secondary",
  connecting: "border-amber-200 bg-status-warning-light",
  error: "border-red-200 bg-status-danger-light",
};

export default function IntegrationStatusCard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/api/v1/integrations");
        setIntegrations(res.data.integrations ?? []);
      } catch (e: any) {
        setError(e?.message || "Failed to load integrations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const state: CardState = loading ? "loading" : error ? "error" : integrations.length > 0 ? "success" : "empty";
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <DashCard
      title="Integration status"
      subtitle="Connected platforms"
      badge={
        connectedCount > 0 ? (
          <span className="rounded-full bg-status-success-light px-2 py-0.5 text-2xs font-semibold text-status-success-text">
            {connectedCount} live
          </span>
        ) : undefined
      }
      delay={180}
    >
      {state === "loading" && <CardLoading lines={5} />}
      {state === "error" && <CardError message="Integration data unavailable" detail={error ?? undefined} />}
      {state === "empty" && (
        <CardEmpty
          icon={<Plug2 size={20} className="text-fg-hint" />}
          title="No integrations"
          description="Connect platforms in the Integrations page."
        />
      )}
      {state === "success" && (
        <div className="space-y-1.5">
          {integrations.slice(0, 8).map((intg) => (
            <div
              key={intg.provider_name}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 ${
                STATUS_STYLES[intg.status] ?? STATUS_STYLES.disconnected
              }`}
            >
              {STATUS_ICON[intg.status] ?? STATUS_ICON.disconnected}
              <span className="flex-1 text-2xs font-medium text-fg-secondary">
                {intg.provider_name}
              </span>
              <span className="text-2xs capitalize text-fg-hint">{intg.status}</span>
            </div>
          ))}
        </div>
      )}
    </DashCard>
  );
}
