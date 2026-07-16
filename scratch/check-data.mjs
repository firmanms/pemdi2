import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: aspeks } = await supabase.from('aspek').select('*').order('urutan')
  const { data: indikators } = await supabase.from('indikator').select('*').order('urutan')
  const { data: profiles } = await supabase.from('profiles').select('*')
  const { data: pd } = await supabase.from('perangkat_daerah').select('*')
  const { data: periode } = await supabase.from('periode_asesmen').select('*')
  const { data: rubrik } = await supabase.from('rubrik_level').select('*')
  
  console.log('Aspeks count:', aspeks?.length)
  console.log('Indikators count:', indikators?.length)
  console.log('Profiles count:', profiles?.length)
  console.log('Perangkat Daerah count:', pd?.length)
  console.log('Periode Asesmen count:', periode?.length)
  console.log('Rubrik Level count:', rubrik?.length)

  if (aspeks) console.log('Aspeks:', aspeks.map(a => ({ id: a.id, kode: a.kode, nama: a.nama, bobot: a.bobot })))
  if (indikators) console.log('Indikators Sample (first 3):', indikators.slice(0, 3).map(i => ({ id: i.id, aspek_id: i.aspek_id, kode: i.kode, nama: i.nama, bobot: i.bobot })))
}

checkData()
