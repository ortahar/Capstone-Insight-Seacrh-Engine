"use client";

import Link from "next/link";
import { COMPANY_COLORS } from "@/lib/types";
import { TrendingUp, Users, DollarSign } from "lucide-react";

const COMPANIES = [
  { slug: "elevance-health",   name: "Elevance Health",      ticker: "ELV", formerly: "Anthem Inc.", revenue: "$171B", members: "45M+", mlr: "87.3%", description: "Operates BCBS plans in 14 states. Carelon health services diversification." },
  { slug: "unitedhealth-group",name: "UnitedHealth Group",   ticker: "UNH", revenue: "$371B", members: "50M+", mlr: "85.1%", description: "Largest US insurer by revenue. UnitedHealthcare + Optum vertical integration." },
  { slug: "aetna-cvs-health",  name: "Aetna (CVS Health)",   ticker: "CVS", revenue: "$372B", members: "25M+", mlr: "89.5%", description: "Integrated model with CVS pharmacy, MinuteClinic, and Caremark PBM." },
  { slug: "cigna-group",       name: "Cigna Group",          ticker: "CI",  revenue: "$247B", members: "18M+", mlr: "82.4%", description: "Evernorth pharmacy benefits and strong employer-sponsored commercial focus." },
  { slug: "humana",            name: "Humana",               ticker: "HUM", revenue: "$117B", members: "17M+", mlr: "91.2%", description: "#2 Medicare Advantage insurer. CenterWell primary care and home health." },
  { slug: "centene",           name: "Centene",              ticker: "CNC", revenue: "$153B", members: "28M+", mlr: "88.7%", description: "#1 Medicaid MCO. Operates WellCare and Ambetter ACA marketplace brands." },
  { slug: "molina-healthcare", name: "Molina Healthcare",    ticker: "MOH", revenue: "$40B",  members: "5.5M+",mlr: "88.4%", description: "California-based pure-play government programs — Medicaid, Medicare, ACA." },
  { slug: "oscar-health",      name: "Oscar Health",         ticker: "OSCR",revenue: "$9B",   members: "1.7M+",mlr: "85.2%", description: "Tech-first insurer. ACA marketplace + +Oscar B2B platform for other carriers." },
];

export default function CompaniesPage() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f7f7f7]">
      <header className="h-14 flex items-center justify-between px-8 border-b border-[#e8e8e8] bg-white shrink-0">
        <span className="text-sm font-bold text-gray-900">Blue Shield CI Engine</span>
        <span className="text-sm font-semibold text-gray-900">Companies</span>
        <span className="text-xs text-gray-400">{COMPANIES.length} competitors tracked</span>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Competitive Intelligence</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Companies</h1>
            <p className="text-[14px] text-gray-500">Click a competitor to view their profile, financials, and AI battle brief.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {COMPANIES.map(co => {
              const color = COMPANY_COLORS[co.name] ?? "#6b7280";
              return (
                <Link key={co.slug} href={`/companies/${co.slug}`}>
                  <div className="bg-white border border-[#e0e0e0] rounded-2xl p-5 h-full flex flex-col gap-4 hover:shadow-sm hover:border-[#c0c0c0] transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: color }} />
                        <div>
                          <p className="text-[15px] font-bold text-gray-900 leading-tight">{co.name}</p>
                          <p className="text-[12px] text-gray-400">{co.ticker}{co.formerly ? ` · formerly ${co.formerly}` : ""}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] text-gray-600 leading-relaxed flex-1">{co.description}</p>

                    <div className="flex items-center gap-5 pt-1 border-t border-[#f0f0f0]">
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <DollarSign size={11} className="text-gray-400" />{co.revenue}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <Users size={11} className="text-gray-400" />{co.members}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <TrendingUp size={11} className="text-gray-400" />MLR {co.mlr}
                      </div>
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
