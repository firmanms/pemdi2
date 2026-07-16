-- ============================================================
-- 004 Landing Page Content Schema — Indeks Pemerintah Digital
-- Run this in Supabase SQL Editor
-- ============================================================

-- ---- Tren Indeks SPBE ----
CREATE TABLE IF NOT EXISTS spbe_trend (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tahun INT NOT NULL UNIQUE,
  indeks NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Tren Indeks PEMDI ----
CREATE TABLE IF NOT EXISTS pemdi_trend (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tahun INT NOT NULL UNIQUE,
  indeks NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Dokumen Pengetahuan ----
CREATE TABLE IF NOT EXISTS dokumen_pengetahuan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul VARCHAR(500) NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  tipe VARCHAR(50) DEFAULT 'PDF',
  ukuran VARCHAR(50) DEFAULT '1.0 MB',
  url TEXT DEFAULT '#',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Initial Seed Data ----
-- SPBE Trend Data
INSERT INTO spbe_trend (tahun, indeks) VALUES
(2018, 2.10),
(2019, 2.30),
(2020, 2.60),
(2021, 2.80),
(2022, 3.20),
(2023, 3.60)
ON CONFLICT (tahun) DO NOTHING;

-- PEMDI Trend Data
INSERT INTO pemdi_trend (tahun, indeks) VALUES
(2021, 1.80),
(2022, 2.40),
(2023, 2.90),
(2024, 3.30),
(2025, 3.70)
ON CONFLICT (tahun) DO NOTHING;

-- Documents Data
INSERT INTO dokumen_pengetahuan (judul, kategori, tipe, ukuran, url) VALUES
('Peraturan Menteri PANRB No 59 Tahun 2020 tentang Pemantauan dan Evaluasi SPBE', 'Kebijakan', 'PDF', '2.4 MB', '#'),
('Panduan Pengisian Asesmen Mandiri Indeks Pemerintah Digital Tahun 2026', 'Penerapan', 'PDF', '1.8 MB', '#'),
('Laporan Hasil Evaluasi SPBE & Pemerintah Digital Nasional 2025', 'Evaluasi', 'PDF', '4.2 MB', '#'),
('Bahan Sosialisasi Rubrik Penilaian Indikator Pemerintah Digital', 'Materi', 'PPTX', '8.5 MB', '#'),
('Kebijakan Tata Kelola Keamanan Informasi Pemerintah Daerah', 'Kebijakan', 'PDF', '1.5 MB', '#'),
('Petunjuk Teknis Integrasi Aplikasi Layanan Publik Berbasis API', 'Penerapan', 'PDF', '3.1 MB', '#');
