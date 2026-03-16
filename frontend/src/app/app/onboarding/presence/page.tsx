"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        website_url: website,
        social_links: { facebook, instagram, linkedin },
        whatsapp_link: whatsapp,
        contact_page: contactPage,
        phone,
        google_business_url: googleBiz,
      });
      router.push("/app/onboarding/competitors");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
      <h2 className="text-lg font-bold text-fg">Website and social links</h2>
      <p className="mt-1 mb-6 text-sm text-fg-muted">We'll use these to analyze your digital presence.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Primary website URL</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourcompany.com"
            className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Facebook</label>
            <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..."
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Instagram</label>
            <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..."
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">LinkedIn</label>
            <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..."
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">WhatsApp link</label>
            <input type="url" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/..."
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Contact / Booking page</label>
            <input type="url" value={contactPage} onChange={(e) => setContactPage(e.target.value)} placeholder="https://..."
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Google Business</label>
            <input type="url" value={googleBiz} onChange={(e) => setGoogleBiz(e.target.value)} placeholder="https://business.google.com/..."
              className="w-full rounded-widget border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-fg-secondary">Phone (optional)</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567"
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
