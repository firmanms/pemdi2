import { supabase } from './supabase/client'
import type { AspekScore, IndikatorScore, IndeksResult, RubrikLevel } from './types'

// Fallback predikat if rubrik is not found
function getDefaultMaturity(skor: number) {
  if (skor >= 4.5) return { level: 5, predikat: 'Memuaskan' }
  if (skor >= 3.5) return { level: 4, predikat: 'Sangat Baik' }
  if (skor >= 2.5) return { level: 3, predikat: 'Baik' }
  if (skor >= 1.5) return { level: 2, predikat: 'Cukup' }
  return { level: 1, predikat: 'Kurang' }
}

export async function hitungIndeksKalkulator(
  instansiId: string,
  periodeId: string
): Promise<IndeksResult> {
  // 1. Fetch aspects
  const { data: aspeks, error: errAspek } = await supabase
    .from('aspek')
    .select('*')
    .order('urutan', { ascending: true })
  
  if (errAspek || !aspeks) {
    throw new Error('Gagal mengambil data aspek: ' + errAspek?.message)
  }

  // 2. Fetch indicators
  const { data: indikators, error: errInd } = await supabase
    .from('indikator')
    .select('*')
    .order('urutan', { ascending: true })

  if (errInd || !indikators) {
    throw new Error('Gagal mengambil data indikator: ' + errInd?.message)
  }

  // 3. Fetch rubrik levels
  const { data: rubriks, error: errRubrik } = await supabase
    .from('rubrik_level')
    .select('*')

  const rubrikMap: Record<string, RubrikLevel[]> = {}
  if (rubriks) {
    rubriks.forEach((r) => {
      if (!rubrikMap[r.indikator_id]) {
        rubrikMap[r.indikator_id] = []
      }
      rubrikMap[r.indikator_id].push(r)
    })
  }

  // 4. Fetch approved final scores
  const { data: finalScores, error: errFinal } = await supabase
    .from('penilaian_final')
    .select('*')
    .eq('periode_id', periodeId)
    .eq('status', 'disetujui')

  const finalScoreMap: Record<string, number> = {}
  if (finalScores) {
    finalScores.forEach((fs) => {
      if (fs.skor_final !== null && fs.skor_final !== undefined) {
        finalScoreMap[fs.indikator_id] = Number(fs.skor_final)
      }
    })
  }

  // 5. Calculate Indicator Scores
  const indicatorScores: IndikatorScore[] = indikators.map((ind) => {
    const skor = finalScoreMap[ind.id] !== undefined ? finalScoreMap[ind.id] : 0
    const skor_100 = (skor / 5) * 100
    // In database, bobot is out of 100 (e.g. 5 for 5%)
    // Let's divide by 100 to get decimal contribution
    const kontribusi = skor_100 * (Number(ind.bobot) / 100)

    // Get level and predikat from rubrik
    const indRubriks = rubrikMap[ind.id] || []
    let level = 0
    let predikat = 'Belum Dinilai'

    if (skor > 0 && indRubriks.length > 0) {
      const match = indRubriks.find(
        (r) =>
          skor >= Number(r.batas_bawah) &&
          (skor < Number(r.batas_atas) || (r.level === 5 && skor <= Number(r.batas_atas)))
      )
      if (match) {
        level = match.level
        predikat = match.predikat
      } else {
        const fallback = getDefaultMaturity(skor)
        level = fallback.level
        predikat = fallback.predikat
      }
    } else if (skor > 0) {
      const fallback = getDefaultMaturity(skor)
      level = fallback.level
      predikat = fallback.predikat
    }

    const aspek = aspeks.find((a) => a.id === ind.aspek_id)

    return {
      indikator_id: ind.id,
      indikator_kode: ind.kode,
      indikator_nama: ind.nama,
      aspek_id: ind.aspek_id,
      aspek_nama: aspek?.nama || '',
      bobot: Number(ind.bobot) / 100, // Normalized to 0-1 for TS interfaces
      skor,
      skor_100,
      kontribusi,
      level,
      predikat,
    }
  })

  // 6. Calculate Aspect Scores
  const aspekScores: AspekScore[] = aspeks.map((aspek) => {
    const indScores = indicatorScores.filter((s) => s.aspek_id === aspek.id)
    const nilai = indScores.reduce((sum, s) => sum + s.kontribusi, 0)
    
    // Weighted 1-5 score for aspects: sum(skor * bobot) / sum(bobot)
    const totalBobot = indScores.reduce((sum, s) => sum + s.bobot, 0)
    const skor_1_5 = totalBobot > 0 
      ? indScores.reduce((sum, s) => sum + (s.skor * s.bobot), 0) / totalBobot
      : 0

    const { level, predikat } = getDefaultMaturity(skor_1_5)

    return {
      aspek_id: aspek.id,
      aspek_kode: aspek.kode,
      aspek_nama: aspek.nama,
      bobot: Number(aspek.bobot) / 100, // Normalized to 0-1
      nilai,
      skor_1_5,
      level,
      predikat,
    }
  })

  // 7. Calculate Final Index
  const indeks = aspekScores.reduce((sum, a) => sum + a.nilai, 0)
  const skor_1_5 = (indeks / 100) * 5
  const { level, predikat } = getDefaultMaturity(skor_1_5)

  return {
    indeks,
    skor_1_5,
    level,
    predikat,
    aspek_scores: aspekScores,
    indikator_scores: indicatorScores,
  }
}
