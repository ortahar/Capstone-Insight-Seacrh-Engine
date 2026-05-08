"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { COMPANY_COLORS } from "@/lib/types";
import { Plus, X, ChevronRight } from "lucide-react";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

function CoverageMatrix() {
  const [indexed, setIndexed] = useState<Record<string, string[]>>({});
  useEffect(() => {
    fetch("/api/scraper/status").then(r => r.json()).then(d => setIndexed(d.indexed ?? {})).catch(() => {});
  }, []);
  const companies = Object.keys(indexed);
  if (companies.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground">Transcript Coverage Matrix</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium w-44">Company</th>
              {YEARS.map(y => (
                <th key={y} colSpan={4} className="text-center px-2 py-2 text-muted-foreground font-medium border-l border-border/50">{y}</th>
              ))}
            </tr>
            <tr className="border-b border-border bg-secondary/20">
              <th className="px-4 py-1" />
              {YEARS.map(y => QUARTERS.map(q => (
                <th key={`${y}-${q}`} className="text-center px-1 py-1 text-muted-foreground/60 font-normal">{q}</th>
              )))}
            </tr>
          </thead>
          <tbody>
            {companies.map(co => {
              const periods = new Set(indexed[co]);
              const color = COMPANY_COLORS[co] ?? "#888";
              return (
                <tr key={co} className="border-b border-border/50 hover:bg-secondary/10">
                  <td className="px-4 py-2 font-medium text-foreground/80 whitespace-nowrap">{co}</td>
                  {YEARS.map(y => QUARTERS.map(q => {
                    const has = periods.has(`${y} ${q}`);
                    return (
                      <td key={`${y}-${q}`} className="text-center px-1 py-2">
                        {has
                          ? <span className="inline-block w-4 h-4 rounded-sm" style={{ background: `${color}40`, border: `1px solid ${color}60` }} />
                          : <span className="inline-block w-4 h-4 rounded-sm bg-border/30" />}
                      </td>
                    );
                  }))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const DEFAULT_COMPANIES = [
  { name: "Elevance Health", ticker: "ELV", formerly: "Anthem Inc.", description: "One of the largest health insurers in the US. Operates Blue Cross Blue Shield plans in 14 states. Known for Carelon health services division.", segments: ["Commercial", "Medicare", "Medicaid", "Carelon Services"], docs: 24, years: "2020–2025" },
  { name: "UnitedHealth Group", ticker: "UNH", formerly: null, description: "Largest US health insurer by revenue. Operates UnitedHealthcare (insurance) and Optum (health services, PBM, analytics). Strongest Medicare Advantage position.", segments: ["UnitedHealthcare", "OptumHealth", "OptumRx", "OptumInsight"], docs: 24, years: "2020–2025" },
  { name: "Aetna (CVS Health)", ticker: "CVS", formerly: null, description: "Acquired by CVS Health in 2018. Operates as part of CVS integrated health model with pharmacy, MinuteClinic, and insurance. Strong employer and Medicare segments.", segments: ["Health Benefits", "Pharmacy & Consumer Wellness", "Health Services"], docs: 24, years: "2020–2024" },
  { name: "Cigna Group", ticker: "CI", formerly: null, description: "Global health services company with strong employer-sponsored insurance and pharmacy benefits (Evernorth). Significant international presence and behavioral health focus.", segments: ["Evernorth Health Services", "Cigna Healthcare", "International"], docs: 0, years: "via SEC EDGAR" },
  { name: "Humana", ticker: "HUM", formerly: null, description: "Leader in Medicare Advantage with ~20% market share. Also operates Centerwell primary care clinics and home health services. Strong military/TRICARE contract.", segments: ["Insurance", "CenterWell", "Medicare Advantage", "Medicaid"], docs: 0, years: "via SEC EDGAR" },
  { name: "Centene", ticker: "CNC", formerly: null, description: "Largest Medicaid managed care organization in the US. Operates WellCare for Medicare and has significant ACA marketplace presence through Ambetter brand.", segments: ["Medicaid", "Medicare", "Commercial", "International"], docs: 0, years: "via SEC EDGAR" },
  { name: "Molina Healthcare", ticker: "MOH", formerly: null, description: "Focused exclusively on government-sponsored health care programs. Operates Medicaid, Medicare, and Marketplace plans in 19 states.", segments: ["Medicaid", "Medicare", "Marketplace"], docs: 0, years: "via SEC EDGAR" },
  { name: "Oscar Health", ticker: "OSCR", formerly: null, description: "Technology-first health insurer focused on ACA Marketplace and Medicare Advantage. Known for concierge care teams, digital-first member experience, and +Oscar platform.", segments: ["Individual & Family", "Small Group", "Medicare Advantage", "+Oscar Platform"], docs: 0, years: "via SEC EDGAR" },
];

interface Company { name: string; ticker: string; formerly: string | null; description: string; segments: string[]; docs: number; years: string; }

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [segments, setSegments] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !ticker.trim()) { setError("Name and ticker are required."); return; }
    if (companies.find(c => c.name.toLowerCase() === name.toLowerCase())) { setError("Competitor already exists."); return; }
    setCompanies(prev => [...prev, { name: name.trim(), ticker: ticker.trim().toUpperCase(), formerly: null, description: description.trim() || "No description provided.", segments: segments.split(",").map(s => s.trim()).filter(Boolean), docs: 0, years: "via SEC EDGAR" }]);
    setShowModal(false); setName(""); setTicker(""); setDescription(""); setSegments(""); setError("");
  };

  const handleRemove = (coName: string) => {
    if (DEFAULT_COMPANIES.find(c => c.name === coName)) return;
    setCompanies(prev => prev.filter(c => c.name !== coName));
  };

  const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Companies" subtitle="Competitor profiles · Click a company to explore" />
      <div className="flex-1 p-6 space-y-6">

        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/80 transition-colors">
            <Plus size={15} /> Add Competitor
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {companies.map(co => {
            const isCustom = !DEFAULT_COMPANIES.find(c => c.name === co.name);
            return (
              <div key={co.name} className="relative group">
                {isCustom && (
                  <button onClick={() => handleRemove(co.name)}
                    className="absolute top-2 right-2 z-10 w-5 h-5 bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                    <X size={10} />
                  </button>
                )}
                {/* Clickable card */}
                <div
                  onClick={() => router.push(`/companies/${toSlug(co.name)}`)}
                  className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-150 group/card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COMPANY_COLORS[co.name] ?? "#888" }} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{co.name}</p>
                        <p className="text-[11px] text-muted-foreground">{co.ticker}{co.formerly ? ` · formerly ${co.formerly}` : ""}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground/40 group-hover/card:text-primary group-hover/card:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{co.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {co.segments.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-muted-foreground">{co.docs} transcripts</span>
                    <span className="text-muted-foreground">{co.years}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <CoverageMatrix />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Add New Competitor</h2>
              <button onClick={() => { setShowModal(false); setError(""); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Company Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Kaiser Permanente" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ticker Symbol *</label>
                <input value={ticker} onChange={e => setTicker(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. KP" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" placeholder="Brief description..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Business Segments (comma separated)</label>
                <input value={segments} onChange={e => setSegments(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Medicare, Medicaid, Commercial" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); setError(""); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Competitor</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
