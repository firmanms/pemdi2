"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { GaugeChart } from "@/components/dashboard/gauge-chart"
import { AspekRadarChart } from "@/components/dashboard/radar-chart"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { IndikatorTable } from "@/components/dashboard/indikator-table"
import { getScoreBadgeClass, formatNumber } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { hitungIndeksKalkulator } from "@/lib/scoring"
import { supabase } from "@/lib/supabase/client"
import type { IndeksResult, DashboardStats } from "@/lib/types"

// Sample historical trend data
const staticTrendData = [
  { periode: 'S1 2024', tahun: 2024, indeks: 45.2 },
  { periode: 'S2 2024', tahun: 2024, indeks: 48.7 },
  { periode: 'S1 2025', tahun: 2025, indeks: 52.3 },
  { periode: 'S2 2025', tahun: 2025, indeks: 54.8 },
]

export default function DashboardPage() {
  const { user, activePeriode, availableOPDs } = useAuth()
  const [indeksResult, setIndeksResult] = useState<IndeksResult | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !activePeriode) return
      
      try {
        setLoading(true)
        // 1. Calculate indeks & aspek scores
        const result = await hitungIndeksKalkulator(user.instansi_id || '', activePeriode.id)
        setIndeksResult(result)

        // 2. Fetch penilaian_opd counts for stats
        const { data: opdPenilaians } = await supabase
          .from('penilaian_opd')
          .select('status')
          .eq('periode_id', activePeriode.id)
        
        const totalSubmissions = opdPenilaians?.filter(p => p.status === 'terkirim').length || 0
        const totalPossibleSubmissions = (availableOPDs.length * 20) || 1
        const progressPercent = (totalSubmissions / totalPossibleSubmissions) * 100

        // 3. Count approved indicators
        const { data: approvedFinals } = await supabase
          .from('penilaian_final')
          .select('id')
          .eq('periode_id', activePeriode.id)
          .eq('status', 'disetujui')

        setStats({
          totalOPD: availableOPDs.length,
          progresIsi: progressPercent,
          indeksAkhir: result.indeks,
          periodeAktif: activePeriode.nama,
          totalIndikator: 20,
          indikatorDisetujui: approvedFinals?.length || 0
        })
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, activePeriode, availableOPDs])

  // Combine static historical trend data with current period's real score
  const trendData = [
    ...staticTrendData,
    {
      periode: activePeriode ? activePeriode.nama : 'S1 2026',
      tahun: activePeriode ? activePeriode.tahun : 2026,
      indeks: indeksResult ? indeksResult.indeks : 0
    }
  ]

  if (loading || !indeksResult || !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat data real-time...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan Indeks Pemerintah Digital — Kota Bandung
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gauge Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Indeks Akhir</CardTitle>
            <CardDescription>Nilai kematangan pemerintah digital</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <GaugeChart value={indeksResult.indeks} />
            <div className="mt-2 text-center space-y-1">
              <Badge className={getScoreBadgeClass(indeksResult.skor_1_5)}>
                Level {indeksResult.level} — {indeksResult.predikat}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Skor: {formatNumber(indeksResult.skor_1_5)} / 5,00
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profil 7 Aspek</CardTitle>
            <CardDescription>Analisis kekuatan dan area perbaikan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <AspekRadarChart data={indeksResult.aspek_scores} />
              <div className="space-y-2">
                {indeksResult.aspek_scores.map((aspek) => (
                  <div
                    key={aspek.aspek_id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{aspek.aspek_nama}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Bobot: {(aspek.bobot * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {formatNumber(aspek.skor_1_5)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] ${getScoreBadgeClass(aspek.skor_1_5)}`}
                      >
                        {aspek.predikat}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend & Detail Section */}
      <Tabs defaultValue="detail" className="space-y-4">
        <TabsList>
          <TabsTrigger value="detail">Detail 20 Indikator</TabsTrigger>
          <TabsTrigger value="trend">Tren Antar Periode</TabsTrigger>
        </TabsList>

        <TabsContent value="detail">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rincian Skor Per Indikator</CardTitle>
              <CardDescription>
                Skor, predikat, dan kontribusi tertimbang dari setiap indikator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndikatorTable scores={indeksResult.indikator_scores} />
              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm font-semibold">Total Indeks Akhir</span>
                <div className="flex items-center gap-3">
                  <Badge className={getScoreBadgeClass(indeksResult.skor_1_5)}>
                    {indeksResult.predikat}
                  </Badge>
                  <span className="text-xl font-bold tabular-nums">
                    {formatNumber(indeksResult.indeks)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tren Indeks Antar Periode</CardTitle>
              <CardDescription>
                Perkembangan nilai indeks dari periode ke periode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={trendData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
