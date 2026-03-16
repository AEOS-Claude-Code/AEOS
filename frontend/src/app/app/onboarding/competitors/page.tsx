"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import api from "@/lib/api";

export default function OnboardingCompetitors() {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(false);

  function updateUrl(i: number, val: string) {
    const next = [...urls];
    next[i] = val;
    setUrls(next);
  }

  function addRow() {
    if (urls.length < 5) setUrls([...urls, ""]);
  }

  function removeRow(i: number) {
    if (urls.length > 1) setUrls(urls.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/competitors", {
        competitor_urls: urls.filter((u) => u.trim()),
      });
      router.push("/app/onboarding/integrations");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
      <h2 className="text-lg font-bold text-fg">Competitors</h2>
      <p className="mt-1 mb-6 text-sm text-fg-muted">
        Add 3 to 5 competitor websites. AEOS will analyze their digital presence and compare with yours.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {urls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-inset text-xs font-bold text-fg-hint">
              {i + 1}
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder={`https://competitor-${i + 1}.com`}
              className="flex-1 rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400"
            />
            {urls.length > 1 && (
              <button type="button" onClick={() => removeRow(i)}
                className="rounded-widget p-2 text-fg-hint transition hover:bg-surface-secondary hover:text-status-danger">
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {urls.length < 5 && (
          <button type="button" onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium text-aeos-600 transition hover:text-aeos-700">
            <Plus size={14} /> Add another competitor
          </button>
        )}

        <button type="submit" disabled={loading}
          className="mt-2 w-full rounded-widget bg-aeos-600 py-2.5 text-sm font-semibold text-white transition hover:bg-aeos-700 disabled:opacity-50">
          {loading ? "Saving\u2026" : "Continue"}
        </button>
      </form>
    </div>
  );
}
