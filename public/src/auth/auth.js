// Wait for Supabase to be loaded and ensure proper initialization
let supabase;

// Initialize Supabase client with proper error handling
function initializeSupabase() {
    try {
        // Check if Supabase is available
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not loaded');
            throw new Error('Supabase library not loaded');
        }

        const supabaseUrl = 'https://wspvspxhjcyviyugcycs.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcHZzcHhoamN5dml5dWdjeWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDM3NTAsImV4cCI6MjA2NDY3OTc1MH0.3wFEhkitH_v_KEZIWEtZ0safLjNPTQhKWD2HUWmixg4';

        // Create Supabase client
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        // Verify the client was created properly
        if (!supabase || !supabase.auth) {
            throw new Error('Failed to create Supabase client');
        }

        console.log('Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('Supabase initialization error:', error);
        throw error;
    }
}

// Auth functions
const authFunctions = {
    async getSession() {
        try {
            if (!supabase) {
                initializeSupabase();
            }
            
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            console.error('Error getting session:', error);
            throw error;
        }
    },

    async signInWithEmail(email, password) {
        try {
            if (!supabase) {
                initializeSupabase();
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Dispatch custom event for auth state change
            window.dispatchEvent(new CustomEvent('authStateChange', {
                detail: { event: 'SIGNED_IN', session: data.session }
            }));
            
            return {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.full_name || 'Pengguna'
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async signUpWithEmail(email, password, name) {
        try {
            if (!supabase) {
                initializeSupabase();
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            
            if (error) throw error;
            
            if (data.user) {
                window.dispatchEvent(new CustomEvent('authStateChange', {
                    detail: { event: 'SIGNED_UP', session: data.session }
                }));
            }
            
            return {
                user: data.user ? {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.full_name || name
                } : null,
                message: 'Silakan cek email Anda untuk verifikasi'
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async signOut() {
        try {
            if (!supabase) {
                initializeSupabase();
            }

            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            window.dispatchEvent(new CustomEvent('authStateChange', {
                detail: { event: 'SIGNED_OUT' }
            }));
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    // Handle auth state changes
    setupAuthListener() {
        try {
            if (!supabase) {
                initializeSupabase();
            }

            supabase.auth.onAuthStateChange((event, session) => {
                window.dispatchEvent(new CustomEvent('authStateChange', {
                    detail: { event, session }
                }));
            });
        } catch (error) {
            console.error('Error setting up auth listener:', error);
        }
    }
};

// Initialize when DOM is ready or Supabase is available
function initAuth() {
    try {
        initializeSupabase();
        authFunctions.setupAuthListener();
        
        // Expose auth functions to window
        window.authFunctions = authFunctions;
        window.supabase = supabase; // Also expose supabase client
        
        console.log('Auth module initialized successfully');
    } catch (error) {
        console.error('Auth initialization failed:', error);
        // Still expose functions for fallback handling
        window.authFunctions = authFunctions;
    }
}

// Initialize immediately if Supabase is already loaded, otherwise wait
if (typeof window.supabase !== 'undefined') {
    initAuth();
} else {
    // Wait for Supabase to load
    window.addEventListener('load', () => {
        // Give a small delay to ensure all scripts are loaded
        setTimeout(initAuth, 100);
    });
}