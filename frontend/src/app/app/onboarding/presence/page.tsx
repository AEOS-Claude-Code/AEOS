"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function OnboardingPresence() {
  const router = useRouter();
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactPage, setContactPage] = useState("");
  const [phone, setPhone] = useState("");
  const [googleBiz, setGoogleBiz] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/presence", {
        website_url: website, social_links: { facebook, instagram, linkedin },
        whatsapp_link: whatsapp, contact_page: contactPage, phone, google_business_url: googleBiz,
      });
      router.push("/app/onboarding/competitors");
    } catch {} finally { setLoading(false); }
  }

  const ic = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-aeos-400 focus:bg-white focus:ring-2 focus:ring-aeos-100";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Website & social links</h2>
            <p className="text-sm text-slate-500">Help AEOS analyze your full digital presence.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Primary website</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com" className={ic} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Facebook", val: facebook, set: setFacebook, ph: "facebook.com/..." },
              { label: "Instagram", val: instagram, set: setInstagram, ph: "instagram.com/..." },
              { label: "LinkedIn", val: linkedin, set: setLinkedin, ph: "linkedin.com/company/..." },
              { label: "WhatsApp", val: whatsapp, set: setWhatsapp, ph: "wa.me/..." },
              { label: "Contact page", val: contactPage, set: setContactPage, ph: "https://..." },
              { label: "Google Business", val: googleBiz, set: setGoogleBiz, ph: "business.google.com/..." },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">{f.label}</label>
                <input type="url" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={ic} />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5XX XXX XXXX" className={ic} />
          </div>

          <button type="submit" disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3 text-sm font-bold text-white shadow-lg shadow-aeos-500/20 transition-all hover:shadow-xl disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></>}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
