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

// ── DYNAMIC NEWSLETTER SIGNUP WIDGET INJECTION ──
document.addEventListener('DOMContentLoaded', () => {
  // Do not show on admin page
  if (/\/(admin|unsubscribe)/.test(window.location.pathname)) return;

  const widget = document.createElement('div');
  widget.className = 'newsletter-widget';
  widget.innerHTML = `
    <button class="newsletter-btn" id="nlBtn" style="display: flex;">
      <span>Subscribe ✉</span>
    </button>
    <div class="newsletter-card" id="nlCard">
      <button class="newsletter-close" id="nlClose" title="Close newsletter signup">×</button>
      <h4>Inside Akshat’s Brain</h4>
      <p>Subscribe to get new blog posts directly in your inbox.</p>
      <form class="newsletter-form" id="nlForm">
        <input type="email" class="newsletter-input" id="nlEmail" placeholder="your@email.com" required autocomplete="email">
        <button type="submit" class="newsletter-submit">Join</button>
      </form>
      <div class="newsletter-msg" id="nlMsg"></div>
    </div>
  `;
  document.body.appendChild(widget);

  const nlBtn = document.getElementById('nlBtn');
  const nlCard = document.getElementById('nlCard');
  const nlClose = document.getElementById('nlClose');
  const nlForm = document.getElementById('nlForm');
  const nlEmail = document.getElementById('nlEmail');
  const nlMsg = document.getElementById('nlMsg');

  nlClose.addEventListener('click', () => {
    nlCard.classList.remove('open');
    nlBtn.style.display = 'flex';
  });

  nlBtn.addEventListener('click', () => {
    nlBtn.style.display = 'none';
    nlCard.classList.add('open');
  });

  nlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = nlEmail.value.trim();
    if (!email) return;

    nlMsg.textContent = 'Subscribing...';
    nlMsg.className = 'newsletter-msg';

    const sb = getSupabase();
    if (!sb) {
      nlMsg.textContent = 'Error: Supabase not configured.';
      nlMsg.classList.add('error');
      return;
    }

    try {
      const { error } = await sb.from('subscribers').insert([{ email }]);
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          nlMsg.textContent = 'Already subscribed!';
          nlMsg.classList.add('success');
        } else {
          nlMsg.textContent = 'Could not subscribe. Please try again shortly.';
          nlMsg.classList.add('error');
        }
      } else {
        nlMsg.textContent = 'Success! Thank you.';
        nlMsg.classList.add('success');
        nlEmail.value = '';
        setTimeout(() => {
          nlCard.classList.remove('open');
          nlBtn.style.display = 'flex';
          nlMsg.textContent = '';
        }, 2000);
      }
    } catch(err) {
      nlMsg.textContent = 'Failed to subscribe.';
      nlMsg.classList.add('error');
    }
  });
});
