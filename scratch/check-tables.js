import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    envVars[key] = value
  }
})

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const testTables = ['spbe_trend', 'pemdi_trend', 'dokumen_pengetahuan']
  for (const table of testTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Table "${table}" does not exist or error: ${error.message}`)
    } else {
      console.log(`Table "${table}" exists!`)
    }
  }

  // Also check RPC for DDL
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' })
  if (rpcError) {
    console.log('exec_sql RPC failed:', rpcError.message)
  } else {
    console.log('exec_sql RPC exists!')
  }
}

run()
