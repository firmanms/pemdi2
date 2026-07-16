import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRpc() {
  const instansiId = 'd1000000-0000-0000-0000-000000000001'

  // Insert a test period with status 'draft'
  const { data: periodData, error: periodErr } = await supabase.from('periode_asesmen').insert([
    {
      instansi_id: instansiId,
      tahun: 2026,
      nama: 'Semester 1 2026',
      status: 'draft',
      tanggal_mulai: '2026-01-01',
      tanggal_selesai: '2026-06-30'
    }
  ]).select()

  if (periodErr) {
    console.error('Error inserting period:', periodErr.message)
    return
  }

  const periodId = periodData[0].id
  console.log('Inserted period ID:', periodId)

  try {
    // Call RPC hitung_indeks
    const { data: rpcData, error: rpcErr } = await supabase.rpc('hitung_indeks', {
      p_instansi_id: instansiId,
      p_periode_id: periodId
    })

    if (rpcErr) {
      console.error('RPC hitung_indeks failed:', rpcErr.message)
    } else {
      console.log('RPC hitung_indeks succeeded! Result:', JSON.stringify(rpcData, null, 2))
    }
  } catch (err) {
    console.error('Unhandled RPC error:', err)
  } finally {
    // Clean up
    const { error: delErr } = await supabase.from('periode_asesmen').delete().eq('id', periodId)
    console.log('Cleanup period:', delErr ? delErr.message : 'OK')
  }
}

testRpc()
