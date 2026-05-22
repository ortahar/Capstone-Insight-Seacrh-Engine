"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import {
  Sparkles, Download, Copy, Check, FileText, TrendingUp,
  AlertTriangle, Calendar, Bell, BellOff, Plus, X, Table2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface BriefSection {
  title: string; content: string; icon: "trending" | "alert" | "sparkles" | "file";
}
interface Alert {
  id: string; keyword: string; company: string; enabled: boolean; matchCount: number;
}
interface CompanyMetrics {
  name: string; ticker: string; revenue: string; members: string;
  mlr: string; maShare: string; growth: string; employees: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const COMPANIES = [
  "Aetna (CVS Health)", "Centene", "Cigna Group",
  "Elevance Health", "Humana", "Molina Healthcare", "Oscar Health", "UnitedHealth Group",
];

const FOCUS_AREAS = [
  "Financial Performance", "Market Strategy", "Medicare & Medicaid",
  "Member Growth", "Regulatory & Policy", "Technology & AI",
];

const COMPANY_METRICS: CompanyMetrics[] = [
  { name: "Elevance Health",    ticker: "ELV",  revenue: "$171B", members: "45M+",  mlr: "87.3%", maShare: "12%",  growth: "+2.1%", employees: "~100K" },
  { name: "UnitedHealth Group", ticker: "UNH",  revenue: "$371B", members: "50M+",  mlr: "85.1%", maShare: "29%",  growth: "+4.3%", employees: "440K+" },
  { name: "Aetna (CVS Health)", ticker: "CVS",  revenue: "$372B", members: "25M+",  mlr: "89.5%", maShare: "11%",  growth: "-1.2%", employees: "300K+" },
  { name: "Cigna Group",        ticker: "CI",   revenue: "$247B", members: "18M+",  mlr: "82.4%", maShare: "0%",   growth: "+1.8%", employees: "70K+"  },
  { name: "Humana",             ticker: "HUM",  revenue: "$117B", members: "17M+",  mlr: "91.2%", maShare: "18%",  growth: "-3.1%", employees: "60K+"  },
  { name: "Centene",            ticker: "CNC",  revenue: "$153B", members: "28M+",  mlr: "88.7%", maShare: "4%",   growth: "+0.9%", employees: "74K+"  },
  { name: "Molina Healthcare",  ticker: "MOH",  revenue: "$40B",  members: "5.5M+", mlr: "88.4%", maShare: "2%",   growth: "+5.2%", employees: "15K+"  },
  { name: "Oscar Health",       ticker: "OSCR", revenue: "$9B",   members: "1.7M+", mlr: "85.2%", maShare: "1%",   growth: "+18%",  employees: "3.5K+" },
];

const COMPANY_COLORS: Record<string, string> = {
  "Elevance Health":    "#1e40af",
  "UnitedHealth Group": "#15803d",
  "Aetna (CVS Health)": "#b91c1c",
  "Cigna Group":        "#7e22ce",
  "Humana":             "#c2410c",
  "Centene":            "#0369a1",
  "Molina Healthcare":  "#0ea5e9",
  "Oscar Health":       "#be185d",
};

const DEFAULT_ALERTS: Alert[] = [
  { id: "1", keyword: "California",       company: "All",              enabled: true,  matchCount: 7  },
  { id: "2", keyword: "premium cuts",     company: "Elevance Health",  enabled: true,  matchCount: 2  },
  { id: "3", keyword: "Medicaid",         company: "Centene",          enabled: true,  matchCount: 12 },
  { id: "4", keyword: "Medicare Advantage", company: "Humana",         enabled: false, matchCount: 5  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseBrief(text: string): BriefSection[] {
  const sections: BriefSection[] = [];
  let current: BriefSection | null = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("##") || (line.startsWith("**") && line.endsWith("**"))) {
      if (current) sections.push(current);
      const title = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      const icon: BriefSection["icon"] =
        /threat|risk/i.test(title) ? "alert" :
        /financial|earning/i.test(title) ? "trending" :
        /strateg|move|recommend/i.test(title) ? "sparkles" : "file";
      current = { title, content: "", icon };
    } else if (current && line.trim()) {
      current.content += (current.content ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  return sections.filter(s => s.content.trim());
}

const ICON_MAP = { trending: <TrendingUp size={14} />, alert: <AlertTriangle size={14} />, sparkles: <Sparkles size={14} />, file: <FileText size={14} /> };
const COLOR_MAP = { trending: "text-green-600 bg-green-50 border-green-100", alert: "text-red-600 bg-red-50 border-red-100", sparkles: "text-blue-600 bg-blue-50 border-blue-100", file: "text-gray-600 bg-gray-50 border-gray-100" };

// ── Sub-components ─────────────────────────────────────────────────────────────
const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function BriefTab() {
  const [selectedCompanies, setSelectedCompanies] = useState(COMPANIES.slice(0, 3));
  const [selectedFocus, setSelectedFocus]         = useState(["Financial Performance", "Market Strategy"]);
  const [startYear, setStartYear]   = useState("2022");
  const [startMonth, setStartMonth] = useState("Jan");
  const [endYear, setEndYear]       = useState("2025");
  const [endMonth, setEndMonth]     = useState("Dec");
  const [loading, setLoading]     = useState(false);
  const [brief, setBrief]         = useState("");
  const [sections, setSections]   = useState<BriefSection[]>([]);
  const [copied, setCopied]       = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError]         = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [showSources, setShowSources] = useState(false);

  const toggleCompany = (c: string) => setSelectedCompanies(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleFocus   = (f: string) => setSelectedFocus(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const generate = async () => {
    if (!selectedCompanies.length) { setError("Select at least one competitor."); return; }
    setLoading(true); setError(""); setBrief(""); setSections([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Generate a professional executive briefing for Blue Shield of California's competitive intelligence team.
Competitors: ${selectedCompanies.join(", ")}
Focus: ${selectedFocus.join(", ")}
Date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Use these sections:
## Executive Summary
## Key Developments by Competitor
## Threats to Blue Shield of CA
## Strategic Recommendations
## Market Outlook

Be specific, data-driven, and actionable for senior executives.`,
          filters: {}, history: [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBrief(data.answer);
      setSections(parseBrief(data.answer));
      setGeneratedAt(new Date().toLocaleString());
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const copyBrief = () => { navigator.clipboard.writeText(brief).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch("/api/briefing/pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, companies: selectedCompanies, focus: selectedFocus, generated_at: generatedAt }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `BSC-Brief-${new Date().toISOString().slice(0, 10)}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { window.print(); }
    finally { setPdfLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 space-y-5">
        <p className="text-[14px] font-semibold text-gray-900">Configure your brief</p>

        {/* Competitors */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Competitors</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {COMPANIES.map(c => {
              const label = c === "UnitedHealth Group" ? "UnitedHealth"
                : c === "Aetna (CVS Health)" ? "Aetna"
                : c === "Molina Healthcare" ? "Molina"
                : c === "Cigna Group" ? "Cigna"
                : c === "Elevance Health" ? "Elevance"
                : c === "Oscar Health" ? "Oscar"
                : c;
              return (
                <button key={c} onClick={() => toggleCompany(c)}
                  className={`text-[12px] px-2 py-2 rounded-lg border transition-all text-center font-medium truncate ${selectedCompanies.includes(c) ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
                  style={selectedCompanies.includes(c) ? { background: COMPANY_COLORS[c] ?? "#1e40af" } : {}}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus areas */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Focus areas</p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map(f => (
              <button key={f} onClick={() => toggleFocus(f)}
                className={`text-[12px] px-3 py-1.5 rounded-lg border transition-all ${selectedFocus.includes(f) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Date context window */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Date context window</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-gray-500">Start</label>
              <select value={startMonth} onChange={e => setStartMonth(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400">
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={startYear} onChange={e => setStartYear(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400">
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <span className="text-gray-300 text-sm">→</span>
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-gray-500">End</label>
              <select value={endMonth} onChange={e => setEndMonth(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400">
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={endYear} onChange={e => setEndYear(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400">
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Sparkles size={14} />{loading ? "Generating…" : "Generate Executive Brief"}
        </button>
      </div>

      {loading && (
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-12 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-[13px] text-gray-400">Analyzing competitive intelligence…</p>
        </div>
      )}

      {!loading && brief && (
        <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
          {/* Brief header */}
          <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold text-gray-900">BSC Competitive Intelligence Brief</p>
              <div className="flex items-center gap-2 text-[12px] text-gray-400 mt-0.5">
                <Calendar size={11} /> {generatedAt} · {selectedCompanies.length} competitors · {startMonth} {startYear}–{endMonth} {endYear}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyBrief} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                {copied ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
              <button onClick={downloadPdf} disabled={pdfLoading}
                className="flex items-center gap-1.5 text-xs text-white bg-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50">
                <Download size={12} />{pdfLoading ? "Generating PDF…" : "Download PDF"}
              </button>
            </div>
          </div>

          {/* Unified content block */}
          <div className="px-6 py-5 space-y-6">
            {sections.length > 0 ? sections.map((s, i) => (
              <div key={i}>
                <div className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg border mb-2 ${COLOR_MAP[s.icon]}`}>
                  {ICON_MAP[s.icon]} {s.title}
                </div>
                <div className="text-[13px] text-gray-700 leading-relaxed">
                  {s.content.split("\n").map((line, j) =>
                    /^[-*•]\s/.test(line) ? (
                      <div key={j} className="flex gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" /><span>{line.replace(/^[-*•]\s/, "")}</span></div>
                    ) : <p key={j} className="mb-1.5">{line}</p>
                  )}
                </div>
                {i < sections.length - 1 && <hr className="mt-4 border-[#f0f0f0]" />}
              </div>
            )) : (
              <pre className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{brief}</pre>
            )}
          </div>

          {/* Reveal Sources */}
          <div className="px-6 py-4 border-t border-[#f0f0f0] bg-[#fafafa]">
            <button onClick={() => setShowSources(s => !s)}
              className="flex items-center gap-2 text-[12px] font-bold text-gray-700 hover:text-gray-900 transition-colors">
              <FileText size={13} />
              {showSources ? "Hide Sources" : "Reveal Sources"}
            </button>
            {showSources && (
              <div className="mt-3 text-[12px] text-gray-400 italic">
                Source transparency coming soon — citations will list indexed filings and news articles used to generate this brief.
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !brief && (
        <div className="bg-white border border-dashed border-[#e0e0e0] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-blue-400" />
          </div>
          <p className="text-[15px] font-semibold text-gray-700 mb-1">Ready to generate</p>
          <p className="text-[13px] text-gray-400">Select competitors and focus areas, then click Generate.</p>
        </div>
      )}
    </div>
  );
}

function ComparisonTab() {
  const [selected, setSelected] = useState(COMPANIES.slice(0, 3));
  const filtered = COMPANY_METRICS.filter(c => selected.includes(c.name));

  const toggle = (name: string) => {
    if (selected.includes(name)) { if (selected.length > 1) setSelected(prev => prev.filter(x => x !== name)); }
    else if (selected.length < 5) setSelected(prev => [...prev, name]);
  };

  const mlrColor = (mlr: string) => {
    const n = parseFloat(mlr);
    return n < 85 ? "text-green-600" : n < 88 ? "text-amber-600" : "text-red-600";
  };

  const growthColor = (g: string) => g.startsWith("+") ? "text-green-600" : "text-red-600";

  const METRICS = [
    { key: "revenue",   label: "Revenue (2024)" },
    { key: "members",   label: "Total Members" },
    { key: "mlr",       label: "Medical Loss Ratio" },
    { key: "maShare",   label: "MA Market Share" },
    { key: "growth",    label: "Member Growth YoY" },
    { key: "employees", label: "Employees" },
  ];

  return (
    <div className="space-y-6">
      {/* Company selector */}
      <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
        <p className="text-[13px] font-semibold text-gray-900 mb-3">Select competitors to compare (max 5)</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {COMPANIES.map(c => {
            const label = c === "UnitedHealth Group" ? "UnitedHealth"
              : c === "Aetna (CVS Health)" ? "Aetna"
              : c === "Molina Healthcare" ? "Molina"
              : c === "Cigna Group" ? "Cigna"
              : c === "Elevance Health" ? "Elevance"
              : c === "Oscar Health" ? "Oscar"
              : c;
            return (
              <button key={c} onClick={() => toggle(c)}
                className={`text-[12px] px-2 py-2 rounded-lg border transition-all text-center font-medium truncate ${selected.includes(c) ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                style={selected.includes(c) ? { background: COMPANY_COLORS[c] ?? "#1e40af" } : {}}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e8e8]">
          <p className="text-[14px] font-semibold text-gray-900">Competitor Comparison — 2024 Metrics</p>
          <p className="text-[12px] text-gray-400">Side-by-side financial and operational benchmarking</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-gray-500 w-44">Metric</th>
                {filtered.map(co => (
                  <th key={co.name} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: COMPANY_COLORS[co.name] ?? "#888" }} />
                      <span className="text-[12px] font-semibold text-gray-800">{co.name.split(" ")[0]}</span>
                      <span className="text-[10px] text-gray-400">{co.ticker}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => (
                <tr key={m.key} className={`border-b border-[#f8f8f8] ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-gray-600">{m.label}</td>
                  {filtered.map(co => {
                    const val = co[m.key as keyof CompanyMetrics];
                    const cls = m.key === "mlr" ? mlrColor(val) : m.key === "growth" ? growthColor(val) : "text-gray-800";
                    return (
                      <td key={co.name} className={`px-4 py-3.5 text-center text-[13px] font-semibold ${cls}`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-[#fafafa] border-t border-[#f0f0f0]">
          <p className="text-[11px] text-gray-400">MLR color: <span className="text-green-600 font-medium">green &lt;85%</span> · <span className="text-amber-600 font-medium">amber 85-88%</span> · <span className="text-red-600 font-medium">red &gt;88%</span> · Data: 2024 annual reports</p>
        </div>
      </div>
    </div>
  );
}

function AlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>(DEFAULT_ALERTS);
  const [newKeyword, setNewKeyword]   = useState("");
  const [newCompany, setNewCompany]   = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [emailInput, setEmailInput]   = useState("");
  const [subscribed, setSubscribed]   = useState(false);

  const handleSubscribe = () => {
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setEmailInput("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  const totalActive = alerts.filter(a => a.enabled).length;
  const totalMatches = alerts.filter(a => a.enabled).reduce((s, a) => s + a.matchCount, 0);

  const toggle = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const remove = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  const addAlert = () => {
    if (!newKeyword.trim()) return;
    setAlerts(prev => [...prev, {
      id: Date.now().toString(), keyword: newKeyword.trim(),
      company: newCompany, enabled: true, matchCount: 0,
    }]);
    setNewKeyword(""); setNewCompany("All"); setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Active alerts</p>
          <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Total matches</p>
          <p className="text-2xl font-bold text-blue-600">{totalMatches}</p>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Last checked</p>
          <p className="text-2xl font-bold text-gray-900">Now</p>
        </div>
      </div>

      {/* Email subscription bar */}
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSubscribe(); }}
          placeholder="type email here to receive email updates on alerts"
          className="flex-1 bg-white border border-[#e8e8e8] rounded-xl px-4 py-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
        />
        <button
          onClick={handleSubscribe}
          className="flex items-center gap-1.5 px-5 py-3 bg-[#1e40af] text-white rounded-xl text-[13px] font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          {subscribed ? <><Check size={13} /> Subscribed!</> : "Subscribe"}
        </button>
      </div>

      {/* Alert list */}
      <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e8e8] flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-gray-900">Keyword Alerts</p>
            <p className="text-[12px] text-gray-400">Get notified when competitors mention these keywords</p>
          </div>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-xs text-white bg-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors">
            <Plus size={12} /> Add Alert
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
              placeholder="Keyword e.g. California, premium cuts"
              className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400 bg-white"
              onKeyDown={e => { if (e.key === "Enter") addAlert(); }}
            />
            <select value={newCompany} onChange={e => setNewCompany(e.target.value)}
              className="border border-blue-200 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-blue-400">
              <option>All</option>
              {COMPANIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={addAlert} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700">Add</button>
            <button onClick={() => setShowAddForm(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
        )}

        <div className="divide-y divide-[#f8f8f8]">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-4 px-5 py-4">
              {/* Toggle */}
              <button onClick={() => toggle(alert.id)}
                className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${alert.enabled ? "bg-blue-600" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${alert.enabled ? "left-5" : "left-1"}`} />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-gray-900">"{alert.keyword}"</p>
                  {alert.matchCount > 0 && alert.enabled && (
                    <span className="text-[11px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      {alert.matchCount} matches
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gray-400">
                  {alert.company === "All" ? "All competitors" : alert.company} · {alert.enabled ? "Active" : "Paused"}
                </p>
              </div>

              {/* Color dot */}
              {alert.company !== "All" && (
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COMPANY_COLORS[alert.company] ?? "#888" }} />
              )}

              {/* Bell icon */}
              {alert.enabled
                ? <Bell size={14} className="text-blue-500 shrink-0" />
                : <BellOff size={14} className="text-gray-300 shrink-0" />}

              {/* Delete */}
              <button onClick={() => remove(alert.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[12px] text-amber-700">
        💡 <strong>Tip:</strong> Alerts scan your indexed news articles and SEC filings every 6 hours. Add keywords like competitor names + "California", "premium", "Medi-Cal" to track what matters most to Blue Shield.
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "brief",      label: "Executive Brief",  icon: <FileText size={13} /> },
  { id: "comparison", label: "Competitor Profiles", icon: <Table2 size={13} /> },
  { id: "alerts",     label: "Alerts",            icon: <Bell size={13} /> },
];

export default function BriefingPage() {
  const [activeTab, setActiveTab] = useState("brief");

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f7f7f7]">
      <Header title="Intelligence Hub" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

          {/* Tab bar */}
          <div className="flex gap-1 bg-white border border-[#e8e8e8] rounded-xl p-1 w-fit">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${activeTab === tab.id ? "bg-[#1e40af] text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {activeTab === "brief"      && <BriefTab />}
          {activeTab === "comparison" && <ComparisonTab />}
          {activeTab === "alerts"     && <AlertsTab />}

        </div>
      </div>
    </div>
  );
}

