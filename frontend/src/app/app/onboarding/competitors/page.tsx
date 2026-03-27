"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, ArrowLeft, ArrowRight, Loader2, Swords,
  Sparkles, Check, Globe, Search,
  Building2, BarChart3, Target, Shield,
} from "lucide-react";
import api from "@/lib/api";

interface DiscoveredCompetitor {
  name: string;
  url: string;
  description: string;
}

/* ── Scan phase definitions ─────────────────────────────────────── */
const SCAN_PHASES = [
  { icon: Building2,  label: "Reading company profile",      color: "from-violet-500 to-purple-500",  duration: 1200 },
  { icon: Search,     label: "Identifying industry & market", color: "from-blue-500 to-cyan-500",      duration: 1400 },
  { icon: Globe,      label: "Scanning regional market",      color: "from-cyan-500 to-teal-500",      duration: 1600 },
  { icon: BarChart3,  label: "Analyzing competitor websites", color: "from-orange-500 to-amber-500",   duration: 1400 },
  { icon: Target,     label: "Ranking by relevance",          color: "from-rose-500 to-pink-500",      duration: 1000 },
  { icon: Shield,     label: "Verifying results",             color: "from-emerald-500 to-green-500",  duration: 800  },
];

/* ── Dramatic scanning UI ───────────────────────────────────────── */
function ScanningScreen({ detectedIndustry, detectedCompany }: { detectedIndustry: string; detectedCompany: string }) {
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState(0);

  // Advance through phases
  useEffect(() => {
    let elapsed = 0;
    const timers = SCAN_PHASES.map((p, i) => {
      elapsed += p.duration;
      return setTimeout(() => setPhase(i + 1), elapsed);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animated dots ...
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  const progress = Math.round((phase / SCAN_PHASES.length) * 100);
  const currentPhase = SCAN_PHASES[Math.min(phase, SCAN_PHASES.length - 1)];
  const PhaseIcon = currentPhase.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* ── Radar circle ── */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Outer rings */}
        {[1, 1.4, 1.8].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-blue-400/20"
            animate={{ scale: [scale, scale * 1.08, scale], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        ))}
        {/* Rotating sweep */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 75%, rgba(59,130,246,0.3) 90%, rgba(99,102,241,0.5) 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
        {/* Ping dot */}
        <motion.div
          className="absolute h-2 w-2 rounded-full bg-blue-400"
          animate={{ x: [0, 38, 0, -38, 0], y: [38, 0, -38, 0, 38], opacity: [1, 0.6, 1, 0.6, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
        {/* Centre icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${currentPhase.color} shadow-xl`}
          >
            <PhaseIcon size={24} className="text-white" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Phase label ── */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-base font-bold text-fg"
          >
            {phase < SCAN_PHASES.length ? SCAN_PHASES[phase].label : "Finalising results"}
            {"...".slice(0, dots)}
          </motion.p>
        </AnimatePresence>
        {detectedCompany && (
          <p className="mt-1 text-xs text-fg-hint">
            {detectedIndustry ? `Scanning ${detectedIndustry} market for ${detectedCompany}` : `Scanning market for ${detectedCompany}`}
          </p>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-fg-hint">
          <span>SCANNING</span>
          <span className="text-blue-400">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            animate={{ width: `${Math.max(4, progress)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Phase steps row ── */}
      <div className="flex items-center gap-1.5">
        {SCAN_PHASES.map((p, i) => {
          const done = i < phase;
          const active = i === phase;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <motion.div
                animate={active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  done ? "bg-emerald-400" : active ? "bg-blue-400" : "bg-surface-secondary"
                }`}
              />
              {i < SCAN_PHASES.length - 1 && (
                <div className={`h-px w-4 transition-all duration-500 ${done ? "bg-emerald-400/60" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Animated stat counters ── */}
      <div className="flex gap-6">
        {[
          { label: "COVERAGE",  value: phase >= 2 ? "Regional" : "—",     accent: phase >= 2 },
          { label: "CONFIDENCE", value: phase >= 4 ? "90%+"   : phase >= 2 ? "..." : "—", accent: phase >= 4 },
          { label: "STATUS",    value: phase >= SCAN_PHASES.length ? "Done" : "Scanning", accent: false },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-hint">{s.label}</p>
            <motion.p
              animate={{ opacity: s.accent ? [0.7, 1, 0.7] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`mt-0.5 text-sm font-bold ${s.accent ? "text-blue-400" : "text-fg-muted"}`}
            >
              {s.value}
            </motion.p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Main competitors page ──────────────────────────────────────── */
export default function OnboardingCompetitors() {
  const router = useRouter();

  // Read company context stored by the company page
  const detectedIndustry = typeof window !== "undefined"
    ? (sessionStorage.getItem("aeos_detected_industry") || "")
    : "";
  const detectedCompany = typeof window !== "undefined"
    ? (sessionStorage.getItem("aeos_detected_company") || "")
    : "";

  // AI-discovered competitors
  const [discovered, setDiscovered] = useState<DiscoveredCompetitor[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(true);
  const [scanError, setScanError] = useState(false);

  // Manual entry
  const [manualUrls, setManualUrls] = useState<string[]>([""]);
  const [showManual, setShowManual] = useState(false);

  const [loading, setLoading] = useState(false);

  // Auto-discover on mount — run scan in parallel with the phase animation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Minimum display time so the animation plays through
      const minDelay = new Promise(r => setTimeout(r, 8000));
      try {
        const [{ data }] = await Promise.all([
          api.get("/api/v1/onboarding/discover-competitors"),
          minDelay,
        ]);
        if (!cancelled && data.competitors?.length) {
          setDiscovered(data.competitors);
          setSelected(new Set(data.competitors.map((c: DiscoveredCompetitor) => c.url)));
        } else if (!cancelled) {
          setShowManual(true);
        }
      } catch {
        await minDelay;
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
      router.push("/app/onboarding/integrations");
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
              <ScanningScreen
                detectedIndustry={detectedIndustry}
                detectedCompany={detectedCompany}
              />
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
                type="button"
                onClick={() => router.push("/app/onboarding/company")}
                className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-fg-muted transition hover:bg-surface-secondary hover:text-fg"
              >
                <ArrowLeft size={14} />
                Back
              </button>
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
                onClick={() => router.push("/app/onboarding/integrations")}
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
