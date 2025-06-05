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

// Auth helpers untuk kemudahan penggunaan
export const authHelpers = {
  // Mendapatkan user saat ini
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  // Mendapatkan session saat ini
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  // Sign up dengan email dan password
  signUp: async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  // Sign in dengan email dan password
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  // Listen untuk perubahan auth state
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  // Update password
  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }
}

// Database helpers
export const dbHelpers = {
  // Get user profile
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  },

  // Upsert user profile (insert or update)
  upsertUserProfile: async (profile) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Upsert user profile error:', error)
      throw error
    }
  }
}

// Real-time helpers
export const realtimeHelpers = {
  // Subscribe to posts changes
  subscribeToPostsChanges: (callback) => {
    return supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to comments changes
  subscribeToCommentsChanges: (callback) => {
    return supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        callback
      )
      .subscribe()
  },

  // Unsubscribe from channel
  unsubscribe: (channel) => {
    return supabase.removeChannel(channel)
  }
}

// Error handler untuk Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  
  // Map common Supabase errors ke pesan yang user-friendly
  const errorMessages = {
    'Invalid login credentials': 'Email atau password salah!',
    'Email not confirmed': 'Silakan konfirmasi email Anda terlebih dahulu!',
    'User already registered': 'Email sudah terdaftar!',
    'Password should be at least 6 characters': 'Password minimal 6 karakter!',
    'Unable to validate email address: invalid format': 'Format email tidak valid!',
    'Database error saving user': 'Terjadi kesalahan pada database!',
    'row-level security': 'Akses ditolak!',
    'JWT expired': 'Sesi telah berakhir, silakan login kembali!'
  }

  // Cari pesan error yang cocok
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message?.includes(key)) {
      return new Error(message)
    }
  }

  // Default error message
  return new Error(error.message || 'Terjadi kesalahan yang tidak diketahui!')
}

// Utility untuk check koneksi
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('count')
      .limit(1)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Connection check failed:', error)
    return false
  }
}

// Export default untuk backward compatibility
export default supabase