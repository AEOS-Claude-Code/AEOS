"use client";

import { useEngineData } from "@/lib/hooks/useEngineData";
import { Megaphone, Target, BarChart3, Mail, Globe2, TrendingUp } from "lucide-react";
import DashCard from "@/components/dashboard/DashCard";
import { CardEmpty } from "@/components/ui/CardStates";

const CHANNELS = [
  { name: "SEO / Organic", icon: <Globe2 size={14} />, status: "active", leads: 12 },
  { name: "Paid Ads", icon: <Target size={14} />, status: "not_connected", leads: 0 },
  { name: "Email Campaigns", icon: <Mail size={14} />, status: "not_connected", leads: 0 },
  { name: "Social Media", icon: <Megaphone size={14} />, status: "active", leads: 5 },
];

export default function MarketingPage() {
  const { leadSummary } = useEngineData();

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-200/40">
          <Megaphone size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-fg">Marketing</h1>
          <p className="text-xs text-fg-muted">Campaign performance, channels, and automation</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DashCard title="Campaign overview" subtitle="Active marketing channels" delay={0}>
          <div className="space-y-3">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="flex items-center gap-3 rounded-widget border border-border-light bg-surface-secondary px-3 py-2.5">
                <span className="text-fg-secondary">{ch.icon}</span>
                <span className="flex-1 text-xs font-medium text-fg">{ch.name}</span>
                {ch.status === "active" ? (
                  <span className="rounded-pill bg-status-success-light px-2 py-0.5 text-2xs font-semibold text-status-success-text">{ch.leads} leads</span>
                ) : (
                  <span className="rounded-pill bg-surface-inset px-2 py-0.5 text-2xs text-fg-hint">Not connected</span>
                )}
              </div>
            ))}
          </div>
        </DashCard>

        <DashCard title="Lead acquisition" subtitle="30-day performance" delay={120}>
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums text-fg">{leadSummary?.total_leads_30d ?? 0}</span>
              <span className="text-sm text-fg-muted">leads this month</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-widget bg-surface-secondary px-3 py-2">
                <span className="text-lg font-bold tabular-nums text-fg">{leadSummary?.qualified_leads_30d ?? 0}</span>
                <span className="block text-2xs text-fg-hint">Qualified</span>
              </div>
              <div className="rounded-widget bg-surface-secondary px-3 py-2">
                <span className="text-lg font-bold tabular-nums text-fg">{leadSummary?.conversion_rate?.toFixed(1) ?? "0"}%</span>
                <span className="block text-2xs text-fg-hint">Conversion</span>
              </div>
            </div>
          </div>
        </DashCard>

        <DashCard title="Content calendar" subtitle="Upcoming campaigns" delay={240}>
          <CardEmpty icon={<BarChart3 size={20} className="text-fg-hint" />} title="No campaigns scheduled" description="Content calendar and campaign scheduling will be available in a future update." />
        </DashCard>

        <DashCard title="SEO performance" subtitle="Search visibility trends" delay={360}>
          <CardEmpty icon={<TrendingUp size={20} className="text-fg-hint" />} title="Connect Google Search Console" description="Link your Search Console to track keyword rankings, impressions, and click-through rates." />
        </DashCard>

        <DashCard title="Email marketing" subtitle="Campaign metrics" delay={480}>
          <CardEmpty icon={<Mail size={20} className="text-fg-hint" />} title="Connect email platform" description="Integrate Mailchimp, SendGrid, or another email provider to track open rates and conversions." />
        </DashCard>

        <DashCard title="Social media" subtitle="Engagement across platforms" delay={600}>
          <CardEmpty icon={<Megaphone size={20} className="text-fg-hint" />} title="Connect social accounts" description="Link your social media accounts to monitor engagement, follower growth, and content performance." />
        </DashCard>
      </div>
    </div>
  );
}
