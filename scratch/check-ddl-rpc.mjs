import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDdlRpc() {
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'query']
  for (const rpcName of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpcName, { sql: 'SELECT 1;' })
      if (error) {
        console.log(`RPC ${rpcName} failed/error:`, error.message)
      } else {
        console.log(`RPC ${rpcName} succeeded! Response:`, data)
      }
    } catch (e) {
      console.log(`RPC ${rpcName} exception:`, e)
    }
  }
}

checkDdlRpc()
