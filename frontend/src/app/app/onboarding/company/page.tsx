"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, CheckCircle2, XCircle, Phone, Mail, Share2,
  Sparkles, MessageCircle, ExternalLink, Building2, Bot, MapPin,
  ArrowRight, Check, Code2, Zap, Shield, Flag,
  Users, Image, Trophy, Search, Briefcase, ShieldCheck,
  Linkedin, Activity, TrendingUp, Wifi,
} from "lucide-react";

/* ── Data ─────────────────────────────────────────────────────────── */

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

const COUNTRY_CITIES: Record<string, string[]> = {
  "Jordan": ["Amman","Irbid","Zarqa","Aqaba","Madaba","Salt","Jerash","Mafraq","Karak","Ajloun","Petra","Tafilah","Maan"],
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

const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", fr: "French", es: "Spanish", de: "German",
  it: "Italian", pt: "Portuguese", nl: "Dutch", ru: "Russian", zh: "Chinese",
  ja: "Japanese", ko: "Korean", hi: "Hindi", tr: "Turkish", th: "Thai",
  vi: "Vietnamese", id: "Indonesian", ms: "Malay", sv: "Swedish", no: "Norwegian",
  da: "Danish", fi: "Finnish", pl: "Polish", cs: "Czech", uk: "Ukrainian",
  ro: "Romanian", hu: "Hungarian", el: "Greek", he: "Hebrew", fa: "Persian",
  ur: "Urdu", bn: "Bengali", ta: "Tamil", te: "Telugu", sw: "Swahili",
};

interface IntakeResult {
  url:string; detected_company_name:string; detected_industry:string;
  industry_confidence:number; detected_country:string; detected_city:string;
  detected_phone_numbers:string[]; detected_emails:string[];
  detected_social_links:Record<string,string[]>; detected_whatsapp_links:string[];
  detected_contact_pages:string[]; detected_booking_pages:string[];
  detected_tech_stack:string[]; page_title:string; meta_description:string;
  og_image: string;
  favicon_url: string;
  detected_business_hours: { day: string; open: string; close: string }[];
  detected_languages: string[];
  detected_competitors: { name: string; url: string; type: string }[];
  detected_keywords: string[];
  detected_team: { team_page_url: string; linkedin_search_url: string; members: { name: string; role: string }[]; count: number };
  detected_services: string[];
  detected_seo_health: {
    has_ssl: { status: boolean; detail: string };
    has_sitemap: { status: boolean; detail: string };
    has_robots: { status: boolean; detail: string };
    has_meta_title: { status: boolean; detail: string };
    has_meta_description: { status: boolean; detail: string };
    has_h1: { status: boolean; detail: string };
    has_canonical: { status: boolean; detail: string };
    has_og_tags: { status: boolean; detail: string };
    has_viewport: { status: boolean; detail: string };
    score: number;
  };
}

/* ── Social media brand SVG icons ──────────────────────────────────── */

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/>
    </svg>
  );
}
function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}
function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
    </svg>
  );
}
function SnapchatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.04-.012.06-.012.1 0 .16.06.32.18.32.36 0 .12-.06.278-.18.381-.39.24-.899.42-1.381.54-.12.036-.239.06-.329.084-.12.037-.18.06-.21.132-.03.09-.01.219.06.42.24.48.54.93.899 1.38.539.599 1.319 1.318 2.379 1.5.18.029.36.12.42.3.04.16 0 .36-.12.48-.36.36-.839.479-1.259.569-.12.03-.239.06-.329.1-.18.06-.18.12-.239.36l-.03.12c-.06.12-.12.24-.36.29-.24.06-.479 0-.659-.06-.36-.12-.659-.18-.96-.18-.24 0-.479.06-.72.12-.9.42-1.679 1.439-3.239 1.439-1.56 0-2.339-1.019-3.239-1.439a2.834 2.834 0 00-.72-.12c-.3 0-.6.06-.96.18-.18.06-.42.12-.659.06-.24-.06-.3-.18-.36-.3l-.03-.12c-.06-.24-.06-.3-.24-.36-.09-.04-.21-.07-.33-.1-.42-.09-.899-.21-1.259-.57-.12-.12-.16-.32-.12-.48.06-.18.24-.27.42-.3 1.06-.18 1.84-.9 2.38-1.5.36-.45.66-.9.899-1.38.06-.18.09-.33.06-.42-.03-.072-.09-.097-.21-.132a6.828 6.828 0 01-.33-.084c-.48-.12-.989-.3-1.38-.54-.12-.1-.18-.26-.18-.38 0-.18.16-.3.32-.36.04-.01.06-.01.1 0 .26.1.62.23.92.22.2 0 .33-.05.4-.09-.01-.17-.02-.33-.03-.51l-.003-.06c-.103-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/>
    </svg>
  );
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const SOCIAL_PLATFORMS: { key: string; label: string; icon: React.FC<{className?: string}>; brandColor: string; bgColor: string }[] = [
  { key: "linkedin", label: "LinkedIn", icon: LinkedInIcon, brandColor: "text-[#0A66C2]", bgColor: "bg-[#0A66C2]/10" },
  { key: "facebook", label: "Facebook", icon: FacebookIcon, brandColor: "text-[#1877F2]", bgColor: "bg-[#1877F2]/10" },
  { key: "instagram", label: "Instagram", icon: InstagramIcon, brandColor: "text-[#E4405F]", bgColor: "bg-[#E4405F]/10" },
  { key: "twitter", label: "X (Twitter)", icon: XTwitterIcon, brandColor: "text-fg", bgColor: "bg-fg/10" },
  { key: "youtube", label: "YouTube", icon: YouTubeIcon, brandColor: "text-[#FF0000]", bgColor: "bg-[#FF0000]/10" },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, brandColor: "text-fg", bgColor: "bg-fg/10" },
  { key: "pinterest", label: "Pinterest", icon: PinterestIcon, brandColor: "text-[#BD081C]", bgColor: "bg-[#BD081C]/10" },
  { key: "snapchat", label: "Snapchat", icon: SnapchatIcon, brandColor: "text-[#FFFC00]", bgColor: "bg-[#FFFC00]/10" },
];

/* ── Animated loading screen ──────────────────────────────────────── */

const SCAN_STEPS = [
  { icon: Globe, label: "Fetching website pages", color: "from-blue-500 to-cyan-500" },
  { icon: Building2, label: "Detecting company identity", color: "from-violet-500 to-purple-500" },
  { icon: Phone, label: "Extracting contacts & social", color: "from-emerald-500 to-teal-500" },
  { icon: Bot, label: "Preparing your AI workspace", color: "from-blue-500 to-indigo-600" },
];

function LoadingScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [600, 1200, 1800, 2400].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = Math.min(100, ((step) / SCAN_STEPS.length) * 100);

  return (
    <div className="flex items-center justify-center py-16">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-2xl">
        {/* Top: Icon + title row */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-full bg-gradient-to-r from-blue-400/15 via-violet-400/15 to-cyan-400/15 blur-lg" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-500/25">
              <Globe size={28} className="text-white" />
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-lg ring-2 ring-blue-500/30">
              <Loader2 size={12} className="animate-spin text-blue-500" />
            </motion.div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-fg">Analyzing your website</h2>
            <p className="text-xs text-fg-hint">Building your AI-powered company profile</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"
            initial={{ width: "5%" }} animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>

        {/* Steps — horizontal row */}
        <div className="grid grid-cols-4 gap-3">
          {SCAN_STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col items-center gap-2.5 rounded-xl px-3 py-4 transition-all duration-300 ${
                  active ? "bg-surface-secondary ring-1 ring-border shadow-sm" :
                  done ? "bg-blue-500/[0.06]" : "opacity-30"
                }`}>
                {done ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-md shadow-blue-500/30">
                    <Check size={18} className="text-white" />
                  </motion.div>
                ) : active ? (
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-md`}>
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
                    <Icon size={18} className="text-fg-hint" />
                  </div>
                )}
                <span className={`text-center text-xs leading-tight ${done ? "font-semibold text-blue-500" : active ? "font-bold text-fg" : "text-fg-hint"}`}>
                  {s.label}
                </span>
                {active && (
                  <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500">Processing...</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Animated card wrapper ─────────────────────────────────────────── */

function Card({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col rounded-2xl border border-border bg-surface shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ icon: Icon, iconGradient, title, subtitle, badge }: {
  icon: React.FC<any>; iconGradient: string; title: string; subtitle: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-border px-6 py-5">
      <motion.div
        whileHover={{ scale: 1.05, rotate: 3 }}
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg`}
      >
        <Icon size={22} className="text-white" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-fg">{title}</h3>
        <p className="text-xs text-fg-hint">{subtitle}</p>
      </div>
      {badge}
    </div>
  );
}

/* ── Main onboarding page ──────────────────────────────────────────── */

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

  async function fetchIntakeResults(forceRescan = false) {
    setLoading(true);
    try {
      if (forceRescan && workspace?.website_url) {
        // Force fresh scan — bypass all caching
        const res = await api.post("/api/v1/onboarding/intake-from-url", { url: workspace.website_url });
        applyIntake(res.data);
      } else {
        // Try cached results first (with smart cache validation)
        const res = await api.get("/api/v1/onboarding/intake-results");
        applyIntake(res.data);
      }
    } catch {
      if (workspace?.website_url) {
        try { const res = await api.post("/api/v1/onboarding/intake-from-url", { url: workspace.website_url }); applyIntake(res.data); }
        catch { setError("Could not analyze website."); setCompanyName(workspace?.name || ""); }
      } else { setCompanyName(workspace?.name || ""); }
    } finally { setLoading(false); }
  }

  function applyIntake(data: IntakeResult) {
    // Clean URL-encoded values in emails (e.g. %20hr@ → hr@)
    if (data.detected_emails) {
      data.detected_emails = data.detected_emails.map(e => {
        try { return decodeURIComponent(e).trim(); } catch { return e.trim(); }
      }).filter(e => e.includes("@") && !e.includes("%"));
    }
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
  const totalDetected = intake ? (intake.detected_company_name ? 1 : 0) + (intake.detected_industry !== "other" ? 1 : 0) + intake.detected_phone_numbers.length + intake.detected_emails.length + socialCount + intake.detected_whatsapp_links.length + intake.detected_contact_pages.length + intake.detected_tech_stack.length + (intake.og_image ? 1 : 0) + (intake.detected_competitors?.length || 0) + (intake.detected_keywords?.length || 0) + (intake.detected_team?.count || 0) + (intake.detected_services?.length || 0) : 0;
  const contactsFound = intake ? [
    intake.detected_phone_numbers.length > 0,
    intake.detected_emails.length > 0,
    intake.detected_whatsapp_links.length > 0,
    intake.detected_contact_pages.length > 0,
  ].filter(Boolean).length : 0;

  const ic = "w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-fg outline-none placeholder:text-fg-hint focus:border-blue-500/40 focus:bg-surface focus:ring-2 focus:ring-blue-500/15 transition-all";
  const selectClass = ic + " appearance-none cursor-pointer";

  if (loading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-4 pb-6">

      {/* ══════════ HERO BANNER ══════════ */}
      <AnimatePresence>
        {intake && totalDetected > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] via-cyan-500/[0.06] to-violet-500/[0.08] px-6 py-4"
          >
            {/* Animated background dots */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDU5LDEzMCwyNDYsMC4wNSkiLz48L3N2Zz4=')] opacity-80" />
            {/* Floating glow */}
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, -20, 0], y: [0, 10, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl"
            />

            <div className="relative flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/20"
              >
                <Sparkles size={24} className="text-white" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-fg">{totalDetected} items detected</h2>
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-md shadow-blue-500/30"
                  >
                    AI-Powered
                  </motion.span>
                </div>
                <p className="mt-1 text-sm text-fg-hint">
                  We scanned your website and built your company profile. Review the details below, then continue.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                  onClick={() => fetchIntakeResults(true)}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2.5 border border-blue-500/20 shadow-sm text-sm font-bold text-blue-500 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  Re-scan
                </motion.button>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                  className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2.5 border border-emerald-500/20 shadow-sm"
                >
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-500">Analysis complete</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !intake && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-6 py-4 text-sm text-amber-400">{error}</motion.div>
      )}

      {/* ══════════ ROW 1: Company Identity + Contact Info + Website Preview ══════════ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Company Identity */}
        <Card delay={0.1} className="h-full">
          <CardHeader
            icon={Building2}
            iconGradient="from-blue-500 to-cyan-500 shadow-blue-500/25"
            title="Company Identity"
            subtitle="Auto-detected — edit if needed"
            badge={intake ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}
                className="rounded-full bg-blue-500/10 px-2.5 py-1 text-2xs font-bold text-blue-500 ring-1 ring-blue-500/20">
                Auto-detected
              </motion.span>
            ) : undefined}
          />
          <div className="flex-1 p-5">
            <div className="space-y-3.5">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  <Building2 size={10} /> Company name
                </label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company name" className={ic} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  <Zap size={10} /> Industry
                  {intake && intake.industry_confidence > 0 && (
                    <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-2xs font-bold text-blue-500 normal-case tracking-normal"
                    >{Math.round(intake.industry_confidence * 100)}%</span>
                  )}
                </label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{INDUSTRY_LABELS[i] || i}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                    <Flag size={10} /> Country
                    {country && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={10} className="text-emerald-500" /></motion.div>}
                  </label>
                  <select value={country} onChange={e => { setCountry(e.target.value); if (!COUNTRY_CITIES[e.target.value]?.includes(city)) setCity(""); }} className={selectClass}>
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                    <MapPin size={10} /> City
                    {city && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={10} className="text-emerald-500" /></motion.div>}
                  </label>
                  <select value={city} onChange={e => setCity(e.target.value)} className={selectClass} disabled={!country}>
                    <option value="">Select</option>
                    {(() => {
                      const cities = COUNTRY_CITIES[country] || [];
                      // Include detected city if not already in the list
                      if (city && !cities.includes(city)) {
                        return [city, ...cities].map(c => <option key={c} value={c}>{c}</option>);
                      }
                      return cities.map(c => <option key={c} value={c}>{c}</option>);
                    })()}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        {intake && (
          <Card delay={0.15} className="h-full">
            <CardHeader
              icon={Phone}
              iconGradient="from-emerald-500 to-teal-600 shadow-emerald-500/25"
              title="Contact Information"
              subtitle="Phone, email & messaging"
              badge={contactsFound > 0 ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-2xs font-bold text-emerald-500 ring-1 ring-emerald-500/20">
                  {contactsFound} found
                </span>
              ) : undefined}
            />
            <div className="flex-1 p-5">
              <div className="space-y-2">
                {[
                  {
                    icon: Phone, label: "Phone",
                    value: intake.detected_phone_numbers[0],
                    found: intake.detected_phone_numbers.length > 0,
                    gradient: "from-blue-500 to-blue-600",
                    glow: "shadow-blue-500/20",
                  },
                  {
                    icon: Mail, label: "Email",
                    value: intake.detected_emails[0],
                    found: intake.detected_emails.length > 0,
                    gradient: "from-violet-500 to-purple-600",
                    glow: "shadow-violet-500/20",
                  },
                  {
                    icon: WhatsAppIcon, label: "WhatsApp",
                    value: intake.detected_whatsapp_links[0] ? "Connected" : undefined,
                    found: intake.detected_whatsapp_links.length > 0,
                    gradient: "from-green-500 to-emerald-600",
                    glow: "shadow-green-500/20",
                    isSvg: true,
                  },
                  {
                    icon: ExternalLink, label: "Contact Page",
                    value: intake.detected_contact_pages[0] ? "Detected" : undefined,
                    found: intake.detected_contact_pages.length > 0,
                    gradient: "from-amber-500 to-orange-600",
                    glow: "shadow-amber-500/20",
                  },
                ].map(({ icon: Ic, label, value, found, gradient, glow, isSvg }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-300 ${
                      found
                        ? "border-border bg-surface hover:border-blue-500/30 hover:shadow-sm"
                        : "border-dashed border-border bg-surface-secondary/50"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      found
                        ? `bg-gradient-to-br ${gradient} shadow-md ${glow}`
                        : "bg-surface-secondary"
                    }`}>
                      {isSvg ? (
                        <Ic className={`h-3.5 w-3.5 ${found ? "text-white" : "text-fg-hint"}`} />
                      ) : (
                        // @ts-ignore
                        <Ic size={14} className={found ? "text-white" : "text-fg-hint"} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xs font-medium text-fg-hint">{label}</p>
                      {found ? (
                        <p className="break-all text-xs font-bold text-fg leading-snug">{value || "Found"}</p>
                      ) : (
                        <p className="text-xs text-fg-hint/60">Not detected</p>
                      )}
                    </div>
                    {found && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }}>
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Website Preview */}
        {intake && (
          <Card delay={0.2} className="h-full">
            <CardHeader
              icon={Image}
              iconGradient="from-indigo-500 to-purple-600 shadow-indigo-500/25"
              title="Website Preview"
              subtitle="Open Graph & meta info"
            />
            <div className="flex-1 p-5 space-y-3">
              {intake.og_image ? (
                <a href={intake.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border hover:border-indigo-500/30 transition-colors group">
                  <img
                    src={intake.og_image}
                    alt="Website preview"
                    className="h-36 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </a>
              ) : (
                <a href={intake.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface-secondary/50 px-4 py-6 hover:border-indigo-500/30 hover:bg-surface-secondary/80 transition-all group">
                  {intake.favicon_url ? (
                    <img src={intake.favicon_url} alt="" className="h-8 w-8 rounded-lg" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                      <Globe size={16} className="text-indigo-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-fg-hint truncate block">{intake.url || "No preview available"}</span>
                    <span className="text-2xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Open website →</span>
                  </div>
                  <ExternalLink size={14} className="text-fg-hint/30 group-hover:text-blue-400 transition-colors shrink-0" />
                </a>
              )}
              {intake.page_title && (
                <p className="text-sm font-bold text-fg leading-snug">{intake.page_title}</p>
              )}
              {intake.meta_description && (
                <p className="text-xs text-fg-hint leading-relaxed line-clamp-3">{intake.meta_description}</p>
              )}
              {intake.detected_languages?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-2xs text-fg-hint/60 font-medium">Languages:</span>
                  {intake.detected_languages.map((lang: string) => (
                    <span key={lang} className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-2xs font-medium text-indigo-400">
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ══════════ ROW 2: Social Profiles + Digital Readiness + Products & Services ══════════ */}
      {intake && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Social Media Profiles */}
          <Card delay={0.25} className="h-full">
            <CardHeader
              icon={Share2}
              iconGradient="from-pink-500 to-rose-600 shadow-pink-500/25"
              title="Social Profiles"
              subtitle="Detected social presence"
              badge={socialCount > 0 ? (
                <span className="rounded-full bg-pink-500/10 px-2.5 py-1 text-2xs font-bold text-pink-500 ring-1 ring-pink-500/20">
                  {socialCount} connected
                </span>
              ) : undefined}
            />
            <div className="flex-1 p-5">
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL_PLATFORMS.map((platform, i) => {
                  const urls = intake.detected_social_links[platform.key] || [];
                  const found = urls.length > 0;
                  const profileUrl = found ? urls[0] : null;
                  const SocialIcon = platform.icon;
                  const Wrapper = found && profileUrl ? "a" : "div";
                  const wrapperProps = found && profileUrl ? { href: profileUrl, target: "_blank", rel: "noopener noreferrer" } : {};
                  return (
                    <motion.div
                      key={platform.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    >
                      <Wrapper
                        {...wrapperProps}
                        className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                          found
                            ? "border-border bg-surface hover:shadow-md hover:border-blue-500/20 cursor-pointer"
                            : "border-dashed border-border/60 bg-surface-secondary/30 cursor-default"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          found ? platform.bgColor : "bg-surface-secondary"
                        }`}>
                          <SocialIcon className={`h-4 w-4 transition-all duration-300 ${
                            found ? platform.brandColor : "text-fg-hint/30"
                          }`} />
                        </div>
                        <p className={`text-xs font-semibold transition-colors flex-1 ${found ? "text-fg" : "text-fg-hint/40"}`}>
                          {platform.label}
                        </p>
                        {found ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.4 + i * 0.04 }} className="flex items-center gap-1">
                            <ExternalLink size={11} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CheckCircle2 size={13} className="text-emerald-500" />
                          </motion.div>
                        ) : (
                          <XCircle size={12} className="text-fg-hint/20" />
                        )}
                      </Wrapper>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Digital Readiness Score — Overall company digital presence assessment */}
          <Card delay={0.3} className="h-full">
            <CardHeader
              icon={Activity}
              iconGradient="from-violet-500 to-fuchsia-500 shadow-violet-500/25"
              title="Digital Readiness"
              subtitle="Overall digital presence score"
              badge={(() => {
                const sc = Object.values(intake.detected_social_links || {}).filter((v: any) => v?.length > 0).length;
                const seo = intake.detected_seo_health?.score ?? 0;
                const hp = (intake.detected_phone_numbers?.length ?? 0) > 0;
                const he = (intake.detected_emails?.length ?? 0) > 0;
                const hw = (intake.detected_whatsapp_links?.length ?? 0) > 0;
                const hc = (intake.detected_contact_pages?.length ?? 0) > 0;
                const ht = (intake.detected_tech_stack?.length ?? 0) > 0;
                const hs = (intake.detected_services?.length ?? 0) > 0;
                const hl = (intake.detected_languages?.length ?? 0) > 0;
                const ps = Math.min(100, Math.round((sc / 6) * 100));
                const cs = Math.round(([hp, he, hw, hc].filter(Boolean).length / 4) * 100);
                const ts = Math.min(100, ht ? 70 + (hl ? 30 : 0) : (hl ? 30 : 0));
                const ds = Math.min(100, (hs ? 50 : 0) + Math.min(50, (intake.detected_keywords?.length ?? 0) * 5));
                const ov = Math.round((ps * 0.3 + seo * 0.25 + cs * 0.25 + ts * 0.1 + ds * 0.1));
                return (
                  <span className={`rounded-full px-2.5 py-1 text-2xs font-bold ring-1 ${
                    ov >= 70 ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                    : ov >= 40 ? "bg-amber-500/10 text-amber-600 ring-amber-500/20"
                    : "bg-red-500/10 text-red-500 ring-red-500/20"
                  }`}>{ov}/100</span>
                );
              })()}
            />
            <div className="flex-1 p-5">
              {(() => {
                const socialCount = Object.values(intake.detected_social_links || {}).filter((v: any) => v?.length > 0).length;
                const seoScore = intake.detected_seo_health?.score ?? 0;
                const hasPhone = (intake.detected_phone_numbers?.length ?? 0) > 0;
                const hasEmail = (intake.detected_emails?.length ?? 0) > 0;
                const hasWhatsApp = (intake.detected_whatsapp_links?.length ?? 0) > 0;
                const hasContactPage = (intake.detected_contact_pages?.length ?? 0) > 0;
                const hasTech = (intake.detected_tech_stack?.length ?? 0) > 0;
                const hasServices = (intake.detected_services?.length ?? 0) > 0;
                const hasLangs = (intake.detected_languages?.length ?? 0) > 0;
                const categories = [
                  { label: "Social Presence", icon: Share2, score: Math.min(100, Math.round((socialCount / 6) * 100)), detail: `${socialCount}/8 platforms`, color: "violet" },
                  { label: "SEO Health", icon: ShieldCheck, score: seoScore, detail: `${seoScore}% optimized`, color: "amber" },
                  { label: "Contact Access", icon: Phone, score: Math.round(([hasPhone, hasEmail, hasWhatsApp, hasContactPage].filter(Boolean).length / 4) * 100), detail: `${[hasPhone && "Phone", hasEmail && "Email", hasWhatsApp && "WhatsApp", hasContactPage && "Contact"].filter(Boolean).join(", ") || "None found"}`, color: "blue" },
                  { label: "Tech Stack", icon: Code2, score: Math.min(100, hasTech ? 70 + (hasLangs ? 30 : 0) : (hasLangs ? 30 : 0)), detail: hasTech ? `${intake.detected_tech_stack.length} technologies` : "Not detected", color: "cyan" },
                  { label: "Content Depth", icon: Briefcase, score: Math.min(100, (hasServices ? 50 : 0) + Math.min(50, (intake.detected_keywords?.length ?? 0) * 5)), detail: hasServices ? `${intake.detected_services.length} services listed` : "No services detected", color: "emerald" },
                ];
                const overall = Math.round(categories[0].score * 0.3 + categories[1].score * 0.25 + categories[2].score * 0.25 + categories[3].score * 0.1 + categories[4].score * 0.1);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-1">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
                          <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="2.5" strokeLinecap="round" className={overall >= 70 ? "text-emerald-500" : overall >= 40 ? "text-amber-500" : "text-red-500"} stroke="currentColor" initial={{ strokeDasharray: "0, 100" }} animate={{ strokeDasharray: `${overall}, 100` }} transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }} />
                        </svg>
                        <span className={`absolute text-lg font-black ${overall >= 70 ? "text-emerald-500" : overall >= 40 ? "text-amber-500" : "text-red-500"}`}>{overall}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${overall >= 70 ? "text-emerald-500" : overall >= 40 ? "text-amber-500" : "text-red-500"}`}>
                          {overall >= 70 ? "Strong Presence" : overall >= 40 ? "Growing Presence" : "Needs Improvement"}
                        </p>
                        <p className="text-2xs text-fg-hint mt-0.5">
                          {overall >= 70 ? "Your digital footprint is well established" : overall >= 40 ? "Room to grow across key channels" : "AEOS can help you build your digital presence"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categories.map((cat, i) => {
                        const Icon = cat.icon;
                        return (
                          <motion.div key={cat.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} className="flex items-center gap-2.5">
                            <Icon size={13} className="shrink-0 text-fg-hint" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-2xs font-semibold text-fg">{cat.label}</span>
                                <span className={`text-2xs font-bold ${cat.score >= 70 ? "text-emerald-500" : cat.score >= 40 ? "text-amber-500" : "text-red-400"}`}>{cat.score}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                                <motion.div className={`h-full rounded-full ${cat.score >= 70 ? "bg-emerald-500" : cat.score >= 40 ? "bg-amber-500" : "bg-red-400"}`} initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ delay: 0.6 + i * 0.08, duration: 0.8, ease: "easeOut" }} />
                              </div>
                              <p className="text-[9px] text-fg-hint/60 mt-0.5">{cat.detail}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Products & Services */}
          <Card delay={0.35} className="h-full">
            <CardHeader
              icon={Briefcase}
              iconGradient="from-teal-500 to-emerald-600 shadow-teal-500/25"
              title="Products & Services"
              subtitle="Detected offerings"
              badge={intake.detected_services?.length > 0 ? (
                <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-2xs font-bold text-teal-600 ring-1 ring-teal-500/20">
                  {intake.detected_services.length} found
                </span>
              ) : undefined}
            />
            <div className="flex-1 p-5">
              {intake.detected_services?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {intake.detected_services.map((svc, i) => (
                    <motion.span
                      key={svc}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500/10 to-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-500/20 hover:ring-teal-500/40 transition-all cursor-default"
                    >
                      <Briefcase size={10} />
                      {svc}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 mb-3">
                    <Briefcase size={24} className="text-teal-500/50" />
                  </div>
                  <p className="text-xs font-medium text-fg-hint">Not detected</p>
                  <p className="text-2xs text-fg-hint/60 mt-1">No services found on the website</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════ ROW 3: Team/People + AI Quick Summary + Location ══════════ */}
      {intake && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Team / People */}
          <Card delay={0.4} className="h-full">
            <CardHeader
              icon={Users}
              iconGradient="from-violet-500 to-purple-600 shadow-violet-500/25"
              title="Team / People"
              subtitle="Detected team members"
              badge={intake.detected_team?.count > 0 ? (
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-2xs font-bold text-violet-500 ring-1 ring-violet-500/20">
                  {intake.detected_team.count} found
                </span>
              ) : undefined}
            />
            <div className="flex-1 p-5">
              {intake.detected_team?.members?.length > 0 ? (
                <div className="space-y-2">
                  {intake.detected_team.members.slice(0, 6).map((member, i) => (
                    <motion.div
                      key={member.name + i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 hover:border-violet-500/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/20">
                        <span className="text-xs font-bold text-white">
                          {member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-fg leading-snug truncate">{member.name}</p>
                        {member.role && (
                          <p className="text-2xs text-fg-hint truncate">{member.role}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    {intake.detected_team.linkedin_search_url && (
                      <a
                        href={intake.detected_team.linkedin_search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#0A66C2]/20 bg-[#0A66C2]/5 px-3 py-2 text-2xs font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all"
                      >
                        <LinkedInIcon className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                    {intake.detected_team.team_page_url && (
                      <a
                        href={intake.detected_team.team_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-2xs font-semibold text-blue-500 hover:border-blue-500/30 transition-all"
                      >
                        <ExternalLink size={10} /> Team page
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 mb-3">
                    <Users size={24} className="text-violet-500/50" />
                  </div>
                  <p className="text-xs font-medium text-fg-hint">Not detected on website</p>
                  <p className="text-2xs text-fg-hint/60 mt-1 mb-3">Try searching on social platforms</p>
                  <div className="flex flex-col gap-1.5 w-full">
                    {intake.detected_team?.linkedin_search_url && (
                      <a
                        href={intake.detected_team.linkedin_search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-[#0A66C2]/20 bg-[#0A66C2]/5 px-3 py-2 text-2xs font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all"
                      >
                        <LinkedInIcon className="h-3.5 w-3.5" /> Search on LinkedIn
                      </a>
                    )}
                    {intake.detected_team?.team_page_url && (
                      <a
                        href={intake.detected_team.team_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-2xs font-semibold text-fg-hint hover:text-fg hover:border-violet-500/30 transition-all"
                      >
                        <ExternalLink size={10} /> View team page
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* AI Quick Summary */}
          <Card delay={0.42} className="h-full">
            <CardHeader
              icon={Bot}
              iconGradient="from-violet-500 to-purple-600 shadow-violet-500/25"
              title="AI Quick Summary"
              subtitle="Auto-generated company brief"
              badge={intake.detected_description ? (
                <span className="rounded-full px-2.5 py-1 text-2xs font-bold ring-1 bg-violet-500/10 text-violet-500 ring-violet-500/20">
                  AI Generated
                </span>
              ) : undefined}
            />
            <div className="flex-1 p-5">
              {intake.detected_description || intake.detected_industry ? (
                <div className="space-y-3">
                  {/* Description */}
                  {intake.detected_description && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.44 }}
                      className="rounded-xl bg-violet-500/[0.06] border border-violet-500/10 p-3"
                    >
                      <p className="text-xs leading-relaxed text-fg/90">{intake.detected_description}</p>
                    </motion.div>
                  )}

                  {/* Quick Facts */}
                  <div className="space-y-1.5">
                    {[
                      intake.detected_industry && {
                        label: "Industry",
                        value: INDUSTRY_LABELS[intake.detected_industry] || intake.detected_industry,
                        icon: Briefcase,
                        color: "text-blue-500",
                      },
                      intake.detected_country && {
                        label: "Headquarters",
                        value: [intake.detected_city, intake.detected_country].filter(Boolean).join(", "),
                        icon: MapPin,
                        color: "text-emerald-500",
                      },
                      intake.detected_services?.length > 0 && {
                        label: "Key Offerings",
                        value: intake.detected_services.slice(0, 3).join(", "),
                        icon: Zap,
                        color: "text-amber-500",
                      },
                      intake.detected_keywords?.length > 0 && {
                        label: "Focus Areas",
                        value: intake.detected_keywords.slice(0, 4).join(", "),
                        icon: Search,
                        color: "text-cyan-500",
                      },
                      (intake.detected_team?.members?.length > 0) && {
                        label: "Team Size Signal",
                        value: `${intake.detected_team.members.length} key people identified`,
                        icon: Users,
                        color: "text-pink-500",
                      },
                    ]
                      .filter(Boolean)
                      .map((fact: any, i: number) => (
                        <motion.div
                          key={fact.label}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.46 + i * 0.04 }}
                          className="flex items-start gap-2.5 rounded-lg px-2.5 py-1.5"
                        >
                          <fact.icon size={13} className={`${fact.color} mt-0.5 shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-2xs font-semibold text-fg-hint uppercase tracking-wider">{fact.label}</p>
                            <p className="text-xs text-fg/80 truncate">{fact.value}</p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 mb-3"
                  >
                    <Bot size={24} className="text-violet-500/50" />
                  </motion.div>
                  <p className="text-xs font-medium text-fg-hint">Analyzing...</p>
                  <p className="text-2xs text-fg-hint/60 mt-1">Generating company brief</p>
                </div>
              )}
            </div>
          </Card>

          {/* Location Map */}
          <Card delay={0.45} className="h-full">
            <CardHeader
              icon={MapPin}
              iconGradient="from-emerald-500 to-green-600 shadow-emerald-500/25"
              title="Location"
              subtitle="Detected headquarters"
            />
            <div className="flex-1 p-5">
              {country ? (
                <>
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <div className="relative flex flex-col items-center justify-center py-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-teal-500/10"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/30">
                          <MapPin size={28} className="text-white" />
                        </div>
                      </motion.div>
                      <p className="relative mt-3 text-base font-bold text-fg">{city || country}</p>
                      {city && <p className="relative text-xs text-fg-hint">{country}</p>}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((city ? city + ", " : "") + country)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary/50 px-4 py-2 text-xs font-semibold text-fg-hint hover:text-fg hover:border-emerald-500/30 transition-all"
                  >
                    <ExternalLink size={12} />
                    Open in Google Maps
                  </a>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
                    <MapPin size={24} className="text-emerald-500/50" />
                  </div>
                  <p className="text-xs font-medium text-fg-hint">Not detected</p>
                  <p className="text-2xs text-fg-hint/60 mt-1">Set your country above</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════ Tech Stack (full width) ══════════ */}
      {intake && intake.detected_tech_stack.length > 0 && (
        <Card delay={0.3}>
          <div className="flex items-center gap-3.5 px-5 py-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25"
            >
              <Code2 size={18} className="text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-fg">Technology Stack</h3>
            </div>
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-2xs font-bold text-cyan-500 ring-1 ring-cyan-500/20">
              {intake.detected_tech_stack.length} detected
            </span>
            <div className="flex flex-wrap gap-2 ml-2">
              {intake.detected_tech_stack.map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-3 py-1.5 text-xs font-bold text-cyan-600 ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all cursor-default"
                >
                  <Code2 size={11} />
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ══════════ CONTINUE BUTTON ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <motion.button
          onClick={handleConfirm}
          disabled={saving}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 bg-[length:200%_100%] py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all duration-500 hover:bg-right hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50"
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{ x: [-200, 400] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          />
          {saving ? (
            <><Loader2 size={20} className="animate-spin" /> Saving your profile...</>
          ) : (
            <>
              <Sparkles size={20} />
              Continue to Org Chart
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
