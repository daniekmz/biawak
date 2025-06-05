// src/auth/auth.js
import { supabase, authHelpers } from '../config/supabase.js'

// Auth functions untuk kompatibilitas dengan kode existing
const authFunctions = {
  async getSession() {
    try {
      const { data: { session }, error } = await authHelpers.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  async signInWithEmail(email, password) {
    try {
      const { data, error } = await authHelpers.signIn(email, password)
      
      if (error) {
        // Handle specific auth errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email atau password salah!')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Silakan konfirmasi email Anda terlebih dahulu!')
        } else {
          throw new Error(error.message)
        }
      }

      if (data.user) {
        // Trigger custom event untuk update UI
        window.dispatchEvent(new CustomEvent('authStateChange', {
          detail: { event: 'SIGNED_IN', session: data.session }
        }))
      }

      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  async signUpWithEmail(email, password, fullName) {
    try {
      const { data, error } = await authHelpers.signUp(email, password, {
        full_name: fullName
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Email sudah terdaftar!')
        } else {
          throw new Error(error.message)
        }
      }

      // Jika user langsung masuk (tanpa konfirmasi email)
      if (data.user && data.session) {
        window.dispatchEvent(new CustomEvent('authStateChange', {
          detail: { event: 'SIGNED_IN', session: data.session }
        }))
        return { user: data.user, message: 'Registrasi berhasil!' }
      } else {
        // Jika perlu konfirmasi email
        return { 
          user: null, 
          message: 'Registrasi berhasil! Silakan cek email untuk konfirmasi.' 
        }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  async signOut() {
    try {
      const { error } = await authHelpers.signOut()
      if (error) throw error

      window.dispatchEvent(new CustomEvent('authStateChange', {
        detail: { event: 'SIGNED_OUT', session: null }
      }))
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }
}

// Setup auth state listener
authHelpers.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session)
  
  window.dispatchEvent(new CustomEvent('authStateChange', {
    detail: { event, session }
  }))
})

// Make available globally
window.authFunctions = authFunctions

export default authFunctions