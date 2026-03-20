import { createClient } from '@supabase/supabase-js'

// Anon key is safe to expose in frontend (RLS protects data)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://hdgjwdaqyphipdkndnuk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'sb_publishable_t-0I4ElOK09QMmyO1OO06A_W8tG37bg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
