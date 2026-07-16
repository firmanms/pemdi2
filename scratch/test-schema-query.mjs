import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSchemaQuery() {
  // Let's try to query information_schema or similar
  try {
    const { data, error } = await supabase.from('information_schema.columns').select('*').limit(1)
    if (error) {
      console.log('Direct information_schema query failed:', error.message)
    } else {
      console.log('Direct information_schema query succeeded:', data)
    }
  } catch (e) {
    console.log('Direct information_schema failed with exception:', e)
  }
}

testSchemaQuery()
