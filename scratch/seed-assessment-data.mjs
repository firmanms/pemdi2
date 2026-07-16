import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const justifications = [
  "Kebijakan telah ditetapkan dan disosialisasikan ke seluruh unit kerja.",
  "Dokumen perencanaan strategis telah disusun dan diselaraskan dengan RPJMD.",
  "Anggaran TIK telah dialokasikan secara terpusat untuk efisiensi.",
  "Kajian manajemen risiko TIK telah diselesaikan dengan melibatkan pihak ketiga.",
  "Pimpinan menunjukkan komitmen tinggi terhadap transformasi digital.",
  "Pelatihan kompetensi digital bagi SDM telah dilaksanakan berkala.",
  "Arsitektur data dan portal satu data telah diimplementasikan.",
  "SOP pembersihan dan validasi data telah berjalan rutin.",
  "Sistem penghubung layanan (interoperabilitas) telah aktif menghubungkan 10 sistem.",
  "Sistem Manajemen Keamanan Informasi (SMKI) bersertifikat ISO 27001 sedang dalam proses audit.",
  "Enkripsi data sensitif dan firewall layer 7 telah diterapkan.",
  "Kebijakan privasi dan persetujuan pengguna telah diintegrasikan pada seluruh layanan publik.",
  "Data center daerah dan jaringan fiber optik internal telah mencakup 90% instansi.",
  "Aplikasi umum berbagi pakai SPBE telah diadaptasi penuh.",
  "Pilot project kecerdasan buatan untuk chatbot pelayanan publik sedang berjalan.",
  "Layanan naskah dinas elektronik aktif digunakan oleh seluruh ASN.",
  "Portal layanan perizinan terpadu online 24 jam dengan waktu pemrosesan lebih cepat.",
  "API Gateway telah menyatukan 15 layanan sektoral daerah.",
  "Survei kepuasan internal ASN menunjukkan tingkat kepuasan yang tinggi (Indeks 4.2).",
  "Hasil SKM (Survei Kepuasan Masyarakat) untuk layanan digital mencapai kategori Sangat Baik."
]

async function seedData() {
  try {
    // 1. Get active period
    const { data: periods } = await supabase.from('periode_asesmen').select('*').order('tahun', { ascending: false })
    if (!periods || periods.length === 0) {
      console.log('No periods found.')
      return
    }
    const period = periods[0]
    const periodId = period.id
    console.log('Target Period:', period.nama, 'ID:', periodId)

    // 2. Get all OPDs
    const { data: opds } = await supabase.from('perangkat_daerah').select('*')
    // 3. Get all indicators
    const { data: indicators } = await supabase.from('indikator').select('*').order('urutan')
    // 4. Get all profiles (to assign review_by / created_by)
    const { data: profiles } = await supabase.from('profiles').select('*')
    const superAdmin = profiles?.find(p => p.role === 'super_admin') || profiles?.[0]
    const diskominfo = opds?.find(o => o.kode === 'DISKOMINFO') || opds?.[0]

    if (!opds || opds.length === 0 || !indicators || indicators.length === 0) {
      console.log('Missing OPDs or indicators.')
      return
    }

    console.log('OPDs count:', opds.length)
    console.log('Indicators count:', indicators.length)

    // 5. Seed OPD Penilaians (self-assessments)
    console.log('Seeding penilaian_opd...')
    const opdPenilaians = []
    
    // To make it faster, we batch inserts
    for (const opd of opds) {
      for (let i = 0; i < indicators.length; i++) {
        const ind = indicators[i]
        // Random score between 1.0 and 5.0 with 2 decimals
        const baseScore = 2.5 + Math.random() * 2.2
        const skor = Number(baseScore.toFixed(2))
        const status = Math.random() > 0.15 ? 'terkirim' : 'draft'
        
        opdPenilaians.push({
          periode_id: periodId,
          indikator_id: ind.id,
          perangkat_daerah_id: opd.id,
          skor,
          justifikasi: `Penilaian oleh ${opd.nama}: ${justifications[i]}`,
          status
        })
      }
    }

    // Clear existing opd penilaians first to prevent unique key violations
    await supabase.from('penilaian_opd').delete().eq('periode_id', periodId)
    
    const { error: opdErr } = await supabase.from('penilaian_opd').insert(opdPenilaians)
    if (opdErr) {
      console.error('Error inserting opd penilaians:', opdErr.message)
    } else {
      console.log('OPD Penilaians seeded successfully!')
    }

    // 6. Seed Penilaian Final (consolidated by OPD pengampu)
    console.log('Seeding penilaian_final...')
    const finalPenilaians = []
    const finalStatuses = ['disetujui', 'disetujui', 'disetujui', 'disetor', 'dikembalikan', 'draft']

    for (let i = 0; i < indicators.length; i++) {
      const ind = indicators[i]
      // Get the corresponding OPD assessments for this indicator to compute average
      const correspondingOpdScores = opdPenilaians.filter(p => p.indikator_id === ind.id && p.status === 'terkirim')
      const avg = correspondingOpdScores.length > 0 
        ? correspondingOpdScores.reduce((sum, s) => sum + s.skor, 0) / correspondingOpdScores.length
        : 3.5
      
      const finalScore = Number(Math.max(1, Math.min(5, avg + (Math.random() - 0.5) * 0.4)).toFixed(2))
      const status = i < 15 ? 'disetujui' : finalStatuses[i % finalStatuses.length]

      finalPenilaians.push({
        periode_id: periodId,
        indikator_id: ind.id,
        skor_final: finalScore,
        justifikasi_konsolidasi: `Skor konsolidasi disepakati bersama oleh pengampu: ${justifications[i]}`,
        ditetapkan_oleh_pd_id: diskominfo?.id || null,
        ditetapkan_oleh_user_id: superAdmin?.id || null,
        status,
        catatan_revisi: status === 'dikembalikan' ? 'Mohon lampirkan dokumen SOP yang terbaru.' : '',
        direview_oleh: status === 'disetujui' ? superAdmin?.id : null,
        direview_at: status === 'disetujui' ? new Date().toISOString() : null
      })
    }

    // Clear existing final assessments
    await supabase.from('penilaian_final').delete().eq('periode_id', periodId)

    const { error: finalErr } = await supabase.from('penilaian_final').insert(finalPenilaians)
    if (finalErr) {
      console.error('Error inserting final assessments:', finalErr.message)
    } else {
      console.log('Final Assessments seeded successfully!')
    }

    // 7. Seed Indikator Pengampu mapping
    console.log('Seeding pengampu mapping...')
    const pengampuList = []
    for (let i = 0; i < indicators.length; i++) {
      const ind = indicators[i]
      // Assign DISKOMINFO as pengampu for all indicators for convenience
      if (diskominfo) {
        pengampuList.push({
          periode_id: periodId,
          indikator_id: ind.id,
          perangkat_daerah_id: diskominfo.id
        })
      }
    }
    
    await supabase.from('indikator_pengampu').delete().eq('periode_id', periodId)
    const { error: pengampuErr } = await supabase.from('indikator_pengampu').insert(pengampuList)
    if (pengampuErr) {
      console.error('Error seeding pengampus:', pengampuErr.message)
    } else {
      console.log('Pengampus seeded successfully!')
    }

  } catch (err) {
    console.error('Exception during seeding:', err)
  }
}

seedData()
