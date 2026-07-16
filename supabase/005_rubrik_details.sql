-- ============================================================
-- 005 Add Kondisi and Bukti Dukung to Rubrik Level
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE rubrik_level ADD COLUMN IF NOT EXISTS kondisi TEXT DEFAULT '';
ALTER TABLE rubrik_level ADD COLUMN IF NOT EXISTS bukti_dukung TEXT DEFAULT '';

-- Update the existing mock data if needed (optional)
