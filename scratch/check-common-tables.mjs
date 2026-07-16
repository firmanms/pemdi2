import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCommonTables() {
  const tables = ['profile', 'profiles', 'user_profile', 'user_profiles', 'user', 'users', 'auth_users']
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`Table ${table} error:`, error.message)
      } else {
        console.log(`Table ${table} exists! Sample:`, data)
      }
    } catch (e) {
      console.log(`Table ${table} failed:`, e)
    }
  }
}

checkCommonTables()
