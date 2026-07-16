-- ============================================================
-- 006 Add Deskripsi to Aspek and Indikator
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE aspek ADD COLUMN IF NOT EXISTS deskripsi TEXT DEFAULT '';
ALTER TABLE indikator ADD COLUMN IF NOT EXISTS deskripsi TEXT DEFAULT '';
