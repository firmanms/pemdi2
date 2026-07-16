// ============================================================
// Demo Data — Indeks Pemerintah Digital
// Used for UI development before Supabase integration is complete
// ============================================================

import type {
  Aspek,
  Indikator,
  RubrikLevel,
  PenilaianOPD,
  PenilaianFinal,
  PerangkatDaerah,
  PeriodeAsesmen,
  DashboardStats,
  TrendDataPoint,
  IndeksResult,
  AspekScore,
  IndikatorScore,
  UserProfile,
} from './types'

// ---- 7 Aspek with Bobot ----
export const demoAspeks: Aspek[] = [
  { id: 'a1', kode: 'A1', nama: 'Tata Kelola & Manajemen', bobot: 0.10, urutan: 1, created_at: '' },
  { id: 'a2', kode: 'A2', nama: 'Penyelenggara', bobot: 0.10, urutan: 2, created_at: '' },
  { id: 'a3', kode: 'A3', nama: 'Data', bobot: 0.15, urutan: 3, created_at: '' },
  { id: 'a4', kode: 'A4', nama: 'Keamanan Siber', bobot: 0.15, urutan: 4, created_at: '' },
  { id: 'a5', kode: 'A5', nama: 'Teknologi Digital', bobot: 0.10, urutan: 5, created_at: '' },
  { id: 'a6', kode: 'A6', nama: 'Keterpaduan Layanan Digital', bobot: 0.15, urutan: 6, created_at: '' },
  { id: 'a7', kode: 'A7', nama: 'Kepuasan Pengguna Layanan Digital', bobot: 0.25, urutan: 7, created_at: '' },
]

// ---- 20 Indikators mapped to Aspek ----
export const demoIndikators: Indikator[] = [
  // A1 - Tata Kelola & Manajemen (10%)
  { id: 'i1', aspek_id: 'a1', kode: 'I01', nama: 'Kebijakan Internal Tata Kelola Pemerintah Digital', bobot: 0.025, urutan: 1, created_at: '' },
  { id: 'i2', aspek_id: 'a1', kode: 'I02', nama: 'Perencanaan Strategis Pemerintah Digital', bobot: 0.025, urutan: 2, created_at: '' },
  { id: 'i3', aspek_id: 'a1', kode: 'I03', nama: 'Manajemen Penganggaran TIK', bobot: 0.025, urutan: 3, created_at: '' },
  { id: 'i4', aspek_id: 'a1', kode: 'I04', nama: 'Manajemen Risiko TIK', bobot: 0.025, urutan: 4, created_at: '' },
  // A2 - Penyelenggara (10%)
  { id: 'i5', aspek_id: 'a2', kode: 'I05', nama: 'Kepemimpinan Digital', bobot: 0.05, urutan: 5, created_at: '' },
  { id: 'i6', aspek_id: 'a2', kode: 'I06', nama: 'SDM TIK', bobot: 0.05, urutan: 6, created_at: '' },
  // A3 - Data (15%)
  { id: 'i7', aspek_id: 'a3', kode: 'I07', nama: 'Tata Kelola Data', bobot: 0.05, urutan: 7, created_at: '' },
  { id: 'i8', aspek_id: 'a3', kode: 'I08', nama: 'Manajemen Data', bobot: 0.05, urutan: 8, created_at: '' },
  { id: 'i9', aspek_id: 'a3', kode: 'I09', nama: 'Interoperabilitas Data', bobot: 0.05, urutan: 9, created_at: '' },
  // A4 - Keamanan Siber (15%)
  { id: 'i10', aspek_id: 'a4', kode: 'I10', nama: 'Kebijakan Keamanan Informasi', bobot: 0.05, urutan: 10, created_at: '' },
  { id: 'i11', aspek_id: 'a4', kode: 'I11', nama: 'Penerapan Keamanan Informasi', bobot: 0.05, urutan: 11, created_at: '' },
  { id: 'i12', aspek_id: 'a4', kode: 'I12', nama: 'Pelindungan Data Pribadi', bobot: 0.05, urutan: 12, created_at: '' },
  // A5 - Teknologi Digital (10%)
  { id: 'i13', aspek_id: 'a5', kode: 'I13', nama: 'Infrastruktur TIK', bobot: 0.034, urutan: 13, created_at: '' },
  { id: 'i14', aspek_id: 'a5', kode: 'I14', nama: 'Sistem Aplikasi', bobot: 0.033, urutan: 14, created_at: '' },
  { id: 'i15', aspek_id: 'a5', kode: 'I15', nama: 'Penggunaan Teknologi Baru', bobot: 0.033, urutan: 15, created_at: '' },
  // A6 - Keterpaduan Layanan Digital (15%)
  { id: 'i16', aspek_id: 'a6', kode: 'I16', nama: 'Layanan Digital Administrasi Pemerintahan', bobot: 0.05, urutan: 16, created_at: '' },
  { id: 'i17', aspek_id: 'a6', kode: 'I17', nama: 'Layanan Digital Pelayanan Publik', bobot: 0.05, urutan: 17, created_at: '' },
  { id: 'i18', aspek_id: 'a6', kode: 'I18', nama: 'Integrasi Layanan Digital', bobot: 0.05, urutan: 18, created_at: '' },
  // A7 - Kepuasan Pengguna (25%)
  { id: 'i19', aspek_id: 'a7', kode: 'I19', nama: 'Kepuasan Pengguna Internal', bobot: 0.125, urutan: 19, created_at: '' },
  { id: 'i20', aspek_id: 'a7', kode: 'I20', nama: 'Kepuasan Pengguna Eksternal', bobot: 0.125, urutan: 20, created_at: '' },
]

// ---- Default Rubrik Level (same for all indicators as default) ----
export function generateDefaultRubrik(indikatorId: string): RubrikLevel[] {
  return [
    { id: `r-${indikatorId}-1`, indikator_id: indikatorId, level: 1, predikat: 'Kurang', batas_bawah: 1.0, batas_atas: 1.49, deskripsi: 'Belum ada inisiasi', created_at: '' },
    { id: `r-${indikatorId}-2`, indikator_id: indikatorId, level: 2, predikat: 'Cukup', batas_bawah: 1.5, batas_atas: 2.49, deskripsi: 'Sudah ada inisiasi awal', created_at: '' },
    { id: `r-${indikatorId}-3`, indikator_id: indikatorId, level: 3, predikat: 'Baik', batas_bawah: 2.5, batas_atas: 3.49, deskripsi: 'Sudah berjalan namun belum optimal', created_at: '' },
    { id: `r-${indikatorId}-4`, indikator_id: indikatorId, level: 4, predikat: 'Sangat Baik', batas_bawah: 3.5, batas_atas: 4.49, deskripsi: 'Sudah berjalan dengan baik dan terukur', created_at: '' },
    { id: `r-${indikatorId}-5`, indikator_id: indikatorId, level: 5, predikat: 'Memuaskan', batas_bawah: 4.5, batas_atas: 5.0, deskripsi: 'Sudah optimal dan menjadi contoh', created_at: '' },
  ]
}

// ---- Demo Perangkat Daerah ----
export const demoPerangkatDaerah: PerangkatDaerah[] = [
  { id: 'pd1', instansi_id: 'inst1', nama: 'Dinas Komunikasi dan Informatika', kode: 'DISKOMINFO', jenis: 'Dinas', created_at: '' },
  { id: 'pd2', instansi_id: 'inst1', nama: 'Badan Perencanaan Pembangunan Daerah', kode: 'BAPPEDA', jenis: 'Badan', created_at: '' },
  { id: 'pd3', instansi_id: 'inst1', nama: 'Dinas Kesehatan', kode: 'DINKES', jenis: 'Dinas', created_at: '' },
  { id: 'pd4', instansi_id: 'inst1', nama: 'Dinas Pendidikan', kode: 'DISDIK', jenis: 'Dinas', created_at: '' },
  { id: 'pd5', instansi_id: 'inst1', nama: 'Dinas Kependudukan dan Pencatatan Sipil', kode: 'DISDUKCAPIL', jenis: 'Dinas', created_at: '' },
  { id: 'pd6', instansi_id: 'inst1', nama: 'Badan Kepegawaian Daerah', kode: 'BKD', jenis: 'Badan', created_at: '' },
  { id: 'pd7', instansi_id: 'inst1', nama: 'Dinas Penanaman Modal dan PTSP', kode: 'DPMPTSP', jenis: 'Dinas', created_at: '' },
  { id: 'pd8', instansi_id: 'inst1', nama: 'Sekretariat Daerah', kode: 'SETDA', jenis: 'Sekretariat', created_at: '' },
]

// ---- Demo User ----
export const demoUser: UserProfile = {
  id: 'u1',
  auth_id: 'auth1',
  instansi_id: 'inst1',
  perangkat_daerah_id: 'pd1',
  nama: 'Admin DISKOMINFO',
  email: 'admin@diskominfo.go.id',
  role: 'admin_pemda',
  created_at: '',
}

// ---- Demo Periode ----
export const demoPeriode: PeriodeAsesmen = {
  id: 'per1',
  instansi_id: 'inst1',
  tahun: 2026,
  nama: 'Evaluasi Semester 1 2026',
  status: 'dibuka',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-06-30',
  created_at: '',
}

// ---- Demo Scores for Dashboard ----
const demoSkorFinal: Record<string, number> = {
  i1: 3.7, i2: 3.2, i3: 2.8, i4: 3.5,
  i5: 4.1, i6: 3.6,
  i7: 3.9, i8: 3.4, i9: 2.6,
  i10: 4.2, i11: 3.8, i12: 3.3,
  i13: 3.1, i14: 3.5, i15: 2.9,
  i16: 3.6, i17: 4.0, i18: 3.2,
  i19: 3.8, i20: 4.1,
}

export function calculateDemoIndeks(): IndeksResult {
  const defaultRubrik = generateDefaultRubrik('default')

  const indikatorScores: IndikatorScore[] = demoIndikators.map((ind) => {
    const skor = demoSkorFinal[ind.id] || 1.0
    const skor100 = (skor / 5) * 100
    const kontribusi = skor100 * ind.bobot
    const { level, predikat } = getDefaultPredikatLocal(skor)
    return {
      indikator_id: ind.id,
      indikator_kode: ind.kode,
      indikator_nama: ind.nama,
      aspek_id: ind.aspek_id,
      aspek_nama: demoAspeks.find(a => a.id === ind.aspek_id)?.nama || '',
      bobot: ind.bobot,
      skor,
      skor_100: skor100,
      kontribusi,
      level,
      predikat,
    }
  })

  const aspekScores: AspekScore[] = demoAspeks.map((aspek) => {
    const indScores = indikatorScores.filter(s => s.aspek_id === aspek.id)
    const nilai = indScores.reduce((sum, s) => sum + s.kontribusi, 0)
    const avgSkor = indScores.length > 0
      ? indScores.reduce((sum, s) => sum + s.skor, 0) / indScores.length
      : 0
    const { level, predikat } = getDefaultPredikatLocal(avgSkor)
    return {
      aspek_id: aspek.id,
      aspek_kode: aspek.kode,
      aspek_nama: aspek.nama,
      bobot: aspek.bobot,
      nilai,
      skor_1_5: avgSkor,
      level,
      predikat,
    }
  })

  const indeks = aspekScores.reduce((sum, a) => sum + a.nilai, 0)
  const skor_1_5 = (indeks / 100) * 5
  const { level, predikat } = getDefaultPredikatLocal(skor_1_5)

  return { indeks, skor_1_5, level, predikat, aspek_scores: aspekScores, indikator_scores: indikatorScores }
}

function getDefaultPredikatLocal(skor: number) {
  if (skor >= 4.5) return { level: 5, predikat: 'Memuaskan' }
  if (skor >= 3.5) return { level: 4, predikat: 'Sangat Baik' }
  if (skor >= 2.5) return { level: 3, predikat: 'Baik' }
  if (skor >= 1.5) return { level: 2, predikat: 'Cukup' }
  return { level: 1, predikat: 'Kurang' }
}

// ---- Demo Dashboard Stats ----
export const demoDashboardStats: DashboardStats = {
  totalOPD: 8,
  progresIsi: 62.5,
  indeksAkhir: calculateDemoIndeks().indeks,
  periodeAktif: 'Semester 1 2026',
  totalIndikator: 20,
  indikatorDisetujui: 12,
}

// ---- Demo Trend Data ----
export const demoTrendData: TrendDataPoint[] = [
  { periode: 'S1 2023', tahun: 2023, indeks: 48.5 },
  { periode: 'S2 2023', tahun: 2023, indeks: 52.3 },
  { periode: 'S1 2024', tahun: 2024, indeks: 56.8 },
  { periode: 'S2 2024', tahun: 2024, indeks: 61.2 },
  { periode: 'S1 2025', tahun: 2025, indeks: 65.7 },
  { periode: 'S2 2025', tahun: 2025, indeks: 68.4 },
  { periode: 'S1 2026', tahun: 2026, indeks: calculateDemoIndeks().indeks },
]

// ---- Demo Penilaian OPD (self-assessment samples) ----
export function generateDemoPenilaianOPD(): PenilaianOPD[] {
  const penilaians: PenilaianOPD[] = []
  const statuses: Array<'draft' | 'terkirim'> = ['terkirim', 'terkirim', 'terkirim', 'draft', 'terkirim', 'draft', 'terkirim', 'terkirim']

  demoPerangkatDaerah.forEach((pd, pdIdx) => {
    demoIndikators.forEach((ind) => {
      const baseSkor = demoSkorFinal[ind.id] || 3.0
      const variation = (Math.random() - 0.5) * 1.2
      const skor = Math.max(1, Math.min(5, +(baseSkor + variation).toFixed(2)))
      penilaians.push({
        id: `po-${pd.id}-${ind.id}`,
        periode_id: 'per1',
        indikator_id: ind.id,
        perangkat_daerah_id: pd.id,
        skor,
        justifikasi: `Justifikasi penilaian ${ind.nama} oleh ${pd.nama}`,
        status: statuses[pdIdx],
        disimpan_at: '2026-03-15',
        created_at: '2026-03-15',
      })
    })
  })

  return penilaians
}

// ---- Demo Penilaian Final ----
export function generateDemoPenilaianFinal(): PenilaianFinal[] {
  const statuses: PenilaianFinalStatus[] = [
    'disetujui', 'disetujui', 'disetujui', 'disetujui',
    'disetujui', 'disetujui', 'disetujui', 'disetujui',
    'disetujui', 'disetujui', 'disetor', 'disetor',
    'disetujui', 'disetujui', 'dikembalikan', 'disetor',
    'disetujui', 'disetujui', 'draft', 'draft',
  ]

  return demoIndikators.map((ind, idx) => ({
    id: `pf-${ind.id}`,
    periode_id: 'per1',
    indikator_id: ind.id,
    skor_final: demoSkorFinal[ind.id] || null,
    justifikasi_konsolidasi: `Hasil konsolidasi untuk ${ind.nama} berdasarkan rata-rata dan musyawarah OPD pengampu.`,
    ditetapkan_oleh_pd_id: 'pd1',
    ditetapkan_oleh_user_id: 'u1',
    status: statuses[idx] || 'draft',
    catatan_revisi: statuses[idx] === 'dikembalikan' ? 'Mohon lengkapi bukti dukung untuk sub-indikator 3.' : '',
    direview_oleh: statuses[idx] === 'disetujui' ? 'u1' : null,
    direview_at: statuses[idx] === 'disetujui' ? '2026-04-15' : null,
    created_at: '2026-03-20',
  }))
}

type PenilaianFinalStatus = 'draft' | 'disetor' | 'dikembalikan' | 'disetujui'
