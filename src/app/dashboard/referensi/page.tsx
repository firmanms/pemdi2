"use client"

import { useState, useEffect } from "react"
import {
  Save,
  FolderCog,
  AlertCircle,
  CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import type { Aspek, Indikator, RubrikLevel } from "@/lib/types"

export default function ReferensiPage() {
  const [aspeks, setAspeks] = useState<Aspek[]>([])
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [selectedIndikator, setSelectedIndikator] = useState<string>("")
  const [rubrikData, setRubrikData] = useState<RubrikLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 1. Fetch aspects and indicators
  const loadData = async () => {
    try {
      setLoading(true)
      const { data: aspData } = await supabase.from('aspek').select('*').order('urutan')
      const { data: indData } = await supabase.from('indikator').select('*').order('urutan')
      
      setAspeks(aspData || [])
      setIndikators(indData || [])
      
      if (indData && indData.length > 0) {
        setSelectedIndikator(indData[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 2. Fetch rubrik for selected indicator
  useEffect(() => {
    async function loadRubrik() {
      if (!selectedIndikator) return
      try {
        const { data } = await supabase
          .from('rubrik_level')
          .select('*')
          .eq('indikator_id', selectedIndikator)
          .order('level')
        setRubrikData(data || [])
      } catch (e) {
        console.error(e)
      }
    }

    loadRubrik()
  }, [selectedIndikator])

  const totalBobotAspek = aspeks.reduce((sum, a) => sum + Number(a.bobot), 0)
  const selectedInd = indikators.find((i) => i.id === selectedIndikator)

  const updateRubrik = (
    idx: number,
    field: "batas_bawah" | "batas_atas" | "predikat" | "deskripsi",
    value: string
  ) => {
    setRubrikData((prev) => {
      const updated = [...prev]
      if (field === "batas_bawah" || field === "batas_atas") {
        updated[idx] = { ...updated[idx], [field]: parseFloat(value) || 0 }
      } else {
        updated[idx] = { ...updated[idx], [field]: value }
      }
      return updated
    })
  }

  // Validate rubrik: no gaps, no overlaps, range 1-5
  const validateRubrik = (): string[] => {
    const errors: string[] = []
    const sorted = [...rubrikData].sort((a, b) => a.level - b.level)

    if (sorted.length !== 5) return ["Tunggu memuat level..."]
    if (Number(sorted[0]?.batas_bawah) !== 1) errors.push("Batas bawah Level 1 harus 1.00")
    if (Number(sorted[4]?.batas_atas) !== 5) errors.push("Batas atas Level 5 harus 5.00")

    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = +(Number(sorted[i + 1].batas_bawah) - Number(sorted[i].batas_atas)).toFixed(2)
      if (Math.abs(gap) > 0.01) {
        errors.push(
          `Gap/overlap antara Level ${sorted[i].level} dan Level ${sorted[i + 1].level}`
        )
      }
    }

    return errors
  }

  const rubrikErrors = validateRubrik()

  const handleSaveRubrik = async () => {
    if (rubrikErrors.length > 0) {
      alert('Terdapat error validasi pada rubrik!')
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase.from('rubrik_level').upsert(rubrikData)
      if (error) throw error
      alert('Rubrik level kematangan berhasil disimpan!')
    } catch (e: any) {
      console.error(e)
      alert('Gagal menyimpan rubrik: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat referensi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Referensi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola master data aspek, indikator, bobot, dan rubrik level kematangan
        </p>
      </div>

      <Tabs defaultValue="aspek" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aspek">Aspek & Indikator</TabsTrigger>
          <TabsTrigger value="rubrik">Rubrik Level</TabsTrigger>
        </TabsList>

        {/* ---- Tab Aspek & Indikator ---- */}
        <TabsContent value="aspek">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">7 Aspek & 20 Indikator</CardTitle>
                  <CardDescription>
                    Atur bobot masing-masing aspek dan indikator
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {Math.abs(totalBobotAspek - 100) < 0.1 || Math.abs(totalBobotAspek - 1) < 0.1 ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Total bobot: 100%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/15 text-red-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Total bobot: {totalBobotAspek}% (harus 100%)
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center w-[100px]">
                      Bobot (%)
                    </TableHead>
                    <TableHead className="text-center w-[100px]">
                      Indikator
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aspeks.map((aspek) => {
                    const inds = indikators.filter(
                      (i) => i.aspek_id === aspek.id
                    )
                    return (
                      <>
                        <TableRow key={aspek.id} className="bg-muted/30 font-medium">
                          <TableCell className="font-mono text-xs text-foreground">
                            {aspek.kode}
                          </TableCell>
                          <TableCell className="font-semibold text-sm text-foreground">
                            {aspek.nama}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {aspek.bobot}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {inds.length} indikator
                          </TableCell>
                        </TableRow>
                        {inds.map((ind) => (
                          <TableRow key={ind.id} className="text-sm">
                            <TableCell className="font-mono text-xs text-muted-foreground pl-8">
                              {ind.kode}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {ind.nama}
                            </TableCell>
                            <TableCell className="text-center text-xs">
                              {ind.bobot}%
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        ))}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab Rubrik Level ---- */}
        <TabsContent value="rubrik">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Indikator Selector */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pilih Indikator</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {indikators.map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => setSelectedIndikator(ind.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                        selectedIndikator === ind.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <span className="font-mono shrink-0">{ind.kode}</span>
                      <span className="truncate">{ind.nama}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rubrik Editor */}
            <Card className="lg:col-span-3 font-sans">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Rubrik Level: {selectedInd?.kode} — {selectedInd?.nama}
                    </CardTitle>
                    <CardDescription>
                      Atur rentang nilai untuk 5 level kematangan
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleSaveRubrik} disabled={saving || rubrikErrors.length > 0}>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Validation Messages */}
                {rubrikErrors.length > 0 && (
                  <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1">
                    {rubrikErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Level</TableHead>
                      <TableHead className="w-[140px]">Predikat</TableHead>
                      <TableHead className="w-[100px] text-center">
                        Batas Bawah
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        Batas Atas
                      </TableHead>
                      <TableHead>Deskripsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rubrikData
                      .sort((a, b) => a.level - b.level)
                      .map((rubrik, idx) => (
                        <TableRow key={rubrik.id}>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {rubrik.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={rubrik.predikat}
                              onChange={(e) =>
                                updateRubrik(idx, "predikat", e.target.value)
                              }
                              className="h-8 text-xs text-foreground bg-transparent"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={rubrik.batas_bawah}
                              onChange={(e) =>
                                updateRubrik(idx, "batas_bawah", e.target.value)
                              }
                              className="h-8 text-xs text-center font-mono text-foreground bg-transparent"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={rubrik.batas_atas}
                              onChange={(e) =>
                                updateRubrik(idx, "batas_atas", e.target.value)
                              }
                              className="h-8 text-xs text-center font-mono text-foreground bg-transparent"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={rubrik.deskripsi}
                              onChange={(e) =>
                                updateRubrik(idx, "deskripsi", e.target.value)
                              }
                              className="h-8 text-xs text-foreground bg-transparent"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                {/* Visual Preview */}
                {rubrikData.length === 5 && (
                  <div className="mt-6">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Visualisasi Rentang
                    </p>
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      {rubrikData
                        .sort((a, b) => a.level - b.level)
                        .map((rubrik) => {
                          const width =
                            ((Number(rubrik.batas_atas) - Number(rubrik.batas_bawah)) / 4) * 100
                          const colors = [
                            "bg-red-400",
                            "bg-orange-400",
                            "bg-amber-400",
                            "bg-blue-400",
                            "bg-emerald-400",
                          ]
                          return (
                            <div
                              key={rubrik.id}
                              className={cn(
                                "flex items-center justify-center text-[10px] font-medium text-white transition-all",
                                colors[rubrik.level - 1]
                              )}
                              style={{ width: `${width}%` }}
                              title={`Level ${rubrik.level}: ${rubrik.batas_bawah} - ${rubrik.batas_atas}`}
                            >
                              L{rubrik.level}
                            </div>
                          )
                        })}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>1.00</span>
                      <span>2.00</span>
                      <span>3.00</span>
                      <span>4.00</span>
                      <span>5.00</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
