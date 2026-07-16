import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStatus() {
  const statuses = [
    'aktif_asesmen', 'aktif_konsolidasi', 'aktif_review', 'selesai_review',
    'persiapan', 'draft', 'aktif', 'selesai', 'ditutup',
    'DRAFT', 'AKTIF', 'SELESAI', 'DITUTUP',
    'assessment', 'consolidation', 'review', 'done', 'closed'
  ]
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
      // If it violates check constraint, it's not allowed
      if (!error.message.includes('violates check constraint')) {
        console.log(`Status "${status}" failed with other error:`, error.message)
      }
    } else {
      console.log(`Status "${status}" succeeded!`)
      await supabase.from('periode_asesmen').delete().eq('id', data[0].id)
    }
  }
}

testStatus()
