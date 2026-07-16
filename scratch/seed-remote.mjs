import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedRemote() {
  try {
    // 1. Check instansi
    const { data: instansiData, error: instansiErr } = await supabase.from('instansi').select('*')
    console.log('Current instansi:', instansiData, instansiErr)

    let instansiId = instansiData?.[0]?.id
    if (!instansiId) {
      const { data: newInst, error: newInstErr } = await supabase.from('instansi').insert([
        { nama: 'Kota Bandung', kode: 'KOTA-BDG', tingkat: 'kota' }
      ]).select()
      if (newInstErr) {
        console.error('Failed to insert instansi:', newInstErr)
        return
      }
      instansiId = newInst[0].id
      console.log('Inserted instansi:', newInst)
    }

    // 2. Insert Perangkat Daerah
    const { data: pdData } = await supabase.from('perangkat_daerah').select('*')
    if (pdData?.length === 0) {
      const pdList = [
        { instansi_id: instansiId, nama: 'Dinas Komunikasi dan Informatika', kode: 'DISKOMINFO', jenis: 'Dinas' },
        { instansi_id: instansiId, nama: 'Badan Perencanaan Pembangunan Daerah', kode: 'BAPPEDA', jenis: 'Badan' },
        { instansi_id: instansiId, nama: 'Dinas Kesehatan', kode: 'DINKES', jenis: 'Dinas' },
        { instansi_id: instansiId, nama: 'Dinas Pendidikan', kode: 'DISDIK', jenis: 'Dinas' },
        { instansi_id: instansiId, nama: 'Dinas Kependudukan dan Pencatatan Sipil', kode: 'DISDUKCAPIL', jenis: 'Dinas' },
        { instansi_id: instansiId, nama: 'Badan Kepegawaian Daerah', kode: 'BKD', jenis: 'Badan' },
        { instansi_id: instansiId, nama: 'Dinas Penanaman Modal dan PTSP', kode: 'DPMPTSP', jenis: 'Dinas' },
        { instansi_id: instansiId, nama: 'Sekretariat Daerah', kode: 'SETDA', jenis: 'Sekretariat' }
      ]
      const { data: newPd, error: pdErr } = await supabase.from('perangkat_daerah').insert(pdList).select()
      console.log('Inserted PD:', newPd, pdErr)
    } else {
      console.log('PD already seeded:', pdData.length)
    }

    // 3. Insert Periode Asesmen
    const { data: perData } = await supabase.from('periode_asesmen').select('*')
    if (perData?.length === 0) {
      const { data: newPer, error: perErr } = await supabase.from('periode_asesmen').insert([
        {
          instansi_id: instansiId,
          tahun: 2026,
          nama: 'Semester 1 2026',
          status: 'aktif',
          tanggal_mulai: '2026-01-01',
          tanggal_selesai: '2026-06-30'
        }
      ]).select()
      console.log('Inserted Periode:', newPer, perErr)
    } else {
      console.log('Periode already seeded:', perData.length)
    }

  } catch (e) {
    console.error('Seed exception:', e)
  }
}

seedRemote()
