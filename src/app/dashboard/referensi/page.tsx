"use client"

import { useState, useEffect, Fragment } from "react"
import {
  Save,
  FolderCog,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  TrendingUp,
  Globe,
  Activity,
  BookOpen
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
  const [rubrikViewMode, setRubrikViewMode] = useState<"fokus" | "matriks">("fokus")
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1)

  // --- Landing Page Content States ---
  const [landingContent, setLandingContent] = useState<{
    spbe_trend: { id: string; tahun: number; indeks: number; kategori: string }[]
    pemdi_trend: { id: string; tahun: number; indeks: number; kategori: string }[]
    documents: { id: string; title: string; category: string; type: string; size: string; downloadUrl: string }[]
  }>({
    spbe_trend: [],
    pemdi_trend: [],
    documents: []
  })

  // Inputs for adding new items
  const [newSpbe, setNewSpbe] = useState({ tahun: "", indeks: "", kategori: "Baik" })
  const [newPemdi, setNewPemdi] = useState({ tahun: "", indeks: "", kategori: "Baik" })
  const [newDoc, setNewDoc] = useState({ title: "", category: "Kebijakan", type: "PDF", size: "", downloadUrl: "" })
  const [savingLanding, setSavingLanding] = useState(false)

  // --- Aspek & Indikator CRUD States ---
  const [editingAspek, setEditingAspek] = useState<Partial<Aspek> | null>(null)
  const [editingIndikator, setEditingIndikator] = useState<Partial<Indikator> | null>(null)
  const [isAddingAspek, setIsAddingAspek] = useState(false)
  const [isAddingIndikator, setIsAddingIndikator] = useState<string | null>(null) // holds aspek_id
  
  // Handlers for Aspek
  const handleSaveAspek = async () => {
    if (!editingAspek?.kode || !editingAspek?.nama || editingAspek.bobot === undefined) {
      alert("Kode, Nama, dan Bobot wajib diisi!")
      return
    }
    try {
      const payload = {
        kode: editingAspek.kode,
        nama: editingAspek.nama,
        deskripsi: editingAspek.deskripsi || '',
        bobot: Number(editingAspek.bobot),
        urutan: editingAspek.urutan || 0
      }
      if (editingAspek.id) {
        // Update
        const { error } = await supabase.from('aspek').update(payload).eq('id', editingAspek.id)
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase.from('aspek').insert([payload])
        if (error) throw error
      }
      setEditingAspek(null)
      setIsAddingAspek(false)
      loadData()
    } catch (e: any) {
      alert("Gagal menyimpan aspek: " + e.message)
    }
  }

  const handleDeleteAspek = async (id: string) => {
    if (!confirm("Hapus aspek ini? Semua indikator di dalamnya (dan rubriknya) akan ikut terhapus!")) return
    try {
      const { error } = await supabase.from('aspek').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (e: any) {
      alert("Gagal menghapus aspek: " + e.message)
    }
  }

  // Handlers for Indikator
  const handleSaveIndikator = async () => {
    if (!editingIndikator?.kode || !editingIndikator?.nama || editingIndikator.bobot === undefined || !editingIndikator.aspek_id) {
      alert("Kode, Nama, Bobot, dan Aspek wajib diisi!")
      return
    }
    try {
      const payload = {
        aspek_id: editingIndikator.aspek_id,
        kode: editingIndikator.kode,
        nama: editingIndikator.nama,
        deskripsi: editingIndikator.deskripsi || '',
        bobot: Number(editingIndikator.bobot),
        urutan: editingIndikator.urutan || 0
      }
      if (editingIndikator.id) {
        const { error } = await supabase.from('indikator').update(payload).eq('id', editingIndikator.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('indikator').insert([payload])
        if (error) throw error
      }
      setEditingIndikator(null)
      setIsAddingIndikator(null)
      loadData()
    } catch (e: any) {
      alert("Gagal menyimpan indikator: " + e.message)
    }
  }

  const handleDeleteIndikator = async (id: string) => {
    if (!confirm("Hapus indikator ini? Semua data rubrik dan penilaian terkait akan ikut terhapus!")) return
    try {
      const { error } = await supabase.from('indikator').delete().eq('id', id)
      if (error) throw error
      if (selectedIndikator === id) setSelectedIndikator("")
      loadData()
    } catch (e: any) {
      alert("Gagal menghapus indikator: " + e.message)
    }
  }

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
      const { data, error } = await supabase.from('spbe_trend').insert({ tahun: thn, indeks: idx, kategori: newSpbe.kategori || '' }).select().single()
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        spbe_trend: [...prev.spbe_trend, data].sort((a, b) => a.tahun - b.tahun)
      }))
      setNewSpbe({ tahun: "", indeks: "", kategori: "Baik" })
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
      const { data, error } = await supabase.from('pemdi_trend').insert({ tahun: thn, indeks: idx, kategori: newPemdi.kategori || '' }).select().single()
      if (error) throw error
      setLandingContent(prev => ({
        ...prev,
        pemdi_trend: [...prev.pemdi_trend, data].sort((a, b) => a.tahun - b.tahun)
      }))
      setNewPemdi({ tahun: "", indeks: "", kategori: "Baik" })
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
    field: "batas_bawah" | "batas_atas" | "predikat" | "deskripsi" | "kondisi" | "bukti_dukung",
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
          <div className="grid grid-cols-1 gap-6">
            
            {/* Editor Form (Aspek or Indikator) */}
            {(isAddingAspek || editingAspek || isAddingIndikator || editingIndikator) && (
              <Card className="border-blue-200 bg-blue-50/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="pb-3 border-b border-blue-100">
                  <CardTitle className="text-sm font-bold text-blue-800">
                    {isAddingAspek ? "Tambah Aspek Baru" : editingAspek ? "Edit Aspek" : isAddingIndikator ? "Tambah Indikator Baru" : "Edit Indikator"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Kode</label>
                      <Input
                        value={isAddingAspek || editingAspek ? editingAspek?.kode || "" : editingIndikator?.kode || ""}
                        onChange={(e) => {
                          if (isAddingAspek || editingAspek) setEditingAspek(prev => ({ ...prev, kode: e.target.value }))
                          else setEditingIndikator(prev => ({ ...prev, kode: e.target.value }))
                        }}
                        placeholder="Contoh: A.1"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Bobot (%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={isAddingAspek || editingAspek ? editingAspek?.bobot || "" : editingIndikator?.bobot || ""}
                        onChange={(e) => {
                          if (isAddingAspek || editingAspek) setEditingAspek(prev => ({ ...prev, bobot: Number(e.target.value) }))
                          else setEditingIndikator(prev => ({ ...prev, bobot: Number(e.target.value) }))
                        }}
                        placeholder="Contoh: 15"
                        className="bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Nama</label>
                      <Input
                        value={isAddingAspek || editingAspek ? editingAspek?.nama || "" : editingIndikator?.nama || ""}
                        onChange={(e) => {
                          if (isAddingAspek || editingAspek) setEditingAspek(prev => ({ ...prev, nama: e.target.value }))
                          else setEditingIndikator(prev => ({ ...prev, nama: e.target.value }))
                        }}
                        placeholder="Nama aspek atau indikator..."
                        className="bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Deskripsi Singkat</label>
                      <textarea
                        value={isAddingAspek || editingAspek ? editingAspek?.deskripsi || "" : editingIndikator?.deskripsi || ""}
                        onChange={(e) => {
                          if (isAddingAspek || editingAspek) setEditingAspek(prev => ({ ...prev, deskripsi: e.target.value }))
                          else setEditingIndikator(prev => ({ ...prev, deskripsi: e.target.value }))
                        }}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-none"
                        placeholder="Deskripsi singkat (opsional)..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingAspek(null)
                      setIsAddingAspek(false)
                      setEditingIndikator(null)
                      setIsAddingIndikator(null)
                    }}>Batal</Button>
                    <Button size="sm" onClick={isAddingAspek || editingAspek ? handleSaveAspek : handleSaveIndikator} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Simpan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List Data */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Daftar Aspek & Indikator</CardTitle>
                    <CardDescription>
                      Total {aspeks.length} Aspek & {indikators.length} Indikator
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {Math.abs(totalBobotAspek - 100) < 0.1 || Math.abs(totalBobotAspek - 1) < 0.1 ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Bobot Total: 100%
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bobot Total: {totalBobotAspek}%
                      </Badge>
                    )}
                    <Button size="sm" onClick={() => { setIsAddingAspek(true); setEditingAspek({}); setEditingIndikator(null); setIsAddingIndikator(null); }}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Aspek
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-center w-[100px]">Bobot</TableHead>
                      <TableHead className="text-right w-[200px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aspeks.map((aspek) => {
                      const inds = indikators.filter((i) => i.aspek_id === aspek.id)
                      return (
                        <Fragment key={aspek.id}>
                          <TableRow className="bg-slate-50 border-t-2 border-t-slate-200">
                            <TableCell className="font-mono text-xs font-bold text-slate-800">
                              {aspek.kode}
                            </TableCell>
                            <TableCell className="font-bold text-sm text-slate-800">
                              {aspek.nama}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-none font-bold">
                                {aspek.bobot}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Tambah Indikator" onClick={() => { setIsAddingIndikator(aspek.id); setEditingIndikator({ aspek_id: aspek.id }); setIsAddingAspek(false); setEditingAspek(null); }}>
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Edit Aspek" onClick={() => { setEditingAspek(aspek); setIsAddingAspek(false); setEditingIndikator(null); setIsAddingIndikator(null); }}>
                                <FolderCog className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" title="Hapus Aspek" onClick={() => handleDeleteAspek(aspek.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {inds.map((ind) => (
                            <TableRow key={ind.id} className="text-sm bg-white hover:bg-slate-50/50">
                              <TableCell className="font-mono text-xs text-slate-500 pl-8">
                                {ind.kode}
                              </TableCell>
                              <TableCell className="text-slate-600 leading-snug">
                                {ind.nama}
                              </TableCell>
                              <TableCell className="text-center text-xs font-semibold text-slate-500">
                                {ind.bobot}%
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Edit Indikator" onClick={() => { setEditingIndikator(ind); setIsAddingIndikator(null); setEditingAspek(null); setIsAddingAspek(false); }}>
                                  <FolderCog className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50" title="Hapus Indikator" onClick={() => handleDeleteIndikator(ind.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Tab Rubrik Level ---- */}
        <TabsContent value="rubrik">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Indikator Selector */}
            <Card className="lg:col-span-1 border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold tracking-tight text-slate-800">Daftar Indikator</CardTitle>
                <CardDescription className="text-xs">Pilih indikator untuk mengatur rubrik level kematangan.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                  {indikators.map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => setSelectedIndikator(ind.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-slate-50 last:border-0",
                        selectedIndikator === ind.id
                          ? "bg-[#f8fbff] border-l-2 border-l-blue-500"
                          : "hover:bg-slate-50 bg-white border-l-2 border-l-transparent"
                      )}
                    >
                      <Badge className={cn("text-[9px] font-mono border-none py-0 shrink-0 mt-0.5", selectedIndikator === ind.id ? "bg-[#1B4B8A] text-white" : "bg-slate-100 text-slate-500")}>
                        {ind.kode}
                      </Badge>
                      <span className={cn("text-xs leading-snug line-clamp-3", selectedIndikator === ind.id ? "text-[#1B4B8A] font-bold" : "text-slate-600 font-medium")}>{ind.nama}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rubrik Editor */}
            <div className="lg:col-span-3">
              {selectedInd ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm h-full flex flex-col">
                  
                  {/* Header */}
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <span className="inline-block bg-blue-50 text-[#1B4B8A] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3">
                        Edit Rubrik Kematangan
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-800 leading-snug mb-2">
                        {selectedInd.nama}
                      </h2>
                    </div>
                    <Button onClick={handleSaveRubrik} disabled={saving || rubrikErrors.length > 0} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>

                  {/* Validation Errors */}
                  {rubrikErrors.length > 0 && (
                    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 space-y-1.5">
                      {rubrikErrors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {err}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Toggle Modes */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-6 mb-6 gap-4">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                      Mode Editor Rubrik
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

                  {rubrikData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-slate-400 font-semibold italic text-sm">
                      Memuat data rubrik...
                    </div>
                  ) : rubrikViewMode === "fokus" ? (
                    <div className="space-y-6">
                      {/* Level Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {[1, 2, 3, 4, 5].map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => setSelectedLevelId(lvl)}
                            className={cn(
                              "px-6 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                              selectedLevelId === lvl
                                ? "bg-slate-700 text-white border-slate-700"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            )}
                          >
                            LEVEL {lvl}
                          </button>
                        ))}
                      </div>

                      {/* Selected Level Editor */}
                      {rubrikData.map((rubrik, idx) => (
                        rubrik.level === selectedLevelId && (
                          <div key={rubrik.id} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                            {/* Base Config (Predikat, Ranges) */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                              <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Pengaturan Dasar Level {rubrik.level}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Predikat (e.g., Initiate)</label>
                                  <Input value={rubrik.predikat} onChange={(e) => updateRubrik(idx, "predikat", e.target.value)} className="bg-white" />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Batas Bawah</label>
                                  <Input type="number" step="0.01" value={rubrik.batas_bawah} onChange={(e) => updateRubrik(idx, "batas_bawah", e.target.value)} className="bg-white font-mono" />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Batas Atas</label>
                                  <Input type="number" step="0.01" value={rubrik.batas_atas} onChange={(e) => updateRubrik(idx, "batas_atas", e.target.value)} className="bg-white font-mono" />
                                </div>
                              </div>
                            </div>

                            {/* Detail Content */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
                                <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-3">
                                  <FileText className="h-4 w-4 text-blue-500" /> Kriteria (Deskripsi)
                                </h4>
                                <textarea
                                  value={rubrik.deskripsi}
                                  onChange={(e) => updateRubrik(idx, "deskripsi", e.target.value)}
                                  className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px] resize-none"
                                  placeholder="Masukkan kriteria utama untuk level ini..."
                                />
                              </div>
                              <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
                                <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-3">
                                  <Activity className="h-4 w-4 text-orange-500" /> Kondisi
                                </h4>
                                <textarea
                                  value={rubrik.kondisi || ""}
                                  onChange={(e) => updateRubrik(idx, "kondisi", e.target.value)}
                                  className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[150px] resize-none"
                                  placeholder="Masukkan rincian kondisi (bisa gunakan angka/bullet)..."
                                />
                              </div>
                              <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
                                <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-3">
                                  <BookOpen className="h-4 w-4 text-emerald-500" /> Bukti Dukung
                                </h4>
                                <textarea
                                  value={rubrik.bukti_dukung || ""}
                                  onChange={(e) => updateRubrik(idx, "bukti_dukung", e.target.value)}
                                  className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[150px] resize-none"
                                  placeholder="Masukkan daftar bukti dukung yang disyaratkan..."
                                />
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    /* Matrix View */
                    <div className="space-y-6">
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm pb-2">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 w-24 align-bottom bg-white sticky left-0 z-10">Elemen</th>
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
                            {/* Kriteria Row */}
                            <tr>
                              <td className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 bg-white sticky left-0 z-10">Kriteria</td>
                              {[1, 2, 3, 4, 5].map(lvl => {
                                const idx = rubrikData.findIndex(x => x.level === lvl)
                                const r = rubrikData[idx]
                                return (
                                  <td key={`krit-${lvl}`} className="p-4 border-r border-slate-100 bg-white align-top text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {r?.deskripsi || "-"}
                                  </td>
                                )
                              })}
                            </tr>
                            {/* Kondisi Row */}
                            <tr>
                              <td className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 border-t border-slate-100 bg-white sticky left-0 z-10">Kondisi</td>
                              {[1, 2, 3, 4, 5].map(lvl => {
                                const idx = rubrikData.findIndex(x => x.level === lvl)
                                const r = rubrikData[idx]
                                return (
                                  <td key={`kond-${lvl}`} className="p-4 border-r border-slate-100 border-t border-slate-100 bg-white align-top text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {r?.kondisi || "-"}
                                  </td>
                                )
                              })}
                            </tr>
                            {/* Bukti Dukung Row */}
                            <tr>
                              <td className="p-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-r border-slate-100 border-t border-slate-100 bg-white sticky left-0 z-10">Bukti Dukung</td>
                              {[1, 2, 3, 4, 5].map(lvl => {
                                const idx = rubrikData.findIndex(x => x.level === lvl)
                                const r = rubrikData[idx]
                                return (
                                  <td key={`bukt-${lvl}`} className="p-4 border-r border-slate-100 border-t border-slate-100 bg-white align-top text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {r?.bukti_dukung || "-"}
                                  </td>
                                )
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Visual Preview Range Tool */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">
                          Visualisasi Rentang Nilai
                        </p>
                        <div className="flex h-10 rounded-xl overflow-hidden shadow-inner">
                          {[...rubrikData].sort((a, b) => a.level - b.level).map((rubrik) => {
                            const width = ((Number(rubrik.batas_atas) - Number(rubrik.batas_bawah)) / 4) * 100
                            const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"]
                            return (
                              <div
                                key={rubrik.id}
                                className={cn("flex items-center justify-center text-xs font-bold text-white transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]", colors[rubrik.level - 1])}
                                style={{ width: `${width}%` }}
                                title={`Level ${rubrik.level}: ${rubrik.batas_bawah} - ${rubrik.batas_atas}`}
                              >
                                L{rubrik.level}
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400">
                          <span>1.00</span>
                          <span>2.00</span>
                          <span>3.00</span>
                          <span>4.00</span>
                          <span>5.00</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center border border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50/50 text-slate-400 font-semibold">
                  Pilih indikator di panel kiri untuk mengatur rubrik level
                </div>
              )}
            </div>
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
                  <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-dashed">
                    <input
                      type="number"
                      placeholder="Tahun (e.g. 2026)"
                      className="flex h-8 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newSpbe.tahun}
                      onChange={(e) => setNewSpbe({ ...newSpbe, tahun: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Indeks (e.g. 3.4)"
                      className="flex h-8 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newSpbe.indeks}
                      onChange={(e) => setNewSpbe({ ...newSpbe, indeks: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Kategori (e.g. Baik)"
                      className="flex h-8 flex-1 min-w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newSpbe.kategori}
                      onChange={(e) => setNewSpbe({ ...newSpbe, kategori: e.target.value })}
                    />
                    <Button onClick={handleAddSpbe} size="sm" className="h-8 text-xs shrink-0 w-full sm:w-auto">
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
                          <TableHead className="py-2 text-[10px] font-bold text-center">Kategori</TableHead>
                          <TableHead className="py-2 text-[10px] font-bold text-right w-[60px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {landingContent.spbe_trend.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6 italic">Belum ada data</TableCell>
                          </TableRow>
                        ) : (
                          landingContent.spbe_trend.map(item => (
                            <TableRow key={item.id} className="text-xs">
                              <TableCell className="py-2 font-semibold text-slate-800">{item.tahun}</TableCell>
                              <TableCell className="py-2 font-mono text-center font-bold text-teal-600">{item.indeks}</TableCell>
                              <TableCell className="py-2 text-center text-muted-foreground">{item.kategori || '-'}</TableCell>
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
                  <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-dashed">
                    <input
                      type="number"
                      placeholder="Tahun (e.g. 2026)"
                      className="flex h-8 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newPemdi.tahun}
                      onChange={(e) => setNewPemdi({ ...newPemdi, tahun: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Indeks (e.g. 3.4)"
                      className="flex h-8 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newPemdi.indeks}
                      onChange={(e) => setNewPemdi({ ...newPemdi, indeks: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Kategori (e.g. Baik)"
                      className="flex h-8 flex-1 min-w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={newPemdi.kategori}
                      onChange={(e) => setNewPemdi({ ...newPemdi, kategori: e.target.value })}
                    />
                    <Button onClick={handleAddPemdi} size="sm" className="h-8 text-xs shrink-0 w-full sm:w-auto">
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
                          <TableHead className="py-2 text-[10px] font-bold text-center">Kategori</TableHead>
                          <TableHead className="py-2 text-[10px] font-bold text-right w-[60px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {landingContent.pemdi_trend.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6 italic">Belum ada data</TableCell>
                          </TableRow>
                        ) : (
                          landingContent.pemdi_trend.map(item => (
                            <TableRow key={item.id} className="text-xs">
                              <TableCell className="py-2 font-semibold text-slate-800">{item.tahun}</TableCell>
                              <TableCell className="py-2 font-mono text-center font-bold text-indigo-600">{item.indeks}</TableCell>
                              <TableCell className="py-2 text-center text-muted-foreground">{item.kategori || '-'}</TableCell>
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
