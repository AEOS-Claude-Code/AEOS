"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, X, Globe, ArrowRight, Loader2, Swords } from "lucide-react";
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
  function addRow() { if (urls.length < 5) setUrls([...urls, ""]); }
  function removeRow(i: number) { if (urls.length > 1) setUrls(urls.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/competitors", { competitor_urls: urls.filter((u) => u.trim()) });
      router.push("/app/onboarding/integrations");
    } catch {} finally { setLoading(false); }
  }

  const ic = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:bg-white focus:ring-2 focus:ring-aeos-100";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-sm">
            <Swords size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Who are your competitors?</h2>
            <p className="text-sm text-slate-500">AEOS will analyze their digital presence and benchmark against yours.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {urls.map((url, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                {i + 1}
              </div>
              <input type="url" value={url} onChange={(e) => updateUrl(i, e.target.value)}
                placeholder={`https://competitor-${i + 1}.com`} className={ic} />
              {urls.length > 1 && (
                <button type="button" onClick={() => removeRow(i)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </motion.div>
          ))}

          {urls.length < 5 && (
            <button type="button" onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-aeos-600 transition hover:bg-aeos-50">
              <Plus size={14} /> Add competitor
            </button>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3 text-sm font-bold text-white shadow-lg shadow-aeos-500/20 transition-all hover:shadow-xl disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>}
            </button>
            <button type="button" onClick={() => router.push("/app/onboarding/integrations")}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100">
              Skip
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
