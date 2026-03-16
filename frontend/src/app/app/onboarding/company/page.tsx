"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const INDUSTRIES = [
  "ecommerce", "healthcare", "travel", "restaurant", "education",
  "real_estate", "saas", "agency", "retail", "professional_services", "other",
];

export default function OnboardingCompany() {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [teamSize, setTeamSize] = useState(1);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/company", {
        industry,
        country,
        city,
        team_size: teamSize,
        primary_goal: goal,
      });
      router.push("/app/onboarding/presence");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
      <h2 className="text-lg font-bold text-fg">Company profile</h2>
      <p className="mt-1 mb-6 text-sm text-fg-muted">Tell us about your business so AEOS can tailor its analysis.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Industry</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} required
            className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none focus:border-aeos-400">
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="US" required
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="New York"
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Team size</label>
          <input type="number" min={1} max={10000} value={teamSize} onChange={(e) => setTeamSize(+e.target.value)}
            className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none focus:border-aeos-400" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Primary business goal</label>
          <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)}
            placeholder="Increase online sales by 30%"
            className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50">
          {loading ? "Saving\u2026" : "Continue"}
        </button>
      </form>
    </div>
  );
}
