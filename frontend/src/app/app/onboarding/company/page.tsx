"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";
import {
  Globe, Loader2, CheckCircle2, XCircle, Phone, Mail, Share2, Cpu,
  Sparkles, MessageCircle, ExternalLink, Calendar, ChevronRight,
  Building2, Bot, Users, Brain, Target, Megaphone, Wallet, Shield,
  Settings, Package, Heart, CalendarDays, Zap, ArrowRight, Check,
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

function ScanStep({ label, done, active }: { label:string; done:boolean; active:boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-500 ${done?"opacity-100":active?"opacity-100":"opacity-30"}`}>
      {done ? <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500"><Check size={11} className="text-white"/></div>
        : active ? <Loader2 size={16} className="animate-spin text-aeos-500"/>
        : <div className="h-5 w-5 rounded-full border-2 border-slate-200"/>}
      <span className={`text-xs ${done?"text-emerald-700":active?"font-medium text-aeos-700":"text-fg-hint"}`}>{label}</span>
    </div>
  );
}

export default function OnboardingCompany() {
  const router = useRouter();
  const { workspace } = useAuth();

  const [loading, setLoading] = useState(true);
  const [scanStep, setScanStep] = useState(0);
  const [intake, setIntake] = useState<IntakeResult|null>(null);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [orgChart, setOrgChart] = useState<OrgChart|null>(null);
  const [showAllDepts, setShowAllDepts] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timers = [600,1400,2200,3000].map((ms,i) => setTimeout(() => setScanStep(i+1), ms));
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  useEffect(() => { fetchIntakeResults(); }, []); // eslint-disable-line

  async function fetchIntakeResults() {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/onboarding/intake-results");
      applyIntake(res.data);
    } catch {
      if (workspace?.website_url) {
        try { const res = await api.post("/api/v1/onboarding/intake-from-url",{url:workspace.website_url}); applyIntake(res.data); }
        catch { setError("Could not analyze website."); setCompanyName(workspace?.name||""); }
      } else { setCompanyName(workspace?.name||""); }
    } finally { setTimeout(() => setLoading(false), 800); }
  }

  function applyIntake(data: IntakeResult) {
    setIntake(data);
    setCompanyName(data.detected_company_name||workspace?.name||"");
    setIndustry(data.detected_industry||"other");
    if (data.detected_country) setCountry(data.detected_country);
    if (data.detected_city) setCity(data.detected_city);
  }

  useEffect(() => {
    if (industry && industry!=="other") {
      api.get(`/api/v1/onboarding/org-chart-recommendation?industry=${industry}`).then(r=>setOrgChart(r.data)).catch(()=>{});
    }
  }, [industry]); // eslint-disable-line

  async function handleConfirm() {
    setSaving(true);
    try {
      await api.post("/api/v1/onboarding/company",{industry,country,city,team_size:orgChart?.total_ai_agents||1,primary_goal:""});
      if (intake) {
        const sl: Record<string,string> = {};
        for (const [p,urls] of Object.entries(intake.detected_social_links)) { if (urls.length>0) sl[p]=urls[0]; }
        await api.post("/api/v1/onboarding/presence",{
          website_url:intake.url||workspace?.website_url||"",social_links:sl,
          whatsapp_link:intake.detected_whatsapp_links[0]||"",contact_page:intake.detected_contact_pages[0]||"",
          phone:intake.detected_phone_numbers[0]||"",google_business_url:"",
        });
      }
      router.push("/app/onboarding/competitors");
    } catch { router.push("/app/onboarding/competitors"); }
    finally { setSaving(false); }
  }

  const socialCount = intake ? Object.values(intake.detected_social_links).filter(u=>u.length>0).length : 0;
  const totalDetected = intake ? (intake.detected_company_name?1:0)+(intake.detected_industry!=="other"?1:0)+intake.detected_phone_numbers.length+intake.detected_emails.length+socialCount+intake.detected_whatsapp_links.length+intake.detected_contact_pages.length+intake.detected_tech_stack.length : 0;

  const ic = "w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-aeos-400 focus:ring-1 focus:ring-aeos-100 transition-all";

  // Loading
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aeos-400 to-aeos-700 shadow-lg shadow-aeos-200">
              <Globe size={32} className="text-white"/>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
              <Loader2 size={14} className="animate-spin text-aeos-500"/>
            </div>
          </div>
          <h2 className="text-base font-bold text-fg">Analyzing your website</h2>
          <div className="w-full max-w-[200px] space-y-2">
            <ScanStep label="Fetching website" done={scanStep>=1} active={scanStep===0}/>
            <ScanStep label="Detecting company info" done={scanStep>=2} active={scanStep===1}/>
            <ScanStep label="Extracting contacts" done={scanStep>=3} active={scanStep===2}/>
            <ScanStep label="Building AI org chart" done={scanStep>=4} active={scanStep===3}/>
          </div>
        </div>
      </div>
    );
  }

  const visibleDepts = showAllDepts ? (orgChart?.departments||[]) : (orgChart?.departments||[]).slice(0,6);

  return (
    <div className="space-y-3">
      {/* Hero */}
      {intake && totalDetected > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-aeos-600 via-aeos-500 to-emerald-500 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <Zap size={20}/>
            <div>
              <p className="text-sm font-bold">{totalDetected} items detected from your website</p>
              <p className="text-2xs text-white/70">Review and confirm your company profile below</p>
            </div>
          </div>
        </div>
      )}

      {error && !intake && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}

      {/* Two-column layout: Left = identity + contacts, Right = org chart */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-3">
          {/* Company Identity - compact */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5">
              <Building2 size={14} className="text-aeos-600"/>
              <h2 className="text-sm font-bold text-fg">Company Identity</h2>
              {intake && <span className="ml-auto rounded-full bg-emerald-50 px-2 py-px text-2xs text-emerald-600">Auto-detected</span>}
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-2xs font-medium text-fg-muted">Company name</label>
                <input type="text" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Company" className={ic}/>
              </div>
              <div>
                <label className="mb-1 block text-2xs font-medium text-fg-muted">
                  Industry {intake && intake.industry_confidence>0 && <span className="ml-1 text-aeos-600">{Math.round(intake.industry_confidence*100)}%</span>}
                </label>
                <select value={industry} onChange={e=>setIndustry(e.target.value)} className={ic}>
                  <option value="">Select</option>
                  {INDUSTRIES.map(i=><option key={i} value={i}>{INDUSTRY_LABELS[i]||i}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-2xs font-medium text-fg-muted">Country {intake?.detected_country&&<span className="text-emerald-500">*</span>}</label>
                  <input type="text" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" className={ic}/>
                </div>
                <div>
                  <label className="mb-1 block text-2xs font-medium text-fg-muted">City {intake?.detected_city&&<span className="text-emerald-500">*</span>}</label>
                  <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="City" className={ic}/>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts + Social - compact grid */}
          {intake && (
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Phone size={14} className="text-aeos-600"/>
                <h2 className="text-sm font-bold text-fg">Contacts & Social</h2>
              </div>
              {/* Contact items - mini */}
              <div className="mb-3 grid grid-cols-2 gap-1.5">
                {[
                  {icon:Phone,label:"Phone",value:intake.detected_phone_numbers[0]||"",found:intake.detected_phone_numbers.length>0},
                  {icon:Mail,label:"Email",value:intake.detected_emails[0]||"",found:intake.detected_emails.length>0},
                  {icon:MessageCircle,label:"WhatsApp",value:intake.detected_whatsapp_links.length?"Found":"",found:intake.detected_whatsapp_links.length>0},
                  {icon:ExternalLink,label:"Contact page",value:intake.detected_contact_pages.length?"Found":"",found:intake.detected_contact_pages.length>0},
                ].map(({icon:Icon,label,value,found})=>(
                  <div key={label} className="flex items-center gap-2 rounded-lg bg-surface-secondary px-2.5 py-1.5">
                    {found?<CheckCircle2 size={12} className="shrink-0 text-emerald-500"/>:<XCircle size={12} className="shrink-0 text-slate-300"/>}
                    <div className="min-w-0">
                      <p className="text-2xs text-fg-hint">{label}</p>
                      <p className={`truncate text-2xs ${found?"font-medium text-fg":"text-fg-hint"}`}>{found?value:"—"}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Social - inline pills */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(SOCIAL_LABELS).map(([p,label])=>{
                  const found = (intake.detected_social_links[p]||[]).length>0;
                  return (
                    <span key={p} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs ${found?"bg-emerald-50 text-emerald-700 font-medium":"bg-slate-50 text-slate-400"}`}>
                      {found?<Check size={9}/>:<XCircle size={9}/>}{label}
                    </span>
                  );
                })}
              </div>
              {/* Tech stack pills */}
              {intake.detected_tech_stack.length>0 && (
                <div className="mt-2.5 flex flex-wrap gap-1 border-t border-border pt-2.5">
                  <span className="text-2xs text-fg-hint mr-1">Tech:</span>
                  {intake.detected_tech_stack.slice(0,6).map(t=>(
                    <span key={t} className="rounded-full bg-blue-50 px-2 py-0.5 text-2xs font-medium text-blue-700">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: AI Org Chart */}
        {orgChart && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5">
              <Bot size={14} className="text-aeos-600"/>
              <h2 className="text-sm font-bold text-fg">Your AI Organization</h2>
            </div>
            {/* Stats row */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-gradient-to-br from-aeos-500 to-aeos-700 px-3 py-2.5 text-white">
                <p className="text-xl font-bold">{orgChart.total_ai_agents}</p>
                <p className="text-2xs text-white/70">AI Agents</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-2.5 text-white">
                <p className="text-xl font-bold">{orgChart.total_departments}</p>
                <p className="text-2xs text-white/70">Departments</p>
              </div>
            </div>
            {/* Department mini cards */}
            <div className="space-y-1.5">
              {visibleDepts.map((dept,idx)=>{
                const Icon = DEPT_ICONS[dept.icon]||Bot;
                const grad = DEPT_COLORS[dept.id]||"from-gray-500 to-gray-600";
                return (
                  <div key={dept.id} className="flex items-center gap-2.5 rounded-lg bg-surface-secondary px-2.5 py-2 transition-all hover:bg-aeos-50/50">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-white`}>
                      <Icon size={12}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-fg leading-tight">{dept.name}</p>
                      <p className="text-2xs text-fg-hint">{dept.ai_head} + {dept.ai_roles.length} agents</p>
                    </div>
                    {idx<3 && <span className="rounded-full bg-aeos-50 px-1.5 py-px text-2xs font-bold text-aeos-600">#{idx+1}</span>}
                  </div>
                );
              })}
            </div>
            {orgChart.departments.length>6 && !showAllDepts && (
              <button onClick={()=>setShowAllDepts(true)} className="mt-2 w-full text-center text-2xs font-medium text-aeos-600 hover:text-aeos-700">
                Show all {orgChart.departments.length} departments
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <button onClick={handleConfirm} disabled={saving}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aeos-600 to-aeos-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-aeos-200/50 transition-all hover:shadow-xl disabled:opacity-50">
        {saving ? <><Loader2 size={16} className="animate-spin"/>Deploying AI agents...</> : <>Confirm and deploy AI agents<ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></>}
      </button>
    </div>
  );
}
