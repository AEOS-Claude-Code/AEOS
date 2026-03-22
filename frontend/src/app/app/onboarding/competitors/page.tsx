"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  ArrowRight,
  Loader2,
  Swords,
  Sparkles,
  Check,
  Globe,
  Search,
  Radar,
} from "lucide-react";
import api from "@/lib/api";

interface DiscoveredCompetitor {
  name: string;
  url: string;
  description: string;
}

export default function OnboardingCompetitors() {
  const router = useRouter();

  // AI-discovered competitors
  const [discovered, setDiscovered] = useState<DiscoveredCompetitor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(true);
  const [scanError, setScanError] = useState(false);

  // Manual entry
  const [manualUrls, setManualUrls] = useState<string[]>([""]);
  const [showManual, setShowManual] = useState(false);

  const [loading, setLoading] = useState(false);

  // Auto-discover on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/v1/onboarding/discover-competitors");
        if (!cancelled && data.competitors?.length) {
          setDiscovered(data.competitors);
          setSelected(new Set(data.competitors.map((c: DiscoveredCompetitor) => c.url)));
        } else if (!cancelled) {
          setShowManual(true);
        }
      } catch {
        if (!cancelled) {
          setScanError(true);
          setShowManual(true);
        }
      } finally {
        if (!cancelled) setScanning(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function toggleCompetitor(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function updateManualUrl(i: number, val: string) {
    const next = [...manualUrls];
    next[i] = val;
    setManualUrls(next);
  }
  function addManualRow() {
    if (manualUrls.length < 5) setManualUrls([...manualUrls, ""]);
  }
  function removeManualRow(i: number) {
    if (manualUrls.length > 1) setManualUrls(manualUrls.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const allUrls = [
        ...Array.from(selected),
        ...manualUrls.filter((u) => u.trim()),
      ];
      await api.post("/api/v1/onboarding/competitors", { competitor_urls: allUrls });
      router.push("/app/onboarding/org-chart");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const totalSelected = selected.size + manualUrls.filter((u) => u.trim()).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
              <Swords size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Who are your competitors?</h2>
              <p className="text-sm text-fg-hint">
                AEOS will analyze their digital presence and benchmark against yours.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* AI Discovery Section */}
          <div className="border-b border-border px-6 py-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={13} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                AI-Discovered Competitors
              </span>
            </div>

            {scanning ? (
              /* Scanning animation */
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
                  <div className="absolute inset-1 animate-pulse rounded-full bg-blue-500/5" />
                  <Radar size={24} className="animate-pulse text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-fg-secondary">Scanning your industry...</p>
                  <p className="mt-1 text-xs text-fg-hint">
                    Finding competitors in your market
                  </p>
                </div>
                {/* Fake progress stats */}
                <div className="mt-2 flex gap-6">
                  {[
                    { label: "SCAN SPEED", value: "~3m" },
                    { label: "CONFIDENCE", value: "90%+", accent: true },
                    { label: "MARKET", value: "Local" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-hint">
                        {stat.label}
                      </p>
                      <p className={`mt-0.5 text-sm font-bold ${stat.accent ? "text-blue-400" : "text-fg-muted"}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : discovered.length > 0 ? (
              /* Discovered competitors list */
              <div className="space-y-2">
                {discovered.map((comp, i) => {
                  const isSelected = selected.has(comp.url);
                  return (
                    <motion.button
                      key={comp.url}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => toggleCompetitor(comp.url)}
                      className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        isSelected
                          ? "border-blue-500/30 bg-blue-500/[0.06]"
                          : "border-border bg-surface-secondary hover:border-border hover:bg-surface"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all ${
                          isSelected
                            ? "bg-blue-500 shadow-sm shadow-blue-500/30"
                            : "border border-border bg-surface-secondary"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-fg">{comp.name}</span>
                          {isSelected && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Globe size={10} className="shrink-0 text-fg-hint" />
                          <span className="truncate text-xs text-fg-hint">
                            {comp.url.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                        {comp.description && (
                          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                            {comp.description}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Match confidence tag */}
                <div className="flex justify-end pt-1">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400">
                    {discovered.length} competitors found
                  </span>
                </div>
              </div>
            ) : (
              /* No results */
              <div className="py-6 text-center">
                <p className="text-sm text-fg-hint">
                  {scanError
                    ? "Could not auto-discover competitors. Add them manually below."
                    : "No competitors found automatically. Add them manually below."}
                </p>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="px-6 py-5">
            {!showManual && discovered.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10"
              >
                <Plus size={14} /> Add more competitors manually
              </button>
            ) : showManual ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-hint">
                  Add manually
                </p>
                {manualUrls.map((url, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateManualUrl(i, e.target.value)}
                      placeholder={`https://competitor-${i + 1}.com`}
                      className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-hint focus:border-blue-500/40 focus:bg-surface focus:ring-2 focus:ring-blue-500/10"
                    />
                    {manualUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeManualRow(i)}
                        className="rounded-lg p-2 text-fg-hint transition hover:bg-status-danger/10 hover:text-status-danger"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                ))}
                {manualUrls.length < 5 && (
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10"
                  >
                    <Plus size={14} /> Add another
                  </button>
                )}
              </motion.div>
            ) : null}
          </div>

          {/* Action bar */}
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Continue
                    {totalSelected > 0 && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                        {totalSelected}
                      </span>
                    )}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/app/onboarding/org-chart")}
                className="rounded-xl px-5 py-3 text-sm font-medium text-fg-hint transition hover:bg-surface-secondary hover:text-fg-muted"
              >
                Skip
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
