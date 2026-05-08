"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { InsightCard } from "@/components/insight-card";
import { Sparkles, Upload, X, FileText, Trash2, Clock, Building2 } from "lucide-react";

const COMPANIES = ["Elevance Health", "UnitedHealth Group", "Aetna (CVS Health)"];
const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const TAG_RE = /\[(\w+)\]\s*/;

function parseBullets(text: string) {
  return text.split("\n")
    .filter(l => l.trim().match(/^[•\-*]/))
    .map(l => {
      const clean = l.replace(/^[•\-*]\s*/, "");
      const m = clean.match(TAG_RE);
      return { tag: m ? m[1] : "Insight", body: clean.replace(TAG_RE, "").trim() };
    });
}

interface DocCard {
  id: string;
  name: string;
  type: "uploaded" | "transcript";
  company?: string;
  year?: number;
  quarter?: string;
  filename?: string;
  uploadedAt: string;
}

export default function InsightsPage() {
  const [docs, setDocs]           = useState<DocCard[]>([]);
  const [selected, setSelected]   = useState<DocCard | null>(null);
  const [insights, setInsights]   = useState<{ tag: string; body: string }[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const transcripts: DocCard[] = [];
    COMPANIES.forEach(co => {
      YEARS.slice(0, 3).forEach(y => {
        QUARTERS.slice(0, 2).forEach(q => {
          transcripts.push({
            id: `${co}-${y}-${q}`,
            name: `${co.split(" ")[0]} ${y} ${q}`,
            type: "transcript",
            company: co, year: y, quarter: q,
            uploadedAt: `${y}`,
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
    } catch (e) {
      setError(String(e));
    } finally { setLoading(false); }
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selected?.id === id) { setSelected(null); setInsights([]); }
  };

  const uploadedDocs   = docs.filter(d => d.type === "uploaded");
  const transcriptDocs = docs.filter(d => d.type === "transcript");

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f8f9fa]">
      <Header title="Insights" subtitle="Upload documents · Generate AI competitive intelligence" />

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — file browser */}
        <div className="w-[300px] shrink-0 border-r border-border bg-white flex flex-col overflow-hidden">

          {/* Upload box */}
          <div className="p-4 border-b border-border">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onFileChange} />
              <Upload size={20} className={uploading ? "text-blue-400 animate-bounce" : "text-gray-400"} />
              <p className="text-[13px] font-medium text-gray-700">{uploading ? "Uploading…" : "Upload document"}</p>
              <p className="text-[11px] text-gray-400 text-center">PDF or TXT · Drag & drop or click</p>
            </div>
            {uploadMsg && (
              <p className={`text-[12px] mt-2 text-center ${uploadMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {uploadMsg}
              </p>
            )}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {uploadedDocs.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">My uploads</p>
                {uploadedDocs.map(doc => (
                  <div key={doc.id} onClick={() => { setSelected(doc); setInsights([]); }}
                    className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected?.id === doc.id ? "bg-blue-50 border-r-2 border-blue-500" : "hover:bg-gray-50"}`}>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1"><Clock size={9} /> {doc.uploadedAt}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeDoc(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">Earnings transcripts</p>
              {transcriptDocs.map(doc => (
                <div key={doc.id} onClick={() => { setSelected(doc); setInsights([]); }}
                  className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected?.id === doc.id ? "bg-blue-50 border-r-2 border-blue-500" : "hover:bg-gray-50"}`}>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{doc.name}</p>
                    <p className="text-[11px] text-gray-400">Earnings Call Transcript</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — insights viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected.type === "uploaded" ? "bg-blue-100" : "bg-purple-100"}`}>
                    {selected.type === "uploaded"
                      ? <FileText size={16} className="text-blue-600" />
                      : <Building2 size={16} className="text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{selected.name}</p>
                    <p className="text-[12px] text-gray-400">
                      {selected.type === "uploaded" ? `Uploaded · ${selected.uploadedAt}` : `${selected.year} ${selected.quarter} · Earnings Call`}
                    </p>
                  </div>
                </div>
                <button onClick={generateInsights} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                  <Sparkles size={14} />
                  {loading ? "Generating…" : "Generate Insights"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>}

                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-[13px] text-gray-400">Extracting insights from {selected.name}…</p>
                  </div>
                )}

                {!loading && insights.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[13px] font-semibold text-gray-700">{insights.length} insights extracted</p>
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{selected.name}</span>
                    </div>
                    {insights.map((item, i) => <InsightCard key={i} tag={item.tag} body={item.body} />)}
                  </div>
                )}

                {!loading && insights.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                      <Sparkles size={28} className="text-blue-400" />
                    </div>
                    <p className="text-[15px] font-medium text-gray-700 mb-1">Ready to generate insights</p>
                    <p className="text-[13px] text-gray-400">Click "Generate Insights" to extract AI-powered<br />competitive intelligence from this document</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <FileText size={32} className="text-gray-300" />
              </div>
              <p className="text-[16px] font-semibold text-gray-700 mb-2">Select a document</p>
              <p className="text-[13px] text-gray-400 max-w-xs leading-relaxed">
                Choose an earnings transcript from the left panel or upload your own PDF/TXT to generate AI insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
