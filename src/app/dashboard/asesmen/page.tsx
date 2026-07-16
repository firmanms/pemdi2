"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Save,
  Send,
  ChevronDown,
  ChevronRight,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  cn,
  getDefaultPredikat,
  getScoreBadgeClass,
} from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase/client"
import type { Aspek, Indikator } from "@/lib/types"

interface FormData {
  [indikatorId: string]: {
    id?: string
    skor: number | null
    justifikasi: string
    fileUrl: string
  }
}

export default function AsesmenPage() {
  const { activePeriode, perangkatDaerahId } = useAuth()
  const [aspeks, setAspeks] = useState<Aspek[]>([])
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [expandedAspek, setExpandedAspek] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch metadata and existing assessments
  useEffect(() => {
    async function loadData() {
      if (!activePeriode || !perangkatDaerahId) return

      try {
        setLoading(true)
        // Fetch aspects and indicators
        const { data: aspData } = await supabase.from('aspek').select('*').order('urutan')
        const { data: indData } = await supabase.from('indikator').select('*').order('urutan')
        
        setAspeks(aspData || [])
        setIndikators(indData || [])
        if (aspData && aspData.length > 0) {
          setExpandedAspek([aspData[0].id])
        }

        // Fetch existing self-assessments with joined bukti_dukung
        const { data: penData } = await supabase
          .from('penilaian_opd')
          .select('*, bukti_dukung(*)')
          .eq('periode_id', activePeriode.id)
          .eq('perangkat_daerah_id', perangkatDaerahId)

        const initialForm: FormData = {}
        // Initialize form with defaults
        indData?.forEach((ind) => {
          initialForm[ind.id] = { skor: null, justifikasi: "", fileUrl: "" }
        })

        // Fill with existing database records
        penData?.forEach((p: any) => {
          initialForm[p.indikator_id] = {
            id: p.id,
            skor: p.skor !== null ? Number(p.skor) : null,
            justifikasi: p.justifikasi || "",
            fileUrl: p.bukti_dukung?.[0]?.file_url || ""
          }
        })

        setFormData(initialForm)
      } catch (e) {
        console.error('Error loading assessment page:', e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activePeriode, perangkatDaerahId])

  const progress = useMemo(() => {
    if (indikators.length === 0) return 0
    const filled = Object.values(formData).filter(
      (d) => d.skor !== null && d.justifikasi.trim().length > 0
    ).length
    return (filled / indikators.length) * 100
  }, [formData, indikators])

  const toggleAspek = (aspekId: string) => {
    setExpandedAspek((prev) =>
      prev.includes(aspekId)
        ? prev.filter((id) => id !== aspekId)
        : [...prev, aspekId]
    )
  }

  const updateSkor = (indId: string, value: string) => {
    const num = parseFloat(value)
    setFormData((prev) => ({
      ...prev,
      [indId]: {
        ...prev[indId],
        skor: isNaN(num) ? null : Math.max(1, Math.min(5, num)),
      },
    }))
  }

  const updateJustifikasi = (indId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [indId]: { ...prev[indId], justifikasi: value },
    }))
  }

  const updateFileUrl = (indId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [indId]: { ...prev[indId], fileUrl: value },
    }))
  }

  // Save assessments to Supabase
  const saveAssessments = async (status: 'draft' | 'terkirim') => {
    if (!activePeriode || !perangkatDaerahId) return

    if (status === 'draft') setSaving(true)
    else setSubmitting(true)

    try {
      const recordsToUpsert = Object.entries(formData)
        .filter(([_, data]) => data.skor !== null) // only save filled scores
        .map(([indId, data]) => ({
          ...(data.id ? { id: data.id } : {}),
          periode_id: activePeriode.id,
          indikator_id: indId,
          perangkat_daerah_id: perangkatDaerahId,
          skor: data.skor,
          justifikasi: data.justifikasi,
          status: status,
          disimpan_at: new Date().toISOString()
        }))

      if (recordsToUpsert.length > 0) {
        const { data: upserted, error } = await supabase
          .from('penilaian_opd')
          .upsert(recordsToUpsert)
          .select()
        if (error) throw error

        // Save bukti_dukung for each upserted row
        if (upserted) {
          for (const row of upserted) {
            const indId = row.indikator_id
            const fileUrl = formData[indId]?.fileUrl?.trim() || ""

            // Delete existing
            await supabase.from('bukti_dukung').delete().eq('penilaian_opd_id', row.id)

            // Insert new if URL is not empty
            if (fileUrl) {
              await supabase.from('bukti_dukung').insert({
                penilaian_opd_id: row.id,
                file_url: fileUrl,
                nama_file: 'Link Bukti Dukung'
              })
            }
          }
        }
      }

      // Re-trigger load to fetch newly assigned IDs
      const { data: penData } = await supabase
        .from('penilaian_opd')
        .select('id, indikator_id')
        .eq('periode_id', activePeriode.id)
        .eq('perangkat_daerah_id', perangkatDaerahId)

      setFormData((prev) => {
        const updated = { ...prev }
        penData?.forEach((p) => {
          if (updated[p.indikator_id]) {
            updated[p.indikator_id].id = p.id
          }
        })
        return updated
      })

      alert(status === 'draft' ? 'Draft berhasil disimpan!' : 'Penilaian berhasil disetor ke sistem!')
    } catch (e: any) {
      console.error('Failed to save assessment:', e)
      alert('Gagal menyimpan penilaian: ' + e.message)
    } finally {
      setSaving(false)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat form asesmen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Self-Assessment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Isi skor dan justifikasi untuk seluruh 20 indikator
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => saveAssessments('draft')} disabled={saving || submitting}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Menyimpan..." : "Simpan Draft"}
          </Button>
          <Button onClick={() => saveAssessments('terkirim')} disabled={saving || submitting}>
            <Send className="h-4 w-4 mr-1" />
            {submitting ? "Menyetor..." : "Setor"}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progres Pengisian</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-2">
            {Object.values(formData).filter((d) => d.skor !== null).length} dari{" "}
            {indikators.length} indikator telah diisi
          </p>
        </CardContent>
      </Card>

      {/* Assessment Form - Accordion by Aspek */}
      <div className="space-y-3">
        {aspeks.map((aspek) => {
          const isExpanded = expandedAspek.includes(aspek.id)
          const aspekIndikators = indikators.filter(
            (ind) => ind.aspek_id === aspek.id
          )
          const filledCount = aspekIndikators.filter(
            (ind) => formData[ind.id]?.skor !== null
          ).length

          return (
            <Card key={aspek.id} className="overflow-hidden">
              {/* Aspek Header */}
              <button
                onClick={() => toggleAspek(aspek.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer text-foreground"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold">
                      {aspek.kode}. {aspek.nama}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bobot: {aspek.bobot}% —{" "}
                      {aspekIndikators.length} indikator
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {filledCount}/{aspekIndikators.length}
                  </Badge>
                  {filledCount === aspekIndikators.length ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Indikator Forms */}
              {isExpanded && (
                <div className="border-t">
                  {aspekIndikators.map((ind, idx) => {
                    const data = formData[ind.id]
                    const predikat =
                      data?.skor !== null && data?.skor !== undefined
                        ? getDefaultPredikat(data.skor)
                        : null

                    return (
                      <div
                        key={ind.id}
                        className={cn(
                          "p-5 animate-fade-in",
                          idx < aspekIndikators.length - 1 && "border-b"
                        )}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {ind.kode}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{ind.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              Bobot: {ind.bobot}%
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Score Input */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold">Pilih Level Kematangan</Label>
                              {predikat && data?.skor !== null && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0",
                                    getScoreBadgeClass(data.skor!)
                                  )}
                                >
                                  {predikat.predikat}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2.5 pt-1">
                              {[1, 2, 3, 4, 5].map((lvl) => {
                                const isActive = data?.skor === lvl
                                const activeColors = [
                                  "bg-red-500 text-white border-red-500 hover:bg-red-600",
                                  "bg-orange-500 text-white border-orange-500 hover:bg-orange-600",
                                  "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
                                  "bg-blue-500 text-white border-blue-500 hover:bg-blue-600",
                                  "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600",
                                ]
                                return (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => updateSkor(ind.id, lvl.toString())}
                                    className={cn(
                                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95",
                                      isActive
                                        ? activeColors[lvl - 1]
                                        : "bg-card text-muted-foreground border-input hover:text-foreground hover:bg-muted"
                                    )}
                                  >
                                    {lvl}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Justifikasi */}
                          <div className="space-y-2">
                            <Label className="text-xs">Justifikasi</Label>
                            <Textarea
                              placeholder="Jelaskan dasar penilaian..."
                              value={data?.justifikasi ?? ""}
                              onChange={(e) =>
                                updateJustifikasi(ind.id, e.target.value)
                              }
                              rows={3}
                              className="text-sm resize-none text-foreground bg-transparent"
                            />
                          </div>

                          {/* URL Input */}
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Tautan Bukti Dukung (URL)</Label>
                            <Input
                              type="url"
                              placeholder="https://drive.google.com/..."
                              value={data?.fileUrl ?? ""}
                              onChange={(e) => updateFileUrl(ind.id, e.target.value)}
                              className="text-xs text-foreground bg-transparent"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Tempel tautan Google Drive, OneDrive, atau cloud storage lainnya
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
