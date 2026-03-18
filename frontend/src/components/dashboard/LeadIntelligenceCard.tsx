"use client";

import { ArrowDown, ArrowRight, ArrowUp, Users, UserPlus } from "lucide-react";
import DashCard from "./DashCard";
import {
  CardLoading,
  CardEmpty,
  CardError,
  type CardState,
} from "@/components/ui/CardStates";

interface LeadData {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  topSource: string;
  trend: string;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising")
    return <ArrowUp size={12} className="text-emerald-500" />;
  if (trend === "declining")
    return <ArrowDown size={12} className="text-red-500" />;
  return <ArrowRight size={12} className="text-amber-500" />;
}

function MetricCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-2xs font-medium uppercase tracking-wider text-fg-hint">
        {label}
      </span>
      <span className="mt-0.5 text-lg font-bold tabular-nums text-fg">
        {value}
      </span>
      {sub && <span className="text-2xs text-fg-hint">{sub}</span>}
    </div>
  );
}

export default function LeadIntelligenceCard({
  data,
  state = "success",
  error,
  onRetry,
}: {
  data?: LeadData;
  state?: CardState;
  error?: string | null;
  onRetry?: () => void;
}) {
  const trendLabel =
    data?.trend === "rising"
      ? "Rising"
      : data?.trend === "declining"
        ? "Declining"
        : "Stable";

  const trendColor =
    data?.trend === "rising"
      ? "bg-status-success-light text-status-success-text"
      : data?.trend === "declining"
        ? "bg-status-danger-light text-status-danger-text"
        : "bg-status-warning-light text-status-warning-text";

  return (
    <DashCard
      title="Lead intelligence"
      subtitle="30-day lead activity"
      badge={
        state === "success" && data ? (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${trendColor}`}
          >
            <TrendIcon trend={data.trend} />
            {trendLabel}
          </span>
        ) : undefined
      }
      delay={60}
    >
      {state === "loading" && <CardLoading lines={3} />}

      {state === "error" && (
        <CardError
          message="Lead data unavailable"
          detail={error ?? undefined}
          onRetry={onRetry}
        />
      )}

      {state === "empty" && (
        <CardEmpty
          icon={<UserPlus size={20} className="text-fg-hint" />}
          title="No leads captured yet"
          description="Leads will appear here once your forms and tracking are connected."
        />
      )}

      {state === "success" && data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <MetricCell
              label="Total leads"
              value={data.totalLeads.toString()}
              sub="last 30 days"
            />
            <MetricCell
              label="Qualified"
              value={data.qualifiedLeads.toString()}
              sub={`${((data.qualifiedLeads / Math.max(1, data.totalLeads)) * 100).toFixed(0)}% of total`}
            />
            <MetricCell
              label="Conversion"
              value={`${data.conversionRate}%`}
              sub="vs 3.2% benchmark"
            />
            <MetricCell label="Top source" value={data.topSource} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-2xs text-fg-hint">
              <Users size={12} />
              <span className="font-medium">{data.totalLeads}</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-aeos-300 to-emerald-300" />
            <div className="flex items-center gap-1.5 text-2xs font-semibold text-emerald-600">
              <span>{data.qualifiedLeads} qualified</span>
            </div>
          </div>
        </>
      )}
    </DashCard>
  );
}
