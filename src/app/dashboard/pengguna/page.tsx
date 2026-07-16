"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  UserPlus,
  X,
  Building,
  Shield,
  Mail,
  User as UserIcon,
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
import { Label } from "@/components/ui/label"
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
import { useAuth } from "@/context/auth-context"
import type { PerangkatDaerah, Indikator, UserRole } from "@/lib/types"

interface ProfileRow {
  id: string
  nama: string
  email: string
  role: UserRole
  perangkat_daerah_id: string | null
  perangkat_daerah?: { nama: string } | null
  is_active: boolean
}

interface PengampuRow {
  id: string
  indikator_id: string
  indikator_kode: string
  indikator_nama: string
  opds: { assignment_id: string; nama: string }[]
}

const roleLabels: Record<UserRole, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
  admin_pemda: { label: "Admin Pemda", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  perangkat_daerah: { label: "Perangkat Daerah", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  viewer: { label: "Viewer", className: "bg-gray-500/15 text-gray-600 dark:text-gray-400" },
}

export default function PenggunaPage() {
  const { activePeriode } = useAuth()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [opds, setOpds] = useState<PerangkatDaerah[]>([])
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [pengampuList, setPengampuList] = useState<PengampuRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // --- Modal States ---
  const [userModal, setUserModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    id?: string
    nama: string
    email: string
    role: UserRole
    pdId: string
  }>({
    isOpen: false,
    mode: 'add',
    nama: '',
    email: '',
    role: 'perangkat_daerah',
    pdId: ''
  })

  const [opdModal, setOpdModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    id?: string
    nama: string
    kode: string
    jenis: string
  }>({
    isOpen: false,
    mode: 'add',
    nama: '',
    kode: '',
    jenis: 'Dinas'
  })

  const [pengampuModal, setPengampuModal] = useState<{
    isOpen: boolean
    indicatorId: string
    indicatorKode: string
    indicatorNama: string
    selectedPdId: string
  }>({
    isOpen: false,
    indicatorId: '',
    indicatorKode: '',
    indicatorNama: '',
    selectedPdId: ''
  })

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    id: string
    type: 'user' | 'opd' | 'pengampu'
    title: string
    description: string
  }>({
    isOpen: false,
    id: '',
    type: 'user',
    title: '',
    description: ''
  })

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // 1. Fetch profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select(`
          id,
          nama,
          email,
          role,
          is_active,
          perangkat_daerah_id,
          perangkat_daerah:perangkat_daerah_id (
            nama
          )
        `)
      setProfiles((profData || []) as any)

      // 2. Fetch OPDs
      const { data: opdData } = await supabase.from('perangkat_daerah').select('*').order('nama')
      setOpds(opdData || [])

      // 3. Fetch Indikators
      const { data: indData } = await supabase.from('indikator').select('*').order('urutan')
      setIndikators(indData || [])

      // 4. Fetch Pengampus
      const { data: pengData } = await supabase
        .from('indikator_pengampu')
        .select(`
          id,
          indikator_id,
          perangkat_daerah:perangkat_daerah_id (
            nama
          )
        `)
      
      const mappedPengampu: Record<string, { assignment_id: string; nama: string }[]> = {}
      pengData?.forEach((p: any) => {
        if (!mappedPengampu[p.indikator_id]) {
          mappedPengampu[p.indikator_id] = []
        }
        if (p.perangkat_daerah?.nama) {
          mappedPengampu[p.indikator_id].push({
            assignment_id: p.id,
            nama: p.perangkat_daerah.nama
          })
        }
      })

      const formattedPengampu: PengampuRow[] = (indData || []).map(ind => ({
        id: ind.id,
        indikator_id: ind.id,
        indikator_kode: ind.kode,
        indikator_nama: ind.nama,
        opds: mappedPengampu[ind.id] || []
      }))
      setPengampuList(formattedPengampu)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // --- CRUD Handlers ---

  const handleSaveUser = async () => {
    const { mode, id, nama, email, role, pdId } = userModal
    if (!nama.trim() || !email.trim()) {
      alert("Nama dan email wajib diisi!")
      return
    }

    try {
      const payload = {
        nama,
        email,
        role,
        perangkat_daerah_id: role === 'perangkat_daerah' ? (pdId || null) : null,
        instansi_id: 'd1000000-0000-0000-0000-000000000001',
        is_active: true
      }

      if (mode === 'add') {
        const { error } = await supabase.from('profiles').insert([payload])
        if (error) throw error
        alert("Pengguna baru berhasil ditambahkan!")
      } else {
        const { error } = await supabase.from('profiles').update(payload).eq('id', id)
        if (error) throw error
        alert("Profil pengguna berhasil diperbarui!")
      }

      setUserModal({ ...userModal, isOpen: false })
      loadData()
    } catch (e: any) {
      alert("Gagal menyimpan pengguna: " + e.message)
    }
  }

  const confirmDeleteUser = (id: string, nama: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      type: 'user',
      title: 'Hapus Pengguna',
      description: `Apakah Anda yakin ingin menghapus pengguna "${nama}"? Data yang sudah dihapus tidak dapat dikembalikan.`
    })
  }

  const handleToggleUser = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      if (error) throw error
      alert("Status pengguna berhasil diubah!")
      loadData()
    } catch (e: any) {
      alert("Gagal mengubah status pengguna: " + e.message)
    }
  }

  const handleSaveOPD = async () => {
    const { mode, id, nama, kode, jenis } = opdModal
    if (!nama.trim() || !kode.trim()) {
      alert("Nama dan kode OPD wajib diisi!")
      return
    }

    try {
      const payload = {
        instansi_id: 'd1000000-0000-0000-0000-000000000001',
        nama,
        kode: kode.toUpperCase().trim(),
        jenis
      }

      if (mode === 'add') {
        const { error } = await supabase.from('perangkat_daerah').insert([payload])
        if (error) throw error
        alert("OPD baru berhasil ditambahkan!")
      } else {
        const { error } = await supabase.from('perangkat_daerah').update(payload).eq('id', id)
        if (error) throw error
        alert("Perangkat daerah berhasil diperbarui!")
      }

      setOpdModal({ ...opdModal, isOpen: false })
      loadData()
    } catch (e: any) {
      alert("Gagal menyimpan OPD: " + e.message)
    }
  }

  const confirmDeleteOPD = (id: string, nama: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      type: 'opd',
      title: 'Hapus Perangkat Daerah',
      description: `Apakah Anda yakin ingin menghapus OPD "${nama}"? Seluruh data penilaian yang terkait juga akan terhapus.`
    })
  }

  const confirmDeletePengampu = (assignment_id: string, opd_nama: string, ind_nama: string) => {
    setDeleteModal({
      isOpen: true,
      id: assignment_id,
      type: 'pengampu',
      title: 'Hapus Penetapan Pengampu',
      description: `Apakah Anda yakin ingin menghapus "${opd_nama}" dari pengampu indikator "${ind_nama}"?`
    })
  }

  const executeDelete = async () => {
    const { id, type } = deleteModal
    try {
      if (type === 'user') {
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) throw error
      } else if (type === 'opd') {
        const { error } = await supabase.from('perangkat_daerah').delete().eq('id', id)
        if (error) throw error
      } else if (type === 'pengampu') {
        const { error } = await supabase.from('indikator_pengampu').delete().eq('id', id)
        if (error) throw error
      }
      setDeleteModal({ ...deleteModal, isOpen: false })
      loadData()
    } catch (e: any) {
      alert(`Gagal menghapus ${type}: ` + e.message)
    }
  }

  const handleSavePengampu = async () => {
    const { indicatorId, selectedPdId } = pengampuModal
    if (!selectedPdId) return

    try {
      const { error } = await supabase.from('indikator_pengampu').insert([
        {
          periode_id: activePeriode?.id,
          indikator_id: indicatorId,
          perangkat_daerah_id: selectedPdId
        }
      ])
      if (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
          alert(`OPD terpilih sudah ditugaskan sebagai pengampu indikator ini!`)
          return
        }
        throw error
      }
      alert(`Berhasil menetapkan pengampu baru!`)
      setPengampuModal({ ...pengampuModal, isOpen: false })
      loadData()
    } catch (e: any) {
      alert("Gagal menetapkan pengampu: " + e.message)
    }
  }

  const filteredUsers = profiles.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.perangkat_daerah?.nama || "").toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse-subtle">Memuat data pengguna...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in font-sans relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akun pengguna dan penetapan OPD Pengampu
          </p>
        </div>
        <Button
          size="sm"
          className="text-xs"
          onClick={() =>
            setUserModal({
              isOpen: true,
              mode: "add",
              nama: "",
              email: "",
              role: "perangkat_daerah",
              pdId: opds[0]?.id || "",
            })
          }
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Tambah Pengguna
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Daftar Pengguna</TabsTrigger>
          <TabsTrigger value="pengampu">Penetapan Pengampu</TabsTrigger>
          <TabsTrigger value="opd">Perangkat Daerah</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Daftar Pengguna</CardTitle>
                  <CardDescription>{profiles.length} pengguna terdaftar</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengguna..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-foreground bg-transparent text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perangkat Daerah</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-xs text-foreground">{user.nama}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.perangkat_daerah?.nama || "Semua OPD (Admin)"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn("text-[9px]", roleLabels[user.role].className)}>
                          {roleLabels[user.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleUser(user.id, user.is_active)}
                          className="cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        >
                          <Badge variant="secondary" className={cn("text-[9px] border-none", user.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-gray-500/15 text-gray-500")}>
                            {user.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              setUserModal({
                                isOpen: true,
                                mode: "edit",
                                id: user.id,
                                nama: user.nama,
                                email: user.email,
                                role: user.role,
                                pdId: user.perangkat_daerah_id || opds[0]?.id || "",
                              })
                            }
                            title="Edit Pengguna"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => confirmDeleteUser(user.id, user.nama)} title="Hapus Pengguna">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pengampu Tab */}
        <TabsContent value="pengampu">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Penetapan OPD Pengampu per Indikator</CardTitle>
              <CardDescription>
                Setiap indikator memiliki satu atau lebih OPD pengampu yang bertanggung jawab mengonsolidasikan skor final
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Kode</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>OPD Pengampu</TableHead>
                    <TableHead className="text-center w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengampuList.map((item) => (
                    <TableRow key={item.indikator_id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.indikator_kode}
                      </TableCell>
                      <TableCell className="text-xs font-medium md:text-sm text-foreground">{item.indikator_nama}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.opds.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground italic">Belum ditetapkan</span>
                          ) : (
                            item.opds.map((opd) => (
                              <Badge key={opd.assignment_id} variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none pr-1">
                                {opd.nama}
                                <button
                                  className="ml-1 text-primary/70 hover:text-destructive transition-colors cursor-pointer"
                                  onClick={() => confirmDeletePengampu(opd.assignment_id, opd.nama, item.indikator_nama)}
                                  title="Hapus OPD Pengampu"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setPengampuModal({
                              isOpen: true,
                              indicatorId: item.indikator_id,
                              indicatorKode: item.indikator_kode,
                              indicatorNama: item.indikator_nama,
                              selectedPdId: opds[0]?.id || "",
                            })
                          }
                          title="Tambah Pengampu"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPD Tab */}
        <TabsContent value="opd">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Perangkat Daerah</CardTitle>
                  <CardDescription>{opds.length} OPD terdaftar</CardDescription>
                </div>
                <Button size="sm" onClick={() => setOpdModal({ isOpen: true, mode: 'add', nama: '', kode: '', jenis: 'Dinas' })}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah OPD
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Kode</TableHead>
                    <TableHead>Nama OPD</TableHead>
                    <TableHead className="text-center">Jenis</TableHead>
                    <TableHead className="text-center w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opds.map((pd) => (
                    <TableRow key={pd.id}>
                      <TableCell className="font-mono text-xs text-foreground">{pd.kode}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{pd.nama}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[9px] border-none">
                          {pd.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpdModal({ isOpen: true, mode: 'edit', id: pd.id, nama: pd.nama, kode: pd.kode, jenis: pd.jenis })} title="Edit OPD">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => confirmDeleteOPD(pd.id, pd.nama)} title="Hapus OPD">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* ============================================================ */}
      {/* 1. MODAL: TAMBAH / EDIT PENGGUNA */}
      {/* ============================================================ */}
      {mounted && userModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md shadow-2xl border-white/20 glass animate-scale-up text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <div>
                <CardTitle className="text-base text-foreground font-bold flex items-center gap-2">
                  <UserIcon className="h-4.5 w-4.5 text-primary" />
                  {userModal.mode === "add" ? "Tambah Pengguna Baru" : "Edit Profil Pengguna"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Isi detail data pengguna sistem</CardDescription>
              </div>
              <button
                onClick={() => setUserModal({ ...userModal, isOpen: false })}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Nama */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nama Lengkap</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Masukkan nama lengkap"
                    value={userModal.nama}
                    onChange={(e) => setUserModal({ ...userModal, nama: e.target.value })}
                    className="pl-9 text-xs text-foreground bg-transparent border-white/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="nama@instansi.go.id"
                    value={userModal.email}
                    onChange={(e) => setUserModal({ ...userModal, email: e.target.value })}
                    className="pl-9 text-xs text-foreground bg-transparent border-white/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Role Akses
                </Label>
                <select
                  value={userModal.role}
                  onChange={(e) => setUserModal({ ...userModal, role: e.target.value as UserRole })}
                  className="w-full text-xs bg-transparent border border-white/20 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="perangkat_daerah" className="text-black">Perangkat Daerah (OPD Operator)</option>
                  <option value="admin_pemda" className="text-black">Admin Pemda (Kominfo)</option>
                  <option value="viewer" className="text-black">Viewer (Kepala Daerah/Pimpinan)</option>
                  <option value="super_admin" className="text-black">Super Admin</option>
                </select>
              </div>

              {/* OPD Select (If role is perangkat_daerah) */}
              {userModal.role === "perangkat_daerah" && opds.length > 0 && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    Penugasan Instansi (OPD)
                  </Label>
                  <select
                    value={userModal.pdId}
                    onChange={(e) => setUserModal({ ...userModal, pdId: e.target.value })}
                    className="w-full text-xs bg-transparent border border-white/20 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    {opds.map((o) => (
                      <option key={o.id} value={o.id} className="text-black">
                        {o.kode} - {o.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserModal({ ...userModal, isOpen: false })}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button size="sm" onClick={handleSaveUser} className="text-xs">
                  Simpan Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      , document.body)}

      {/* ============================================================ */}
      {/* 2. MODAL: TAMBAH / EDIT PERANGKAT DAERAH (OPD) */}
      {/* ============================================================ */}
      {mounted && opdModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md shadow-2xl border-white/20 glass animate-scale-up text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <div>
                <CardTitle className="text-base text-foreground font-bold flex items-center gap-2">
                  <Building className="h-4.5 w-4.5 text-primary" />
                  {opdModal.mode === "add" ? "Tambah OPD Baru" : "Edit Detail OPD"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Atur detail nama, kode, dan jenis perangkat daerah</CardDescription>
              </div>
              <button
                onClick={() => setOpdModal({ ...opdModal, isOpen: false })}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Nama OPD */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nama Perangkat Daerah</Label>
                <Input
                  placeholder="Contoh: Dinas Perhubungan"
                  value={opdModal.nama}
                  onChange={(e) => setOpdModal({ ...opdModal, nama: e.target.value })}
                  className="text-xs text-foreground bg-transparent border-white/20 focus:border-primary"
                />
              </div>

              {/* Kode Singkatan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Kode Singkat (Huruf Kapital)</Label>
                <Input
                  placeholder="Contoh: DISHUB"
                  value={opdModal.kode}
                  onChange={(e) => setOpdModal({ ...opdModal, kode: e.target.value.toUpperCase() })}
                  className="text-xs font-mono text-foreground bg-transparent border-white/20 focus:border-primary"
                />
              </div>

              {/* Jenis */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Jenis OPD</Label>
                <select
                  value={opdModal.jenis}
                  onChange={(e) => setOpdModal({ ...opdModal, jenis: e.target.value })}
                  className="w-full text-xs bg-transparent border border-white/20 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="Dinas" className="text-black">Dinas</option>
                  <option value="Badan" className="text-black">Badan</option>
                  <option value="Sekretariat" className="text-black">Sekretariat</option>
                  <option value="Inspektorat" className="text-black">Inspektorat</option>
                  <option value="Kecamatan" className="text-black">Kecamatan</option>
                  <option value="Rumah Sakit" className="text-black">Rumah Sakit</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpdModal({ ...opdModal, isOpen: false })}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button size="sm" onClick={handleSaveOPD} className="text-xs">
                  Simpan OPD
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      , document.body)}

      {/* ============================================================ */}
      {/* 3. MODAL: TAMBAH PENGAMPU INDIKATOR */}
      {/* ============================================================ */}
      {mounted && pengampuModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md shadow-2xl border-white/20 glass animate-scale-up text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <div>
                <CardTitle className="text-base text-foreground font-bold flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-primary" />
                  Tetapkan OPD Pengampu
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Indikator: {pengampuModal.indicatorKode} — {pengampuModal.indicatorNama}
                </CardDescription>
              </div>
              <button
                onClick={() => setPengampuModal({ ...pengampuModal, isOpen: false })}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* OPD Select */}
              {opds.length > 0 ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Pilih OPD Pengampu Baru</Label>
                  <select
                    value={pengampuModal.selectedPdId}
                    onChange={(e) => setPengampuModal({ ...pengampuModal, selectedPdId: e.target.value })}
                    className="w-full text-xs bg-transparent border border-white/20 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    {opds.map((o) => (
                      <option key={o.id} value={o.id} className="text-black">
                        {o.kode} - {o.nama}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Belum ada data OPD terdaftar.</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPengampuModal({ ...pengampuModal, isOpen: false })}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button size="sm" onClick={handleSavePengampu} className="text-xs" disabled={opds.length === 0}>
                  Tetapkan Pengampu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      , document.body)}
      {/* ============================================================ */}
      {/* 4. MODAL: KONFIRMASI HAPUS */}
      {/* ============================================================ */}
      {mounted && deleteModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-sm shadow-2xl border-white/20 glass animate-scale-up text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <CardTitle className="text-base text-foreground font-bold flex items-center gap-2">
                <Trash2 className="h-4.5 w-4.5 text-destructive" />
                {deleteModal.title}
              </CardTitle>
              <button
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm text-foreground">{deleteModal.description}</p>
              <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button variant="destructive" size="sm" onClick={executeDelete} className="text-xs">
                  Ya, Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      , document.body)}
    </>
  )
}
