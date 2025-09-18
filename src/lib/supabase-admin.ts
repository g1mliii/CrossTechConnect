// Supabase admin client with service role key for full database access
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Admin client with service role - bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to test the connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    console.log('✅ Supabase admin connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase admin connection failed:', error)
    return false
  }
}