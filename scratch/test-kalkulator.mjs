import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

function getDefaultMaturity(skor) {
  if (skor >= 4.5) return { level: 5, predikat: 'Memuaskan' }
  if (skor >= 3.5) return { level: 4, predikat: 'Sangat Baik' }
  if (skor >= 2.5) return { level: 3, predikat: 'Baik' }
  if (skor >= 1.5) return { level: 2, predikat: 'Cukup' }
  return { level: 1, predikat: 'Kurang' }
}

async function runTest() {
  const instansiId = 'd1000000-0000-0000-0000-000000000001'

  // Let's create a real period if none exists
  let periodId = ''
  const { data: periods } = await supabase.from('periode_asesmen').select('*')
  if (periods && periods.length > 0) {
    periodId = periods[0].id
    console.log('Using existing period:', periods[0].nama, 'ID:', periodId)
  } else {
    const { data: newPer, error: perErr } = await supabase.from('periode_asesmen').insert([
      {
        instansi_id: instansiId,
        tahun: 2026,
        nama: 'Semester 1 2026',
        status: 'draft',
        tanggal_mulai: '2026-01-01',
        tanggal_selesai: '2026-06-30'
      }
    ]).select()
    if (perErr) {
      console.error('Failed to create period:', perErr.message)
      return
    }
    periodId = newPer[0].id
    console.log('Created test period:', newPer[0].nama, 'ID:', periodId)
  }

  // 1. Fetch aspects
  const { data: aspeks } = await supabase.from('aspek').select('*').order('urutan')
  // 2. Fetch indicators
  const { data: indikators } = await supabase.from('indikator').select('*').order('urutan')
  // 3. Fetch rubriks
  const { data: rubriks } = await supabase.from('rubrik_level').select('*')

  const rubrikMap = {}
  if (rubriks) {
    rubriks.forEach((r) => {
      if (!rubrikMap[r.indikator_id]) {
        rubrikMap[r.indikator_id] = []
      }
      rubrikMap[r.indikator_id].push(r)
    })
  }

  // Fetch final scores
  const { data: finalScores } = await supabase
    .from('penilaian_final')
    .select('*')
    .eq('periode_id', periodId)
    .eq('status', 'disetujui')

  const finalScoreMap = {}
  if (finalScores) {
    finalScores.forEach((fs) => {
      if (fs.skor_final !== null && fs.skor_final !== undefined) {
        finalScoreMap[fs.indikator_id] = Number(fs.skor_final)
      }
    })
  }

  // Calculate Indicator Scores
  const indicatorScores = indikators.map((ind) => {
    const skor = finalScoreMap[ind.id] !== undefined ? finalScoreMap[ind.id] : 0
    const skor_100 = (skor / 5) * 100
    const kontribusi = skor_100 * (Number(ind.bobot) / 100)

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

    return {
      id: ind.id,
      kode: ind.kode,
      nama: ind.nama,
      aspek_id: ind.aspek_id,
      bobot: Number(ind.bobot),
      skor,
      skor_100,
      kontribusi,
      level,
      predikat,
    }
  })

  // Calculate Aspect Scores
  const aspekScores = aspeks.map((aspek) => {
    const indScores = indicatorScores.filter((s) => s.aspek_id === aspek.id)
    const nilai = indScores.reduce((sum, s) => sum + s.kontribusi, 0)
    
    const totalBobot = indScores.reduce((sum, s) => sum + s.bobot, 0)
    const skor_1_5 = totalBobot > 0 
      ? indScores.reduce((sum, s) => sum + (s.skor * s.bobot), 0) / totalBobot
      : 0

    const { level, predikat } = getDefaultMaturity(skor_1_5)

    return {
      id: aspek.id,
      kode: aspek.kode,
      nama: aspek.nama,
      bobot: Number(aspek.bobot),
      nilai,
      skor_1_5,
      level,
      predikat,
    }
  })

  const indeks = aspekScores.reduce((sum, a) => sum + a.nilai, 0)
  const skor_1_5 = (indeks / 100) * 5
  const { level, predikat } = getDefaultMaturity(skor_1_5)

  console.log('=== CALCULATION SUCCESS ===')
  console.log('Indeks Akhir:', indeks.toFixed(2))
  console.log('Skor 1-5:', skor_1_5.toFixed(2))
  console.log('Level:', level, predikat)
  console.log('Aspek Scores (first 2):', aspekScores.slice(0, 2))
}

runTest()
