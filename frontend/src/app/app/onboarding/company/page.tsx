"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, CheckCircle2, XCircle, Phone, Mail, Share2, Cpu,
  Sparkles, MessageCircle, ExternalLink, Calendar, ChevronRight, ChevronDown,
  Building2, Bot, Users, Brain, Target, Megaphone, Wallet, Shield,
  Settings, Package, Heart, CalendarDays, Zap, ArrowRight, Check, Rocket,
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
const DEPT_ICONS: Record<string,any> = {
  brain:Brain,target:Target,megaphone:Megaphone,users:Users,wallet:Wallet,
  shield:Shield,settings:Settings,cpu:Cpu,package:Package,heart:Heart,
  calendar:CalendarDays,sparkles:Sparkles,
};
const DEPT_COLORS: Record<string,string> = {
  strategy:"from-violet-500 to-purple-600",sales:"from-orange-500 to-red-500",
  marketing:"from-pink-500 to-rose-500",hr:"from-blue-500 to-indigo-500",
  finance:"from-emerald-500 to-green-600",legal:"from-slate-400 to-gray-500",
  operations:"from-amber-500 to-yellow-600",it:"from-cyan-500 to-teal-500",
  procurement:"from-lime-500 to-green-500",reservations:"from-blue-400 to-blue-600",
  guest_relations:"from-rose-400 to-pink-600",partnerships:"from-teal-500 to-emerald-600",
  patient_care:"from-red-400 to-rose-500",clinical_ops:"from-sky-500 to-blue-600",
  billing:"from-emerald-500 to-green-600",compliance:"from-gray-400 to-slate-500",
  front_house:"from-amber-400 to-orange-500",kitchen_ops:"from-red-500 to-orange-600",
  delivery:"from-blue-500 to-cyan-500",customer_service:"from-pink-400 to-rose-500",
  customer_success:"from-pink-400 to-rose-500",creative:"from-fuchsia-500 to-purple-600",
  project_mgmt:"from-indigo-500 to-blue-600",client_services:"from-orange-400 to-amber-500",
  digital:"from-cyan-500 to-blue-500",technical:"from-slate-400 to-gray-500",
  safety:"from-red-500 to-red-700",product:"from-violet-500 to-indigo-600",
  devops:"from-gray-500 to-gray-600",elearning:"from-blue-400 to-indigo-500",
  academic:"from-emerald-400 to-teal-500",student_services:"from-amber-400 to-orange-500",
  risk:"from-red-500 to-rose-600",production:"from-orange-500 to-amber-600",
  supply_chain:"from-teal-500 to-green-600",rd:"from-purple-500 to-violet-600",
  warehouse:"from-amber-500 to-yellow-600",customs:"from-slate-400 to-gray-500",
  estimating:"from-blue-500 to-indigo-500",property_mgmt:"from-amber-500 to-orange-500",
  valuation:"from-emerald-500 to-teal-500",transactions:"from-slate-400 to-gray-500",
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
interface OrgDepartment {
  id:string; name:string; icon:string; status:string; ai_head:string;
  ai_agents:number; ai_roles:string[]; description:string; priority_rank:number;
}
interface OrgChart {
  total_ai_agents:number; total_departments:number;
  departments:OrgDepartment[]; summary:string;
}

/* -- Animated loading screen ---------------------------------------- */

const SCAN_STEPS = [
  { icon: Globe, label: "Fetching website", color: "from-blue-500 to-cyan-500" },
  { icon: Building2, label: "Detecting company info", color: "from-violet-500 to-purple-500" },
  { icon: Phone, label: "Extracting contacts & social", color: "from-emerald-500 to-green-500" },
  { icon: Bot, label: "Building your AI org chart", color: "from-emerald-400 to-emerald-600" },
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
              className="absolute -inset-3 rounded-full bg-gradient-to-r from-emerald-400/10 via-violet-400/10 to-cyan-400/10 blur-md" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
              <Globe size={36} className="text-white" />
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary shadow-lg ring-2 ring-emerald-500/20">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
            </motion.div>
          </div>
        </div>

        <h2 className="mb-1 text-center text-lg font-bold text-fg">Analyzing your website</h2>
        <p className="mb-6 text-center text-sm text-fg-hint">Building your AI-powered company profile</p>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400"
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
                  done ? "bg-emerald-500/[0.06]" : "opacity-30"
                }`}>
                {done ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm shadow-emerald-500/30">
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
                <span className={`text-sm ${done ? "font-medium text-emerald-400" : active ? "font-semibold text-fg" : "text-fg-hint"}`}>
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
  const [orgChart, setOrgChart] = useState<OrgChart|null>(null);
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [expandedDept, setExpandedDept] = useState<string|null>(null);
  const [humanRoles, setHumanRoles] = useState<Record<string, boolean>>({});
  const [orgBuildStep, setOrgBuildStep] = useState(0);

  function toggleRole(deptId: string, role: string) {
    const key = `${deptId}:${role}`;
    setHumanRoles(prev => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleHead(deptId: string) {
    const key = `${deptId}:__head__`;
    setHumanRoles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const aiCount = orgChart ? orgChart.departments.reduce((sum, dept) => {
    const headIsHuman = humanRoles[`${dept.id}:__head__`];
    const humanAgents = dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
    return sum + (headIsHuman ? 0 : 1) + (dept.ai_roles.length - humanAgents);
  }, 0) : 0;
  const humanCount = orgChart ? orgChart.departments.reduce((sum, dept) => {
    const headIsHuman = humanRoles[`${dept.id}:__head__`] ? 1 : 0;
    const humanAgents = dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
    return sum + headIsHuman + humanAgents;
  }, 0) : 0;

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

  useEffect(() => {
    if (industry && industry !== "other") {
      api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${industry}`).then(r => {
        setOrgChart(r.data);
        setOrgBuildStep(0);
        const depts = r.data?.departments || [];
        depts.forEach((_: any, i: number) => {
          setTimeout(() => setOrgBuildStep(i + 1), 300 + i * 200);
        });
      }).catch(() => {});
    }
  }, [industry]); // eslint-disable-line

  async function handleConfirm() {
    setSaving(true);
    try {
      if (Object.keys(humanRoles).length > 0) {
        await api.put("/api/v1/workspace/role-assignments", { role_map: humanRoles }).catch(() => {});
      }
      await api.post("/api/v1/onboarding/company", { industry, country, city, team_size: orgChart?.total_ai_agents || 1, primary_goal: "" });
      if (intake) {
        const sl: Record<string, string> = {};
        for (const [p, urls] of Object.entries(intake.detected_social_links)) { if (urls.length > 0) sl[p] = urls[0]; }
        await api.post("/api/v1/onboarding/presence", {
          website_url: intake.url || workspace?.website_url || "", social_links: sl,
          whatsapp_link: intake.detected_whatsapp_links[0] || "", contact_page: intake.detected_contact_pages[0] || "",
          phone: intake.detected_phone_numbers[0] || "", google_business_url: "",
        });
      }
      router.push("/app/onboarding/competitors");
    } catch { router.push("/app/onboarding/competitors"); }
    finally { setSaving(false); }
  }

  const socialCount = intake ? Object.values(intake.detected_social_links).filter(u => u.length > 0).length : 0;
  const totalDetected = intake ? (intake.detected_company_name ? 1 : 0) + (intake.detected_industry !== "other" ? 1 : 0) + intake.detected_phone_numbers.length + intake.detected_emails.length + socialCount + intake.detected_whatsapp_links.length + intake.detected_contact_pages.length + intake.detected_tech_stack.length : 0;

  const ic = "w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-emerald-500/40 focus:bg-surface focus:ring-2 focus:ring-emerald-500/10 transition-all";
  const selectClass = ic + " appearance-none";

  if (loading) return <LoadingScreen />;

  const allDepts = orgChart?.departments || [];
  const visibleDepts2 = showAllDepts ? allDepts : allDepts.slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-5 px-2">
      {/* === HERO BANNER === */}
      {intake && totalDetected > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 px-6 py-4">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
          <div className="relative flex items-center gap-4">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
              <Sparkles size={28} className="text-emerald-400" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-fg">{totalDetected} items detected from your website</h2>
              <p className="mt-0.5 text-sm text-fg-hint">We built your company profile and AI team. Review below, then deploy.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 backdrop-blur-sm border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-400" /><span className="text-sm font-bold text-emerald-400">Analysis complete</span>
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
                className="ml-auto rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
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
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-bold text-emerald-400">{Math.round(intake.industry_confidence * 100)}%</span>
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
                  Country {country && <CheckCircle2 size={10} className="text-emerald-400" />}
                </label>
                <select value={country} onChange={e => { setCountry(e.target.value); if (!COUNTRY_CITIES[e.target.value]?.includes(city)) setCity(""); }} className={selectClass}>
                  <option value="">Select</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg-muted">
                  City {city && <CheckCircle2 size={10} className="text-emerald-400" />}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
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
                  <div key={label} className={`flex items-center gap-2 rounded-xl p-3 ${found ? "bg-emerald-500/[0.06] ring-1 ring-emerald-500/20" : "bg-surface-secondary ring-1 ring-border"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${found ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" : "bg-surface-secondary"}`}>
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
                        found ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-surface-secondary text-fg-hint ring-1 ring-border"
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

      {/* === ROW 2: Full-width AI Org Chart === */}
      {orgChart && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-fg">Your AI Organization</h2>
              <p className="text-xs text-fg-hint">Click any role to toggle between AI agent and human employee</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                <Bot size={12} />{aiCount} AI
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                <Users size={12} />{humanCount} Human
              </span>
              <span className="rounded-xl bg-surface-secondary px-3 py-1.5 text-xs font-bold text-fg-muted ring-1 ring-border">
                {orgChart.total_departments} Depts
              </span>
            </div>
          </div>

          {/* CEO Node */}
          <div className="flex justify-center mb-2">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-surface-secondary to-surface px-6 py-3 shadow-xl border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20">
                <Users size={18} className="text-slate-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-fg">CEO / Owner</p>
                <p className="text-xs text-fg-hint">You -- overseeing {orgChart.total_departments} departments</p>
              </div>
            </motion.div>
          </div>

          {/* SVG connectors from CEO */}
          <svg width="100%" height="32" className="overflow-visible">
            <line x1="50%" y1="0" x2="50%" y2="16" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="4%" y1="16" x2="96%" y2="16" stroke="var(--color-border)" strokeWidth="2" />
          </svg>

          {/* Department grid */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(allDepts.length, 5)}, 1fr)` }}>
            {visibleDepts2.map((dept, idx) => {
              const Icon = DEPT_ICONS[dept.icon] || Bot;
              const grad = DEPT_COLORS[dept.id] || "from-gray-400 to-gray-500";
              const isExpanded = expandedDept === dept.id;
              const headIsHuman = humanRoles[`${dept.id}:__head__`];
              const deptAi = (headIsHuman ? 0 : 1) + dept.ai_roles.filter(r => !humanRoles[`${dept.id}:${r}`]).length;
              const deptHu = (headIsHuman ? 1 : 0) + dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;
              const isBuilt = idx < orgBuildStep;

              return (
                <motion.div key={dept.id}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={isBuilt ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center">
                  <svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="3 2" /></svg>

                  <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                    className={`group relative w-full overflow-hidden rounded-xl border p-3 text-center transition-all duration-300 ${
                      isExpanded ? "border-emerald-500/30 bg-emerald-500/[0.06] shadow-xl" : "border-border bg-surface-secondary shadow-md hover:bg-surface hover:border-border"
                    }`}>
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${grad}`} />
                    <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-lg`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-xs font-bold text-fg leading-tight mb-1.5">{dept.name}</p>
                    <motion.span whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleHead(dept.id); }}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold cursor-pointer transition-colors ${
                        headIsHuman ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      }`}>
                      {headIsHuman ? <Users size={8} /> : <Bot size={8} />}
                      {dept.ai_head.replace(" AI", "").split(" ").slice(0, 2).join(" ")}
                    </motion.span>
                    <div className="mt-1.5 flex items-center justify-center gap-2">
                      <span className="flex items-center gap-0.5 text-2xs font-semibold text-emerald-400"><Bot size={8} />{deptAi}</span>
                      <span className="h-3 w-px bg-border" />
                      <span className="flex items-center gap-0.5 text-2xs font-semibold text-blue-400"><Users size={8} />{deptHu}</span>
                    </div>
                    <ChevronDown size={12} className={`mx-auto mt-1 text-fg-hint transition-transform duration-300 ${isExpanded ? "rotate-180 text-emerald-400" : ""}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="w-full overflow-hidden">
                        <div className="flex justify-center"><svg width="2" height="12"><line x1="1" y1="0" x2="1" y2="12" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="3 2" /></svg></div>
                        <div className="relative rounded-xl border border-border bg-surface-secondary p-2.5">
                          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-border to-transparent" />
                          <div className="space-y-1.5">
                            {dept.ai_roles.map((role, ri) => {
                              const isH = humanRoles[`${dept.id}:${role}`];
                              return (
                                <motion.button key={role} whileTap={{ scale: 0.97 }}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ri * 0.05 }}
                                  onClick={() => toggleRole(dept.id, role)}
                                  className={`relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                                    isH ? "bg-blue-500/[0.08] ring-1 ring-blue-500/20 shadow-sm" : "bg-surface ring-1 ring-border hover:ring-border"
                                  }`}>
                                  <div className="absolute -left-[5px] top-1/2 h-px w-[12px] bg-border" />
                                  <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm ${
                                    isH ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-surface-secondary to-surface"
                                  }`}>
                                    {isH ? <Users size={10} className="text-white" /> : <Bot size={10} className="text-fg-muted" />}
                                  </div>
                                  <span className="flex-1 truncate text-xs text-fg-muted">{role.replace(" Agent", "")}</span>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold ${isH ? "bg-blue-500/10 text-blue-400" : "bg-surface-secondary text-fg-hint"}`}>
                                    {isH ? "Human" : "AI"}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {allDepts.length > 10 && !showAllDepts && (
            <div className="mt-4 flex justify-center">
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowAllDepts(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-2 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/[0.15]">
                <ChevronDown size={14} /> Show all {allDepts.length} departments
              </motion.button>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-fg-hint"><div className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600" />AI Agent</span>
              <span className="flex items-center gap-1.5 text-xs text-fg-hint"><div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />Human</span>
              <span className="flex items-center gap-1.5 text-xs text-fg-hint"><div className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-300 to-amber-500" />CEO (You)</span>
            </div>
            {humanCount > 0 && (
              <span className="text-xs font-semibold text-blue-400">{humanCount} human positions · {aiCount} AI agents will deploy</span>
            )}
          </div>
        </motion.div>
      )}

      {/* === CONFIRM BUTTON === */}
      <motion.button onClick={handleConfirm} disabled={saving}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:shadow-2xl hover:shadow-emerald-500/30 disabled:opacity-50">
        {saving ? (
          <><Loader2 size={18} className="animate-spin" /> Deploying your AI agents...</>
        ) : (
          <><Rocket size={18} /> Confirm and deploy AI agents <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
        )}
      </motion.button>
    </motion.div>
  );
}
