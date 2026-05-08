"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { COMPANY_COLORS } from "@/lib/types";
import { ArrowLeft, TrendingUp, Shield, Users, DollarSign, AlertTriangle, Sparkles, ExternalLink } from "lucide-react";

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
  },
};

function toSlug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function fromSlug(slug: string) {
  return Object.keys(COMPANY_DATA).find(k => k === slug) ?? null;
}

// ── Section card ───────────────────────────────────────────────────────────────
function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
      <div className={`flex items-center gap-2 mb-4 text-sm font-semibold ${color}`}>
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

export default function CompanyDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = params?.slug as string;
  const co      = COMPANY_DATA[slug];

  const [aiInsight, setAiInsight]   = useState("");
  const [aiLoading, setAiLoading]   = useState(false);

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
        <button onClick={() => router.push("/companies")} className="text-blue-600 text-sm hover:underline">← Back to Companies</button>
      </div>
    );
  }

  const color = COMPANY_COLORS[co.name] ?? "#6b7280";

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e8] px-8 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/companies")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ background: color }} />
            <div>
              <h1 className="text-[18px] font-bold text-gray-900">{co.name}</h1>
              <p className="text-[12px] text-gray-400">{co.ticker}{co.formerly ? ` · formerly ${co.formerly}` : ""}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href={co.irUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <ExternalLink size={12} /> IR Page
          </a>
          <button onClick={generateAiInsight} disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
            <Sparkles size={12} />
            {aiLoading ? "Generating…" : "AI Battle Brief"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* AI Battle Brief */}
          {(aiInsight || aiLoading) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-blue-700">
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

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Revenue", value: co.revenue, icon: <DollarSign size={14} /> },
              { label: "Members", value: co.members, icon: <Users size={14} /> },
              { label: "Medical Loss Ratio", value: co.mlr, icon: <TrendingUp size={14} /> },
              { label: "Employees", value: co.employees, icon: <Shield size={14} /> },
            ].map(m => (
              <div key={m.label} className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">{m.icon}{m.label}</div>
                <p className="text-[15px] font-bold text-gray-900">{m.value}</p>
              </div>
            ))}
          </div>

          {/* About + HQ */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
            <p className="text-[13px] text-gray-700 leading-relaxed mb-3">{co.description}</p>
            <div className="flex flex-wrap gap-4 text-[12px] text-gray-400">
              <span>🏢 {co.hq}</span>
              <span>📅 Founded {co.founded}</span>
              <span>👥 {co.employees}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {co.segments.map(s => <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>)}
            </div>
          </div>

          {/* 4 grid sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <Section icon={<TrendingUp size={14} />} title="Strengths" color="text-green-700">
              <ul className="space-y-2">
                {co.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={<Shield size={14} />} title="Weaknesses" color="text-amber-600">
              <ul className="space-y-2">
                {co.weaknesses.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={<AlertTriangle size={14} />} title="Threats to Blue Shield of CA" color="text-red-600">
              <ul className="space-y-2">
                {co.threats_to_bsc.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={<Sparkles size={14} />} title="Recent Strategic Moves" color="text-blue-600">
              <ul className="space-y-2">
                {co.recent_moves.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}
