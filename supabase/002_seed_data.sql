-- ============================================================
-- 002 Seed Data — 7 Aspek, 20 Indikator, Rubrik Level Default
-- Run after 001_initial_schema.sql
-- ============================================================

-- ---- Insert 7 Aspek ----
INSERT INTO aspek (id, kode, nama, bobot, urutan) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'A1', 'Tata Kelola & Manajemen', 0.10, 1),
  ('a0000001-0000-0000-0000-000000000002', 'A2', 'Penyelenggara', 0.10, 2),
  ('a0000001-0000-0000-0000-000000000003', 'A3', 'Data', 0.15, 3),
  ('a0000001-0000-0000-0000-000000000004', 'A4', 'Keamanan Siber', 0.15, 4),
  ('a0000001-0000-0000-0000-000000000005', 'A5', 'Teknologi Digital', 0.10, 5),
  ('a0000001-0000-0000-0000-000000000006', 'A6', 'Keterpaduan Layanan Digital Pemerintah', 0.15, 6),
  ('a0000001-0000-0000-0000-000000000007', 'A7', 'Kepuasan Pengguna Layanan Digital', 0.25, 7);

-- ---- Insert 20 Indikator ----
-- A1: Tata Kelola & Manajemen (10% total → 4 indikator @ 2.5%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'I01', 'Kebijakan Internal Tata Kelola Pemerintah Digital', 0.025, 1),
  ('i0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'I02', 'Perencanaan Strategis Pemerintah Digital', 0.025, 2),
  ('i0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'I03', 'Manajemen Penganggaran TIK', 0.025, 3),
  ('i0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'I04', 'Manajemen Risiko TIK', 0.025, 4);

-- A2: Penyelenggara (10% total → 2 indikator @ 5%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'I05', 'Kepemimpinan Digital', 0.05, 5),
  ('i0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'I06', 'SDM TIK', 0.05, 6);

-- A3: Data (15% total → 3 indikator @ 5%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'I07', 'Tata Kelola Data', 0.05, 7),
  ('i0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'I08', 'Manajemen Data', 0.05, 8),
  ('i0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'I09', 'Interoperabilitas Data', 0.05, 9);

-- A4: Keamanan Siber (15% total → 3 indikator @ 5%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000004', 'I10', 'Kebijakan Keamanan Informasi', 0.05, 10),
  ('i0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000004', 'I11', 'Penerapan Keamanan Informasi', 0.05, 11),
  ('i0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000004', 'I12', 'Pelindungan Data Pribadi', 0.05, 12);

-- A5: Teknologi Digital (10% total → 3 indikator @ ~3.33%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000005', 'I13', 'Infrastruktur TIK', 0.034, 13),
  ('i0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000005', 'I14', 'Sistem Aplikasi', 0.033, 14),
  ('i0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000005', 'I15', 'Penggunaan Teknologi Baru', 0.033, 15);

-- A6: Keterpaduan Layanan Digital (15% total → 3 indikator @ 5%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000006', 'I16', 'Layanan Digital Administrasi Pemerintahan', 0.05, 16),
  ('i0000001-0000-0000-0000-000000000017', 'a0000001-0000-0000-0000-000000000006', 'I17', 'Layanan Digital Pelayanan Publik', 0.05, 17),
  ('i0000001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000006', 'I18', 'Integrasi Layanan Digital', 0.05, 18);

-- A7: Kepuasan Pengguna (25% total → 2 indikator @ 12.5%)
INSERT INTO indikator (id, aspek_id, kode, nama, bobot, urutan) VALUES
  ('i0000001-0000-0000-0000-000000000019', 'a0000001-0000-0000-0000-000000000007', 'I19', 'Kepuasan Pengguna Internal', 0.125, 19),
  ('i0000001-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000007', 'I20', 'Kepuasan Pengguna Eksternal', 0.125, 20);

-- ---- Insert Default Rubrik Level for ALL 20 Indikators ----
-- Using a DO block to generate 100 rows (5 levels × 20 indikators)
DO $$
DECLARE
  ind_id UUID;
BEGIN
  FOR ind_id IN (SELECT id FROM indikator ORDER BY urutan)
  LOOP
    INSERT INTO rubrik_level (indikator_id, level, predikat, batas_bawah, batas_atas, deskripsi) VALUES
      (ind_id, 1, 'Kurang', 1.00, 1.49, 'Belum ada inisiasi atau implementasi sangat minim'),
      (ind_id, 2, 'Cukup', 1.50, 2.49, 'Sudah ada inisiasi awal namun belum terstruktur'),
      (ind_id, 3, 'Baik', 2.50, 3.49, 'Sudah berjalan namun belum optimal dan konsisten'),
      (ind_id, 4, 'Sangat Baik', 3.50, 4.49, 'Sudah berjalan dengan baik, terukur, dan terdokumentasi'),
      (ind_id, 5, 'Memuaskan', 4.50, 5.00, 'Sudah optimal, menjadi contoh, dan terus berinovasi');
  END LOOP;
END $$;

-- ---- Insert Demo Instansi ----
INSERT INTO instansi (id, nama, kode, tingkat) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Kota Bandung', 'KOTA-BDG', 'kota');

-- ---- Insert Demo Perangkat Daerah ----
INSERT INTO perangkat_daerah (id, instansi_id, nama, kode, jenis) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Dinas Komunikasi dan Informatika', 'DISKOMINFO', 'Dinas'),
  ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'Badan Perencanaan Pembangunan Daerah', 'BAPPEDA', 'Badan'),
  ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 'Dinas Kesehatan', 'DINKES', 'Dinas'),
  ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 'Dinas Pendidikan', 'DISDIK', 'Dinas'),
  ('e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 'Dinas Kependudukan dan Pencatatan Sipil', 'DISDUKCAPIL', 'Dinas'),
  ('e0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000001', 'Badan Kepegawaian Daerah', 'BKD', 'Badan'),
  ('e0000001-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000001', 'Dinas Penanaman Modal dan PTSP', 'DPMPTSP', 'Dinas'),
  ('e0000001-0000-0000-0000-000000000008', 'd0000001-0000-0000-0000-000000000001', 'Sekretariat Daerah', 'SETDA', 'Sekretariat');
