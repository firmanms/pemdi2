"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Layers3,
  LayoutGrid,
  ListFilter,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { hitungIndeksKalkulator } from "@/lib/scoring"
import { supabase } from "@/lib/supabase/client"
import type { Aspek, Indikator, RubrikLevel } from "@/lib/types"

type TrendItem = {
  id?: string
  tahun: number | string
  indeks: number
  kategori?: string | null
}

type KnowledgeDocument = {
  id: string
  judul: string
  kategori?: string | null
  tipe?: string | null
  ukuran?: string | null
  created_at?: string | null
  file_url?: string | null
  url?: string | null
  link?: string | null
}

type LiveIndex = {
  skor_1_5?: number
  predikat?: string
}

type ViewMode = "fokus" | "matriks"

const DOCUMENT_TABS = ["Semua", "Kebijakan", "Penerapan", "Evaluasi", "Materi"]

const MATURITY_LEVELS = [
  { level: 1, name: "Initiate", label: "Rintisan", range: "1,00–1,49" },
  { level: 2, name: "Emerging", label: "Berkembang", range: "1,50–2,49" },
  { level: 3, name: "Developing", label: "Terdefinisi", range: "2,50–3,49" },
  { level: 4, name: "Embedded", label: "Terkelola", range: "3,50–4,49" },
  { level: 5, name: "Leading", label: "Optimal", range: "4,50–5,00" },
]

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatScore(value: unknown) {
  return safeNumber(value).toFixed(2)
}

function getCategoryClasses(category?: string | null) {
  const value = category?.toLowerCase() ?? ""

  if (value.includes("memuaskan") || value.includes("sangat baik") || value.includes("optimal")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (value.includes("baik") || value.includes("terkelola")) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700"
  }

  if (value.includes("cukup") || value.includes("berkembang") || value.includes("terdefinisi")) {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  if (value.includes("kurang") || value.includes("rintisan") || value.includes("initiate")) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function getDocumentUrl(document: KnowledgeDocument) {
  return document.file_url || document.url || document.link || ""
}

function RichContent({ html, fallback = "Informasi belum tersedia." }: { html?: string | null; fallback?: string }) {
  if (!html) {
    return <p className="text-sm leading-7 text-slate-400">{fallback}</p>
  }

  return (
    <div
      className="text-sm leading-7 text-slate-600 [&_a]:font-semibold [&_a]:text-indigo-600 [&_a]:underline [&_li]:mb-1.5 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:ml-5 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function EmptyChart({ title }: { title: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
      <BarChart3 className="mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-xs text-slate-400">Data akan tampil setelah tersedia pada sistem.</p>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const aspectScrollRef = useRef<HTMLDivElement>(null)

  const scrollAspect = (direction: "left" | "right") => {
    if (aspectScrollRef.current) {
      const scrollAmount = 300
      aspectScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const [aspeks, setAspeks] = useState<Aspek[]>([])
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [rubrikData, setRubrikData] = useState<RubrikLevel[]>([])

  const [selectedAspekId, setSelectedAspekId] = useState("")
  const [selectedIndikatorId, setSelectedIndikatorId] = useState("")
  const [selectedLevelId, setSelectedLevelId] = useState(1)
  const [rubrikViewMode, setRubrikViewMode] = useState<ViewMode>("fokus")

  const [searchIndikator, setSearchIndikator] = useState("")
  const [docTab, setDocTab] = useState("Semua")
  const [searchDoc, setSearchDoc] = useState("")

  const [spbeTrendData, setSpbeTrendData] = useState<TrendItem[]>([])
  const [pemdiTrendData, setPemdiTrendData] = useState<TrendItem[]>([])
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [liveIndeks, setLiveIndeks] = useState<LiveIndex | null>(null)

  const [loadingLanding, setLoadingLanding] = useState(true)
  const [loadingInstrument, setLoadingInstrument] = useState(true)
  const [loadingRubrik, setLoadingRubrik] = useState(false)
  const [dataWarning, setDataWarning] = useState("")

  useEffect(() => {
    let active = true

    async function fetchLandingContent() {
      setLoadingLanding(true)

      try {
        const [spbeResponse, pemdiResponse, documentResponse, periodResponse] = await Promise.all([
          supabase.from("spbe_trend").select("*").order("tahun"),
          supabase.from("pemdi_trend").select("*").order("tahun"),
          supabase.from("dokumen_pengetahuan").select("*").order("created_at", { ascending: false }),
          supabase.from("periode_asesmen").select("*"),
        ])

        if (!active) return

        if (spbeResponse.error || pemdiResponse.error || documentResponse.error || periodResponse.error) {
          setDataWarning("Sebagian data publik belum dapat dimuat. Silakan muat ulang halaman.")
        }

        setSpbeTrendData((spbeResponse.data as TrendItem[]) || [])
        setPemdiTrendData((pemdiResponse.data as TrendItem[]) || [])
        setDocuments((documentResponse.data as KnowledgeDocument[]) || [])

        const periods = periodResponse.data || []
        const activePeriod =
          periods.find((period) => period.status === "draft" || period.status === "dibuka") || periods[0]

        if (activePeriod) {
          try {
            const result = await hitungIndeksKalkulator("", activePeriod.id)
            if (active) setLiveIndeks(result as LiveIndex)
          } catch (error) {
            console.error("Error calculating live PEMDI index:", error)
          }
        }
      } catch (error) {
        console.error("Error loading landing content:", error)
        if (active) setDataWarning("Data ringkasan belum dapat dimuat sepenuhnya.")
      } finally {
        if (active) setLoadingLanding(false)
      }
    }

    fetchLandingContent()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function fetchInstrument() {
      setLoadingInstrument(true)

      try {
        const [aspectResponse, indicatorResponse] = await Promise.all([
          supabase.from("aspek").select("*").order("urutan"),
          supabase.from("indikator").select("*, aspek(*)").order("urutan"),
        ])

        if (!active) return

        if (aspectResponse.error) throw aspectResponse.error
        if (indicatorResponse.error) throw indicatorResponse.error

        const aspectItems = (aspectResponse.data as Aspek[]) || []
        const indicatorItems = (indicatorResponse.data as Indikator[]) || []

        setAspeks(aspectItems)
        setIndikators(indicatorItems)
        setSelectedAspekId((current) => {
          if (current && aspectItems.some((aspect) => aspect.id === current)) return current
          return aspectItems[0]?.id || ""
        })
      } catch (error) {
        console.error("Error loading PEMDI instrument:", error)
        if (active) setDataWarning("Instrumen PEMDI belum dapat dimuat sepenuhnya.")
      } finally {
        if (active) setLoadingInstrument(false)
      }
    }

    fetchInstrument()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedAspekId || indikators.length === 0) {
      setSelectedIndikatorId("")
      return
    }

    const aspectIndicators = indikators.filter((indicator) => indicator.aspek_id === selectedAspekId)

    setSelectedIndikatorId((current) => {
      if (current && aspectIndicators.some((indicator) => indicator.id === current)) return current
      return aspectIndicators[0]?.id || ""
    })
    setSearchIndikator("")
  }, [selectedAspekId, indikators])

  useEffect(() => {
    let active = true

    async function fetchRubric() {
      if (!selectedIndikatorId) {
        setRubrikData([])
        return
      }

      setLoadingRubrik(true)

      try {
        const { data, error } = await supabase
          .from("rubrik_level")
          .select("*")
          .eq("indikator_id", selectedIndikatorId)
          .order("level")

        if (error) throw error
        if (!active) return

        const levels = (data as RubrikLevel[]) || []
        setRubrikData(levels)
        setSelectedLevelId((current) => {
          if (levels.some((item) => item.level === current)) return current
          return levels[0]?.level || 1
        })
      } catch (error) {
        console.error("Error loading rubric:", error)
        if (active) setRubrikData([])
      } finally {
        if (active) setLoadingRubrik(false)
      }
    }

    fetchRubric()

    return () => {
      active = false
    }
  }, [selectedIndikatorId])

  const latestSpbe = spbeTrendData.at(-1) || null
  const latestPemdi = pemdiTrendData.at(-1) || null

  const currentScore = safeNumber(liveIndeks?.skor_1_5 ?? latestPemdi?.indeks)
  const currentPredicate = liveIndeks?.predikat || latestPemdi?.kategori || "Belum dinilai"
  const currentPercentage = Math.min(100, Math.max(0, (currentScore / 5) * 100))

  const selectedAspek = useMemo(
    () => aspeks.find((aspect) => aspect.id === selectedAspekId),
    [aspeks, selectedAspekId]
  )

  const selectedIndikator = useMemo(
    () => indikators.find((indicator) => indicator.id === selectedIndikatorId),
    [indikators, selectedIndikatorId]
  )

  const aspectIndicators = useMemo(
    () => indikators.filter((indicator) => indicator.aspek_id === selectedAspekId),
    [indikators, selectedAspekId]
  )

  const filteredIndicators = useMemo(() => {
    const keyword = searchIndikator.trim().toLowerCase()
    if (!keyword) return aspectIndicators

    return aspectIndicators.filter((indicator) => {
      return (
        indicator.kode?.toLowerCase().includes(keyword) ||
        indicator.nama?.toLowerCase().includes(keyword) ||
        indicator.deskripsi?.toLowerCase().includes(keyword)
      )
    })
  }, [aspectIndicators, searchIndikator])

  const selectedRubrik = useMemo(
    () => rubrikData.find((rubric) => rubric.level === selectedLevelId),
    [rubrikData, selectedLevelId]
  )

  const filteredDocuments = useMemo(() => {
    const keyword = searchDoc.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesCategory = docTab === "Semua" || document.kategori === docTab
      const matchesKeyword = !keyword || document.judul?.toLowerCase().includes(keyword)
      return matchesCategory && matchesKeyword
    })
  }, [docTab, documents, searchDoc])

  const totalAspectWeight = aspeks.reduce((total, aspect) => total + safeNumber(aspect.bobot), 0)

  const navItems = [
    { label: "Ringkasan", href: "#ringkasan" },
    { label: "Tren Kinerja", href: "#tren" },
    { label: "Instrumen", href: "#instrumen" },
    { label: "Dokumen", href: "#dokumen" },
  ]

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7fb] text-slate-950 antialiased selection:bg-indigo-600 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="#ringkasan" className="group flex items-center gap-3" aria-label="PEMDI - Kembali ke halaman utama">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-[-0.04em] text-slate-950">PEMDI</span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                  Publik
                </span>
              </div>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:block">
                Pemantauan Evaluasi Pemerintah Digital
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button className="h-10 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700">
                Masuk Sistem
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Navigasi seluler">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 sm:hidden">
                <Button className="h-11 w-full rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700">
                  Masuk Sistem
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {dataWarning && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-700">
          {dataWarning}
        </div>
      )}

      <section id="ringkasan" className="relative scroll-mt-24 overflow-hidden bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-52 left-1/4 h-[460px] w-[460px] rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Portal Transparansi Kinerja Digital
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Mengukur kematangan pemerintah digital secara
              <span className="block bg-gradient-to-r from-indigo-300 via-white to-cyan-300 bg-clip-text text-transparent">
                terarah dan transparan.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Portal publik untuk memahami kinerja SPBE, memantau asesmen mandiri PEMDI, serta mempelajari aspek, indikator, rubrik kematangan, dan bukti dukung Pemerintah Kabupaten Bandung.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#instrumen">
                <Button className="h-12 w-full rounded-xl bg-white px-6 text-sm font-bold text-slate-950 shadow-xl shadow-black/10 hover:bg-slate-100 sm:w-auto">
                  Jelajahi Instrumen
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-white/15 bg-white/5 px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Mulai Asesmen
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Data terintegrasi
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instrumen transparan
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Berbasis bukti dukung
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Indeks PEMDI Terkini</p>
                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-6xl font-black tracking-[-0.06em] text-white sm:text-7xl">
                      {loadingLanding ? "—" : formatScore(currentScore)}
                    </span>
                    <span className="mb-2 text-sm font-semibold text-slate-400">dari 5,00</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200 ring-1 ring-inset ring-indigo-400/20">
                  <Gauge className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-400">Pencapaian skala kematangan</span>
                  <Badge className={cn("border text-[10px] font-bold", getCategoryClasses(currentPredicate))}>
                    {currentPredicate}
                  </Badge>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300 transition-[width] duration-700"
                    style={{ width: `${currentPercentage}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500">
                  <span>1,00</span>
                  <span>3,00</span>
                  <span>5,00</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                <div>
                  <p className="text-2xl font-black text-white">{aspeks.length || "—"}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Aspek</p>
                </div>
                <div className="border-x border-white/10 px-4">
                  <p className="text-2xl font-black text-white">{indikators.length || "—"}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Indikator</p>
                </div>
                <div className="pl-2">
                  <p className="text-2xl font-black text-white">5</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Level</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Indeks SPBE",
              value: loadingLanding ? "—" : formatScore(latestSpbe?.indeks),
              detail: latestSpbe?.kategori || "Belum tersedia",
              icon: Award,
              iconClass: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "Indeks PEMDI",
              value: loadingLanding ? "—" : formatScore(currentScore),
              detail: currentPredicate,
              icon: TrendingUp,
              iconClass: "bg-cyan-50 text-cyan-600",
            },
            {
              label: "Instrumen Aktif",
              value: loadingInstrument ? "—" : String(indikators.length),
              detail: `${aspeks.length} aspek • ${formatScore(totalAspectWeight)}% bobot`,
              icon: Layers3,
              iconClass: "bg-violet-50 text-violet-600",
            },
            {
              label: "Pusat Pengetahuan",
              value: loadingLanding ? "—" : String(documents.length),
              detail: "Kebijakan, panduan, dan materi",
              icon: BookOpen,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.label} className="rounded-2xl border-slate-200/80 bg-white shadow-lg shadow-slate-900/[0.04]">
                <CardContent className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                    <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{item.value}</p>
                    <p className="mt-1 max-w-[190px] truncate text-xs font-medium text-slate-500">{item.detail}</p>
                  </div>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.iconClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section id="tren" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Kinerja Digital</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Tren yang mudah dipahami,
                <span className="block text-slate-400">bukan sekadar angka.</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-500">
              Perbandingan historis membantu melihat konsistensi peningkatan SPBE nasional dan hasil evaluasi mandiri PEMDI dari tahun ke tahun.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Tren Indeks SPBE</CardTitle>
                  <CardDescription className="mt-1 text-xs">Perkembangan nilai evaluasi SPBE instansi</CardDescription>
                </div>
                {latestSpbe?.kategori && (
                  <Badge className={cn("border text-[10px] font-bold", getCategoryClasses(latestSpbe.kategori))}>
                    {latestSpbe.kategori}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {spbeTrendData.length === 0 ? (
                  <EmptyChart title="Tren SPBE belum tersedia" />
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spbeTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis
                          domain={[0, 5]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: any, _name: any, item: any) => [
                            `${formatScore(value)} • ${item.payload.kategori || "Tanpa predikat"}`,
                            "Nilai SPBE",
                          ]}
                          contentStyle={{
                            background: "#0f172a",
                            border: "none",
                            borderRadius: 14,
                            boxShadow: "0 16px 40px rgba(15,23,42,.2)",
                            color: "#fff",
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}
                          itemStyle={{ color: "#fff", fontWeight: 700 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="indeks"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#ffffff", stroke: "#4f46e5", strokeWidth: 3 }}
                          activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Tren Indeks PEMDI</CardTitle>
                  <CardDescription className="mt-1 text-xs">Perkembangan asesmen mandiri pemerintah daerah</CardDescription>
                </div>
                {latestPemdi?.kategori && (
                  <Badge className={cn("border text-[10px] font-bold", getCategoryClasses(latestPemdi.kategori))}>
                    {latestPemdi.kategori}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {pemdiTrendData.length === 0 ? (
                  <EmptyChart title="Tren PEMDI belum tersedia" />
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pemdiTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis
                          domain={[0, 5]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: any, _name: any, item: any) => [
                            `${formatScore(value)} • ${item.payload.kategori || "Tanpa predikat"}`,
                            "Nilai PEMDI",
                          ]}
                          contentStyle={{
                            background: "#0f172a",
                            border: "none",
                            borderRadius: 14,
                            boxShadow: "0 16px 40px rgba(15,23,42,.2)",
                            color: "#fff",
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}
                          itemStyle={{ color: "#fff", fontWeight: 700 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="indeks"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#ffffff", stroke: "#06b6d4", strokeWidth: 3 }}
                          activeDot={{ r: 6, fill: "#06b6d4", stroke: "#ffffff", strokeWidth: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[.65fr_1.35fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Posisi Saat Ini</p>
                    <p className="text-sm font-bold text-slate-800">Tingkat kematangan PEMDI</p>
                  </div>
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-5xl font-black tracking-[-0.05em] text-slate-950">{formatScore(currentScore)}</span>
                  <span className="mb-1.5 text-sm font-semibold text-slate-400">/ 5,00</span>
                </div>
                <Badge className={cn("mt-4 border text-[10px] font-bold", getCategoryClasses(currentPredicate))}>
                  {currentPredicate}
                </Badge>
              </div>

              <div>
                <div className="relative pt-7">
                  <div
                    className="absolute top-0 -translate-x-1/2 transition-[left] duration-700"
                    style={{ left: `${currentPercentage}%` }}
                  >
                    <div className="rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-bold text-white shadow-lg">
                      {formatScore(currentScore)}
                    </div>
                    <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 bg-slate-950" />
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                    {MATURITY_LEVELS.map((level) => (
                      <div
                        key={level.level}
                        className={cn(
                          "h-full flex-1 border-r border-white last:border-r-0",
                          level.level === 1 && "bg-amber-300",
                          level.level === 2 && "bg-blue-300",
                          level.level === 3 && "bg-cyan-400",
                          level.level === 4 && "bg-indigo-500",
                          level.level === 5 && "bg-emerald-500"
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-5">
                    {MATURITY_LEVELS.map((level) => (
                      <div key={level.level}>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                          L{level.level} • {level.name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-700">{level.label}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{level.range}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="instrumen" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] bg-slate-950">
            <div className="relative px-6 py-8 sm:px-8 lg:px-10">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-[90px]" />
              <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-300">Instrumen PEMDI</p>
                  <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                    Daftar Aspek & Indikator PEMDI
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                    Pilih aspek dan indikator untuk mempelajari tujuan pengukuran, tingkat kematangan, kondisi yang harus dipenuhi, serta bukti dukung yang diperlukan.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: aspeks.length, label: "Aspek" },
                    { value: indikators.length, label: "Indikator" },
                    { value: 5, label: "Level" },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[78px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                      <p className="text-xl font-black text-white">{loadingInstrument ? "—" : item.value}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative border-t border-white/10 bg-white/[0.04] px-4 py-4 sm:px-6 lg:px-8 group/nav">
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={() => scrollAspect("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-white shadow-lg backdrop-blur transition-opacity duration-250 opacity-0 group-hover/nav:opacity-100 hover:bg-slate-800 hover:scale-105 active:scale-95 cursor-pointer hidden md:flex"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Scroll Container */}
              <div
                ref={aspectScrollRef}
                className="flex gap-3 overflow-x-auto pb-3 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {loadingInstrument
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-[76px] min-w-[230px] animate-pulse rounded-2xl bg-white/10" />
                    ))
                  : aspeks.map((aspect, index) => {
                      const isActive = aspect.id === selectedAspekId
                      const indicatorCount = indikators.filter((indicator) => indicator.aspek_id === aspect.id).length

                      return (
                        <button
                          key={aspect.id}
                          type="button"
                          onClick={() => setSelectedAspekId(aspect.id)}
                          aria-pressed={isActive}
                          className={cn(
                            "group min-w-[230px] rounded-2xl border p-4 text-left transition-all cursor-pointer",
                            isActive
                              ? "border-white bg-white text-slate-950 shadow-xl"
                              : "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black",
                                isActive ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-300"
                              )}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-xs font-extrabold leading-5">{aspect.nama}</p>
                              <div className={cn("mt-2 flex items-center gap-2 text-[10px] font-semibold", isActive ? "text-slate-500" : "text-slate-400")}>
                                <span>{indicatorCount} indikator</span>
                                <span>•</span>
                                <span>Bobot {safeNumber(aspect.bobot).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="self-start rounded-3xl border border-slate-200 bg-slate-50/70 p-4 xl:sticky xl:top-24">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Aspek Terpilih</p>
                    <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                      {selectedAspek?.nama || "Pilih aspek"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-lg font-black text-slate-900">{aspectIndicators.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Indikator</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-lg font-black text-slate-900">{safeNumber(selectedAspek?.bobot).toFixed(1)}%</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Bobot Aspek</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchIndikator}
                  onChange={(event) => setSearchIndikator(event.target.value)}
                  placeholder="Cari kode atau indikator..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  aria-label="Cari indikator"
                />
              </div>

              <div className="mt-4 flex items-center justify-between px-1">
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  <ListFilter className="h-3.5 w-3.5" /> Daftar Indikator
                </p>
                <span className="text-[10px] font-bold text-slate-400">{filteredIndicators.length} hasil</span>
              </div>

              <div className="mt-3 max-h-[610px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                {loadingInstrument ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-[88px] animate-pulse rounded-2xl bg-slate-200/60" />
                  ))
                ) : filteredIndicators.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                    <Search className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-xs font-semibold text-slate-500">Indikator tidak ditemukan</p>
                  </div>
                ) : (
                  filteredIndicators.map((indicator) => {
                    const isActive = indicator.id === selectedIndikatorId

                    return (
                      <button
                        key={indicator.id}
                        type="button"
                        onClick={() => setSelectedIndikatorId(indicator.id)}
                        aria-pressed={isActive}
                        className={cn(
                          "group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all",
                          isActive
                            ? "border-indigo-200 bg-white shadow-md shadow-indigo-900/[0.05]"
                            : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white"
                        )}
                      >
                        {isActive && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-indigo-600" />}
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-8 min-w-12 shrink-0 items-center justify-center rounded-xl px-2 text-[10px] font-black",
                              isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {indicator.kode}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn("line-clamp-2 text-xs font-bold leading-5", isActive ? "text-slate-950" : "text-slate-700")}>
                              {indicator.nama}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                                Bobot {safeNumber(indicator.bobot).toFixed(1)}%
                              </span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isActive ? "translate-x-0 text-indigo-600" : "-translate-x-1 text-slate-300 group-hover:translate-x-0"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </aside>

            <div className="min-w-0">
              {!selectedIndikator ? (
                <div className="flex min-h-[620px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                  <Layers3 className="h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-base font-bold text-slate-700">Pilih indikator</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Detail instrumen dan rubrik kematangan akan ditampilkan pada area ini.
                  </p>
                </div>
              ) : (
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-indigo-600 px-3 py-1 text-[10px] font-extrabold text-white hover:bg-indigo-600">
                            {selectedIndikator.kode}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 bg-white text-[10px] font-bold text-slate-500">
                            {selectedAspek?.nama || selectedIndikator.aspek?.nama || "Aspek PEMDI"}
                          </Badge>
                        </div>
                        <h3 className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-3xl">
                          {selectedIndikator.nama}
                        </h3>
                        <div className="mt-4 max-w-3xl">
                          <RichContent html={selectedIndikator.deskripsi} fallback="Deskripsi indikator belum tersedia." />
                        </div>
                      </div>

                      <div className="grid min-w-[230px] grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Bobot</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{safeNumber(selectedIndikator.bobot).toFixed(1)}%</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Rubrik</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{loadingRubrik ? "—" : rubrikData.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Rubrik Kematangan</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {rubrikViewMode === "fokus" ? "Pelajari satu level secara mendalam" : "Bandingkan seluruh level dalam satu matriks"}
                        </p>
                      </div>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setRubrikViewMode("fokus")}
                          className={cn(
                            "rounded-lg px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all",
                            rubrikViewMode === "fokus" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-700"
                          )}
                        >
                          Tampilan Fokus
                        </button>
                        <button
                          type="button"
                          onClick={() => setRubrikViewMode("matriks")}
                          className={cn(
                            "rounded-lg px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all",
                            rubrikViewMode === "matriks" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-700"
                          )}
                        >
                          Matriks Level
                        </button>
                      </div>
                    </div>

                    {loadingRubrik ? (
                      <div className="mt-6 space-y-4">
                        <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
                          <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
                        </div>
                      </div>
                    ) : rubrikData.length === 0 ? (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                        <FileText className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-500">Rubrik indikator belum tersedia</p>
                      </div>
                    ) : rubrikViewMode === "fokus" ? (
                      <div className="mt-6">
                        <div className="grid gap-2 sm:grid-cols-5">
                          {MATURITY_LEVELS.map((level) => {
                            const rubric = rubrikData.find((item) => item.level === level.level)
                            const isActive = selectedLevelId === level.level

                            return (
                              <button
                                key={level.level}
                                type="button"
                                disabled={!rubric}
                                onClick={() => setSelectedLevelId(level.level)}
                                className={cn(
                                  "rounded-2xl border p-3 text-left transition-all",
                                  isActive
                                    ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                                    : rubric
                                      ? "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40"
                                      : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={cn("text-[9px] font-extrabold uppercase tracking-[0.14em]", isActive ? "text-indigo-100" : "text-slate-400")}>
                                    Level {level.level}
                                  </span>
                                  <span
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black",
                                      isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                                    )}
                                  >
                                    L{level.level}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs font-black">{level.name}</p>
                                <p className={cn("mt-1 text-[10px] font-semibold", isActive ? "text-indigo-100" : "text-slate-400")}>
                                  {rubric?.predikat || level.label}
                                </p>
                              </button>
                            )
                          })}
                        </div>

                        {selectedRubrik && (
                          <div className="mt-6 space-y-4">
                            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20">
                                  L{selectedRubrik.level}
                                </div>
                                <div>
                                  <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-indigo-500">
                                    Tingkat Kematangan {selectedRubrik.level}
                                  </p>
                                  <h4 className="mt-1 text-lg font-black text-indigo-950">{selectedRubrik.predikat}</h4>
                                </div>
                              </div>
                              <div className="rounded-xl border border-indigo-100 bg-white px-4 py-2 text-xs font-semibold text-indigo-700">
                                Instrumen Level {selectedRubrik.level} dari 5
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                                <div className="mb-4 flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Elemen Penilaian</p>
                                    <h5 className="text-sm font-bold text-slate-900">Kriteria Utama</h5>
                                  </div>
                                </div>
                                <RichContent html={selectedRubrik.deskripsi} fallback="Kriteria utama belum tersedia." />
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                                <div className="mb-4 flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                    <Activity className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Kondisi Organisasi</p>
                                    <h5 className="text-sm font-bold text-slate-900">Rincian Kondisi</h5>
                                  </div>
                                </div>
                                <RichContent html={selectedRubrik.kondisi} fallback="Rincian kondisi belum tersedia." />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5 sm:p-6">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">Dokumen Pembuktian</p>
                                  <h5 className="text-sm font-bold text-emerald-950">Bukti Dukung yang Diperlukan</h5>
                                </div>
                              </div>
                              <RichContent html={selectedRubrik.bukti_dukung} fallback="Daftar bukti dukung belum tersedia." />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-[1080px] border-collapse text-left">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-950 text-white">
                                <th className="sticky left-0 z-20 w-36 bg-slate-950 px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.14em]">
                                  Elemen
                                </th>
                                {MATURITY_LEVELS.map((level) => {
                                  const rubric = rubrikData.find((item) => item.level === level.level)
                                  return (
                                    <th key={level.level} className="min-w-[185px] border-l border-white/10 px-4 py-4 align-top">
                                      <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-[10px] font-black">
                                          L{level.level}
                                        </span>
                                        <div>
                                          <p className="text-xs font-black">{level.name}</p>
                                          <p className="mt-0.5 text-[9px] font-semibold text-slate-400">{rubric?.predikat || "Belum tersedia"}</p>
                                        </div>
                                      </div>
                                    </th>
                                  )
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { label: "Kriteria", field: "deskripsi" as const },
                                { label: "Kondisi", field: "kondisi" as const },
                                { label: "Bukti Dukung", field: "bukti_dukung" as const },
                              ].map((row, rowIndex) => (
                                <tr key={row.label} className={cn("border-b border-slate-200 last:border-b-0", rowIndex % 2 === 1 && "bg-slate-50/60")}>
                                  <th className={cn("sticky left-0 z-10 px-5 py-5 align-top text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500", rowIndex % 2 === 1 ? "bg-slate-50" : "bg-white")}>
                                    {row.label}
                                  </th>
                                  {MATURITY_LEVELS.map((level) => {
                                    const rubric = rubrikData.find((item) => item.level === level.level)
                                    const html = rubric?.[row.field] as string | undefined

                                    return (
                                      <td key={level.level} className="border-l border-slate-200 px-4 py-5 align-top">
                                        <RichContent html={html} fallback="—" />
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="dokumen" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Manajemen Pengetahuan</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Pusat dokumen dan referensi</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                Temukan kebijakan, pedoman, materi sosialisasi, panduan bukti dukung, dan laporan evaluasi yang mendukung pelaksanaan PEMDI.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchDoc}
                  onChange={(event) => setSearchDoc(event.target.value)}
                  placeholder="Cari judul dokumen, panduan, atau materi..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  aria-label="Cari dokumen"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {DOCUMENT_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDocTab(tab)}
                    className={cn(
                      "whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                      docTab === tab ? "bg-slate-950 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingLanding ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-200/70" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <FileText className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-4 text-sm font-bold text-slate-600">Dokumen tidak ditemukan</p>
              <p className="mt-1 text-xs text-slate-400">Coba gunakan kata kunci atau kategori yang berbeda.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredDocuments.map((document) => {
                const documentUrl = getDocumentUrl(document)

                return (
                  <Card
                    key={document.id}
                    className="group overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-900/[0.06]"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          <FileText className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500">
                          {document.kategori || "Dokumen"}
                        </Badge>
                      </div>

                      <h3 className="mt-5 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-900 transition-colors group-hover:text-indigo-700">
                        {document.judul}
                      </h3>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          {[document.tipe, document.ukuran].filter(Boolean).join(" • ") || "Referensi PEMDI"}
                        </p>
                        {documentUrl ? (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            aria-label={`Buka ${document.judul}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl bg-slate-50 text-slate-300"
                            aria-label="Tautan dokumen belum tersedia"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-indigo-600 px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-200">Area Asesmen</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
              Siap melanjutkan pengisian dan evaluasi PEMDI?
            </h2>
            <p className="mt-3 text-sm leading-7 text-indigo-100">
              Masuk ke dashboard untuk mengelola periode asesmen, melengkapi bukti dukung, dan memantau progres perangkat daerah.
            </p>
          </div>
          <div className="relative mt-7 lg:mt-0">
            <Link href="/login">
              <Button className="h-12 rounded-xl bg-white px-6 text-sm font-bold text-indigo-700 shadow-xl hover:bg-indigo-50">
                Masuk ke Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">PEMDI Kabupaten Bandung</p>
              <p className="mt-0.5 text-xs text-slate-400">Portal Pemantauan Evaluasi Pemerintah Digital</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
            <a href="#instrumen" className="transition-colors hover:text-indigo-600">Instrumen</a>
            <a href="#dokumen" className="transition-colors hover:text-indigo-600">Dokumen</a>
            <a href="#" className="flex items-center gap-1.5 transition-colors hover:text-indigo-600">
              Panduan Sistem <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs font-medium text-slate-400">© {new Date().getFullYear()} Pemerintah Kabupaten Bandung</p>
        </div>
      </footer>
    </main>
  )
}