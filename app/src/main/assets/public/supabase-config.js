const SUPABASE_URL = 'https://pvhfkjinyrgxakvsoblp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aGZramlueXJneGFrdnNvYmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NzA4OTQsImV4cCI6MjEwMTU0Njg5NH0.qduW_NOxJZUqaH9xz7b1fzePv4pF8PqCdBkM6bmTl4o';

try {
  console.log('DEBUG config: supabase library =', typeof supabase, supabase);
  console.log('DEBUG config: supabase.createClient =', typeof (supabase && supabase.createClient));
  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    storage: {
      autoRefreshToken: true,
    },
  });
  console.log('DEBUG config: window.sb created =', typeof window.sb, window.sb);
} catch (e) {
  console.error('DEBUG config: FAILED to create client:', e);
}
