"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plug, CheckCircle2, XCircle, Loader2, RefreshCw,
  Search, BarChart3, Megaphone, Camera, Briefcase, FileText, ShoppingCart, CreditCard, Users, Mail, MessageSquare, Target,
} from "lucide-react";
import api from "@/lib/api";

interface Integration {
  id: string;
  provider_id: string;
  provider_name: string;
  category: string;
  description: string;
  icon: string;
  status: string;
  display_name: string;
  connected_at: string | null;
  error_message: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  search: <Search size={18} />,
  bar_chart: <BarChart3 size={18} />,
  megaphone: <Megaphone size={18} />,
  camera: <Camera size={18} />,
  briefcase: <Briefcase size={18} />,
  file_text: <FileText size={18} />,
  shopping_cart: <ShoppingCart size={18} />,
  credit_card: <CreditCard size={18} />,
  users: <Users size={18} />,
  mail: <Mail size={18} />,
  message_square: <MessageSquare size={18} />,
  target: <Target size={18} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  seo: "bg-blue-50 text-blue-700",
  analytics: "bg-violet-50 text-violet-700",
  advertising: "bg-orange-50 text-orange-700",
  social: "bg-pink-50 text-pink-700",
  cms: "bg-emerald-50 text-emerald-700",
  ecommerce: "bg-amber-50 text-amber-700",
  payments: "bg-green-50 text-green-700",
  crm: "bg-cyan-50 text-cyan-700",
  email: "bg-red-50 text-red-700",
  communication: "bg-indigo-50 text-indigo-700",
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/integrations");
      setIntegrations(res.data.integrations);
      setConnectedCount(res.data.connected);
    } catch {
      // fail silently, keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    try {
      await api.post("/api/v1/integrations/connect", {
        provider_id: providerId,
        simulated_account_name: "",
      });
      await fetchIntegrations();
    } catch {
      // handled by card error state
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect(providerId: string) {
    setConnectingId(providerId);
    try {
      await api.post("/api/v1/integrations/disconnect", {
        provider_id: providerId,
      });
      await fetchIntegrations();
    } catch {
      // handled by card error state
    } finally {
      setConnectingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
          <span className="text-sm text-fg-muted">Loading integrations…</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-fg">Integrations</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Connect your tools to power AEOS intelligence engines with real-time data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-pill bg-status-success-light px-3 py-1 text-xs font-semibold text-status-success-text">
            {connectedCount} connected
          </span>
          <span className="rounded-pill bg-surface-secondary px-3 py-1 text-xs text-fg-muted">
            {integrations.length} available
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {integrations.map((intg) => {
          const isConnected = intg.status === "connected";
          const isConnecting = connectingId === intg.provider_id;
          const isError = intg.status === "error";

          return (
            <div
              key={intg.provider_id}
              className={`rounded-2xl border bg-surface p-5 shadow-card transition ${
                isConnected
                  ? "border-status-success/30"
                  : isError
                    ? "border-status-danger/30"
                    : "border-border hover:border-aeos-200 hover:shadow-md"
              }`}
            >
              {/* Header */}
              <div className="mb-3 flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isConnected ? "bg-status-success-light text-status-success" : "bg-aeos-50 text-aeos-600"
                }`}>
                  {ICON_MAP[intg.icon] ?? <Plug size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">{intg.provider_name}</span>
                    {isConnected && <CheckCircle2 size={14} className="shrink-0 text-status-success" />}
                    {isError && <XCircle size={14} className="shrink-0 text-status-danger" />}
                  </div>
                  <span className={`rounded-pill px-1.5 py-0.5 text-2xs font-medium ${
                    CATEGORY_COLORS[intg.category] ?? "bg-surface-secondary text-fg-hint"
                  }`}>
                    {intg.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="mb-3 text-2xs leading-relaxed text-fg-muted">{intg.description}</p>

              {/* Connected info */}
              {isConnected && intg.display_name && (
                <div className="mb-3 rounded-widget bg-status-success-light/50 px-3 py-2">
                  <span className="text-2xs text-status-success-text">
                    Connected as <span className="font-semibold">{intg.display_name}</span>
                  </span>
                </div>
              )}

              {/* Error info */}
              {isError && intg.error_message && (
                <div className="mb-3 rounded-widget bg-status-danger-light/50 px-3 py-2">
                  <span className="text-2xs text-status-danger-text">{intg.error_message}</span>
                </div>
              )}

              {/* Action button */}
              {isConnected ? (
                <button
                  onClick={() => handleDisconnect(intg.provider_id)}
                  disabled={isConnecting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-widget border border-border py-2 text-2xs font-medium text-fg-secondary transition hover:bg-surface-secondary disabled:opacity-50"
                >
                  {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(intg.provider_id)}
                  disabled={isConnecting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-widget bg-aeos-600 py-2 text-2xs font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <><Loader2 size={12} className="animate-spin" /> Connecting…</>
                  ) : (
                    <><Plug size={12} /> Connect</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
