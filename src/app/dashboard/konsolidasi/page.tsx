"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Send,
  Users,
  BarChart3,
  FileCheck2,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  cn,
  getDefaultPredikat,
  getScoreBadgeClass,
  formatNumber,
} from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase/client"
import type { Indikator, PerangkatDaerah } from "@/lib/types"

interface OPDScoreItem {
  id: string
  skor: number
  justifikasi: string
  status: string
  pdName: string
  pdKode: string
}

export default function KonsolidasiPage() {
  const { activePeriode, perangkatDaerahId, user } = useAuth()
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [selectedIndikator, setSelectedIndikator] = useState<string>("")
  const [opdScores, setOpdScores] = useState<OPDScoreItem[]>([])
  
  const [skorFinal, setSkorFinal] = useState<number | null>(null)
  const [justifikasi, setJustifikasi] = useState("")
  const [finalRecordId, setFinalRecordId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch indicators
  useEffect(() => {
    async function loadIndicators() {
      if (!activePeriode) return
      try {
        setLoading(true)
        // Fetch all indicators
        const { data: indData } = await supabase.from('indikator').select('*').order('urutan')
        setIndikators(indData || [])
        
        // Also fetch which indicators this OPD is pengampu of
        const { data: pengampus } = await supabase
          .from('indikator_pengampu')
          .select('indikator_id')
          .eq('periode_id', activePeriode.id)
          .eq('perangkat_daerah_id', perangkatDaerahId)
        
        const pengampuIds = pengampus?.map(p => p.indikator_id) || []
        
        // Select first indicator (prefer one they are pengampu of, otherwise first overall)
        if (indData && indData.length > 0) {
          const defaultSelect = indData.find(i => pengampuIds.includes(i.id)) || indData[0]
          setSelectedIndikator(defaultSelect.id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadIndicators()
  }, [activePeriode, perangkatDaerahId])

  const selectedInd = useMemo(() => {
    return indikators.find((i) => i.id === selectedIndikator)
  }, [indikators, selectedIndikator])

  // 2. Fetch OPD scores and existing final score for the selected indicator
  useEffect(() => {
    async function loadScores() {
      if (!activePeriode || !selectedIndikator) return

      try {
        // Fetch self-assessments from other OPDs
        const { data: penData } = await supabase
          .from('penilaian_opd')
          .select(`
            id,
            skor,
            justifikasi,
            status,
            perangkat_daerah:perangkat_daerah_id (
              nama,
              kode
            )
          `)
          .eq('periode_id', activePeriode.id)
          .eq('indikator_id', selectedIndikator)
        
        const formatted = (penData || []).map((p: any) => ({
          id: p.id,
          skor: p.skor !== null ? Number(p.skor) : 0,
          justifikasi: p.justifikasi || "",
          status: p.status,
          pdName: p.perangkat_daerah?.nama || "Tidak Dikenal",
          pdKode: p.perangkat_daerah?.kode || "OPD"
        }))
        setOpdScores(formatted)

        // Fetch existing consolidated final score
        const { data: finalData } = await supabase
          .from('penilaian_final')
          .select('*')
          .eq('periode_id', activePeriode.id)
          .eq('indikator_id', selectedIndikator)
          .maybeSingle()
        
        if (finalData) {
          setFinalRecordId(finalData.id)
          setSkorFinal(finalData.skor_final !== null ? Number(finalData.skor_final) : null)
          setJustifikasi(finalData.justifikasi_konsolidasi || "")
        } else {
          setFinalRecordId(null)
          setSkorFinal(null)
          setJustifikasi("")
        }
      } catch (e) {
        console.error(e)
      }
    }

    loadScores()
  }, [activePeriode, selectedIndikator])

  const stats = useMemo(() => {
    const scores = opdScores.filter(s => s.skor > 0)
    if (scores.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }
    const sum = scores.reduce((acc, s) => acc + s.skor, 0)
    const min = Math.min(...scores.map(s => s.skor))
    const max = Math.max(...scores.map(s => s.skor))
    return {
      avg: sum / scores.length,
      min,
      max,
      count: scores.length
    }
  }, [opdScores])

  // Save final score
  const handleSetorFinal = async () => {
    if (!activePeriode || !selectedIndikator || skorFinal === null) return
    
    setSubmitting(true)
    try {
      const payload = {
        ...(finalRecordId ? { id: finalRecordId } : {}),
        periode_id: activePeriode.id,
        indikator_id: selectedIndikator,
        skor_final: skorFinal,
        justifikasi_konsolidasi: justifikasi,
        ditetapkan_oleh_pd_id: perangkatDaerahId,
        ditetapkan_oleh_user_id: user?.id || null,
        status: 'disetor',
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase.from('penilaian_final').upsert(payload).select()
      if (error) throw error
      
      if (data && data.length > 0) {
        setFinalRecordId(data[0].id)
      }
      alert('Skor final indikator berhasil disetor ke Admin Pemda!')
    } catch (e: any) {
      console.error(e)
      alert('Gagal menyetor skor final: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat data konsolidasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Konsolidasi Skor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rekap skor self-assessment seluruh OPD dan tetapkan skor final sebagai
          OPD Pengampu
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Indikator List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Daftar Indikator</CardTitle>
            <CardDescription className="text-xs">
              Pilih indikator untuk melihat rekap
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {indikators.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndikator(ind.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                    selectedIndikator === ind.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="font-mono text-xs shrink-0">{ind.kode}</span>
                  <span className="truncate text-xs">{ind.nama}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Rekap & Final Score */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl p-2.5 bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">OPD Mengisi</p>
                  <p className="text-lg font-bold">{stats.count}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl p-2.5 bg-teal-500/10">
                  <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rata-rata</p>
                  <p className="text-lg font-bold">{formatNumber(stats.avg)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl p-2.5 bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rentang</p>
                  <p className="text-lg font-bold">
                    {formatNumber(stats.min)} – {formatNumber(stats.max)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OPD Scores Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Rekap Skor: {selectedInd?.kode} — {selectedInd?.nama}
              </CardTitle>
              <CardDescription>
                Skor self-assessment dari seluruh perangkat daerah
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opdScores.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Belum ada perangkat daerah yang menginput penilaian untuk indikator ini.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Perangkat Daerah</TableHead>
                      <TableHead className="text-center w-[80px]">Skor</TableHead>
                      <TableHead className="text-center w-[100px]">Predikat</TableHead>
                      <TableHead>Justifikasi</TableHead>
                      <TableHead className="text-center w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opdScores.map((score) => {
                      const pred = getDefaultPredikat(score.skor || 0)
                      return (
                        <TableRow key={score.id}>
                          <TableCell className="text-sm font-medium">
                            {score.pdName}
                          </TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">
                            {score.skor > 0 ? formatNumber(score.skor) : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {score.skor > 0 ? (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px]",
                                  getScoreBadgeClass(score.skor)
                                )}
                              >
                                {pred.predikat}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {score.justifikasi || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                score.status === "terkirim"
                                  ? "bg-emerald-500/15 text-emerald-600"
                                  : "bg-gray-500/15 text-gray-600"
                              )}
                            >
                              {score.status === "terkirim" ? "Terkirim" : "Draft"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Average reference bar */}
              {stats.count > 0 && (
                <div className="mt-4 rounded-lg bg-muted/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Rata-rata skor OPD (referensi)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getScoreBadgeClass(stats.avg)}>
                      {getDefaultPredikat(stats.avg).predikat}
                    </Badge>
                    <span className="text-lg font-bold tabular-nums">
                      {formatNumber(stats.avg)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Score Input */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Tetapkan Skor Final</CardTitle>
              </div>
              <CardDescription>
                Sebagai OPD Pengampu, tetapkan skor final berdasarkan hasil
                musyawarah dan analisis rekap di atas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Skor Final (1.00 - 5.00)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      max="5"
                      placeholder="0.00"
                      value={skorFinal ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        setSkorFinal(isNaN(v) ? null : Math.max(1, Math.min(5, v)))
                      }}
                      className="w-28 text-center font-mono text-lg font-bold text-foreground bg-transparent"
                    />
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.01"
                      value={skorFinal ?? 1}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        setSkorFinal(isNaN(v) ? 1 : Math.max(1, Math.min(5, v)))
                      }}
                      className="flex-1 accent-primary h-2 cursor-pointer"
                    />
                    {skorFinal !== null && (
                      <Badge className={getScoreBadgeClass(skorFinal)}>
                        {getDefaultPredikat(skorFinal).predikat}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Justifikasi Konsolidasi</Label>
                  <Textarea
                    placeholder="Jelaskan dasar penetapan skor final..."
                    value={justifikasi}
                    onChange={(e) => setJustifikasi(e.target.value)}
                    rows={3}
                    className="text-foreground bg-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSetorFinal} disabled={submitting || skorFinal === null}>
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? "Menyetor..." : "Setor ke Admin Pemda"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
