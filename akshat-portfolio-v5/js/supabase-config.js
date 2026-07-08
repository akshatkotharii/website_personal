/* ============================================================
   SUPABASE CONFIG
   
   DO NOT hardcode keys here if using Git.
   
   FOR NETLIFY (recommended):
   1. Netlify dashboard → Site settings → Environment variables
   2. Add: SUPABASE_URL and SUPABASE_ANON_KEY
   3. Then use a build step OR paste values below for static deploy
   
   FOR QUICK STATIC DEPLOY (no build step):
   Just paste your values below. The anon key is safe to expose —
   security comes from Supabase RLS rules, not key secrecy.
   ============================================================ */

const SUPABASE_URL  = 'https://ljaohvbvmbkedvvrtumi.supabase.co';       // https://xxxx.supabase.co
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqYW9odmJ2bWJrZWR2dnJ0dW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzI5NzAsImV4cCI6MjA5NzIwODk3MH0.OtSuT68ZEO8EBaMmPNFCwjCv_trARCoiZTR4DWUHvWc';  // eyJ...

/* ── DO NOT EDIT BELOW ── */
window._sb = null;
function getSupabase() {
  if (window._sb) return window._sb;
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;
  try {
    window._sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      global: {
        headers: { 'x-application-name': 'akshat-portfolio' }
      }
    });
  } catch(e) {
    console.error('Supabase init failed:', e);
    return null;
  }
  return window._sb;
}
