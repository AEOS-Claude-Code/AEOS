"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  Globe, Loader2, CheckCircle2, XCircle, Phone, Mail, Share2, Cpu,
  Sparkles, MessageCircle, ExternalLink, Building2, Bot,
  ArrowRight, Check,
} from "lucide-react";

const INDUSTRIES = [
  "ecommerce","healthcare","travel","restaurant","education","real_estate","saas",
  "agency","design_creative","engineering","construction","manufacturing","technology",
  "retail","finance","logistics","media_entertainment","nonprofit","professional_services","other",
];
const INDUSTRY_LABELS: Record<string,string> = {
  ecommerce:"E-commerce",healthcare:"Healthcare",travel:"Travel & Tourism",
  restaurant:"Restaurant & Food",education:"Education",real_estate:"Real Estate",
  saas:"SaaS / Software",agency:"Agency / Marketing",design_creative:"Design & Creative",
  engineering:"Engineering & Solutions",construction:"Construction",manufacturing:"Manufacturing",
  technology:"Technology & IT",retail:"Retail",finance:"Finance & Banking",
  logistics:"Logistics & Supply Chain",media_entertainment:"Media & Entertainment",
  nonprofit:"Non-profit",professional_services:"Professional Services",other:"Other",
};
const SOCIAL_LABELS: Record<string,string> = {
  linkedin:"LinkedIn",facebook:"Facebook",instagram:"Instagram",twitter:"X",
  youtube:"YouTube",tiktok:"TikTok",pinterest:"Pinterest",snapchat:"Snapchat",
};

const COUNTRY_CITIES: Record<string, string[]> = {
  "Jordan": ["Amman","Irbid","Zarqa","Aqaba","Madaba","Salt","Jerash","Mafraq","Karak","Ajloun"],
  "Saudi Arabia": ["Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar","Dhahran","Tabuk","Abha","Taif","Jubail","Yanbu","Buraidah","Hail"],
  "UAE": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Al Ain","Umm Al Quwain"],
  "Qatar": ["Doha","Al Wakrah","Al Khor","Al Rayyan","Umm Salal","Lusail"],
  "Kuwait": ["Kuwait City","Hawalli","Salmiya","Farwaniya","Jahra","Ahmadi","Mangaf"],
  "Bahrain": ["Manama","Muharraq","Riffa","Hamad Town","Isa Town","Sitra","Budaiya"],
  "Oman": ["Muscat","Salalah","Sohar","Nizwa","Sur","Ibri","Barka","Rustaq"],
  "Egypt": ["Cairo","Alexandria","Giza","Sharm El Sheikh","Hurghada","Luxor","Aswan","Tanta","Mansoura","Port Said"],
  "Lebanon": ["Beirut","Tripoli","Sidon","Tyre","Jounieh","Byblos","Zahle","Baalbek"],
  "Iraq": ["Baghdad","Erbil","Basra","Sulaymaniyah","Mosul","Kirkuk","Najaf","Karbala"],
  "Palestine": ["Ramallah","Gaza","Nablus","Hebron","Bethlehem","Jenin","Jericho","Tulkarm"],
  "United States": ["New York","Los Angeles","Chicago","Houston","Phoenix","San Francisco","Seattle","Boston","Miami","Denver","Austin","Dallas","Atlanta","San Diego","Portland"],
  "United Kingdom": ["London","Manchester","Birmingham","Leeds","Glasgow","Liverpool","Edinburgh","Bristol","Sheffield","Cardiff"],
  "Canada": ["Toronto","Vancouver","Montreal","Calgary","Ottawa","Edmonton","Winnipeg","Quebec City","Halifax"],
  "Germany": ["Berlin","Munich","Hamburg","Frankfurt","Cologne","Stuttgart","Dusseldorf","Leipzig","Dresden"],
  "France": ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Bordeaux","Lille"],
  "India": ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow"],
  "Turkey": ["Istanbul","Ankara","Izmir","Antalya","Bursa","Adana","Gaziantep","Konya"],
  "Pakistan": ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta"],
  "Morocco": ["Casablanca","Rabat","Marrakech","Fez","Tangier","Agadir","Meknes","Oujda"],
  "Tunisia": ["Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabes","Monastir"],
  "Algeria": ["Algiers","Oran","Constantine","Annaba","Blida","Setif","Batna"],
  "Libya": ["Tripoli","Benghazi","Misrata","Zawiya","Sabratah","Zliten"],
  "Sudan": ["Khartoum","Omdurman","Port Sudan","Kassala","El Obeid","Nyala"],
  "Singapore": ["Singapore"],
  "Malaysia": ["Kuala Lumpur","George Town","Johor Bahru","Ipoh","Shah Alam","Melaka","Kota Kinabalu"],
  "Australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Canberra","Gold Coast","Hobart"],
  "Japan": ["Tokyo","Osaka","Yokohama","Nagoya","Kyoto","Sapporo","Fukuoka","Kobe"],
  "South Korea": ["Seoul","Busan","Incheon","Daegu","Daejeon","Gwangju","Ulsan","Suwon"],
  "China": ["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Hangzhou","Wuhan","Nanjing","Xian"],
  "Brazil": ["Sao Paulo","Rio de Janeiro","Brasilia","Salvador","Fortaleza","Belo Horizonte","Recife","Curitiba"],
  "Mexico": ["Mexico City","Guadalajara","Monterrey","Puebla","Tijuana","Leon","Cancun","Merida"],
  "South Africa": ["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth","Bloemfontein"],
  "Nigeria": ["Lagos","Abuja","Kano","Ibadan","Port Harcourt","Benin City","Kaduna"],
  "Kenya": ["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Malindi"],
  "Italy": ["Rome","Milan","Naples","Turin","Palermo","Florence","Venice","Bologna","Genoa"],
  "Spain": ["Madrid","Barcelona","Valencia","Seville","Malaga","Bilbao","Zaragoza"],
  "Netherlands": ["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven","Groningen"],
  "Sweden": ["Stockholm","Gothenburg","Malmo","Uppsala","Linkoping"],
  "Switzerland": ["Zurich","Geneva","Basel","Bern","Lausanne","Lucerne"],
  "Ireland": ["Dublin","Cork","Galway","Limerick","Waterford"],
};
const COUNTRIES = Object.keys(COUNTRY_CITIES).sort();

interface IntakeResult {
  url:string; detected_company_name:string; detected_industry:string;
  industry_confidence:number; detected_country:string; detected_city:string;
  detected_phone_numbers:string[]; detected_emails:string[];
  detected_social_links:Record<string,string[]>; detected_whatsapp_links:string[];
  detected_contact_pages:string[]; detected_booking_pages:string[];
  detected_tech_stack:string[]; page_title:string; meta_description:string;
}

/* -- Animated loading screen ---------------------------------------- */

const SCAN_STEPS = [
  { icon: Globe, label: "Fetching website", color: "from-blue-500 to-cyan-500" },
  { icon: Building2, label: "Detecting company info", color: "from-violet-500 to-purple-500" },
  { icon: Phone, label: "Extracting contacts & social", color: "from-blue-500 to-cyan-500" },
  { icon: Bot, label: "Building your AI org chart", color: "from-blue-500 to-blue-600" },
];

function LoadingScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [800, 1800, 2800, 3800].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = Math.min(100, ((step) / SCAN_STEPS.length) * 100);

  return (
    <div className="flex items-center justify-center py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl">
        {/* Animated icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-full bg-gradient-to-r from-blue-400/10 via-violet-400/10 to-cyan-400/10 blur-md" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
              <Globe size={36} className="text-white" />
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary shadow-lg ring-2 ring-blue-500/20">
              <Loader2 size={16} className="animate-spin text-blue-400" />
            </motion.div>
          </div>
        </div>

        <h2 className="mb-1 text-center text-lg font-bold text-fg">Analyzing your website</h2>
        <p className="mb-6 text-center text-sm text-fg-hint">Building your AI-powered company profile</p>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"
            initial={{ width: "5%" }} animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }} />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {SCAN_STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                  active ? "bg-surface-secondary ring-1 ring-border" :
                  done ? "bg-blue-500/[0.06]" : "opacity-30"
                }`}>
                {done ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 shadow-sm shadow-blue-500/30">
                    <Check size={14} className="text-white" />
                  </motion.div>
                ) : active ? (
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} shadow-sm`}>
                    <Loader2 size={14} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                    <Icon size={14} className="text-fg-hint" />
                  </div>
                )}
                <span className={`text-sm ${done ? "font-medium text-blue-400" : active ? "font-semibold text-fg" : "text-fg-hint"}`}>
                  {s.label}
                </span>
                {active && (
                  <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-auto text-2xs text-fg-hint">Processing...</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* -- Main onboarding page ------------------------------------------- */

export default function OnboardingCompany() {
  const router = useRouter();
  const { workspace } = useAuth();

  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<IntakeResult|null>(null);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchIntakeResults(); }, []); // eslint-disable-line

  async function fetchIntakeResults() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/onboarding/intake-results");
      applyIntake(res.data);
    } catch {
      if (workspace?.website_url) {
        try { const res = await api.post("/api/v1/onboarding/intake-from-url", { url: workspace.website_url }); applyIntake(res.data); }
        catch { setError("Could not analyze website."); setCompanyName(workspace?.name || ""); }
      } else { setCompanyName(workspace?.name || ""); }
    } finally { setTimeout(() => setLoading(false), 4200); }
  }

  function applyIntake(data: IntakeResult) {
    setIntake(data);
    setCompanyName(data.detected_company_name || workspace?.name || "");
    setIndustry(data.detected_industry || "other");
    if (data.detected_country) setCountry(data.detected_country);
    if (data.detected_city) setCity(data.detected_city);
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await api.post("/api/v1/onboarding/company", { industry, country, city, team_size: 1, primary_goal: "" });
      if (intake) {
        const sl: Record<string, string> = {};
        for (const [p, urls] of Object.entries(intake.detected_social_links)) { if (urls.length > 0) sl[p] = urls[0]; }
        await api.post("/api/v1/onboarding/presence", {
          website_url: intake.url || workspace?.website_url || "", social_links: sl,
          whatsapp_link: intake.detected_whatsapp_links[0] || "", contact_page: intake.detected_contact_pages[0] || "",
          phone: intake.detected_phone_numbers[0] || "", google_business_url: "",
        });
      }
      router.push("/app/onboarding/org-chart");
    } catch { router.push("/app/onboarding/org-chart"); }
    finally { setSaving(false); }
  }

  const socialCount = intake ? Object.values(intake.detected_social_links).filter(u => u.length > 0).length : 0;
  const totalDetected = intake ? (intake.detected_company_name ? 1 : 0) + (intake.detected_industry !== "other" ? 1 : 0) + intake.detected_phone_numbers.length + intake.detected_emails.length + socialCount + intake.detected_whatsapp_links.length + intake.detected_contact_pages.length + intake.detected_tech_stack.length : 0;

  const ic = "w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-blue-500/40 focus:bg-surface focus:ring-2 focus:ring-blue-500/10 transition-all";
  const selectClass = ic + " appearance-none";

  if (loading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-5 px-2">
      {/* === HERO BANNER === */}
      {intake && totalDetected > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 px-6 py-4">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
          <div className="relative flex items-center gap-4">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 backdrop-blur-sm shadow-lg shadow-blue-500/10">
              <Sparkles size={28} className="text-blue-400" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-fg">{totalDetected} items detected from your website</h2>
              <p className="mt-0.5 text-sm text-fg-hint">We built your company profile and AI team. Review below, then deploy.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 backdrop-blur-sm border border-blue-500/20">
              <CheckCircle2 size={16} className="text-blue-400" /><span className="text-sm font-bold text-blue-400">Analysis complete</span>
            </div>
          </div>
        </motion.div>
      )}

      {error && !intake && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-6 py-4 text-sm text-amber-400">{error}</div>
      )}

      {/* === ROW 1: Company Identity + Contacts & Social === */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Company Identity -- 3 cols */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-3 rounded-2xl border border-border bg-surface p-6 shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/20">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Company Identity</h2>
              <p className="text-xs text-fg-hint">Auto-detected from your website -- edit if needed</p>
            </div>
            {intake && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="ml-auto rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                Auto-detected
              </motion.span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-fg-muted">Company name</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company name" className={ic} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
                Industry
                {intake && intake.industry_confidence > 0 && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-2xs font-bold text-blue-400">{Math.round(intake.industry_confidence * 100)}%</span>
                )}
              </label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} className={selectClass}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{INDUSTRY_LABELS[i] || i}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg-muted">
                  Country {country && <CheckCircle2 size={10} className="text-blue-400" />}
                </label>
                <select value={country} onChange={e => { setCountry(e.target.value); if (!COUNTRY_CITIES[e.target.value]?.includes(city)) setCity(""); }} className={selectClass}>
                  <option value="">Select</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg-muted">
                  City {city && <CheckCircle2 size={10} className="text-blue-400" />}
                </label>
                <select value={city} onChange={e => setCity(e.target.value)} className={selectClass} disabled={!country}>
                  <option value="">Select</option>
                  {(COUNTRY_CITIES[country] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contacts & Social -- 2 cols */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
              <Share2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Contacts & Social</h2>
              <p className="text-xs text-fg-hint">Detected from your website</p>
            </div>
          </div>
          {intake ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Phone, label: "Phone", value: intake.detected_phone_numbers[0], found: intake.detected_phone_numbers.length > 0 },
                  { icon: Mail, label: "Email", value: intake.detected_emails[0], found: intake.detected_emails.length > 0 },
                  { icon: MessageCircle, label: "WhatsApp", value: "Connected", found: intake.detected_whatsapp_links.length > 0 },
                  { icon: ExternalLink, label: "Contact Page", value: "Found", found: intake.detected_contact_pages.length > 0 },
                ].map(({ icon: Ic, label, value, found }) => (
                  <div key={label} className={`flex items-center gap-2 rounded-xl p-3 ${found ? "bg-blue-500/[0.06] ring-1 ring-blue-500/20" : "bg-surface-secondary ring-1 ring-border"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${found ? "bg-blue-500 shadow-sm shadow-blue-500/30" : "bg-surface-secondary"}`}>
                      <Ic size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xs text-fg-hint">{label}</p>
                      <p className={`truncate text-xs font-semibold ${found ? "text-fg-secondary" : "text-fg-hint"}`}>{found ? value || label : "Not found"}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-fg-muted">Social Profiles</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(SOCIAL_LABELS).map(([p, label]) => {
                    const found = (intake.detected_social_links[p] || []).length > 0;
                    return (
                      <span key={p} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        found ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" : "bg-surface-secondary text-fg-hint ring-1 ring-border"
                      }`}>
                        {found ? <CheckCircle2 size={10} /> : <XCircle size={10} />}{label}
                      </span>
                    );
                  })}
                </div>
              </div>
              {intake.detected_tech_stack.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-semibold text-fg-muted">Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intake.detected_tech_stack.slice(0, 8).map(t => (
                      <span key={t} className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-400 ring-1 ring-cyan-500/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-fg-hint">No website data available</p>
          )}
        </motion.div>
      </div>

      {/* === CONFIRM BUTTON === */}
      <motion.button onClick={handleConfirm} disabled={saving}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50">
        {saving ? (
          <><Loader2 size={18} className="animate-spin" /> Saving...</>
        ) : (
          <><Sparkles size={18} /> Continue to Org Chart <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
        )}
      </motion.button>
    </motion.div>
  );
}
