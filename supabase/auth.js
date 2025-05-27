// auth.js - Updated version
const getSupabaseClient = async () => {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    
    // Wait for supabase client to be available
    return new Promise((resolve) => {
        const checkClient = () => {
            if (window.supabaseClient) {
                resolve(window.supabaseClient);
            } else {
                setTimeout(checkClient, 50);
            }
        };
        checkClient();
    });
};

// Properly expose all functions to the window object
window.authFunctions = {
    getSession: async function() {
        try {
            const supabase = await getSupabaseClient();
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    },

    signInWithEmail: async function(email, password) {
        try {
            const supabase = await getSupabaseClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                let errorMessage = 'Login gagal';
                
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Email atau password salah';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Silakan verifikasi email Anda terlebih dahulu';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti';
                }
                
                throw new Error(errorMessage);
            }

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

    signUpWithEmail: async function(email, password, name) {
        try {
            const supabase = await getSupabaseClient();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) {
                let errorMessage = 'Registrasi gagal';
                
                if (error.message.includes('User already registered')) {
                    errorMessage = 'Email sudah terdaftar';
                } else if (error.message.includes('Password should')) {
                    errorMessage = 'Password minimal 6 karakter';
                } else if (error.message.includes('Invalid email')) {
                    errorMessage = 'Format email tidak valid';
                } else if (error.message.includes('Signup requires a valid password')) {
                    errorMessage = 'Password tidak boleh kosong';
                }
                
                throw new Error(errorMessage);
            }

            // Return user data for immediate login after registration
            if (data.user) {
                return {
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        name: name
                    },
                    message: 'Registrasi berhasil!'
                };
            } else {
                return {
                    message: 'Registrasi berhasil! Silakan cek email untuk verifikasi'
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    signOut: async function() {
        try {
            const supabase = await getSupabaseClient();
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
};

// For backward compatibility
window.getSession = window.authFunctions.getSession;
window.signInWithEmail = window.authFunctions.signInWithEmail;
window.signUpWithEmail = window.authFunctions.signUpWithEmail;
window.signOut = window.authFunctions.signOut;