"use client";

import DashCard from "@/components/dashboard/DashCard";
import { CardEmpty } from "@/components/ui/CardStates";
import { Swords, Eye, TrendingDown, BarChart3, Search } from "lucide-react";

export default function CompetitorsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-fg">Competitors</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Monitor competitor activity, market positioning, and competitive intelligence.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DashCard title="Competitive landscape" subtitle="Tracked competitors" delay={0}>
          <CardEmpty
            icon={<Swords size={20} className="text-fg-hint" />}
            title="No competitors tracked"
            description="Add competitor URLs during onboarding or in settings to start monitoring their digital presence."
          />
        </DashCard>

        <DashCard title="SEO gap analysis" subtitle="Keyword comparison" delay={120}>
          <CardEmpty
            icon={<Search size={20} className="text-fg-hint" />}
            title="Connect Search Console"
            description="Compare your keyword rankings against competitors to find content gaps and opportunities."
          />
        </DashCard>

        <DashCard title="Market share signals" subtitle="Traffic and visibility" delay={240}>
          <CardEmpty
            icon={<BarChart3 size={20} className="text-fg-hint" />}
            title="Market data coming soon"
            description="Industry market share estimates and traffic comparison will be available in a future update."
          />
        </DashCard>

        <DashCard title="Competitor activity feed" subtitle="Recent changes detected" delay={360}>
          <CardEmpty
            icon={<Eye size={20} className="text-fg-hint" />}
            title="Activity monitoring"
            description="Track when competitors update their website, launch new content, or change their tech stack."
          />
        </DashCard>

        <DashCard title="Pricing intelligence" subtitle="Competitive pricing" delay={480}>
          <CardEmpty
            icon={<TrendingDown size={20} className="text-fg-hint" />}
            title="Pricing data"
            description="Monitor competitor pricing changes and positioning strategies."
          />
        </DashCard>
      </div>
    </div>
  );
}
