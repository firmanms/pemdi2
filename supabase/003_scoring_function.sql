-- ============================================================
-- 003 Scoring Function — hitung_indeks
-- Calculates the final index from approved penilaian_final
-- ============================================================

-- ---- Function: Get predikat from rubrik_level ----
CREATE OR REPLACE FUNCTION get_predikat(
  p_indikator_id UUID,
  p_skor NUMERIC
)
RETURNS TABLE(level INT, predikat VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT rl.level, rl.predikat
  FROM rubrik_level rl
  WHERE rl.indikator_id = p_indikator_id
    AND p_skor >= rl.batas_bawah
    AND p_skor <= rl.batas_atas
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---- Function: Calculate full index ----
CREATE OR REPLACE FUNCTION hitung_indeks(
  p_instansi_id UUID,
  p_periode_id UUID
)
RETURNS TABLE(
  indikator_id UUID,
  indikator_kode VARCHAR,
  indikator_nama VARCHAR,
  aspek_id UUID,
  aspek_kode VARCHAR,
  aspek_nama VARCHAR,
  bobot_indikator NUMERIC,
  bobot_aspek NUMERIC,
  skor NUMERIC,
  skor_100 NUMERIC,
  kontribusi NUMERIC,
  level_val INT,
  predikat_val VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS indikator_id,
    i.kode AS indikator_kode,
    i.nama::VARCHAR AS indikator_nama,
    a.id AS aspek_id,
    a.kode AS aspek_kode,
    a.nama::VARCHAR AS aspek_nama,
    i.bobot AS bobot_indikator,
    a.bobot AS bobot_aspek,
    COALESCE(pf.skor_final, 0) AS skor,
    CASE WHEN pf.skor_final IS NOT NULL
      THEN (pf.skor_final / 5.0) * 100
      ELSE 0
    END AS skor_100,
    CASE WHEN pf.skor_final IS NOT NULL
      THEN ((pf.skor_final / 5.0) * 100) * i.bobot
      ELSE 0
    END AS kontribusi,
    COALESCE((SELECT gp.level FROM get_predikat(i.id, pf.skor_final) gp), 0) AS level_val,
    COALESCE((SELECT gp.predikat FROM get_predikat(i.id, pf.skor_final) gp), 'Belum Dinilai')::VARCHAR AS predikat_val
  FROM indikator i
  JOIN aspek a ON a.id = i.aspek_id
  LEFT JOIN penilaian_final pf
    ON pf.indikator_id = i.id
    AND pf.periode_id = p_periode_id
    AND pf.status = 'disetujui'
  ORDER BY i.urutan;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---- Function: Calculate aspek summary ----
CREATE OR REPLACE FUNCTION hitung_aspek(
  p_instansi_id UUID,
  p_periode_id UUID
)
RETURNS TABLE(
  aspek_id UUID,
  aspek_kode VARCHAR,
  aspek_nama VARCHAR,
  bobot NUMERIC,
  nilai NUMERIC,
  skor_1_5 NUMERIC,
  level_val INT,
  predikat_val VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS aspek_id,
    a.kode AS aspek_kode,
    a.nama::VARCHAR AS aspek_nama,
    a.bobot,
    COALESCE(SUM(
      CASE WHEN pf.skor_final IS NOT NULL
        THEN ((pf.skor_final / 5.0) * 100) * i.bobot
        ELSE 0
      END
    ), 0) AS nilai,
    CASE WHEN COUNT(pf.skor_final) > 0
      THEN (SUM(COALESCE(pf.skor_final, 0)) / NULLIF(COUNT(pf.skor_final), 0))
      ELSE 0
    END AS skor_1_5,
    0 AS level_val,
    'Belum Dihitung'::VARCHAR AS predikat_val
  FROM aspek a
  JOIN indikator i ON i.aspek_id = a.id
  LEFT JOIN penilaian_final pf
    ON pf.indikator_id = i.id
    AND pf.periode_id = p_periode_id
    AND pf.status = 'disetujui'
  GROUP BY a.id, a.kode, a.nama, a.bobot
  ORDER BY a.urutan;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---- Function: Calculate final index value ----
CREATE OR REPLACE FUNCTION hitung_indeks_akhir(
  p_instansi_id UUID,
  p_periode_id UUID
)
RETURNS TABLE(
  indeks_akhir NUMERIC,
  skor_1_5 NUMERIC,
  total_indikator_disetujui INT,
  total_indikator INT
) AS $$
DECLARE
  v_indeks NUMERIC;
  v_approved INT;
  v_total INT;
BEGIN
  -- Sum all weighted contributions from approved final scores
  SELECT COALESCE(SUM(
    CASE WHEN pf.skor_final IS NOT NULL
      THEN ((pf.skor_final / 5.0) * 100) * i.bobot
      ELSE 0
    END
  ), 0)
  INTO v_indeks
  FROM indikator i
  LEFT JOIN penilaian_final pf
    ON pf.indikator_id = i.id
    AND pf.periode_id = p_periode_id
    AND pf.status = 'disetujui';

  SELECT COUNT(*) INTO v_total FROM indikator;

  SELECT COUNT(*) INTO v_approved
  FROM penilaian_final
  WHERE periode_id = p_periode_id AND status = 'disetujui';

  RETURN QUERY SELECT
    v_indeks,
    (v_indeks / 100.0) * 5,
    v_approved,
    v_total;
END;
$$ LANGUAGE plpgsql STABLE;
