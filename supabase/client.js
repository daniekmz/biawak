// Initialize Supabase client
const supabaseUrl = 'https://wiivhdrmfbaegvvhbivn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpaXZoZHJtZmJhZWd2dmhiaXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNTMyMzAsImV4cCI6MjA2MzgyOTIzMH0.gzhI53HfaGmHtPOb1wDsWgXP6jwJXtEjEfdzu41-eBg';

// Create Supabase client and make it globally available
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      debug: true
    }
});

// Export for module usage
const supabase = window.supabaseClient;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = supabase;
}