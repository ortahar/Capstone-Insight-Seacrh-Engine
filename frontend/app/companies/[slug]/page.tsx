"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { COMPANY_COLORS } from "@/lib/types";
import {
  ArrowLeft, TrendingUp, Shield, Users, DollarSign,
  AlertTriangle, Sparkles, ExternalLink, ChevronRight,
  Copy, Check,
} from "lucide-react";

// ── Company data ───────────────────────────────────────────────────────────────
const COMPANY_DATA: Record<string, {
  name: string; ticker: string; formerly?: string;
  description: string; segments: string[];
  hq: string; founded: string; employees: string;
  revenue: string; members: string; mlr: string;
  strengths: string[]; weaknesses: string[];
  threats_to_bsc: string[];
  recent_moves: string[];
  irUrl: string;
  logo: string;
}> = {
  "elevance-health": {
    name: "Elevance Health", ticker: "ELV", formerly: "Anthem Inc.",
    description: "One of the largest health insurers in the US. Operates Blue Cross Blue Shield plans in 14 states. Known for Carelon health services division.",
    segments: ["Commercial", "Medicare", "Medicaid", "Carelon Services"],
    hq: "Indianapolis, IN", founded: "1944", employees: "~100,000",
    revenue: "$171B (2024)", members: "45M+", mlr: "87.3%",
    strengths: ["Strong BCBS brand recognition", "Carelon health services diversification", "Largest commercial insurer in many markets", "Strong government business (Medicaid/Medicare)"],
    weaknesses: ["High medical costs pressure", "Integration challenges post-Anthem rebrand", "Limited West Coast presence", "MA membership declining"],
    threats_to_bsc: ["Competing for same California employer groups", "Anthem BCBS brand overlap in Northern CA", "Aggressive Medi-Cal expansion", "Digital health investments targeting BSC members"],
    recent_moves: ["Carelon behavioral health expansion", "AI-powered prior authorization rollout", "Medicaid contract wins in multiple states", "2025 MA plan exits in unprofitable markets"],
    irUrl: "https://ir.elevancehealth.com",
    logo: "https://logo.clearbit.com/elevancehealth.com",
  },
  "unitedhealth-group": {
    name: "UnitedHealth Group", ticker: "UNH",
    description: "Largest US health insurer by revenue. Operates UnitedHealthcare and Optum. Dominant Medicare Advantage position nationwide.",
    segments: ["UnitedHealthcare", "OptumHealth", "OptumRx", "OptumInsight"],
    hq: "Minnetonka, MN", founded: "1977", employees: "440,000+",
    revenue: "$371B (2024)", members: "50M+", mlr: "85.1%",
    strengths: ["Largest MA market share (~29%)", "Optum vertical integration", "Technology and data analytics leadership", "Scale advantages in negotiations"],
    weaknesses: ["DOJ antitrust scrutiny", "CEO tragedy impact on operations", "Rising medical costs in MA", "Public trust issues post-2024"],
    threats_to_bsc: ["Optum acquiring physician groups in CA", "Undercutting BSC on employer group pricing", "MA dominance limiting BSC growth", "Data and analytics capabilities far ahead"],
    recent_moves: ["Settled DOJ Change Healthcare investigation", "Expanded Optum primary care in California", "Pulled back from some MA markets", "Invested $1B+ in AI/tech infrastructure"],
    irUrl: "https://ir.uhc.com",
    logo: "https://logo.clearbit.com/unitedhealthgroup.com",
  },
  "aetna-cvs-health": {
    name: "Aetna (CVS Health)", ticker: "CVS",
    description: "Acquired by CVS Health in 2018. Integrated health model with pharmacy, MinuteClinic, and insurance.",
    segments: ["Health Benefits", "Pharmacy & Consumer Wellness", "Health Services"],
    hq: "Hartford, CT / Woonsocket, RI", founded: "1853", employees: "300,000+",
    revenue: "$372B (2024)", members: "25M+", mlr: "89.5%",
    strengths: ["CVS pharmacy integration (9,000+ locations)", "MinuteClinic access points", "Strong PBM through Caremark", "Employer market relationships"],
    weaknesses: ["MA losses driving restructuring", "Heavy debt from CVS acquisition", "MLR deterioration", "Leadership changes slowing strategy"],
    threats_to_bsc: ["CVS retail health clinics as alternative access points", "PBM advantage in employer negotiations", "Pharmacy benefit bundling deals", "California employer market competition"],
    recent_moves: ["$2.6B Aetna turnaround plan announced", "MA market exits in 2025", "CVS Health CEO replacement", "Cost reduction program — cutting 2,900 jobs"],
    irUrl: "https://investors.cvshealth.com",
    logo: "https://logo.clearbit.com/aetna.com",
  },
  "cigna-group": {
    name: "Cigna Group", ticker: "CI",
    description: "Global health services with strong employer-sponsored insurance and Evernorth pharmacy benefits.",
    segments: ["Evernorth Health Services", "Cigna Healthcare", "International"],
    hq: "Bloomfield, CT", founded: "1792", employees: "70,000+",
    revenue: "$247B (2024)", members: "18M+", mlr: "82.4%",
    strengths: ["Evernorth PBM scale", "Strong commercial/employer focus", "International diversification", "Low MLR vs peers"],
    weaknesses: ["Exited MA market in 2024", "Smaller individual/ACA presence", "Limited West Coast commercial footprint", "Divested Medicare business"],
    threats_to_bsc: ["Employer group competition in CA tech sector", "Express Scripts PBM bundling", "Behavioral health Evernorth expansion", "Potential re-entry into government markets"],
    recent_moves: ["Sold MA business to HCSC", "Evernorth behavioral health expansion", "Share buyback acceleration", "Exploring Humana acquisition (rumored)"],
    irUrl: "https://www.thecignagroup.com/investors",
    logo: "https://logo.clearbit.com/cigna.com",
  },
  "humana": {
    name: "Humana", ticker: "HUM",
    description: "Leader in Medicare Advantage with ~20% market share. Operates Centerwell primary care and home health.",
    segments: ["Insurance", "CenterWell", "Medicare Advantage", "Medicaid"],
    hq: "Louisville, KY", founded: "1961", employees: "60,000+",
    revenue: "$117B (2024)", members: "17M+", mlr: "91.2%",
    strengths: ["#2 MA insurer nationally", "CenterWell primary care integration", "Strong senior brand loyalty", "TRICARE military contract"],
    weaknesses: ["MA losses — MLR above 90%", "2025 earnings guidance cuts", "Limited commercial/employer presence", "Geographic concentration risk"],
    threats_to_bsc: ["MA competition in CA senior market", "CenterWell clinics targeting BSC Medicare members", "Brand loyalty among seniors", "TRICARE military families in CA"],
    recent_moves: ["Cut 2025 EPS guidance significantly", "Closed unprofitable MA plans", "CenterWell clinic expansion paused", "Exploring strategic alternatives (sale rumors)"],
    irUrl: "https://ir.humana.com",
    logo: "https://logo.clearbit.com/humana.com",
  },
  "centene": {
    name: "Centene", ticker: "CNC",
    description: "Largest Medicaid managed care organization in the US. Operates WellCare and Ambetter brands.",
    segments: ["Medicaid", "Medicare", "Commercial", "International"],
    hq: "St. Louis, MO", founded: "1984", employees: "74,000+",
    revenue: "$153B (2024)", members: "28M+", mlr: "88.7%",
    strengths: ["#1 Medicaid MCO by membership", "Ambetter ACA marketplace scale", "Multi-state government contract relationships", "Low-income population expertise"],
    weaknesses: ["Medicaid redetermination membership losses", "ACA market volatility", "State contract renewal risk", "Low margin government business"],
    threats_to_bsc: ["Medi-Cal competition in California", "Ambetter undercutting BSC on ACA exchange", "Medicaid expansion gains at BSC expense", "State contract bids for Medi-Cal"],
    recent_moves: ["Medi-Cal contract expansion in CA", "Medicaid redetermination impact recovery", "ACA membership growth offsetting Medicaid losses", "40% EPS growth target for 2026"],
    irUrl: "https://ir.centene.com",
    logo: "https://logo.clearbit.com/centene.com",
  },
  "molina-healthcare": {
    name: "Molina Healthcare", ticker: "MOH",
    description: "Focused exclusively on government-sponsored programs. Medicaid, Medicare, and Marketplace in 19 states.",
    segments: ["Medicaid", "Medicare", "Marketplace"],
    hq: "Long Beach, CA", founded: "1980", employees: "15,000+",
    revenue: "$40B (2024)", members: "5.5M+", mlr: "88.4%",
    strengths: ["California HQ — deep state relationships", "Pure-play government focus", "Cost discipline track record", "Marketplace growth momentum"],
    weaknesses: ["No commercial/employer business", "Medicaid concentration risk", "Small scale vs large competitors", "ACA membership cost pressures"],
    threats_to_bsc: ["Direct Medi-Cal competition in California (home market)", "Marketplace ACA competition", "California government relationships", "Low-income member acquisition in BSC territory"],
    recent_moves: ["Q1 2026 earnings beat — stock up 15%", "Medicaid contract wins in new states", "ACA membership growth despite industry headwinds", "Reaffirmed full-year 2026 guidance"],
    irUrl: "https://ir.molinahealthcare.com",
    logo: "https://logo.clearbit.com/molinahealthcare.com",
  },
  "oscar-health": {
    name: "Oscar Health", ticker: "OSCR",
    description: "Technology-first health insurer. ACA Marketplace and Medicare Advantage focus. +Oscar B2B platform.",
    segments: ["Individual & Family", "Small Group", "Medicare Advantage", "+Oscar Platform"],
    hq: "New York, NY", founded: "2012", employees: "3,500+",
    revenue: "$9B (2024)", members: "1.7M+", mlr: "85.2%",
    strengths: ["Tech-first member experience", "+Oscar B2B licensing model", "Younger demographic appeal", "Strong ACA marketplace growth"],
    weaknesses: ["Small scale — limited negotiating power", "Still achieving profitability", "Limited geographic coverage", "Brand awareness outside core markets"],
    threats_to_bsc: ["Tech-savvy younger member competition", "+Oscar platform selling to other insurers", "ACA marketplace pricing aggressiveness", "Digital-first members who prefer app-based care"],
    recent_moves: ["First full year of profitability (2024)", "+Oscar platform licensing expanding", "MA market selective expansion", "Lucie marketplace launch for tech workers"],
    irUrl: "https://ir.hioscar.com",
    logo: "https://logo.clearbit.com/hioscar.com",
  },
};

// ── Company logo with fallback ─────────────────────────────────────────────────
function CompanyLogo({ logo, name, color, size = 10 }: { logo: string; name: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const cls = `w-${size} h-${size}`;
  if (failed) {
    return (
      <div className={`${cls} rounded-xl shrink-0 flex items-center justify-center`}
        style={{ background: color + "20", border: `1.5px solid ${color}40` }}>
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      </div>
    );
  }
  return (
    <div className={`${cls} rounded-xl shrink-0 bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center`}>
      <img src={logo} alt={name} className="w-[80%] h-[80%] object-contain"
        onError={() => setFailed(true)} />
    </div>
  );
}

// ── Refined segment pill ───────────────────────────────────────────────────────
function SegmentPill({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full leading-none whitespace-nowrap"
      style={{ background: color + "14", color, border: `1px solid ${color}28` }}>
      {label}
    </span>
  );
}

// ── Copy-to-clipboard button ───────────────────────────────────────────────────
function CopyButton({ items }: { items: string[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(items.map(s => `• ${s}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handleCopy} title="Copy"
      className="p-1.5 rounded-lg hover:bg-black/5 text-gray-300 hover:text-gray-500 transition-colors">
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

// ── Generic section card ───────────────────────────────────────────────────────
interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  headerBg: string;
  headerBorder: string;
  titleColor: string;
  dotColor: string;
  items: string[];
}

function SectionCard({ icon, title, headerBg, headerBorder, titleColor, dotColor, items }: SectionCardProps) {
  return (
    <div className={`bg-white border ${headerBorder} rounded-2xl overflow-hidden
                     hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition-all duration-150`}>
      {/* Title bar */}
      <div className={`flex items-center justify-between px-5 py-3 ${headerBg} border-b ${headerBorder}`}>
        <div className={`flex items-center gap-2 text-[13px] font-semibold ${titleColor}`}>
          {icon}{title}
        </div>
        <CopyButton items={items} />
      </div>

      {/* Items */}
      <div className="px-5 py-4">
        <ul className="space-y-3.5">
          {items.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-relaxed">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-[5px] shrink-0`} />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Threats card — full-width, elevated weight ─────────────────────────────────
function ThreatsCard({ items }: { items: string[] }) {
  return (
    <div className="bg-white border-2 border-red-200 rounded-2xl overflow-hidden
                    shadow-[0_2px_16px_rgba(239,68,68,0.10)]
                    hover:shadow-[0_4px_24px_rgba(239,68,68,0.16)] transition-all duration-150">
      {/* Title bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-red-50 border-b border-red-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle size={13} className="text-red-500" />
          </div>
          <span className="text-[13px] font-bold text-red-700">Threats to Blue Shield of CA</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-100 text-red-500 rounded-full ml-1">
            HIGH PRIORITY
          </span>
        </div>
        <CopyButton items={items} />
      </div>

      {/* Items in 2-col grid on wide screens */}
      <div className="px-5 py-5">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
          {items.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-[5px] shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params?.slug as string;
  const co     = COMPANY_DATA[slug];

  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const generateAiInsight = async () => {
    if (!co) return;
    setAiLoading(true); setAiInsight("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Give me a concise competitive intelligence summary for ${co.name} vs Blue Shield of California. Cover: 1) Their biggest strategic threat to BSC, 2) Their current financial trajectory, 3) One key opportunity for BSC to compete against them. Be specific and actionable.`,
          filters: {}, history: [],
        }),
      });
      const data = await res.json();
      setAiInsight(data.answer ?? "No insight generated.");
    } catch {
      setAiInsight("Error generating insight. Please try again.");
    } finally { setAiLoading(false); }
  };

  if (!co) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">Company not found.</p>
        <button onClick={() => router.push("/companies")} className="text-blue-600 text-sm hover:underline">
          ← Back to Companies
        </button>
      </div>
    );
  }

  const color = COMPANY_COLORS[co.name] ?? "#6b7280";

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f7f7f7]">

      {/* ── Header: 2-layer ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e8e8e8] shrink-0">

        {/* Layer 1 — breadcrumb */}
        <div className="flex items-center gap-1.5 px-8 pt-3.5 pb-1">
          <button onClick={() => router.push("/companies")}
            className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={12} /> Companies
          </button>
          <ChevronRight size={11} className="text-gray-300" />
          <span className="text-[12px] text-gray-500 font-medium">{co.name}</span>
        </div>

        {/* Layer 2 — identity + actions */}
        <div className="flex items-center justify-between px-8 pb-4 pt-2">
          {/* Left: logo + name block (no duplicate dot) */}
          <div className="flex items-center gap-3.5">
            <CompanyLogo logo={co.logo} name={co.name} color={color} size={11} />
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">{co.name}</h1>
              <p className="text-[12px] text-gray-400 leading-none">
                <span className="font-semibold text-gray-500">{co.ticker}</span>
                {co.formerly && <span className="ml-1.5">· formerly {co.formerly}</span>}
              </p>
            </div>
          </div>

          {/* Right: ghost + primary, vertically centred with company name */}
          <div className="flex items-center gap-2">
            <a href={co.irUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 text-[12px] text-gray-500 border border-gray-200 rounded-lg px-3.5 hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium whitespace-nowrap">
              <ExternalLink size={12} /> IR Page
            </a>
            <button onClick={generateAiInsight} disabled={aiLoading}
              className="inline-flex items-center gap-1.5 h-8 text-[12px] text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 transition-colors font-semibold disabled:opacity-50 shadow-sm whitespace-nowrap">
              <Sparkles size={12} />
              {aiLoading ? "Generating…" : "AI Battle Brief"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* AI Battle Brief result */}
          {(aiInsight || aiLoading) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold text-blue-700">
                <Sparkles size={14} /> AI Battle Brief
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-3 text-sm text-blue-500">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  Analyzing competitive intelligence…
                </div>
              ) : (
                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
              )}
            </div>
          )}

          {/* KPI row — primary (Revenue, MLR) slightly larger; brand-tint icons; context hints */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              {
                label: "Revenue", value: co.revenue,
                icon: <DollarSign size={13} />, primary: true,
                hint: "Annual · FY 2024",
              },
              {
                label: "Members", value: co.members,
                icon: <Users size={13} />, primary: false,
                hint: "Total covered lives",
              },
              {
                label: "MLR", value: co.mlr,
                icon: <TrendingUp size={13} />, primary: true,
                hint: "Peer median 87.9%",
              },
              {
                label: "Employees", value: co.employees,
                icon: <Shield size={13} />, primary: false,
                hint: "Full-time equivalent",
              },
            ] as { label: string; value: string; icon: React.ReactNode; primary: boolean; hint: string }[]).map(m => (
              <div key={m.label}
                className={[
                  "bg-white border rounded-2xl px-4 pt-4 pb-3 flex flex-col gap-1",
                  "hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-150",
                  m.primary
                    ? "border-[#d4dcf5] shadow-[0_1px_4px_rgba(61,90,241,0.06)]"
                    : "border-[#e4e7ef]",
                ].join(" ")}>
                {/* Label row with brand-tinted icon */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: color + "aa" }}>
                  <span style={{ color: color + "99" }}>{m.icon}</span>
                  {m.label}
                </div>
                {/* Number */}
                <p className={[
                  "font-extrabold text-gray-900 leading-none",
                  m.primary ? "text-[24px]" : "text-[20px]",
                ].join(" ")}>{m.value}</p>
                {/* Context hint */}
                <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">{m.hint}</p>
              </div>
            ))}
          </div>

          {/* About + segments */}
          <div className="bg-white border border-[#e4e7ef] rounded-2xl p-5
                          hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:border-[#ccd0e0]
                          transition-all duration-150">
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">{co.description}</p>

            {/* Structured metadata — 3-column aligned grid */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-[#f8f9fc] rounded-xl border border-[#eef0f8]">
              {[
                { label: "Headquarters", value: co.hq,        icon: "🏢" },
                { label: "Founded",      value: co.founded,   icon: "📅" },
                { label: "Employees",    value: co.employees, icon: "👥" },
              ].map(m => (
                <div key={m.label} className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {m.label}
                  </span>
                  <span className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className="text-[12px]">{m.icon}</span>{m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Segment chips — consistent height h-6 */}
            <div className="flex flex-wrap gap-1.5">
              {co.segments.map(s => (
                <span key={s}
                  className="inline-flex items-center h-6 text-[11px] font-medium px-2.5 rounded-full leading-none whitespace-nowrap"
                  style={{ background: color + "14", color, border: `1px solid ${color}28` }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* ── Threats — full-width, high priority ── */}
          <ThreatsCard items={co.threats_to_bsc} />

          {/* ── 3-column grid: Strengths · Weaknesses · Recent Moves ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SectionCard
              icon={<TrendingUp size={13} />}
              title="Strengths"
              headerBg="bg-green-50"
              headerBorder="border-green-100"
              titleColor="text-green-700"
              dotColor="bg-green-400"
              items={co.strengths}
            />
            <SectionCard
              icon={<Shield size={13} />}
              title="Weaknesses"
              headerBg="bg-amber-50"
              headerBorder="border-amber-100"
              titleColor="text-amber-700"
              dotColor="bg-amber-400"
              items={co.weaknesses}
            />
            <SectionCard
              icon={<Sparkles size={13} />}
              title="Recent Strategic Moves"
              headerBg="bg-blue-50"
              headerBorder="border-blue-100"
              titleColor="text-blue-700"
              dotColor="bg-blue-400"
              items={co.recent_moves}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
