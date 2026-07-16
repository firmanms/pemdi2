"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Sparkles,
  Search,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  HelpCircle,
  Activity,
  FileDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { hitungIndeksKalkulator } from "@/lib/scoring"
import type { Aspek, Indikator, RubrikLevel } from "@/lib/types"

// Local landing page content loaded dynamically

export default function LandingPage() {
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [selectedIndikatorId, setSelectedIndikatorId] = useState<string>("")
  const [rubrikData, setRubrikData] = useState<RubrikLevel[]>([])
  
  // New States for Indikator Section
  const [aspeks, setAspeks] = useState<Aspek[]>([])
  const [selectedAspekId, setSelectedAspekId] = useState<string>("")
  const [rubrikViewMode, setRubrikViewMode] = useState<"fokus" | "matriks">("fokus")
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1)
  
  const [docTab, setDocTab] = useState<string>("Semua")
  const [searchDoc, setSearchDoc] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [spbeTrendData, setSpbeTrendData] = useState<any[]>([])
  const [pemdiTrendData, setPemdiTrendData] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [liveIndeks, setLiveIndeks] = useState<any>(null)

  // Load landing page content from Supabase
  useEffect(() => {
    async function fetchLandingContent() {
      try {
        const { data: spbeData } = await supabase.from('spbe_trend').select('*').order('tahun')
        const { data: pemdiData } = await supabase.from('pemdi_trend').select('*').order('tahun')
        const { data: docData } = await supabase.from('dokumen_pengetahuan').select('*').order('created_at', { ascending: false })
        
        setSpbeTrendData(spbeData || [])
        setPemdiTrendData(pemdiData || [])
        setDocuments(docData || [])

        // Fetch live index for active period
        const { data: activePeriodeList } = await supabase.from('periode_asesmen').select('*').eq('status', 'aktif').limit(1)
        if (activePeriodeList && activePeriodeList.length > 0) {
          const result = await hitungIndeksKalkulator('', activePeriodeList[0].id)
          setLiveIndeks(result)
        }
      } catch (e) {
        console.error("Error loading landing content:", e)
      }
    }
    fetchLandingContent()
  }, [])

  // Load Aspects and Indicators from Supabase
  useEffect(() => {
    async function fetchIndikators() {
      try {
        setLoading(true)
        
        // Fetch Aspek
        const { data: aspData, error: aspErr } = await supabase.from("aspek").select("*").order("urutan")
        if (aspErr) throw aspErr
        setAspeks(aspData || [])
        
        if (aspData && aspData.length > 0) {
          setSelectedAspekId(aspData[0].id)
        }

        // Fetch Indikator
        const { data: indData, error: indErr } = await supabase
          .from("indikator")
          .select("*, aspek(*)")
          .order("urutan")
        
        if (indErr) throw indErr
        setIndikators(indData || [])
      } catch (e) {
        console.error("Error fetching indicators/aspeks:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchIndikators()
  }, [])

  // Auto-select first indicator when aspect changes
  useEffect(() => {
    if (!selectedAspekId || indikators.length === 0) return
    const filteredInds = indikators.filter(i => i.aspek_id === selectedAspekId)
    if (filteredInds.length > 0) {
      setSelectedIndikatorId(filteredInds[0].id)
    } else {
      setSelectedIndikatorId("")
    }
  }, [selectedAspekId, indikators])

  // Load Rubrik for selected indicator
  useEffect(() => {
    async function fetchRubrik() {
      if (!selectedIndikatorId) return
      try {
        const { data, error } = await supabase
          .from("rubrik_level")
          .select("*")
          .eq("indikator_id", selectedIndikatorId)
          .order("level")
        
        if (error) throw error
        setRubrikData(data || [])
      } catch (e) {
        console.error("Error fetching rubrik:", e)
      }
    }
    fetchRubrik()
  }, [selectedIndikatorId])

  const selectedInd = indikators.find(i => i.id === selectedIndikatorId)
  
  const latestSpbe = spbeTrendData.length > 0 ? spbeTrendData[spbeTrendData.length - 1] : null;
  const latestPemdi = pemdiTrendData.length > 0 ? pemdiTrendData[pemdiTrendData.length - 1] : null;
  
  const getCategoryColor = (kategori: string) => {
    const k = kategori?.toLowerCase() || '';
    if (k.includes('sangat baik') || k.includes('memuaskan')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (k.includes('baik')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (k.includes('cukup')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (k.includes('kurang') && !k.includes('sangat')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (k.includes('sangat kurang') || k.includes('initiate')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };
  const filteredIndikators = indikators.filter(i => i.aspek_id === selectedAspekId)
  const selectedRubrik = rubrikData.find(r => r.level === selectedLevelId)

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesTab = docTab === "Semua" || doc.kategori === docTab
    const matchesSearch = (doc.judul || '').toLowerCase().includes(searchDoc.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Sparkles className="h-5.5 w-5.5 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                  SPBE
                </span>
                <span className="text-xs font-semibold text-slate-400">×</span>
                <span className="font-extrabold text-lg tracking-tight text-slate-800">
                  PEMDI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Sistem Pemantauan Evaluasi Pemerintah Digital</p>
            </div>
          </div>
          
          <Link href="/login">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/10 px-5 text-xs transition-all">
              MASUK
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero / Charts Section */}
      <section className="py-8 px-6 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(() => {
            return (
              <>
                {/* Chart 1: Indeks SPBE */}
                <Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
                          Indeks SPBE
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">Perkembangan nilai indeks SPBE Nasional</CardDescription>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-1">Kematangan</span>
                        {latestSpbe?.kategori ? (
                          <Badge className={cn("border px-3 py-1", getCategoryColor(latestSpbe.kategori))}>
                            {latestSpbe.kategori}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1">Belum Ada Data</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spbeTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="tahun" fontSize={11} stroke="#94a3b8" />
                          <YAxis domain={[2.0, 5.0]} fontSize={11} stroke="#94a3b8" />
                          <Tooltip
                            formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.kategori || 'Baik'})`, 'Nilai']}
                            contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff", padding: "8px 12px" }}
                            labelStyle={{ fontWeight: "bold", color: "#94a3b8", fontSize: 11, marginBottom: 4 }}
                            itemStyle={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="indeks"
                            stroke="#1e40af"
                            strokeWidth={3}
                            dot={{ r: 4, stroke: "#1e40af", strokeWidth: 2, fill: "#ffffff" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 2: Indeks PEMDI */}
                <Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
                          Indeks PEMDI
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">Progres agregat indeks internal daerah</CardDescription>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-1">Kematangan</span>
                        {latestPemdi?.kategori ? (
                          <Badge className={cn("border px-3 py-1", getCategoryColor(latestPemdi.kategori))}>
                            {latestPemdi.kategori}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1">Belum Ada Data</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pemdiTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="tahun" fontSize={11} stroke="#94a3b8" />
                          <YAxis domain={[2.0, 5.0]} fontSize={11} stroke="#94a3b8" />
                          <Tooltip
                            formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.kategori || 'Baik'})`, 'Nilai']}
                            contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff", padding: "8px 12px" }}
                            labelStyle={{ fontWeight: "bold", color: "#94a3b8", fontSize: 11, marginBottom: 4 }}
                            itemStyle={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="indeks" fill="url(#indigoGrad)" radius={[4, 4, 0, 0]} barSize={30}>
                            <defs>
                              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                <stop offset="100%" stopColor="#1e40af" stopOpacity={0.8} />
                              </linearGradient>
                            </defs>
                            {pemdiTrendData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === pemdiTrendData.length - 1 ? "url(#indigoGrad)" : "#93c5fd"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>

        {/* Indeks Tahun Berjalan Progress Row */}
        {(() => {
          const displayScore = liveIndeks ? liveIndeks.skor_1_5 : (latestPemdi ? latestPemdi.indeks : 0);
          const displayPredikat = liveIndeks ? liveIndeks.predikat : (latestPemdi ? latestPemdi.kategori : "BELUM ADA DATA");
          const percentage = (displayScore / 5.0) * 100;

          return (
            <div className="bg-white border border-slate-200/60 shadow-sm rounded-[2rem] p-8 lg:p-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Indeks Pemdi Tahun Berjalan
                  </h2>
                  <p className="text-[13px] text-slate-500 italic mt-1.5 md:ml-5">Progres nilai evaluasi kinerja pemerintah digital secara mandiri vs target yang ditetapkan</p>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-full px-5 py-2.5 shadow-sm text-[11px] font-bold text-slate-600 tracking-widest uppercase">
                  {displayPredikat}
                </div>
              </div>

              <div className="flex justify-between items-end mt-10 mb-8 md:ml-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-[64px] font-black text-slate-900 tracking-tighter leading-none">
                    {displayScore.toFixed(2)}
                  </span>
                  <span className="text-sm md:text-base font-bold text-slate-400">Nilai Mandiri Terkini</span>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Skor Target 2026</span>
                  <span className="text-2xl md:text-3xl font-extrabold text-indigo-700 leading-none">1.00</span>
                </div>
              </div>

          <div className="relative mt-12 mb-2 md:ml-5 md:mr-5">
            {/* Value scale markings */}
            <div className="absolute top-[-24px] left-0 right-0 w-full flex text-[10px] font-extrabold text-slate-300">
              <div className="w-[30%] flex justify-end pr-2">1.5</div>
              <div className="w-[20%] flex justify-end pr-2">2.5</div>
              <div className="w-[20%] flex justify-end pr-2">3.5</div>
              <div className="w-[10%] flex justify-end pr-2">4.0</div>
              <div className="w-[20%]"></div>
            </div>

            {/* Marker Icon at current value */}
            <div className="absolute top-[-30px] -translate-x-1/2 flex flex-col items-center z-10" style={{ left: `${percentage}%` }}>
              <div className="h-3.5 w-[3px] bg-slate-500 rounded-full mb-0.5" />
              <div className="h-3.5 w-3.5 rounded-full border-[2.5px] border-slate-500 bg-white" />
            </div>

            {/* The progress bar track */}
            <div className="h-3.5 w-full bg-slate-100 rounded-full relative overflow-hidden flex shadow-inner">
               {/* Gradient Fill representing current value */}
               <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 rounded-l-full" style={{ width: `${percentage}%` }} />
               
               {/* Hatched pattern up to target (target 1.0 = 20%) */}
               <div className="absolute top-0 h-full bg-slate-200/50" 
                    style={{ 
                      left: `${percentage}%`,
                      width: `${Math.max(0, 20 - percentage)}%`, 
                      backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(148, 163, 184, 0.15) 3px, rgba(148, 163, 184, 0.15) 6px)' 
                    }} 
               />

               {/* White Dividers representing segment bounds */}
               <div className="absolute top-0 left-0 w-full h-full flex pointer-events-none">
                 <div className="w-[30%] h-full border-r-[2.5px] border-white" />
                 <div className="w-[20%] h-full border-r-[2.5px] border-white" />
                 <div className="w-[20%] h-full border-r-[2.5px] border-white" />
                 <div className="w-[10%] h-full border-r-[2.5px] border-white" />
                 <div className="w-[20%] h-full" />
               </div>
            </div>

            {/* Category Labels below track */}
            <div className="flex w-full mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="w-[30%] pr-4 border-r border-slate-200/70 pt-1">
                <p>Initiate</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Kurang</p>
              </div>
              <div className="w-[20%] px-4 border-r border-slate-200/70 pt-1">
                <p>Emerging</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Cukup</p>
              </div>
              <div className="w-[20%] px-4 border-r border-slate-200/70 pt-1">
                <p>Developing</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Baik</p>
              </div>
              <div className="w-[10%] px-4 border-r border-slate-200/70 pt-1">
                <p>Embedded</p>
                <p className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">Sgt Baik</p>
              </div>
              <div className="w-[20%] px-4 text-right pt-1">
                <p>Leading</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Memuaskan</p>
              </div>
            </div>
          </div>
        </div>
        );
        })()}

        {/* Section 2: Daftar Indikator PEMDI */}
        <div className="space-y-6 pt-4">
          
          {/* Aspek Tabs Header */}
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x">
            {aspeks.map((aspek, idx) => (
              <button
                key={aspek.id}
                onClick={() => setSelectedAspekId(aspek.id)}
                className={cn(
                  "snap-center flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-[1.25rem] text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm border",
                  selectedAspekId === aspek.id
                    ? "bg-[#1B4B8A] text-white border-[#1B4B8A]"
                    : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-5 w-5 rounded bg-white/20 text-[10px]",
                  selectedAspekId !== aspek.id && "bg-slate-100 text-slate-400"
                )}>
                  {idx + 1}
                </div>
                {aspek.nama}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar list (Indikator List) */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Daftar Indikator</p>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  ) : filteredIndikators.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-6">Belum ada indikator</div>
                  ) : (
                    filteredIndikators.map(ind => (
                      <button
                        key={ind.id}
                        onClick={() => setSelectedIndikatorId(ind.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex gap-4",
                          selectedIndikatorId === ind.id
                            ? "bg-[#f8fbff] border-blue-400 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-7 px-2.5 rounded-lg text-[11px] font-bold shrink-0",
                          selectedIndikatorId === ind.id ? "bg-[#1B4B8A] text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          {ind.kode}
                        </div>
                        <div className="space-y-2">
                          <span className={cn(
                            "line-clamp-3 text-xs font-bold leading-relaxed",
                            selectedIndikatorId === ind.id ? "text-[#1B4B8A]" : "text-slate-700"
                          )}>
                            {ind.nama}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Bobot: {ind.bobot}%</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Detail view right */}
            <div className="lg:col-span-8 xl:col-span-9">
              {selectedInd ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm h-full">
                  
                  {/* Indikator Header */}
                  <div className="mb-6">
                    <span className="inline-block bg-blue-50 text-[#1B4B8A] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
                      {selectedInd.aspek?.nama || "Aspek"}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-snug mb-4">
                      {selectedInd.nama}
                    </h2>
                    <div 
                      className="text-sm text-slate-600 leading-relaxed max-w-4xl prose prose-sm prose-slate prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedInd.deskripsi || "Belum ada deskripsi untuk indikator ini." }}
                    />
                  </div>

                  {/* Toggle Modes */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-6 mb-6 gap-4">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                      {rubrikViewMode === "fokus" ? "Detail Tingkat Kematangan" : "Perbandingan Level Kematangan"}
                    </p>
                    <div className="flex bg-slate-50 rounded-full p-1 border border-slate-100">
                      <button 
                        onClick={() => setRubrikViewMode("fokus")}
                        className={cn("px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all", rubrikViewMode === "fokus" ? "bg-white shadow text-[#1B4B8A]" : "text-slate-500 hover:text-slate-800")}
                      >
                        Tab Fokus
                      </button>
                      <button 
                        onClick={() => setRubrikViewMode("matriks")}
                        className={cn("px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all", rubrikViewMode === "matriks" ? "bg-white shadow text-[#1B4B8A]" : "text-slate-500 hover:text-slate-800")}
                      >
                        Tabel Matriks
                      </button>
                    </div>
                  </div>

                  {/* Conditional Rendering based on Mode */}
                  {rubrikData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed">
                      Rubrik level untuk indikator ini belum diisi.
                    </div>
                  ) : rubrikViewMode === "fokus" ? (
                    <div className="space-y-6">
                      {/* Level Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {[1, 2, 3, 4, 5].map(lvl => {
                          const hasData = rubrikData.some(r => r.level === lvl)
                          return (
                            <button
                              key={lvl}
                              disabled={!hasData}
                              onClick={() => setSelectedLevelId(lvl)}
                              className={cn(
                                "px-6 py-2.5 rounded-full text-xs font-bold transition-all border",
                                selectedLevelId === lvl
                                  ? "bg-slate-700 text-white border-slate-700 shadow-md"
                                  : hasData ? "bg-white text-slate-600 border-slate-200 hover:border-slate-400" : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                              )}
                            >
                              LEVEL {lvl}
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Level Header */}
                      {selectedRubrik && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                          <div className="h-10 w-10 shrink-0 bg-slate-600 rounded-xl flex items-center justify-center text-white font-bold">
                            L{selectedLevelId}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#1B4B8A]">
                              {selectedRubrik.predikat.split(" ")[0]} ({selectedRubrik.predikat})
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Kriteria Tingkat Kematangan Indikator</p>
                          </div>
                        </div>
                      )}

                      {/* Info Cards (Mocked content parsed from deskripsi) */}
                      {selectedRubrik && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
                            <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-4">
                              <FileText className="h-4 w-4 text-blue-500" /> Kriteria
                            </h4>
                            <div 
                              className="text-sm text-slate-700 leading-relaxed prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                              dangerouslySetInnerHTML={{ __html: selectedRubrik.deskripsi || '-' }}
                            />
                          </div>
                          <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
                            <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-4">
                              <Activity className="h-4 w-4 text-orange-500" /> Kondisi
                            </h4>
                            <div 
                              className="text-sm text-slate-700 leading-relaxed prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                              dangerouslySetInnerHTML={{ __html: selectedRubrik.kondisi || '-' }}
                            />
                          </div>
                          <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
                            <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-4">
                              <BookOpen className="h-4 w-4 text-emerald-500" /> Bukti Dukung
                            </h4>
                            <div 
                              className="text-sm text-slate-700 leading-relaxed prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                              dangerouslySetInnerHTML={{ __html: selectedRubrik.bukti_dukung || '-' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Matrix View */
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 w-24 align-bottom">Elemen</th>
                            {[1, 2, 3, 4, 5].map(lvl => {
                              const r = rubrikData.find(x => x.level === lvl)
                              return (
                                <th key={lvl} className="p-4 border-r border-slate-100 align-top min-w-[200px] text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                                      L{lvl}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{r ? r.predikat : "N/A"}</span>
                                  </div>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 bg-white">Kriteria</td>
                            {[1, 2, 3, 4, 5].map(lvl => {
                              const r = rubrikData.find(x => x.level === lvl)
                              return (
                                <td 
                                  key={lvl} 
                                  className="p-4 border-r border-slate-100 bg-white align-top text-xs text-slate-600 leading-relaxed prose prose-sm prose-slate prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                                  dangerouslySetInnerHTML={{ __html: r ? r.deskripsi : "-" }}
                                />
                              )
                            })}
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 bg-white">Kondisi</td>
                            {[1, 2, 3, 4, 5].map(lvl => {
                              const r = rubrikData.find(x => x.level === lvl)
                              return (
                                <td 
                                  key={lvl} 
                                  className="p-4 border-r border-slate-100 bg-white align-top text-xs text-slate-600 leading-relaxed prose prose-sm prose-slate prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                                  dangerouslySetInnerHTML={{ __html: r?.kondisi || "-" }}
                                />
                              )
                            })}
                          </tr>
                          <tr>
                            <td className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 bg-white">Bukti Dukung</td>
                            {[1, 2, 3, 4, 5].map(lvl => {
                              const r = rubrikData.find(x => x.level === lvl)
                              return (
                                <td 
                                  key={lvl} 
                                  className="p-4 border-r border-slate-100 bg-white align-top text-xs text-slate-600 leading-relaxed prose prose-sm prose-slate prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
                                  dangerouslySetInnerHTML={{ __html: r?.bukti_dukung || "-" }}
                                />
                              )
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex h-full items-center justify-center border border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50/50 text-slate-400 font-semibold">
                  Pilih indikator untuk melihat rincian rubrik
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Manajemen Pengetahuan */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Pengetahuan</h2>
            <p className="text-xs text-slate-500 mt-1">Unduh dokumen kebijakan, panduan, bahan paparan, dan laporan hasil evaluasi</p>
          </div>

          <div className="space-y-4">
            {/* Search & Tabs control */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Cari kebijakan, modul, panduan..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-transparent pl-9 pr-4 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {["Semua", "Kebijakan", "Penerapan", "Evaluasi", "Materi"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDocTab(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                      docTab === tab
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Document List */}
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl bg-white text-slate-400 italic text-xs">
                Tidak ada dokumen yang sesuai dengan pencarian Anda
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map(doc => (
                  <Card key={doc.id} className="border-slate-200/80 hover:border-indigo-200 hover:shadow-md shadow-sm transition-all bg-white overflow-hidden group">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-slate-600 border-none font-semibold text-[9px] py-0">
                            {doc.kategori}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {doc.tipe} • {doc.ukuran}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                          {doc.judul}
                        </h4>
                      </div>
                      <button
                        onClick={() => alert(`Mengunduh dokumen: ${doc.judul}`)}
                        className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Unduh Dokumen"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PEMDI Dashboard. All rights reserved.</p>
          <div className="flex items-center gap-4 font-semibold">
            <a href="#" className="hover:text-indigo-600 transition-colors">Kebijakan Privasi</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-600 transition-colors">Panduan Sistem</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              Hubungi Kami
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
