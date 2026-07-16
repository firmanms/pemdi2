"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  RotateCcw,
  Eye,
  FileText,
  Shield,
  Send,
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
  getStatusConfig,
  formatNumber,
} from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase/client"
import type { Indikator, PenilaianFinal } from "@/lib/types"

interface PenilaianFinalJoined extends PenilaianFinal {
  indikator_kode?: string
  indikator_nama?: string
}

export default function ReviewPage() {
  const { activePeriode, user } = useAuth()
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [penilaianFinals, setPenilaianFinals] = useState<PenilaianFinalJoined[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [catatan, setCatatan] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch indicators and existing final scores
  const loadData = async () => {
    if (!activePeriode) return

    try {
      setLoading(true)
      const { data: indData } = await supabase.from('indikator').select('*').order('urutan')
      setIndikators(indData || [])

      const { data: pfData } = await supabase
        .from('penilaian_final')
        .select('*')
        .eq('periode_id', activePeriode.id)

      // Join local indicator codes & names for displaying
      const joined: PenilaianFinalJoined[] = (indData || []).map((ind) => {
        const pf = pfData?.find((p) => p.indikator_id === ind.id)
        return {
          id: pf?.id || `temp-${ind.id}`,
          periode_id: activePeriode.id,
          indikator_id: ind.id,
          skor_final: pf?.skor_final ? Number(pf.skor_final) : null,
          justifikasi_konsolidasi: pf?.justifikasi_konsolidasi || "",
          ditetapkan_oleh_pd_id: pf?.ditetapkan_oleh_pd_id || "",
          ditetapkan_oleh_user_id: pf?.ditetapkan_oleh_user_id || "",
          status: pf?.status || "draft",
          catatan_revisi: pf?.catatan_revisi || "",
          direview_oleh: pf?.direview_oleh || null,
          direview_at: pf?.direview_at || null,
          created_at: pf?.created_at || "",
          indikator_kode: ind.kode,
          indikator_nama: ind.nama
        }
      })

      setPenilaianFinals(joined)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activePeriode])

  const disetujui = penilaianFinals.filter((p) => p.status === "disetujui").length
  const disetor = penilaianFinals.filter((p) => p.status === "disetor").length
  const dikembalikan = penilaianFinals.filter((p) => p.status === "dikembalikan").length
  const draft = penilaianFinals.filter((p) => p.status === "draft").length
  const progressPct = penilaianFinals.length > 0 ? (disetujui / penilaianFinals.length) * 100 : 0

  const selectedPenilaian = selectedId
    ? penilaianFinals.find((p) => p.id === selectedId)
    : null

  // Approve / Return actions
  const handleReviewAction = async (status: 'disetujui' | 'dikembalikan') => {
    if (!selectedPenilaian || !activePeriode) return

    setSubmitting(true)
    try {
      const isInsert = selectedPenilaian.id.startsWith('temp-')
      
      const payload = {
        ...(isInsert ? {} : { id: selectedPenilaian.id }),
        periode_id: activePeriode.id,
        indikator_id: selectedPenilaian.indikator_id,
        skor_final: selectedPenilaian.skor_final,
        justifikasi_konsolidasi: selectedPenilaian.justifikasi_konsolidasi,
        status: status,
        catatan_revisi: status === 'dikembalikan' ? catatan : selectedPenilaian.catatan_revisi,
        direview_oleh: null, // bypassing dummy user FK constraint
        direview_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase.from('penilaian_final').upsert(payload).select()
      if (error) throw error

      alert(status === 'disetujui' ? 'Skor final berhasil disetujui!' : 'Skor final berhasil dikembalikan untuk revisi.')
      setCatatan("")
      loadData()
    } catch (e: any) {
      console.error(e)
      alert('Gagal mereview skor final: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!activePeriode) return
    try {
      const { error } = await supabase
        .from('periode_asesmen')
        .update({ status: 'final' })
        .eq('id', activePeriode.id)
      
      if (error) throw error
      alert('Seluruh evaluasi periode ini telah final dan ditutup!')
      window.location.reload()
    } catch (e: any) {
      console.error(e)
      alert('Gagal melakukan submit final: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat data review...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review & Approval</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tinjau skor final dari OPD Pengampu dan setujui atau kembalikan
          </p>
        </div>
        <Button onClick={handleFinalSubmit} disabled={disetujui < 20}>
          <Send className="h-4 w-4 mr-1" />
          Submit Final Indeks
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progres Review</span>
            <span className="text-sm font-bold">{disetujui}/20 disetujui</span>
          </div>
          <Progress value={progressPct} />
          <div className="mt-3 flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Disetujui: {disetujui}
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Shield className="h-3 w-3 mr-1" />
              Disetor: {disetor}
            </Badge>
            <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <RotateCcw className="h-3 w-3 mr-1" />
              Dikembalikan: {dikembalikan}
            </Badge>
            <Badge variant="secondary" className="bg-gray-500/15 text-gray-600 dark:text-gray-400">
              <FileText className="h-3 w-3 mr-1" />
              Draft: {draft}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Indikator List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daftar Skor Final</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Kode</TableHead>
                  <TableHead>Indikator</TableHead>
                  <TableHead className="text-center w-[80px]">Skor</TableHead>
                  <TableHead className="text-center w-[100px]">Predikat</TableHead>
                  <TableHead className="text-center w-[110px]">Status</TableHead>
                  <TableHead className="text-center w-[60px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penilaianFinals.map((pf) => {
                  const pred = pf.skor_final
                    ? getDefaultPredikat(pf.skor_final)
                    : null
                  const statusConf = getStatusConfig(pf.status)

                  return (
                    <TableRow
                      key={pf.id}
                      className={cn(
                        "cursor-pointer",
                        selectedId === pf.id && "bg-primary/5"
                      )}
                      onClick={() => setSelectedId(pf.id)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {pf.indikator_kode}
                      </TableCell>
                      <TableCell className="text-xs font-medium md:text-sm">{pf.indikator_nama}</TableCell>
                      <TableCell className="text-center font-semibold tabular-nums">
                        {pf.skor_final ? formatNumber(pf.skor_final) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {pred ? (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px]",
                              getScoreBadgeClass(pf.skor_final!)
                            )}
                          >
                            {pred.predikat}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn("text-[10px]", statusConf.className)}>
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right: Detail & Actions */}
        <Card className="lg:col-span-1 font-sans">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Detail Review</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPenilaian ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <p className="text-xs text-muted-foreground">Indikator</p>
                  <p className="text-sm font-semibold">{selectedPenilaian.indikator_nama}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Skor Final</p>
                    <p className="text-xl font-bold tabular-nums">
                      {selectedPenilaian.skor_final
                        ? formatNumber(selectedPenilaian.skor_final)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1",
                        getStatusConfig(selectedPenilaian.status).className
                      )}
                    >
                      {getStatusConfig(selectedPenilaian.status).label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Justifikasi Konsolidasi
                  </p>
                  <p className="text-xs bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                    {selectedPenilaian.justifikasi_konsolidasi || "Belum diisi"}
                  </p>
                </div>

                {selectedPenilaian.status === "disetor" && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-xs">Catatan Review (jika dikembalikan)</Label>
                    <Textarea
                      placeholder="Tulis catatan jika ada revisi yang diperlukan..."
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={3}
                      className="text-foreground bg-transparent text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 text-xs" onClick={() => handleReviewAction('disetujui')} disabled={submitting}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Setujui
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleReviewAction('dikembalikan')} disabled={submitting}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Kembalikan
                      </Button>
                    </div>
                  </div>
                )}

                {selectedPenilaian.status === "dikembalikan" && selectedPenilaian.catatan_revisi && (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">
                      Catatan Pengembalian
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300">
                      {selectedPenilaian.catatan_revisi}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Pilih indikator untuk melihat detail</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
