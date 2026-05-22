"use client";

import Link from "next/link";
import { useState } from "react";
import { COMPANY_COLORS } from "@/lib/types";
import { ArrowRight } from "lucide-react";

const COMPANIES = [
  {
    slug: "elevance-health",
    name: "Elevance Health",
    ticker: "ELV",
    category: "Commercial · BCBS",
    revenue: "$171B",
    members: "45M+",
    mlr: "87.3%",
    description: "Operates BCBS plans in 14 states. Carelon health services diversification.",
    logo: "https://logo.clearbit.com/elevancehealth.com",
  },
  {
    slug: "unitedhealth-group",
    name: "UnitedHealth Group",
    ticker: "UNH",
    category: "Diversified",
    revenue: "$371B",
    members: "50M+",
    mlr: "85.1%",
    description: "Largest US insurer by revenue. UnitedHealthcare + Optum vertical integration.",
    logo: "https://logo.clearbit.com/unitedhealthgroup.com",
  },
  {
    slug: "aetna-cvs-health",
    name: "Aetna (CVS Health)",
    ticker: "CVS",
    category: "Commercial · PBM",
    revenue: "$372B",
    members: "25M+",
    mlr: "89.5%",
    description: "Integrated model with CVS pharmacy, MinuteClinic, and Caremark PBM.",
    logo: "https://logo.clearbit.com/aetna.com",
  },
  {
    slug: "cigna-group",
    name: "Cigna Group",
    ticker: "CI",
    category: "Commercial · PBM",
    revenue: "$247B",
    members: "18M+",
    mlr: "82.4%",
    description: "Evernorth pharmacy benefits and strong employer-sponsored commercial focus.",
    logo: "https://logo.clearbit.com/cigna.com",
  },
  {
    slug: "humana",
    name: "Humana",
    ticker: "HUM",
    category: "Medicare Advantage",
    revenue: "$117B",
    members: "17M+",
    mlr: "91.2%",
    description: "#2 Medicare Advantage insurer. CenterWell primary care and home health.",
    logo: "https://logo.clearbit.com/humana.com",
  },
  {
    slug: "centene",
    name: "Centene",
    ticker: "CNC",
    category: "Medicaid · ACA",
    revenue: "$153B",
    members: "28M+",
    mlr: "88.7%",
    description: "#1 Medicaid MCO. Operates WellCare and Ambetter ACA marketplace brands.",
    logo: "https://logo.clearbit.com/centene.com",
  },
  {
    slug: "molina-healthcare",
    name: "Molina Healthcare",
    ticker: "MOH",
    category: "Medicaid · Gov",
    revenue: "$40B",
    members: "5.5M+",
    mlr: "88.4%",
    description: "California-based pure-play government programs — Medicaid, Medicare, ACA.",
    logo: "https://logo.clearbit.com/molinahealthcare.com",
  },
  {
    slug: "oscar-health",
    name: "Oscar Health",
    ticker: "OSCR",
    category: "ACA · Tech",
    revenue: "$9B",
    members: "1.7M+",
    mlr: "85.2%",
    description: "Tech-first insurer. ACA marketplace + +Oscar B2B platform for other carriers.",
    logo: "https://logo.clearbit.com/hioscar.com",
  },
];

function CompanyLogo({ logo, name, color }: { logo: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: color + "22", border: `1.5px solid ${color}44` }}
      >
        <div className="w-3.5 h-3.5 rounded-full" style={{ background: color }} />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl shrink-0 bg-white flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
      <img
        src={logo}
        alt={`${name} logo`}
        className="w-7 h-7 object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

interface KpiBadgeProps { value: string; label: string; color: string }
function KpiBadge({ value, label, color }: KpiBadgeProps) {
  return (
    <div
      className="flex flex-col items-center px-3 py-1.5 rounded-xl flex-1"
      style={{ background: color + "12" }}
    >
      <span className="text-[14px] font-extrabold text-gray-800 leading-tight tracking-tight">{value}</span>
      <span className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f7f7f7]">
      <header className="h-14 flex items-center justify-between px-8 border-b border-[#e8e8e8] bg-white shrink-0">
        <span className="text-[15px] font-bold text-gray-900">Blue Shield CI Engine</span>
        <span className="text-[15px] font-semibold text-gray-900">Companies</span>
        <span className="text-xs text-gray-400">{COMPANIES.length} competitors tracked</span>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Competitive Intelligence</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Companies</h1>
            <p className="text-[14px] text-gray-500">Click a competitor to view their profile, financials, and AI battle brief.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {COMPANIES.map(co => {
              const color = COMPANY_COLORS[co.name] ?? "#6b7280";
              return (
                <Link key={co.slug} href={`/companies/${co.slug}`} className="group">
                  <div className="relative bg-white border border-[#e4e7ef] rounded-2xl overflow-hidden h-full flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.13)] hover:border-[#c5cfe0] transition-all duration-200 cursor-pointer">

                    {/* ── Row 1: Logo · Name · Ticker · Category tag ── */}
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                      <CompanyLogo logo={co.logo} name={co.name} color={color} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-bold text-gray-900 leading-tight truncate">{co.name}</span>
                          {/* Ticker badge */}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none tracking-wide"
                            style={{ color, background: color + "18", border: `1px solid ${color}30` }}
                          >
                            {co.ticker}
                          </span>
                          {/* Category tag */}
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 leading-none whitespace-nowrap">
                            {co.category}
                          </span>
                        </div>
                      </div>

                      {/* "View details" arrow — appears on hover */}
                      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 text-[12px] font-medium text-blue-500 whitespace-nowrap">
                        View details <ArrowRight size={13} />
                      </div>
                    </div>

                    {/* ── Row 2: Description ── */}
                    <p className="text-[13px] text-gray-600 leading-relaxed flex-1 px-5 pb-4">
                      {co.description}
                    </p>

                    {/* ── Row 3: KPI badges ── */}
                    <div className="flex items-center gap-2 px-4 pb-4">
                      <KpiBadge value={co.revenue} label="Revenue"  color={color} />
                      <KpiBadge value={co.members} label="Members"  color={color} />
                      <KpiBadge value={co.mlr}     label="MLR"      color={color} />
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
