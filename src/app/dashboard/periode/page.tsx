"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Plus,
  Calendar,
  Play,
  Pause,
  CheckCircle2,
  Lock,
  ClipboardCheck,
  FileCheck2,
  X,
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
import { Progress } from "@/components/ui/progress"
import { cn, getStatusConfig } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase/client"
import type { PeriodeAsesmen, PeriodeStatus } from "@/lib/types"

interface PeriodeWithProgress extends PeriodeAsesmen {
  progresOPD: number
  progresKonsolidasi: number
  progresReview: number
}

const statusIcons: Record<PeriodeStatus, React.ReactNode> = {
  draft: <Pause className="h-3.5 w-3.5" />,
  dibuka: <Play className="h-3.5 w-3.5" />,
  final: <CheckCircle2 className="h-3.5 w-3.5" />,
  ditutup: <Lock className="h-3.5 w-3.5" />,
}

export default function PeriodePage() {
  const { availableOPDs, availablePeriodes, refreshData } = useAuth()
  const [periodes, setPeriodes] = useState<PeriodeWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  const [addModal, setAddModal] = useState<{
    isOpen: boolean
    nama: string
    tahun: string
  }>({
    isOpen: false,
    nama: '',
    tahun: ''
  })

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadProgress() {
      if (availablePeriodes.length === 0) {
        setPeriodes([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const totalOpds = availableOPDs.length || 1
        const totalIndikators = 20

        const formatted = await Promise.all(
          availablePeriodes.map(async (p) => {
            // 1. OPD submission progress
            const { data: opdPen } = await supabase
              .from('penilaian_opd')
              .select('status')
              .eq('periode_id', p.id)
            
            const submittedOpd = opdPen?.filter(x => x.status === 'terkirim').length || 0
            const opdPct = (submittedOpd / (totalOpds * totalIndikators)) * 100

            // 2. Consolidation progress
            const { data: finalPen } = await supabase
              .from('penilaian_final')
              .select('status')
              .eq('periode_id', p.id)

            const consolidated = finalPen?.filter(x => x.status === 'disetor' || x.status === 'disetujui').length || 0
            const consPct = (consolidated / totalIndikators) * 100

            // 3. Review progress
            const approved = finalPen?.filter(x => x.status === 'disetujui').length || 0
            const revPct = (approved / totalIndikators) * 100

            return {
              ...p,
              progresOPD: Math.round(opdPct),
              progresKonsolidasi: Math.round(consPct),
              progresReview: Math.round(revPct)
            }
          })
        )

        // Sort by year desc
        setPeriodes(formatted.sort((a, b) => b.tahun - a.tahun))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [availablePeriodes, availableOPDs])
  const executeCreatePeriode = async () => {
    const { nama, tahun: tahunStr } = addModal
    if (!nama.trim()) {
      alert("Nama periode wajib diisi!")
      return
    }
    const tahun = parseInt(tahunStr || '')
    if (isNaN(tahun)) {
      alert('Tahun tidak valid!')
      return
    }

    try {
      const { error } = await supabase.from('periode_asesmen').insert([
        {
          instansi_id: 'd1000000-0000-0000-0000-000000000001', // demo instansi
          tahun,
          nama,
          status: 'draft',
          tanggal_mulai: `${tahun}-07-01`,
          tanggal_selesai: `${tahun}-12-31`
        }
      ])
      if (error) throw error
      alert('Periode baru berhasil dibuat!')
      setAddModal({ ...addModal, isOpen: false, nama: '', tahun: '' })
      refreshData()
    } catch (e: any) {
      console.error(e)
      alert('Gagal membuat periode: ' + e.message)
    }
  }

  const handleUpdateStatus = async (id: string, nextStatus: PeriodeStatus) => {
    try {
      const { error } = await supabase
        .from('periode_asesmen')
        .update({ status: nextStatus })
        .eq('id', id)
      
      if (error) throw error
      alert(`Periode berhasil diubah menjadi: ${nextStatus}`)
      refreshData()
    } catch (e: any) {
      console.error(e)
      alert('Gagal mengubah status: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat periode asesmen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Periode Asesmen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola periode evaluasi dan pantau progres pengisian
          </p>
        </div>
        <Button onClick={() => setAddModal({ isOpen: true, nama: '', tahun: '' })} size="sm" className="text-xs">
          <Plus className="h-4 w-4 mr-1" />
          Buat Periode Baru
        </Button>
      </div>

      {/* Periode Cards */}
      {periodes.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border border-dashed">
          <Calendar className="h-10 w-10 mx-auto opacity-20 mb-2" />
          <p className="text-sm">Belum ada periode asesmen. Silakan buat baru.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {periodes.map((periode) => {
            const statusConf = getStatusConfig(periode.status)
            const isDraft = periode.status === 'draft'
            const isDitutup = periode.status === 'ditutup'

            return (
              <Card
                key={periode.id}
                className={cn(
                  "overflow-hidden transition-all",
                  isDraft && "border-primary/30 shadow-sm"
                )}
              >
                {/* Active indicator bar */}
                {isDraft && (
                  <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
                )}

                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold">{periode.nama}</h3>
                        <Badge
                          variant="secondary"
                          className={cn("text-[9px] border-none", statusConf.className)}
                        >
                          {statusIcons[periode.status]}
                          <span className="ml-1 uppercase tracking-wider">{statusConf.label}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {periode.tanggal_mulai} s.d. {periode.tanggal_selesai}
                      </p>
                    </div>

                    {/* Right: Progress Metrics */}
                    <div className="grid grid-cols-3 gap-4 lg:w-[400px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                          <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
                          Self-Asesmen
                        </div>
                        <Progress
                          value={periode.progresOPD}
                          className="h-1.5"
                          indicatorClassName={
                            periode.progresOPD === 100
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }
                        />
                        <p className="text-xs font-semibold tabular-nums mt-0.5">
                          {periode.progresOPD}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                          <FileCheck2 className="h-3 w-3 text-muted-foreground" />
                          Konsolidasi
                        </div>
                        <Progress
                          value={periode.progresKonsolidasi}
                          className="h-1.5"
                          indicatorClassName={
                            periode.progresKonsolidasi === 100
                              ? "bg-emerald-500"
                              : "bg-purple-500"
                          }
                        />
                        <p className="text-xs font-semibold tabular-nums mt-0.5">
                          {periode.progresKonsolidasi}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                          Review
                        </div>
                        <Progress
                          value={periode.progresReview}
                          className="h-1.5"
                          indicatorClassName={
                            periode.progresReview === 100
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }
                        />
                        <p className="text-xs font-semibold tabular-nums mt-0.5">
                          {periode.progresReview}%
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:ml-4">
                      {isDraft && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleUpdateStatus(periode.id, 'ditutup')}>
                          Tutup Periode
                        </Button>
                      )}
                      {isDitutup && (
                        <Button size="sm" variant="outline" className="text-xs text-primary hover:text-primary" onClick={() => handleUpdateStatus(periode.id, 'draft')}>
                          Buka Kembali
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH PERIODE */}
      {/* ============================================================ */}
      {mounted && addModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-sm shadow-2xl border-white/20 glass animate-scale-up text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <CardTitle className="text-base text-foreground font-bold flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-primary" />
                Buat Periode Baru
              </CardTitle>
              <button
                onClick={() => setAddModal({ ...addModal, isOpen: false })}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Nama Periode</label>
                <input
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Contoh: Evaluasi Semester 2 2026"
                  value={addModal.nama}
                  onChange={(e) => setAddModal({ ...addModal, nama: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Tahun</label>
                <input
                  type="number"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Contoh: 2026"
                  value={addModal.tahun}
                  onChange={(e) => setAddModal({ ...addModal, tahun: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModal({ ...addModal, isOpen: false })}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button variant="default" size="sm" onClick={executeCreatePeriode} className="text-xs">
                  Simpan Periode
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      , document.body)}
    </div>
  )
}
