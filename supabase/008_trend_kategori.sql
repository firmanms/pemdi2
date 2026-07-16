-- ============================================================
-- 008 Add Kategori to Trend Tables
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE spbe_trend ADD COLUMN IF NOT EXISTS kategori VARCHAR(50) DEFAULT '';
ALTER TABLE pemdi_trend ADD COLUMN IF NOT EXISTS kategori VARCHAR(50) DEFAULT '';

-- Set nilai default 'Baik' untuk data lama jika ada
UPDATE spbe_trend SET kategori = 'Baik' WHERE kategori = '';
UPDATE pemdi_trend SET kategori = 'Baik' WHERE kategori = '';
