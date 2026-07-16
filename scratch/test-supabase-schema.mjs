import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const tables = ['aspek', 'indikator', 'users', 'perangkat_daerah', 'periode_asesmen', 'rubrik_level', 'penilaian_opd', 'penilaian_final', 'bukti_dukung']
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`Table ${table} error:`, error.message)
      } else {
        console.log(`Table ${table} connected successfully! Sample:`, data)
      }
    } catch (e) {
      console.log(`Table ${table} failed:`, e)
    }
  }
}

checkSchema()
