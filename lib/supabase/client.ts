import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Using untyped client to avoid strict TypeScript inference issues
// with complex queries (.in(), nested selects, etc.)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function createClient() {
  return supabase
}
