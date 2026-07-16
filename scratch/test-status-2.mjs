import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStatus() {
  const statuses = ['terbuka', 'berjalan', 'proses', 'ongoing', 'review', 'verifikasi', 'buka', 'tutup', 'tutup_sementara', 'arsip']
  const instansiId = 'd1000000-0000-0000-0000-000000000001'
  for (const status of statuses) {
    const { data, error } = await supabase.from('periode_asesmen').insert([
      {
        instansi_id: instansiId,
        tahun: 2026,
        nama: `Test ${status}`,
        status: status,
        tanggal_mulai: '2026-01-01',
        tanggal_selesai: '2026-06-30'
      }
    ]).select()
    if (error) {
      console.log(`Status "${status}" failed:`, error.message)
    } else {
      console.log(`Status "${status}" succeeded! Data:`, data)
      // Cleanup
      await supabase.from('periode_asesmen').delete().eq('id', data[0].id)
    }
  }
}

testStatus()
