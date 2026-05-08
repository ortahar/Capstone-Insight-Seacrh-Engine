"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { api } from "@/lib/api";
import { COMPANY_COLORS, TOPIC_LIST, type OverviewResponse, type TopicOverview } from "@/lib/types";
import { RefreshCw, X, TrendingUp, DollarSign, Users, Shield, LayoutDashboard } from "lucide-react";

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function bestCredTier(t: TopicOverview): string {
  for (const tier of ["1", "2", "3", "0B"])
    if (t.companies.some(c => c.credibility_tier === tier)) return tier;
  return "0B";
}

function buildArticlesByCompany(data: OverviewResponse) {
  const counts: Record<string, number> = {};
  for (const topic of data.topics)
    for (const co of topic.companies)
      counts[co.company_name] = (counts[co.company_name] ?? 0) + co.articles.length;
  return Object.entries(counts)
    .map(([company, articles]) => ({ company: company.split(" ")[0], full: company, articles }))
    .sort((a, b) => b.articles - a.articles).slice(0, 8);
}

function buildTopicCoverage(data: OverviewResponse) {
  return data.topics.map(t => ({
    topic: t.topic_name.length > 18 ? t.topic_name.slice(0, 16) + "…" : t.topic_name,
    full: t.topic_name,
    companies: t.companies.filter(c => c.articles.length > 0).length,
    articles: t.companies.reduce((s, c) => s + c.articles.length, 0),
  })).sort((a, b) => b.articles - a.articles);
}

function buildActivityTimeline(data: OverviewResponse) {
  const byMonth: Record<string, number> = {};
  for (const topic of data.topics)
    for (const co of topic.companies)
      for (const a of co.articles) {
        if (!a.date) continue;
        byMonth[a.date.slice(0, 7)] = (byMonth[a.date.slice(0, 7)] ?? 0) + 1;
      }
  return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b))
    .slice(-12).map(([month, articles]) => ({ month, articles }));
}

function buildCredibilityBreakdown(data: OverviewResponse) {
  const tiers: Record<string, number> = { Official: 0, Press: 0, General: 0, Unverified: 0 };
  const map: Record<string, string> = { "1": "Official", "2": "Press", "3": "General", "0B": "Unverified" };
  for (const topic of data.topics)
    for (const co of topic.companies)
      for (const a of co.articles)
        tiers[map[a.credibility_tier] ?? "Unverified"]++;
  return Object.entries(tiers).map(([tier, count]) => ({ tier, count }));
}

function filterByTopics(data: OverviewResponse, keywords: string[]) {
  const total: Record<string, number> = {};
  for (const topic of data.topics)
    for (const co of topic.companies)
      for (const a of co.articles) {
        const t = (a.title ?? "").toLowerCase();
        if (keywords.some(k => t.includes(k.toLowerCase())))
          total[co.company_name] = (total[co.company_name] ?? 0) + 1;
      }
  return Object.entries(total)
    .map(([company, count]) => ({ company: company.split(" ")[0], full: company, count }))
    .sort((a, b) => b.count - a.count).slice(0, 8);
}

function buildTimelineByKeywords(data: OverviewResponse, keywords: string[]) {
  const byMonth: Record<string, number> = {};
  for (const topic of data.topics)
    for (const co of topic.companies)
      for (const a of co.articles) {
        if (!a.date) continue;
        const t = (a.title ?? "").toLowerCase();
        if (keywords.some(k => t.includes(k.toLowerCase())))
          byMonth[a.date.slice(0, 7)] = (byMonth[a.date.slice(0, 7)] ?? 0) + 1;
      }
  return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b))
    .slice(-12).map(([month, count]) => ({ month, count }));
}

const SUB_TABS = [
  { id: "overview",    label: "Overview",        icon: LayoutDashboard, keywords: [],          description: "All competitor activity across topics" },
  { id: "finance",     label: "Finance",          icon: DollarSign,      keywords: ["earnings", "revenue", "profit", "financial", "EPS", "income", "loss", "guidance", "Q1", "Q2", "Q3", "Q4"], description: "Earnings, revenue, and financial performance" },
  { id: "market",      label: "Market Strategy",  icon: TrendingUp,      keywords: ["strategy", "acquisition", "growth", "market", "expansion", "launch", "partnership", "deal", "merger"],      description: "Strategic moves, acquisitions, and market positioning" },
  { id: "members",     label: "Members & Plans",  icon: Users,           keywords: ["membership", "enrollment", "member", "plan", "premium", "coverage", "insured", "beneficiary"],               description: "Membership trends, plan changes, and enrollment data" },
  { id: "regulatory",  label: "Regulatory",       icon: Shield,          keywords: ["regulatory", "policy", "CMS", "Medicaid", "Medicare", "ACA", "law", "compliance", "regulation", "government"], description: "Policy changes, CMS updates, and compliance news" },
];

const YEARS = ["All", "2026", "2025", "2024", "2023", "2022"];
const PIE_COLORS = ["#1e40af", "#15803d", "#b91c1c", "#7e22ce", "#c2410c", "#0369a1", "#047857", "#be185d"];
const CRED_COLORS: Record<string, string> = { Official: "#15803d", Press: "#1e40af", General: "#b45309", Unverified: "#6b7280" };

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
      <p className="text-[15px] font-semibold text-gray-900 mb-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mb-4">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 animate-pulse">
      <div className="h-5 bg-gray-100 rounded w-36 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-4/5 mb-5" />
      <div className="h-3 bg-gray-100 rounded w-28" />
    </div>
  );
}

const CRED_PILL: Record<string, { label: string; cls: string }> = {
  "1":  { label: "Official",   cls: "bg-green-50 text-green-700 border border-green-100" },
  "2":  { label: "Press",      cls: "bg-blue-50 text-blue-600 border border-blue-100" },
  "3":  { label: "General",    cls: "bg-amber-50 text-amber-700 border border-amber-100" },
  "0B": { label: "Unverified", cls: "bg-gray-100 text-gray-500 border border-gray-200" },
};

function TopicCard({ topic, onRefresh, isRefreshing, onDelete, deleting }: {
  topic: TopicOverview; onRefresh: (id: string) => void; isRefreshing: boolean; onDelete: (id: string) => void; deleting: boolean;
}) {
  const tier = bestCredTier(topic);
  const pill = CRED_PILL[tier] ?? CRED_PILL["0B"];
  const totalArticles = topic.companies.reduce((s, c) => s + c.articles.length, 0);
  return (
    <div className="relative group">
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(topic.topic_id); }} disabled={deleting}
        className="absolute -top-2 -left-2 z-10 w-5 h-5 bg-gray-200 hover:bg-red-500 text-gray-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 disabled:opacity-50">
        <X size={10} />
      </button>
      <Link href={`/topics/${topic.topic_id}`} className="block">
        <div className={`bg-white border rounded-2xl p-5 h-full flex flex-col gap-3 hover:shadow-sm transition-all cursor-pointer ${isRefreshing ? "border-blue-200 bg-blue-50/30" : "border-[#e0e0e0] hover:border-[#c0c0c0]"}`}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-[15px] text-gray-900 leading-snug">{topic.topic_name}</h3>
            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 font-medium">{topic.companies.length} co.</span>
          </div>
          <div className="flex-1">
            {totalArticles > 0
              ? <p className="text-[13px] text-gray-600">{totalArticles} articles tracked</p>
              : <p className="text-[13px] text-gray-400 italic">No articles yet — click Refresh</p>}
          </div>
          <div className="flex items-center justify-between pt-1">
            {isRefreshing
              ? <span className="flex items-center gap-1.5 text-[12px] text-blue-500"><RefreshCw size={10} className="animate-spin" /> Generating…</span>
              : <span className="text-[12px] text-gray-400">Updated {timeAgo(topic.last_updated)}</span>}
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${pill.cls}`}>{pill.label}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData]             = useState<OverviewResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topicName, setTopicName]   = useState("");
  const [keywords, setKeywords]     = useState("");
  const [addingTopic, setAddingTopic]           = useState(false);
  const [refreshingTopics, setRefreshingTopics] = useState<Set<string>>(new Set());
  const [deletingTopics, setDeletingTopics]     = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab]               = useState("overview");
  const [selectedYear, setSelectedYear]         = useState("All");

  const fetchData = useCallback(async () => {
    try { setData(await api.overview()); } catch {}
  }, []);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);

  const handleAdd = async () => {
    if (!topicName.trim()) return;
    setAddingTopic(true);
    await api.topics.create(topicName.trim(), keywords.split(",").map(k => k.trim()).filter(Boolean));
    setTopicName(""); setKeywords("");
    await fetchData();
    setAddingTopic(false);
  };

  const pollUntilUpdated = useCallback(async (ids: string[], onDone?: () => void) => {
    const startTimes: Record<string, string | null> = {};
    data?.topics.forEach(t => { if (ids.includes(t.topic_id)) startTimes[t.topic_id] = t.last_updated; });
    let tries = 0;
    const poll = async () => {
      const res = await api.overview().catch(() => null);
      if (res) {
        setData(res);
        if (ids.every(id => { const t = res.topics.find(t => t.topic_id === id); return t && t.last_updated !== startTimes[id]; })) { onDone?.(); return; }
      }
      if (++tries < 36) setTimeout(poll, 5000); else onDone?.();
    };
    setTimeout(poll, 6000);
  }, [data]);

  const handleRefreshAll = async () => {
    if (!data) return;
    setRefreshing(true);
    const ids = data.topics.map(t => t.topic_id);
    setRefreshingTopics(new Set(ids));
    await Promise.all(ids.map(id => api.topics.refresh(id).catch(() => {})));
    pollUntilUpdated(ids, () => { setRefreshing(false); setRefreshingTopics(new Set()); });
  };

  const handleRefreshTopic = async (id: string) => {
    setRefreshingTopics(prev => new Set([...prev, id]));
    await api.topics.refresh(id).catch(() => {});
    pollUntilUpdated([id], () => { setRefreshingTopics(prev => { const s = new Set(prev); s.delete(id); return s; }); });
  };

  const handleDelete = async (id: string) => {
    setDeletingTopics(prev => new Set([...prev, id]));
    try { await api.topics.delete(id); await fetchData(); } catch {}
    setDeletingTopics(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const filteredData = data ? {
    ...data,
    topics: data.topics.map(t => ({
      ...t,
      companies: t.companies.map(co => ({
        ...co,
        articles: co.articles.filter(a => selectedYear === "All" || (a.date ?? "").startsWith(selectedYear)),
      })),
    })),
  } : null;

  const currentTab          = SUB_TABS.find(t => t.id === activeTab) ?? SUB_TABS[0];
  const articlesByCompany   = filteredData ? buildArticlesByCompany(filteredData) : [];
  const topicCoverage       = filteredData ? buildTopicCoverage(filteredData) : [];
  const activityTimeline    = filteredData ? buildActivityTimeline(filteredData) : [];
  const credBreakdown       = filteredData ? buildCredibilityBreakdown(filteredData) : [];
  const filteredByKeywords  = filteredData && currentTab.keywords.length > 0 ? filterByTopics(filteredData, currentTab.keywords) : [];
  const keywordTimeline     = filteredData && currentTab.keywords.length > 0 ? buildTimelineByKeywords(filteredData, currentTab.keywords) : [];
  const totalArticles       = filteredData?.topics.reduce((s, t) => s + t.companies.reduce((ss, c) => ss + c.articles.length, 0), 0) ?? 0;
  const topicCount          = data?.topics.length ?? 0;
  const lastRefreshed       = data?.last_refreshed ? timeAgo(data.last_refreshed) : null;

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f7f7f7]">
      <header className="h-14 flex items-center justify-between px-8 border-b border-[#e8e8e8] bg-white shrink-0">
        <span className="text-sm font-bold text-gray-900">Blue Shield CI Engine</span>
        <span className="text-sm font-semibold text-gray-900">Overview</span>
        <div className="flex items-center gap-3">
          {lastRefreshed && <span className="text-xs text-gray-400">Last refreshed {lastRefreshed}</span>}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Competitive Intelligence</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Overview</h1>
            <p className="text-[14px] text-gray-500">{topicCount || "—"} topics tracked · 10 competitors · auto-refreshed</p>
          </div>

          {/* Sub-tabs + year filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 bg-white border border-[#e8e8e8] rounded-xl p-1">
              {SUB_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${activeTab === tab.id ? "bg-[#1e40af] text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                    <Icon size={13} />{tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 bg-white border border-[#e8e8e8] rounded-xl p-1">
              {YEARS.map(y => (
                <button key={y} onClick={() => setSelectedYear(y)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${selectedYear === y ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[13px] text-gray-500 -mt-2">{currentTab.description}</p>

          {/* Stat cards */}
          {!loading && filteredData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Topics tracked"  value={topicCount}    sub="active topics" />
              <StatCard label="Total articles"  value={totalArticles} sub={selectedYear === "All" ? "all time" : selectedYear} />
              <StatCard label="Competitors"     value={10}            sub="health insurers" />
              <StatCard label="Data sources"    value={3}             sub="news · SEC · transcripts" />
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && !loading && filteredData && totalArticles > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Articles by competitor" sub="Total articles per company">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={articlesByCompany} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="company" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip formatter={(v: number) => [v, "Articles"]} labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                      <Bar dataKey="articles" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Topic coverage" sub="Articles per topic">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topicCoverage} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis dataKey="topic" type="category" tick={{ fontSize: 10, fill: "#9ca3af" }} width={90} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="articles" fill="#1e40af" radius={[0, 4, 4, 0]} name="Articles" />
                      <Bar dataKey="companies" fill="#15803d" radius={[0, 4, 4, 0]} name="Companies" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ChartCard title="Activity over time" sub="Monthly article volume (last 12 months)">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={activityTimeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                        <Line type="monotone" dataKey="articles" stroke="#1e40af" strokeWidth={2} dot={{ r: 3 }} name="Articles" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
                <ChartCard title="Source credibility" sub="By tier">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={credBreakdown} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={70} label={({ tier, percent }) => `${tier} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {credBreakdown.map((entry, i) => <Cell key={i} fill={CRED_COLORS[entry.tier] ?? "#6b7280"} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>
          )}

          {/* FINANCE / MARKET / MEMBERS / REGULATORY TABS */}
          {activeTab !== "overview" && !loading && filteredData && (
            <div className="space-y-6">
              {filteredByKeywords.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title={`${currentTab.label} mentions by competitor`} sub={`Articles matching ${currentTab.label.toLowerCase()} keywords`}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={filteredByKeywords} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="company" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <Tooltip formatter={(v: number) => [v, "Articles"]} labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {filteredByKeywords.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title={`${currentTab.label} activity over time`} sub="Monthly mention volume">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={keywordTimeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                        <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2} dot={{ r: 3 }} name="Articles" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title={`${currentTab.label} share by competitor`} sub="Proportional coverage">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={filteredByKeywords} dataKey="count" nameKey="company" cx="50%" cy="50%" outerRadius={80} label={({ company, percent }) => `${company} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {filteredByKeywords.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e8e8" }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title={`Top ${currentTab.label} articles`} sub="Most recent matches">
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {filteredData.topics
                        .flatMap(t => t.companies.flatMap(co => co.articles
                          .filter(a => currentTab.keywords.some(k => (a.title ?? "").toLowerCase().includes(k.toLowerCase())))
                          .map(a => ({ ...a, company: co.company_name }))))
                        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
                        .slice(0, 8)
                        .map((a, i) => (
                          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1e40af] mt-1.5 shrink-0" />
                            <div>
                              <p className="text-[12px] font-medium text-gray-800 leading-snug">{a.title ?? "Untitled"}</p>
                              <p className="text-[11px] text-gray-400">{a.company} · {a.date}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ChartCard>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-[#e0e0e0] rounded-2xl p-14 text-center">
                  <p className="text-[15px] text-gray-400 font-medium">No {currentTab.label} articles found</p>
                  <p className="text-[13px] text-gray-400 mt-1">Try refreshing topics or selecting a different year.</p>
                </div>
              )}
            </div>
          )}

          {!loading && totalArticles === 0 && (
            <div className="bg-white border border-dashed border-[#e0e0e0] rounded-2xl p-14 text-center">
              <p className="text-[15px] text-gray-400 font-medium">No data yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Click "Refresh all" below to load articles.</p>
            </div>
          )}

          {/* Add topic */}
          <div className="flex gap-3">
            <input className="flex-[0_0_220px] bg-white border border-[#d8d8d8] rounded-xl px-4 py-3 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" placeholder="New topic name (e.g. Mobile)" value={topicName} onChange={e => setTopicName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
            <input className="flex-1 bg-white border border-[#d8d8d8] rounded-xl px-4 py-3 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" placeholder="Keywords (comma separated)" value={keywords} onChange={e => setKeywords(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
            <button onClick={handleAdd} disabled={addingTopic || !topicName.trim()} className="bg-white border border-[#d8d8d8] rounded-xl px-5 py-3 text-[14px] font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-colors whitespace-nowrap">
              {addingTopic ? "Adding…" : "+ Add topic"}
            </button>
          </div>

          {/* Topics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Your topics</p>
              <button onClick={handleRefreshAll} disabled={refreshing || loading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-colors">
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing…" : "Refresh all"}
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : !data || data.topics.length === 0 ? (
              <div className="bg-white border border-dashed border-[#e0e0e0] rounded-2xl p-14 text-center">
                <p className="text-[15px] text-gray-400 font-medium">No topics yet</p>
                <p className="text-[13px] text-gray-400 mt-1">Add a topic above to start tracking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.topics.map(t => (
                  <TopicCard key={t.topic_id} topic={t} onRefresh={handleRefreshTopic} isRefreshing={refreshingTopics.has(t.topic_id)} onDelete={handleDelete} deleting={deletingTopics.has(t.topic_id)} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
