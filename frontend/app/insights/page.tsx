"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { InsightCard } from "@/components/insight-card";
import {
  Sparkles, Upload, FileText, Trash2, Clock,
  Building2, AlertTriangle, Zap, ChevronRight,
  Shield, CheckCircle2,
} from "lucide-react";

const COMPANIES = ["Elevance Health", "UnitedHealth Group", "Aetna (CVS Health)"];
const YEARS     = [2025, 2024, 2023, 2022, 2021, 2020];
const QUARTERS  = ["Q1", "Q2", "Q3", "Q4"];
const TAG_RE    = /\[(\w+)\]\s*/;

type InsightTab = "summary" | "risks" | "signals" | "battle";

const TABS: { id: InsightTab; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary",     icon: <FileText size={13} /> },
  { id: "risks",   label: "Risks",       icon: <AlertTriangle size={13} /> },
  { id: "signals", label: "Signals",     icon: <Zap size={13} /> },
  { id: "battle",  label: "Battle Brief",icon: <Sparkles size={13} /> },
];

function parseBullets(text: string) {
  return text.split("\n")
    .filter(l => l.trim().match(/^[•\-*]/))
    .map(l => {
      const clean = l.replace(/^[•\-*]\s*/, "");
      const m = clean.match(TAG_RE);
      return { tag: m ? m[1] : "Insight", body: clean.replace(TAG_RE, "").trim() };
    });
}

function filterByTab(items: { tag: string; body: string }[], tab: InsightTab) {
  if (tab === "risks")   return items.filter(i => /risk|threat|concern|weak|loss|decline/i.test(i.tag + " " + i.body));
  if (tab === "signals") return items.filter(i => /signal|opportunit|strength|growth|upside|innovat|expand/i.test(i.tag + " " + i.body));
  return items; // summary + battle: show all
}

interface DocCard {
  id: string; name: string; type: "uploaded" | "transcript";
  company?: string; year?: number; quarter?: string;
  filename?: string; uploadedAt: string;
}

// ── 3-step empty-state guide ────────────────────────────────────────────────
function EmptyGuide() {
  const steps = [
    {
      num: "01", color: "blue",
      title: "Select a Transcript",
      desc: "Browse earnings transcripts on the left, or upload your own PDF / TXT document via the upload area.",
      icon: <FileText size={18} />,
    },
    {
      num: "02", color: "purple",
      title: "Generate AI Insights",
      desc: 'Click "Generate Insights" to extract signals, risks, and strategic moves with one click.',
      icon: <Sparkles size={18} />,
    },
    {
      num: "03", color: "green",
      title: "Compare Competitors",
      desc: "Switch between Summary, Risks, Signals, and Battle Brief tabs to build your competitive picture.",
      icon: <Building2 size={18} />,
    },
  ] as const;

  const palette = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   num: "text-blue-300" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", num: "text-purple-300" },
    green:  { bg: "bg-green-50",  text: "text-green-600",  num: "text-green-300" },
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 py-10">
      <div className="w-full max-w-lg space-y-6">

        {/* Hero */}
        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <Sparkles size={22} className="text-white" />
          </div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">AI Insights Workspace</h2>
          <p className="text-[13px] text-gray-400">
            Follow the steps below to generate competitive intelligence
          </p>
        </div>

        {/* Steps */}
        {steps.map(({ num, color, title, desc, icon }) => {
          const p = palette[color];
          return (
            <div key={num}
              className="flex gap-4 p-4 bg-white rounded-2xl border border-[#e4e7ef]
                         hover:border-[#c5cfe0] hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)]
                         transition-all duration-150">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.bg} ${p.text}`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${p.num}`}>{num}</span>
                  <span className="text-[13px] font-semibold text-gray-800">{title}</span>
                </div>
                <p className="text-[12px] text-gray-400 leading-relaxed">{desc}</p>
              </div>
              <ChevronRight size={14} className="text-gray-200 shrink-0 self-center" />
            </div>
          );
        })}

        {/* Tip */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700 leading-relaxed">
            <span className="font-semibold">Tip:</span> Start with a Q1 transcript for the most recent full-quarter view, then layer competitors for a battle brief.
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [docs, setDocs]           = useState<DocCard[]>([]);
  const [selected, setSelected]   = useState<DocCard | null>(null);
  const [insights, setInsights]   = useState<{ tag: string; body: string }[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [activeTab, setActiveTab] = useState<InsightTab>("summary");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const transcripts: DocCard[] = [];
    COMPANIES.forEach(co => {
      YEARS.slice(0, 3).forEach(y => {
        QUARTERS.slice(0, 2).forEach(q => {
          transcripts.push({
            id: `${co}-${y}-${q}`, name: `${co.split(" ")[0]} ${y} ${q}`,
            type: "transcript", company: co, year: y, quarter: q, uploadedAt: `${y}`,
          });
        });
      });
    });
    setDocs(transcripts);
  }, []);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      setUploadMsg("❌ Only PDF or TXT files allowed."); return;
    }
    setUploading(true); setUploadMsg("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newDoc: DocCard = {
        id: data.filename ?? file.name, name: file.name, type: "uploaded",
        filename: data.filename ?? file.name, uploadedAt: new Date().toLocaleDateString(),
      };
      setDocs(prev => [newDoc, ...prev]);
      setSelected(newDoc); setInsights([]);
      setUploadMsg(`✓ "${file.name}" uploaded!`);
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (e) {
      setUploadMsg(`❌ Upload failed: ${String(e)}`);
    } finally { setUploading(false); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const generateInsights = async () => {
    if (!selected) return;
    setLoading(true); setError(""); setInsights([]);
    try {
      const body = selected.type === "uploaded"
        ? { filename: selected.filename }
        : { company: selected.company, year: selected.year, quarter: selected.quarter };
      const res = await fetch("/api/insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInsights(parseBullets(data.insights));
      setActiveTab("summary");
    } catch (e) {
      setError(String(e));
    } finally { setLoading(false); }
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selected?.id === id) { setSelected(null); setInsights([]); }
  };

  const selectDoc = (doc: DocCard) => { setSelected(doc); setInsights([]); setActiveTab("summary"); };

  const uploadedDocs   = docs.filter(d => d.type === "uploaded");
  const transcriptDocs = docs.filter(d => d.type === "transcript");
  const tabItems       = filterByTab(insights, activeTab);

  // Group transcripts by company
  const byCompany = COMPANIES.map(co => ({
    company: co,
    docs: transcriptDocs.filter(d => d.company === co),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#f8f9fa]">
      <Header title="Insights" subtitle="Upload documents · Generate AI competitive intelligence" />

      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: file browser (widened) ───────────────────────────── */}
        <div className="w-[300px] shrink-0 border-r border-[#e8e8e8] bg-white flex flex-col overflow-hidden">

          {/* Upload CTA */}
          <div className="p-4 border-b border-[#e8e8e8]">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-150 group",
                dragOver
                  ? "border-blue-400 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                  : "border-blue-200 hover:border-blue-400 hover:bg-blue-50/60 hover:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]",
              ].join(" ")}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onFileChange} />

              <div className="flex flex-col items-center gap-2 text-center">
                {/* Icon */}
                <div className={[
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  uploading ? "bg-blue-100" : "bg-blue-50 group-hover:bg-blue-100",
                ].join(" ")}>
                  <Upload size={18} className={uploading ? "text-blue-500 animate-bounce" : "text-blue-500"} />
                </div>

                <div>
                  <p className="text-[13px] font-semibold text-blue-700">
                    {uploading ? "Uploading…" : "Upload Document"}
                  </p>
                  <p className="text-[11px] text-blue-400 mt-0.5">PDF or TXT · Drag & drop or click</p>
                </div>

                {/* Button feel */}
                <div className="mt-1 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold shadow-sm group-hover:bg-blue-700 transition-colors">
                  Browse files
                </div>
              </div>
            </div>

            {uploadMsg && (
              <p className={`text-[12px] mt-2 text-center font-medium ${uploadMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {uploadMsg}
              </p>
            )}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">

            {/* My Uploads */}
            {uploadedDocs.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-2 px-4 pt-2 pb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Uploads</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-300 font-medium">{uploadedDocs.length}</span>
                </div>
                {uploadedDocs.map(doc => (
                  <div key={doc.id} onClick={() => selectDoc(doc)}
                    className={[
                      "group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100",
                      selected?.id === doc.id
                        ? "bg-blue-50 border border-blue-200 shadow-[0_1px_3px_rgba(59,130,246,0.12)]"
                        : "hover:bg-gray-50 border border-transparent",
                    ].join(" ")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected?.id === doc.id ? "bg-blue-100" : "bg-gray-100 group-hover:bg-blue-50"}`}>
                      <FileText size={13} className={selected?.id === doc.id ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${selected?.id === doc.id ? "text-blue-800" : "text-gray-700"}`}>{doc.name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1"><Clock size={9} />{doc.uploadedAt}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeDoc(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Earnings Transcripts — grouped by company */}
            {byCompany.map(({ company, docs: coDocs }) => coDocs.length === 0 ? null : (
              <div key={company} className="py-2">
                <div className="flex items-center gap-2 px-4 pt-2 pb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                    {company.split(" ")[0]}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-300 font-medium">{coDocs.length}</span>
                </div>
                {coDocs.map(doc => (
                  <div key={doc.id} onClick={() => selectDoc(doc)}
                    className={[
                      "group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100",
                      selected?.id === doc.id
                        ? "bg-blue-50 border border-blue-200 shadow-[0_1px_3px_rgba(59,130,246,0.12)]"
                        : "hover:bg-gray-50 border border-transparent",
                    ].join(" ")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected?.id === doc.id ? "bg-blue-100" : "bg-purple-50 group-hover:bg-blue-50"}`}>
                      <Building2 size={13} className={selected?.id === doc.id ? "text-blue-600" : "text-purple-400 group-hover:text-blue-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${selected?.id === doc.id ? "text-blue-800" : "text-gray-700"}`}>
                        {doc.year} {doc.quarter}
                      </p>
                      <p className="text-[11px] text-gray-400">Earnings Transcript</p>
                    </div>
                    {selected?.id === doc.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: workspace ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <EmptyGuide />
          ) : (
            <>
              {/* Doc header + Generate button */}
              <div className="bg-white border-b border-[#e8e8e8] px-6 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected.type === "uploaded" ? "bg-blue-100" : "bg-purple-100"}`}>
                    {selected.type === "uploaded"
                      ? <FileText size={15} className="text-blue-600" />
                      : <Building2 size={15} className="text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900 leading-tight">{selected.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {selected.type === "uploaded"
                        ? `Uploaded · ${selected.uploadedAt}`
                        : `${selected.year} ${selected.quarter} · Earnings Call`}
                    </p>
                  </div>
                </div>
                <button onClick={generateInsights} disabled={loading}
                  className="inline-flex items-center gap-2 h-8 px-4 bg-blue-600 text-white rounded-lg text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap">
                  <Sparkles size={13} />
                  {loading ? "Generating…" : "Generate Insights"}
                </button>
              </div>

              {/* Tab bar */}
              <div className="bg-white border-b border-[#e8e8e8] px-6 flex items-center gap-1 shrink-0">
                {TABS.map(tab => {
                  const count = tab.id === "summary"
                    ? insights.length
                    : filterByTab(insights, tab.id).length;
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={[
                        "inline-flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-all duration-100 -mb-px",
                        active
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200",
                      ].join(" ")}>
                      {tab.icon}
                      {tab.label}
                      {insights.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-[13px] text-gray-400">Extracting insights from {selected.name}…</p>
                  </div>
                )}

                {!loading && insights.length > 0 && (
                  <div className="space-y-3 max-w-3xl">
                    {/* Tab-level header */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-semibold text-gray-700">
                        {tabItems.length} {activeTab === "battle" ? "intelligence signals" : activeTab}
                      </p>
                      <span className="text-[11px] text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-full">
                        {selected.name}
                      </span>
                    </div>

                    {tabItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield size={28} className="text-gray-200 mb-3" />
                        <p className="text-[13px] font-medium text-gray-400">No {activeTab} signals found</p>
                        <p className="text-[12px] text-gray-300 mt-1">Try the Summary tab to see all extracted insights</p>
                      </div>
                    ) : (
                      tabItems.map((item, i) => <InsightCard key={i} tag={item.tag} body={item.body} />)
                    )}
                  </div>
                )}

                {!loading && insights.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                      <Sparkles size={24} className="text-blue-400" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-700 mb-1.5">Ready to analyse</p>
                    <p className="text-[13px] text-gray-400 leading-relaxed max-w-xs">
                      Click <strong className="text-gray-600">"Generate Insights"</strong> above to extract AI-powered signals across all four tabs.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
