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
  finance:"from-emerald-500 to-green-600",legal:"from-slate-500 to-gray-600",
  operations:"from-amber-500 to-yellow-600",it:"from-cyan-500 to-teal-500",
  procurement:"from-lime-500 to-green-500",reservations:"from-blue-400 to-blue-600",
  guest_relations:"from-rose-400 to-pink-600",partnerships:"from-teal-500 to-emerald-600",
  patient_care:"from-red-400 to-rose-500",clinical_ops:"from-sky-500 to-blue-600",
  billing:"from-emerald-500 to-green-600",compliance:"from-gray-500 to-slate-600",
  front_house:"from-amber-400 to-orange-500",kitchen_ops:"from-red-500 to-orange-600",
  delivery:"from-blue-500 to-cyan-500",customer_service:"from-pink-400 to-rose-500",
  customer_success:"from-pink-400 to-rose-500",creative:"from-fuchsia-500 to-purple-600",
  project_mgmt:"from-indigo-500 to-blue-600",client_services:"from-orange-400 to-amber-500",
  digital:"from-cyan-500 to-blue-500",technical:"from-slate-500 to-gray-700",
  safety:"from-red-500 to-red-700",product:"from-violet-500 to-indigo-600",
  devops:"from-gray-600 to-gray-800",elearning:"from-blue-400 to-indigo-500",
  academic:"from-emerald-400 to-teal-500",student_services:"from-amber-400 to-orange-500",
  risk:"from-red-500 to-rose-600",production:"from-orange-500 to-amber-600",
  supply_chain:"from-teal-500 to-green-600",rd:"from-purple-500 to-violet-600",
  warehouse:"from-amber-500 to-yellow-600",customs:"from-slate-500 to-gray-600",
  estimating:"from-blue-500 to-indigo-500",property_mgmt:"from-amber-500 to-orange-500",
  valuation:"from-emerald-500 to-teal-500",transactions:"from-slate-500 to-gray-600",
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

/* ── Animated loading screen ──────────────────────────────────── */

const SCAN_STEPS = [
  { icon: Globe, label: "Fetching website", color: "from-blue-500 to-cyan-500" },
  { icon: Building2, label: "Detecting company info", color: "from-violet-500 to-purple-500" },
  { icon: Phone, label: "Extracting contacts & social", color: "from-emerald-500 to-green-500" },
  { icon: Bot, label: "Building your AI org chart", color: "from-aeos-500 to-aeos-700" },
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
        className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-8 shadow-2xl shadow-slate-200/50">
        {/* Animated icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-full bg-gradient-to-r from-aeos-400/20 via-violet-400/20 to-emerald-400/20 blur-md" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-500 to-aeos-700 shadow-lg shadow-aeos-300/40">
              <Globe size={36} className="text-white" />
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-aeos-100">
              <Loader2 size={16} className="animate-spin text-aeos-600" />
            </motion.div>
          </div>
        </div>

        <h2 className="mb-1 text-center text-lg font-bold text-slate-900">Analyzing your website</h2>
        <p className="mb-6 text-center text-sm text-slate-500">Building your AI-powered company profile</p>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-aeos-500 via-violet-500 to-emerald-500"
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
                  active ? "bg-gradient-to-r " + s.color + " bg-opacity-5 shadow-sm ring-1 ring-inset ring-slate-100" :
                  done ? "bg-emerald-50/50" : "opacity-40"
                }`}>
                {done ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
                    <Check size={14} className="text-white" />
                  </motion.div>
                ) : active ? (
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} shadow-sm`}>
                    <Loader2 size={14} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Icon size={14} className="text-slate-400" />
                  </div>
                )}
                <span className={`text-sm ${done ? "font-medium text-emerald-700" : active ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                  {s.label}
                </span>
                {active && (
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-auto text-2xs text-slate-400">Processing...</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main onboarding page ─────────────────────────────────────── */

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
      api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${industry}`).then(r => setOrgChart(r.data)).catch(() => {});
    }
  }, [industry]); // eslint-disable-line

  async function handleConfirm() {
    setSaving(true);
    try {
      // Save role assignments (human/AI toggles)
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

  const ic = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-aeos-400 focus:bg-white focus:ring-2 focus:ring-aeos-100 transition-all";

  if (loading) return <LoadingScreen />;

  const visibleDepts = showAllDepts ? (orgChart?.departments || []) : (orgChart?.departments || []).slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="space-y-3">
      {/* ═══ ROW 1: Compact hero banner ═══ */}
      {intake && totalDetected > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-aeos-600 via-violet-500 to-emerald-500 px-4 py-3 text-white shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-40" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{totalDetected} items detected — AI profile ready</p>
              <p className="text-xs text-white/70">Review and customize below, then deploy your AI team</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              <CheckCircle2 size={12} /><span className="text-2xs font-bold">Complete</span>
            </div>
          </div>
        </motion.div>
      )}

      {error && !intake && (
        <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 border border-amber-200">{error}</div>
      )}

      {/* ═══ ROW 2: Company Identity + Contacts SIDE BY SIDE ═══ */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Company Identity — compact */}
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-600">
              <Building2 size={13} className="text-white" />
            </div>
            <h2 className="text-xs font-bold text-slate-900">Company Identity</h2>
            {intake && <span className="ml-auto rounded-full bg-emerald-50 px-2 py-px text-2xs font-bold text-emerald-600 ring-1 ring-emerald-200">Auto-detected</span>}
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" className={ic} />
              </div>
              <select value={industry} onChange={e => setIndustry(e.target.value)} className={ic}>
                <option value="">Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{INDUSTRY_LABELS[i] || i}</option>)}
              </select>
              <div className="flex gap-1.5">
                <select value={country} onChange={e => { setCountry(e.target.value); if (!COUNTRY_CITIES[e.target.value]?.includes(city)) setCity(""); }} className={ic}>
                  <option value="">Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={city} onChange={e => setCity(e.target.value)} className={ic} disabled={!country}>
                  <option value="">City</option>
                  {(COUNTRY_CITIES[country] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {intake && intake.industry_confidence > 0 && (
              <p className="text-2xs text-aeos-600 font-semibold">{Math.round(intake.industry_confidence * 100)}% industry confidence</p>
            )}
          </div>
        </motion.div>

        {/* Contacts & Social — compact */}
        <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Phone size={13} className="text-white" />
            </div>
            <h2 className="text-xs font-bold text-slate-900">Contacts & Social</h2>
          </div>
          {intake ? (
            <div className="space-y-2">
              {/* Contact pills row */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Phone", value: intake.detected_phone_numbers[0], found: intake.detected_phone_numbers.length > 0, icon: Phone },
                  { label: "Email", value: intake.detected_emails[0], found: intake.detected_emails.length > 0, icon: Mail },
                  { label: "WhatsApp", value: "Active", found: intake.detected_whatsapp_links.length > 0, icon: MessageCircle },
                  { label: "Contact", value: "Found", found: intake.detected_contact_pages.length > 0, icon: ExternalLink },
                ].map(({ label, value, found, icon: Ic }) => (
                  <div key={label} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${found ? "bg-emerald-50 ring-1 ring-emerald-100" : "bg-slate-50 ring-1 ring-slate-100"}`}>
                    <Ic size={10} className={found ? "text-emerald-500" : "text-slate-300"} />
                    <span className={`text-2xs font-semibold ${found ? "text-emerald-700" : "text-slate-400"}`}>{found ? value || label : "—"}</span>
                  </div>
                ))}
              </div>
              {/* Social profiles inline */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(SOCIAL_LABELS).map(([p, label]) => {
                  const found = (intake.detected_social_links[p] || []).length > 0;
                  return (
                    <span key={p} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${
                      found ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-50 text-slate-400 ring-1 ring-slate-100"
                    }`}>
                      {found ? <Check size={8} /> : <XCircle size={8} />}{label}
                    </span>
                  );
                })}
              </div>
              {/* Tech stack */}
              {intake.detected_tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2">
                  {intake.detected_tech_stack.slice(0, 6).map(t => (
                    <span key={t} className="rounded bg-blue-50 px-1.5 py-0.5 text-2xs font-bold text-blue-700 ring-1 ring-blue-100">{t}</span>
                  ))}
                  {intake.detected_tech_stack.length > 6 && <span className="text-2xs text-slate-400">+{intake.detected_tech_stack.length - 6}</span>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No website data available</p>
          )}
        </motion.div>
      </div>

      {/* ═══ ROW 3: Full-width AI Org Chart ═══ */}
      {orgChart && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-md">
          {/* Header row: title + stats inline */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot size={13} className="text-white" />
            </div>
            <h2 className="text-xs font-bold text-slate-900">Your AI Organization</h2>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-aeos-50 px-2.5 py-1 text-2xs font-bold text-aeos-700 ring-1 ring-aeos-200">
                <Bot size={10} />{aiCount} AI
              </span>
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-2xs font-bold text-blue-700 ring-1 ring-blue-200">
                <Users size={10} />{humanCount} Human
              </span>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-2xs font-bold text-slate-600 ring-1 ring-slate-200">
                {orgChart.total_departments} Depts
              </span>
              <span className="text-2xs text-slate-400">Click to toggle AI/Human</span>
            </div>
          </div>

          {/* CEO + Tree */}
          <div className="relative">
            {/* CEO node centered */}
            <div className="flex justify-center mb-1">
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 text-white shadow-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow">
                  <Users size={14} className="text-slate-900" />
                </div>
                <div>
                  <p className="text-xs font-bold">CEO / Owner</p>
                  <p className="text-2xs text-slate-400">You</p>
                </div>
              </div>
            </div>

            {/* SVG connectors */}
            <svg width="100%" height="28" className="overflow-visible">
              <line x1="50%" y1="0" x2="50%" y2="14" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="3%" y1="14" x2="97%" y2="14" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* Department grid — use more columns for wider layout */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(orgChart.departments.length, 5)}, 1fr)` }}>
              {(showAllDepts ? orgChart.departments : orgChart.departments.slice(0, 10)).map((dept, idx) => {
                const Icon = DEPT_ICONS[dept.icon] || Bot;
                const grad = DEPT_COLORS[dept.id] || "from-gray-500 to-gray-600";
                const isExpanded = expandedDept === dept.id;
                const headIsHuman = humanRoles[`${dept.id}:__head__`];
                const deptAi = (headIsHuman ? 0 : 1) + dept.ai_roles.filter(r => !humanRoles[`${dept.id}:${r}`]).length;
                const deptHu = (headIsHuman ? 1 : 0) + dept.ai_roles.filter(r => humanRoles[`${dept.id}:${r}`]).length;

                return (
                  <motion.div key={dept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.04 }} className="flex flex-col items-center">
                    {/* Vertical drop line */}
                    <svg width="2" height="8"><line x1="1" y1="0" x2="1" y2="8" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2 2" /></svg>

                    {/* Dept card */}
                    <motion.button whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                      className={`group relative w-full overflow-hidden rounded-lg border p-2 text-center transition-all ${
                        isExpanded ? "border-aeos-400 bg-aeos-50/60 shadow-lg ring-1 ring-aeos-200" : "border-slate-200 bg-white shadow hover:shadow-md hover:border-slate-300"
                      }`}>
                      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${grad}`} />
                      <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-white shadow`}>
                        <Icon size={14} />
                      </div>
                      <p className="text-2xs font-bold text-slate-900 leading-tight mb-1">{dept.name}</p>
                      <motion.span whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); toggleHead(dept.id); }}
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-2xs font-bold cursor-pointer ${
                          headIsHuman ? "bg-blue-100 text-blue-700" : "bg-aeos-50 text-aeos-700"
                        }`}>
                        {headIsHuman ? <Users size={7} /> : <Bot size={7} />}
                        {dept.ai_head.replace(" AI", "").split(" ").slice(0, 2).join(" ")}
                      </motion.span>
                      <p className="mt-0.5 text-2xs text-slate-400">{deptAi}AI · {deptHu}H</p>
                    </motion.button>

                    {/* Expanded team */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="w-full overflow-hidden">
                          <svg width="2" height="8" className="mx-auto block"><line x1="1" y1="0" x2="1" y2="8" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 2" /></svg>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 space-y-1">
                            {dept.ai_roles.map((role, ri) => {
                              const isH = humanRoles[`${dept.id}:${role}`];
                              return (
                                <motion.button key={role} whileTap={{ scale: 0.97 }}
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ri * 0.03 }}
                                  onClick={() => toggleRole(dept.id, role)}
                                  className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left ${
                                    isH ? "bg-blue-50 ring-1 ring-blue-200" : "bg-white ring-1 ring-slate-100"
                                  }`}>
                                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isH ? "bg-blue-500" : "bg-slate-300"}`}>
                                    {isH ? <Users size={7} className="text-white" /> : <Bot size={7} className="text-white" />}
                                  </div>
                                  <span className="flex-1 truncate text-2xs text-slate-700">{role.replace(" Agent", "")}</span>
                                  <span className={`text-2xs font-bold ${isH ? "text-blue-600" : "text-slate-400"}`}>{isH ? "H" : "AI"}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {orgChart.departments.length > 10 && !showAllDepts && (
              <div className="mt-2 flex justify-center">
                <button onClick={() => setShowAllDepts(true)}
                  className="rounded-lg bg-aeos-50 px-4 py-1.5 text-2xs font-bold text-aeos-600 ring-1 ring-aeos-200 hover:bg-aeos-100">
                  Show all {orgChart.departments.length} departments
                </button>
              </div>
            )}
          </div>

          {/* Bottom legend + human message */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-2xs text-slate-500"><div className="h-2.5 w-2.5 rounded-full bg-aeos-500" />AI Agent</span>
              <span className="flex items-center gap-1 text-2xs text-slate-500"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" />Human</span>
              <span className="flex items-center gap-1 text-2xs text-slate-500"><div className="h-2.5 w-2.5 rounded-full bg-amber-400" />You (CEO)</span>
            </div>
            {humanCount > 0 && (
              <span className="text-2xs text-blue-600 font-semibold">{humanCount} human · {aiCount} AI agents will be deployed</span>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ ROW 4: Confirm button ═══ */}
      <motion.button onClick={handleConfirm} disabled={saving}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-aeos-600 via-aeos-500 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-aeos-300/30 transition-all hover:shadow-2xl disabled:opacity-50">
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Deploying AI agents...</>
        ) : (
          <><Rocket size={16} /> Confirm and deploy AI agents <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></>
        )}
      </motion.button>
    </motion.div>
  );
}
