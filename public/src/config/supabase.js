// src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan Key Supabase Anda
const supabaseUrl = 'https://wspvspxhjcyviyugcycs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcHZzcHhoamN5dml5dWdjeWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDM3NTAsImV4cCI6MjA2NDY3OTc1MH0.3wFEhkitH_v_KEZIWEtZ0safLjNPTQhKWD2HUWmixg4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'biawak-foundation-web'
    }
  }
})

window.supabase = supabase;