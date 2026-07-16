import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  try {
    const { data, error } = await supabase.from('aspek').select('*')
    if (error) {
      console.error('Error fetching aspek:', error)
    } else {
      console.log('Successfully connected! Aspek count:', data?.length)
      console.log('Sample data:', data)
    }
  } catch (err) {
    console.error('Unhandled error:', err)
  }
}

test()
