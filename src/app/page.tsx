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
import type { Aspek, Indikator, RubrikLevel } from "@/lib/types"

// Mock SPBE & PEMDI Trend Data
const spbeTrendData = [
  { tahun: 2018, indeks: 2.1 },
  { tahun: 2019, indeks: 2.3 },
  { tahun: 2020, indeks: 2.6 },
  { tahun: 2021, indeks: 2.8 },
  { tahun: 2022, indeks: 3.2 },
  { tahun: 2023, indeks: 3.6 },
]

const pemdiTrendData = [
  { tahun: 2021, indeks: 1.8 },
  { tahun: 2022, indeks: 2.4 },
  { tahun: 2023, indeks: 2.9 },
  { tahun: 2024, indeks: 3.3 },
  { tahun: 2025, indeks: 3.7 },
]

// Mock Knowledge Documents
const mockDocuments = [
  {
    id: 1,
    title: "Peraturan Menteri PANRB No 59 Tahun 2020 tentang Pemantauan dan Evaluasi SPBE",
    category: "Kebijakan",
    type: "PDF",
    size: "2.4 MB",
    downloadUrl: "#"
  },
  {
    id: 2,
    title: "Panduan Pengisian Asesmen Mandiri Indeks Pemerintah Digital Tahun 2026",
    category: "Penerapan",
    type: "PDF",
    size: "1.8 MB",
    downloadUrl: "#"
  },
  {
    id: 3,
    title: "Laporan Hasil Evaluasi SPBE & Pemerintah Digital Nasional 2025",
    category: "Evaluasi",
    type: "PDF",
    size: "4.2 MB",
    downloadUrl: "#"
  },
  {
    id: 4,
    title: "Bahan Sosialisasi Rubrik Penilaian Indikator Pemerintah Digital",
    category: "Materi",
    type: "PPTX",
    size: "8.5 MB",
    downloadUrl: "#"
  },
  {
    id: 5,
    title: "Kebijakan Tata Kelola Keamanan Informasi Pemerintah Daerah",
    category: "Kebijakan",
    type: "PDF",
    size: "1.5 MB",
    downloadUrl: "#"
  },
  {
    id: 6,
    title: "Petunjuk Teknis Integrasi Aplikasi Layanan Publik Berbasis API",
    category: "Penerapan",
    type: "PDF",
    size: "3.1 MB",
    downloadUrl: "#"
  }
]

export default function LandingPage() {
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [selectedIndikatorId, setSelectedIndikatorId] = useState<string>("")
  const [rubrikData, setRubrikData] = useState<RubrikLevel[]>([])
  const [docTab, setDocTab] = useState<string>("Semua")
  const [searchDoc, setSearchDoc] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Load Indicators from Supabase
  useEffect(() => {
    async function fetchIndikators() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("indikator")
          .select("*, aspek(*)")
          .order("urutan")
        
        if (error) throw error
        setIndikators(data || [])
        if (data && data.length > 0) {
          setSelectedIndikatorId(data[0].id)
        }
      } catch (e) {
        console.error("Error fetching indicators:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchIndikators()
  }, [])

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

  // Filtered documents
  const filteredDocs = mockDocuments.filter(doc => {
    const matchesTab = docTab === "Semua" || doc.category === docTab
    const matchesSearch = doc.title.toLowerCase().includes(searchDoc.toLowerCase())
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
          {/* Chart 1: Indeks SPBE */}
          <Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                    Indeks SPBE Nasional
                  </CardTitle>
                  <CardDescription className="text-xs">Periode pemantauan perkembangan 2018 - 2023</CardDescription>
                </div>
                <Badge className="bg-teal-50 text-teal-700 border-none text-[10px]">Nasional</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spbeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tahun" fontSize={11} stroke="#94a3b8" />
                    <YAxis domain={[0, 4]} fontSize={11} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}
                      labelStyle={{ fontWeight: "bold", color: "#1e293b", fontSize: 12 }}
                      itemStyle={{ color: "#0d9488", fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="indeks"
                      stroke="#0d9488"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: "#0d9488", strokeWidth: 2, fill: "#ffffff" }}
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-600" />
                    Indeks Kematangan PEMDI
                  </CardTitle>
                  <CardDescription className="text-xs">Progres agregat indeks internal daerah</CardDescription>
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border-none text-[10px]">Daerah</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pemdiTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tahun" fontSize={11} stroke="#94a3b8" />
                    <YAxis domain={[0, 5]} fontSize={11} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}
                      labelStyle={{ fontWeight: "bold", color: "#1e293b", fontSize: 12 }}
                      itemStyle={{ color: "#6366f1", fontSize: 12 }}
                    />
                    <Bar dataKey="indeks" fill="url(#indigoGrad)" radius={[4, 4, 0, 0]}>
                      <defs>
                        <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      {pemdiTrendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === pemdiTrendData.length - 1 ? "#4f46e5" : "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indeks Tahun Berjalan Progress Row */}
        <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <CardContent className="py-6 px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Indeks PEMDI Tahun Berjalan (2026)</h3>
                  <p className="text-xs text-slate-500">Skor rata-rata berjalan berdasarkan penilaian OPD terkonsolidasi</p>
                </div>
              </div>
              <div className="flex-1 max-w-md w-full">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Realisasi Berjalan: <b className="text-indigo-600">0.30</b></span>
                  <span className="text-slate-400">Target Akhir: <b>1.20</b></span>
                </div>
                <Progress value={25} className="h-2.5 bg-slate-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Daftar Indikator PEMDI */}
        <div className="space-y-4">
          <div className="text-center max-w-2xl mx-auto py-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Daftar Indikator PEMDI</h2>
            <p className="text-xs text-slate-500 mt-1">Rubrik lengkap tingkat kematangan penyelenggaraan pemerintah digital daerah</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar list */}
            <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-200 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                indikators.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndikatorId(ind.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-start gap-2.5 cursor-pointer",
                      selectedIndikatorId === ind.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "bg-white border-slate-200 hover:border-indigo-400 text-slate-700"
                    )}
                  >
                    <Badge className={cn("text-[9px] font-mono border-none py-0.5", selectedIndikatorId === ind.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>
                      {ind.kode}
                    </Badge>
                    <span className="line-clamp-2 leading-relaxed">{ind.nama}</span>
                  </button>
                ))
              )}
            </div>

            {/* Detail view right */}
            <div className="md:col-span-3">
              {selectedInd ? (
                <Card className="border-slate-200/80 shadow-sm bg-white h-full">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-50 text-indigo-700 border-none font-mono font-bold text-[10px]">
                          {selectedInd.kode}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Domain: {selectedInd.aspek?.nama || "Aspek Utama"}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-800 leading-snug">
                        {selectedInd.nama}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="font-semibold text-slate-700 mb-1">Deskripsi Indikator:</p>
                      Indikator ini mengukur keselarasan, kematangan, dan kualitas implementasi arsitektur infrastruktur, tata kelola, dan kebijakan pelaksanaan layanan pemerintah digital di lingkungan perangkat daerah terkait.
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800">Rubrik Tingkat Kematangan (Level 1 - 5)</h4>
                      
                      <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white text-xs">
                        {rubrikData.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 italic">
                            Rubrik level untuk indikator ini belum diisi.
                          </div>
                        ) : (
                          rubrikData.map((level) => (
                            <div key={level.id} className="p-4 flex flex-col sm:flex-row gap-3 hover:bg-slate-50/50 transition-colors">
                              <div className="sm:w-28 flex-shrink-0">
                                <Badge className="bg-teal-50 text-teal-700 border-none font-bold text-[10px] w-20 justify-center">
                                  Level {level.level}
                                </Badge>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">{level.predikat}</p>
                              </div>
                              <div className="flex-1 text-slate-600 leading-relaxed text-xs">
                                {level.deskripsi || <span className="text-slate-300 italic">Tidak ada deskripsi</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex h-full items-center justify-center border border-dashed rounded-2xl p-8 bg-white/50 text-slate-400 italic text-xs">
                  Pilih indikator di panel kiri untuk melihat rincian rubrik
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
                            {doc.category}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {doc.type} • {doc.size}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                          {doc.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => alert(`Mengunduh dokumen: ${doc.title}`)}
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
