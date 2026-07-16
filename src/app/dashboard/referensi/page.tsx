"use client"

import { useState, useEffect } from "react"
import {
  Save,
  FolderCog,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  TrendingUp,
  Globe
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

  // --- Landing Page Content States ---
  const [landingContent, setLandingContent] = useState<{
    spbe_trend: { id: string; tahun: number; indeks: number }[]
    pemdi_trend: { id: string; tahun: number; indeks: number }[]
    documents: { id: string; title: string; category: string; type: string; size: string; downloadUrl: string }[]
  }>({
    spbe_trend: [],
    pemdi_trend: [],
    documents: []
  })

  // Inputs for adding new items
  const [newSpbe, setNewSpbe] = useState({ tahun: "", indeks: "" })
  const [newPemdi, setNewPemdi] = useState({ tahun: "", indeks: "" })
  const [newDoc, setNewDoc] = useState({ title: "", category: "Kebijakan", type: "PDF", size: "", downloadUrl: "" })
  const [savingLanding, setSavingLanding] = useState(false)

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

      // Fetch landing page content
      try {
        const { data: spbeData } = await supabase.from('spbe_trend').select('*').order('tahun')
        const { data: pemdiData } = await supabase.from('pemdi_trend').select('*').order('tahun')
        const { data: docData } = await supabase.from('dokumen_pengetahuan').select('*').order('created_at', { ascending: false })
        
        setLandingContent({
          spbe_trend: spbeData || [],
          pemdi_trend: pemdiData || [],
          documents: (docData || []).map(d => ({
            id: d.id,
            title: d.judul,
            category: d.kategori,
            type: d.tipe,
            size: d.ukuran,
            downloadUrl: d.url
          }))
        })
      } catch (e) {
        console.error(e)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- Landing Page CRUD Handlers ---

  const handleAddSpbe = async () => {
    const thn = parseInt(newSpbe.tahun)
    const idx = parseFloat(newSpbe.indeks)
    if (isNaN(thn) || isNaN(idx)) {
      alert("Tahun dan Indeks harus valid!")
      return
    }
    try {
      const { data, error } = await supabase.from('spbe_trend').insert({ tahun: thn, indeks: idx }).select().single()
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        spbe_trend: [...prev.spbe_trend, data].sort((a, b) => a.tahun - b.tahun)
      }))
      setNewSpbe({ tahun: "", indeks: "" })
    } catch (e: any) {
      alert("Gagal menambahkan SPBE: " + e.message)
    }
  }

  const handleDeleteSpbe = async (id: string) => {
    try {
      const { error } = await supabase.from('spbe_trend').delete().eq('id', id)
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        spbe_trend: prev.spbe_trend.filter(i => i.id !== id)
      }))
    } catch (e: any) {
      alert("Gagal menghapus SPBE: " + e.message)
    }
  }

  const handleAddPemdi = async () => {
    const thn = parseInt(newPemdi.tahun)
    const idx = parseFloat(newPemdi.indeks)
    if (isNaN(thn) || isNaN(idx)) {
      alert("Tahun dan Indeks harus valid!")
      return
    }
    try {
      const { data, error } = await supabase.from('pemdi_trend').insert({ tahun: thn, indeks: idx }).select().single()
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        pemdi_trend: [...prev.pemdi_trend, data].sort((a, b) => a.tahun - b.tahun)
      }))
      setNewPemdi({ tahun: "", indeks: "" })
    } catch (e: any) {
      alert("Gagal menambahkan PEMDI: " + e.message)
    }
  }

  const handleDeletePemdi = async (id: string) => {
    try {
      const { error } = await supabase.from('pemdi_trend').delete().eq('id', id)
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        pemdi_trend: prev.pemdi_trend.filter(i => i.id !== id)
      }))
    } catch (e: any) {
      alert("Gagal menghapus PEMDI: " + e.message)
    }
  }

  const handleAddDoc = async () => {
    if (!newDoc.title.trim()) {
      alert("Judul dokumen wajib diisi!")
      return
    }
    try {
      const { data, error } = await supabase.from('dokumen_pengetahuan').insert({
        judul: newDoc.title,
        kategori: newDoc.category,
        tipe: newDoc.type || "PDF",
        ukuran: newDoc.size || "1.0 MB",
        url: newDoc.downloadUrl || "#"
      }).select().single()
      if (error) throw error
      
      const item = {
        id: data.id,
        title: data.judul,
        category: data.kategori,
        type: data.tipe,
        size: data.ukuran,
        downloadUrl: data.url
      }
      setLandingContent(prev => ({
        ...prev,
        documents: [...prev.documents, item]
      }))
      setNewDoc({ title: "", category: "Kebijakan", type: "PDF", size: "", downloadUrl: "" })
    } catch (e: any) {
      alert("Gagal menambahkan dokumen: " + e.message)
    }
  }

  const handleDeleteDoc = async (id: string) => {
    try {
      const { error } = await supabase.from('dokumen_pengetahuan').delete().eq('id', id)
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        documents: prev.documents.filter(i => i.id !== id)
      }))
    } catch (e: any) {
      alert("Gagal menghapus dokumen: " + e.message)
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
          <TabsTrigger value="konten">Konten Landing</TabsTrigger>
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

        {/* ---- Tab Konten Landing (CRUD) ---- */}
        <TabsContent value="konten">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Manajemen Konten Landing Page</h3>
                <p className="text-xs text-muted-foreground">Kelola grafik tren indeks dan perpustakaan dokumen pengetahuan halaman depan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: SPBE Trend */}
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                    Tren Indeks SPBE Nasional
                  </CardTitle>
                  <CardDescription className="text-xs">Data poin tren tahunan SPBE</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Form input */}
                  <div className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-dashed">
                    <input
                      type="number"
                      placeholder="Tahun (e.g. 2026)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newSpbe.tahun}
                      onChange={(e) => setNewSpbe({ ...newSpbe, tahun: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Skor Indeks (e.g. 3.4)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newSpbe.indeks}
                      onChange={(e) => setNewSpbe({ ...newSpbe, indeks: e.target.value })}
                    />
                    <Button onClick={handleAddSpbe} size="sm" className="h-8 text-xs shrink-0">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                    </Button>
                  </div>

                  {/* Table list */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/35">
                        <TableRow>
                          <TableHead className="py-2 text-[10px] font-bold">Tahun</TableHead>
                          <TableHead className="py-2 text-[10px] font-bold text-center">Indeks</TableHead>
                          <TableHead className="py-2 text-[10px] font-bold text-right w-[60px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {landingContent.spbe_trend.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6 italic">Belum ada data</TableCell>
                          </TableRow>
                        ) : (
                          landingContent.spbe_trend.map(item => (
                            <TableRow key={item.id} className="text-xs">
                              <TableCell className="py-2 font-semibold text-slate-800">{item.tahun}</TableCell>
                              <TableCell className="py-2 font-mono text-center font-bold text-teal-600">{item.indeks}</TableCell>
                              <TableCell className="py-2 text-right">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteSpbe(item.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: PEMDI Trend */}
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-indigo-600" />
                    Tren Kematangan PEMDI Daerah
                  </CardTitle>
                  <CardDescription className="text-xs">Data poin tren tahunan PEMDI</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Form input */}
                  <div className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-dashed">
                    <input
                      type="number"
                      placeholder="Tahun (e.g. 2026)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newPemdi.tahun}
                      onChange={(e) => setNewPemdi({ ...newPemdi, tahun: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Skor Indeks (e.g. 3.4)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newPemdi.indeks}
                      onChange={(e) => setNewPemdi({ ...newPemdi, indeks: e.target.value })}
                    />
                    <Button onClick={handleAddPemdi} size="sm" className="h-8 text-xs shrink-0">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                    </Button>
                  </div>

                  {/* Table list */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/35">
                        <TableRow>
                          <TableHead className="py-2 text-[10px] font-bold">Tahun</TableHead>
                          <TableHead className="py-2 text-[10px] font-bold text-center">Indeks</TableHead>
                          <TableHead className="py-2 text-[10px] font-bold text-right w-[60px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {landingContent.pemdi_trend.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6 italic">Belum ada data</TableCell>
                          </TableRow>
                        ) : (
                          landingContent.pemdi_trend.map(item => (
                            <TableRow key={item.id} className="text-xs">
                              <TableCell className="py-2 font-semibold text-slate-800">{item.tahun}</TableCell>
                              <TableCell className="py-2 font-mono text-center font-bold text-indigo-600">{item.indeks}</TableCell>
                              <TableCell className="py-2 text-right">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeletePemdi(item.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card 3: Documents Management */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Perpustakaan Manajemen Pengetahuan
                </CardTitle>
                <CardDescription className="text-xs">Kelola dokumen unduhan kebijakan dan materi sosialisasi</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Form input */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-muted/30 p-3 rounded-xl border border-dashed">
                  <div className="lg:col-span-2">
                    <input
                      type="text"
                      placeholder="Judul Dokumen (e.g. Peraturan Bupati No 12...)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-slate-800"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <select
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-slate-800"
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                    >
                      <option value="Kebijakan">Kebijakan</option>
                      <option value="Penerapan">Penerapan</option>
                      <option value="Evaluasi">Evaluasi</option>
                      <option value="Materi">Materi</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tipe (PDF/PPT)"
                      className="flex h-8 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-slate-800"
                      value={newDoc.type}
                      onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Ukuran (e.g. 1.2 MB)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-slate-800"
                      value={newDoc.size}
                      onChange={(e) => setNewDoc({ ...newDoc, size: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Tautan/Link Unduhan (#)"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-slate-800"
                      value={newDoc.downloadUrl}
                      onChange={(e) => setNewDoc({ ...newDoc, downloadUrl: e.target.value })}
                    />
                    <Button onClick={handleAddDoc} size="sm" className="h-8 text-xs shrink-0">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                    </Button>
                  </div>
                </div>

                {/* Table list */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/35">
                      <TableRow>
                        <TableHead className="py-2 text-[10px] font-bold">Judul Dokumen</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold text-center w-[100px]">Kategori</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold text-center w-[80px]">Format</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold text-center w-[80px]">Ukuran</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold text-right w-[60px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {landingContent.documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6 italic">Belum ada data dokumen</TableCell>
                        </TableRow>
                      ) : (
                        landingContent.documents.map(item => (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="py-2 font-semibold text-slate-800 leading-snug">{item.title}</TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge variant="secondary" className="text-[9px] font-medium border-none bg-indigo-50 text-indigo-700">
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-center font-mono text-[10px] text-muted-foreground">{item.type}</TableCell>
                            <TableCell className="py-2 text-center font-mono text-[10px] text-muted-foreground">{item.size}</TableCell>
                            <TableCell className="py-2 text-right">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteDoc(item.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
