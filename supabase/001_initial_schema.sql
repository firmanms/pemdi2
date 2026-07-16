-- ============================================================
-- 001 Initial Schema — Indeks Pemerintah Digital
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- Instansi (Pemda) ----
CREATE TABLE instansi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(255) NOT NULL,
  kode VARCHAR(50) UNIQUE NOT NULL,
  tingkat VARCHAR(20) NOT NULL CHECK (tingkat IN ('provinsi', 'kabupaten', 'kota')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Perangkat Daerah (OPD) ----
CREATE TABLE perangkat_daerah (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instansi_id UUID NOT NULL REFERENCES instansi(id) ON DELETE CASCADE,
  nama VARCHAR(255) NOT NULL,
  kode VARCHAR(50) NOT NULL,
  jenis VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instansi_id, kode)
);

-- ---- Users (linked to Supabase Auth) ----
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- references auth.users(id)
  instansi_id UUID REFERENCES instansi(id) ON DELETE SET NULL,
  perangkat_daerah_id UUID REFERENCES perangkat_daerah(id) ON DELETE SET NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('super_admin', 'admin_pemda', 'perangkat_daerah', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Periode Asesmen ----
CREATE TABLE periode_asesmen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instansi_id UUID NOT NULL REFERENCES instansi(id) ON DELETE CASCADE,
  tahun INT NOT NULL,
  nama VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'persiapan' CHECK (status IN ('persiapan', 'aktif', 'selesai', 'ditutup')),
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Aspek (7 aspek) ----
CREATE TABLE aspek (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  bobot NUMERIC(5,4) NOT NULL CHECK (bobot >= 0 AND bobot <= 1),
  urutan INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Indikator (20 indikator) ----
CREATE TABLE indikator (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aspek_id UUID NOT NULL REFERENCES aspek(id) ON DELETE CASCADE,
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama VARCHAR(500) NOT NULL,
  bobot NUMERIC(6,4) NOT NULL CHECK (bobot >= 0 AND bobot <= 1),
  urutan INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Indikator Pengampu (many-to-many) ----
CREATE TABLE indikator_pengampu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periode_id UUID NOT NULL REFERENCES periode_asesmen(id) ON DELETE CASCADE,
  indikator_id UUID NOT NULL REFERENCES indikator(id) ON DELETE CASCADE,
  perangkat_daerah_id UUID NOT NULL REFERENCES perangkat_daerah(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(periode_id, indikator_id, perangkat_daerah_id)
);

-- ---- Rubrik Level (5 per indikator, configurable) ----
CREATE TABLE rubrik_level (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indikator_id UUID NOT NULL REFERENCES indikator(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level >= 1 AND level <= 5),
  predikat VARCHAR(100) NOT NULL,
  batas_bawah NUMERIC(4,2) NOT NULL CHECK (batas_bawah >= 1 AND batas_bawah <= 5),
  batas_atas NUMERIC(4,2) NOT NULL CHECK (batas_atas >= 1 AND batas_atas <= 5),
  deskripsi TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(indikator_id, level),
  CHECK (batas_bawah <= batas_atas)
);

-- ---- Penilaian OPD (self-assessment) ----
CREATE TABLE penilaian_opd (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periode_id UUID NOT NULL REFERENCES periode_asesmen(id) ON DELETE CASCADE,
  indikator_id UUID NOT NULL REFERENCES indikator(id) ON DELETE CASCADE,
  perangkat_daerah_id UUID NOT NULL REFERENCES perangkat_daerah(id) ON DELETE CASCADE,
  skor NUMERIC(3,2) CHECK (skor IS NULL OR (skor >= 1 AND skor <= 5)),
  justifikasi TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'terkirim')),
  disimpan_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(periode_id, indikator_id, perangkat_daerah_id)
);

-- ---- Penilaian Final (consolidated by OPD Pengampu) ----
CREATE TABLE penilaian_final (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periode_id UUID NOT NULL REFERENCES periode_asesmen(id) ON DELETE CASCADE,
  indikator_id UUID NOT NULL REFERENCES indikator(id) ON DELETE CASCADE,
  skor_final NUMERIC(3,2) CHECK (skor_final IS NULL OR (skor_final >= 1 AND skor_final <= 5)),
  justifikasi_konsolidasi TEXT DEFAULT '',
  ditetapkan_oleh_perangkat_daerah_id UUID REFERENCES perangkat_daerah(id),
  ditetapkan_oleh_user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'disetor', 'dikembalikan', 'disetujui')),
  catatan_review TEXT DEFAULT '',
  direview_oleh UUID REFERENCES users(id),
  direview_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(periode_id, indikator_id)
);

-- ---- Bukti Dukung ----
CREATE TABLE bukti_dukung (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  penilaian_opd_id UUID REFERENCES penilaian_opd(id) ON DELETE CASCADE,
  penilaian_final_id UUID REFERENCES penilaian_final(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  nama_file VARCHAR(255) DEFAULT '',
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (penilaian_opd_id IS NOT NULL OR penilaian_final_id IS NOT NULL)
);

-- ---- Audit Log ----
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_table VARCHAR(100) NOT NULL,
  ref_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  aksi VARCHAR(50) NOT NULL,
  nilai_lama JSONB,
  nilai_baru JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Indexes ----
CREATE INDEX idx_perangkat_daerah_instansi ON perangkat_daerah(instansi_id);
CREATE INDEX idx_users_instansi ON users(instansi_id);
CREATE INDEX idx_users_pd ON users(perangkat_daerah_id);
CREATE INDEX idx_penilaian_opd_periode ON penilaian_opd(periode_id);
CREATE INDEX idx_penilaian_opd_indikator ON penilaian_opd(indikator_id);
CREATE INDEX idx_penilaian_opd_pd ON penilaian_opd(perangkat_daerah_id);
CREATE INDEX idx_penilaian_final_periode ON penilaian_final(periode_id);
CREATE INDEX idx_penilaian_final_indikator ON penilaian_final(indikator_id);
CREATE INDEX idx_audit_log_ref ON audit_log(ref_table, ref_id);
CREATE INDEX idx_rubrik_level_indikator ON rubrik_level(indikator_id);
CREATE INDEX idx_indikator_pengampu_periode ON indikator_pengampu(periode_id);
