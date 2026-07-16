import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRelation() {
  try {
    const { data, error } = await supabase
      .from('penilaian_opd')
      .select('*, bukti_dukung(*)')
      .limit(1)

    if (error) {
      console.log('Relation query failed:', error.message)
    } else {
      console.log('Relation query succeeded! Data:', data)
    }
  } catch (e) {
    console.log('Relation exception:', e)
  }
}

testRelation()
