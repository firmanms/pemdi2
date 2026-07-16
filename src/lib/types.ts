// ============================================================
// TypeScript Types for Indeks Pemerintah Digital
// ============================================================

// ---- Enums ----
export type UserRole = 'super_admin' | 'admin_pemda' | 'perangkat_daerah' | 'viewer'
export type PenilaianStatus = 'draft' | 'terkirim'
export type PenilaianFinalStatus = 'draft' | 'disetor' | 'dikembalikan' | 'disetujui'
export type PeriodeStatus = 'draft' | 'dibuka' | 'ditutup' | 'final'
export type TingkatInstansi = 'provinsi' | 'kabupaten' | 'kota'

// ---- Database Row Types ----

export interface Instansi {
  id: string
  nama: string
  kode: string
  tingkat: TingkatInstansi
  created_at: string
}

export interface PerangkatDaerah {
  id: string
  instansi_id: string
  nama: string
  kode: string
  jenis: string
  created_at: string
}

export interface UserProfile {
  id: string
  auth_id: string
  instansi_id: string | null
  perangkat_daerah_id: string | null
  nama: string
  email: string
  role: UserRole
  created_at: string
  // Joined fields
  instansi?: Instansi
  perangkat_daerah?: PerangkatDaerah
}

export interface PeriodeAsesmen {
  id: string
  instansi_id: string
  tahun: number
  nama: string
  status: PeriodeStatus
  tanggal_mulai: string
  tanggal_selesai: string
  created_at: string
}

export interface Aspek {
  id: string
  kode: string
  nama: string
  deskripsi?: string
  bobot: number
  urutan: number
  created_at: string
  // Joined fields
  indikators?: Indikator[]
}

export interface Indikator {
  id: string
  aspek_id: string
  kode: string
  nama: string
  deskripsi?: string
  bobot: number
  urutan: number
  created_at: string
  // Joined fields
  aspek?: Aspek
  rubrik_levels?: RubrikLevel[]
  pengampus?: IndikatorPengampu[]
}

export interface IndikatorPengampu {
  id: string
  periode_id: string
  indikator_id: string
  perangkat_daerah_id: string
  created_at: string
  // Joined fields
  perangkat_daerah?: PerangkatDaerah
  indikator?: Indikator
}

export interface RubrikLevel {
  id: string
  indikator_id: string
  level: number
  predikat: string
  batas_bawah: number
  batas_atas: number
  deskripsi: string
  kondisi?: string
  bukti_dukung?: string
  created_at: string
}

export interface PenilaianOPD {
  id: string
  periode_id: string
  indikator_id: string
  perangkat_daerah_id: string
  skor: number | null
  justifikasi: string
  status: PenilaianStatus
  disimpan_at: string
  created_at: string
  // Joined fields
  indikator?: Indikator
  perangkat_daerah?: PerangkatDaerah
  bukti_dukungs?: BuktiDukung[]
}

export interface PenilaianFinal {
  id: string
  periode_id: string
  indikator_id: string
  skor_final: number | null
  justifikasi_konsolidasi: string
  ditetapkan_oleh_pd_id: string
  ditetapkan_oleh_user_id: string
  status: PenilaianFinalStatus
  catatan_revisi: string
  direview_oleh: string | null
  direview_at: string | null
  created_at: string
  // Joined fields
  indikator?: Indikator
  perangkat_daerah?: PerangkatDaerah
  bukti_dukungs?: BuktiDukung[]
}

export interface BuktiDukung {
  id: string
  penilaian_opd_id: string | null
  penilaian_final_id: string | null
  file_url: string
  nama_file: string
  keterangan: string
  created_at: string
}

export interface AuditLog {
  id: string
  ref_table: string
  ref_id: string
  user_id: string
  aksi: string
  nilai_lama: string | null
  nilai_baru: string | null
  created_at: string
  // Joined
  user?: UserProfile
}

// ---- Computed / View Types ----

export interface IndikatorScore {
  indikator_id: string
  indikator_kode: string
  indikator_nama: string
  aspek_id: string
  aspek_nama: string
  bobot: number
  skor: number // 1-5
  skor_100: number // 0-100
  kontribusi: number // weighted contribution
  level: number
  predikat: string
}

export interface AspekScore {
  aspek_id: string
  aspek_kode: string
  aspek_nama: string
  bobot: number
  nilai: number // aggregated score (0-100 range contribution)
  skor_1_5: number // converted back to 1-5
  level: number
  predikat: string
}

export interface IndeksResult {
  indeks: number // 0-100 final index
  skor_1_5: number // converted to 1-5
  level: number
  predikat: string
  aspek_scores: AspekScore[]
  indikator_scores: IndikatorScore[]
}

// ---- UI-specific Types ----

export interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
  badge?: number
}

export interface DashboardStats {
  totalOPD: number
  progresIsi: number // percentage
  indeksAkhir: number
  periodeAktif: string
  totalIndikator: number
  indikatorDisetujui: number
}

export interface TrendDataPoint {
  periode: string
  tahun: number
  indeks: number
}
