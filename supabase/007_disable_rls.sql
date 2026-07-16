-- ============================================================
-- 007 Fix Row Level Security (RLS)
-- Run this in Supabase SQL Editor to allow CRUD operations
-- ============================================================

-- Menonaktifkan RLS sementara untuk keperluan development dan admin
ALTER TABLE spbe_trend DISABLE ROW LEVEL SECURITY;
ALTER TABLE pemdi_trend DISABLE ROW LEVEL SECURITY;
ALTER TABLE dokumen_pengetahuan DISABLE ROW LEVEL SECURITY;
ALTER TABLE aspek DISABLE ROW LEVEL SECURITY;
ALTER TABLE indikator DISABLE ROW LEVEL SECURITY;
ALTER TABLE rubrik_level DISABLE ROW LEVEL SECURITY;
ALTER TABLE periode_asesmen DISABLE ROW LEVEL SECURITY;

-- Opsional: Jika Anda ingin tetap mengaktifkan RLS tapi mengizinkan akses ke semua orang
-- (Hapus tanda komentar di bawah ini dan beri komentar pada blok di atas jika lebih memilih cara ini)
/*
CREATE POLICY "Allow All" ON spbe_trend FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON pemdi_trend FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON dokumen_pengetahuan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON aspek FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON indikator FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON rubrik_level FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON periode_asesmen FOR ALL USING (true) WITH CHECK (true);
*/
