/* ============================================================
   main.js — Index page
   Blog: shows 1 featured post plus 4 cards (5 total).
   Experience: loaded from Supabase, falls back to hardcoded.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initSmoothScroll();
  await Promise.all([loadBlog(), loadExperience()]);
});

/* ── NAV ─────────────────────────────────────────────────── */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }
  // Active section highlight
  const navAs = document.querySelectorAll('.nav-links a');
  document.querySelectorAll('section[id]').forEach(s => {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting)
          navAs.forEach(a => {
            a.style.color = a.getAttribute('href') === `#${e.target.id}` ? 'var(--black)' : '';
          });
      });
    }, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
  });
}

/* ── SMOOTH SCROLL ───────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH  = document.querySelector('nav').offsetHeight;
      const tick  = document.querySelector('.ticker');
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH - (tick ? tick.offsetHeight : 0) - 8,
        behavior: 'smooth'
      });
    });
  });
}

/* ── BLOG LOADER ─────────────────────────────────────────── */
async function loadBlog() {
  const featured = document.getElementById('blogFeatured');
  const grid     = document.getElementById('blogCards');
  if (!grid) return;

  showSkeleton(featured, grid);

  // Try starred posts first; fall back to latest 5.
  let posts = await fetchFeaturedPosts();
  if (!posts.length) posts = await fetchPosts(5);

  if (!posts.length) {
    if (featured) featured.style.display = 'none';
    grid.innerHTML = `<div class="blog-empty">No posts yet — <a href="admin/index.html">write your first one</a>.</div>`;
    return;
  }

  renderFeatured(featured, posts[0]);
  grid.innerHTML = '';
  posts.slice(1).forEach(p => grid.appendChild(makeCard(p)));
}

/* ── FETCH POSTS ─────────────────────────────────────────── */
async function fetchFeaturedPosts() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('posts')
      .select('id, title, slug, category, excerpt, created_at, featured')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(5);
    if (!error && data) return data;
  } catch(e) { console.warn('Featured fetch failed:', e); }
  return [];
}

async function fetchPosts(limit = 5, offset = 0) {
  const sb = getSupabase();

  // Try Supabase
  if (sb) {
    try {
      const { data, error } = await sb
        .from('posts')
        .select('id, title, slug, category, excerpt, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (!error && data) return data;
      console.warn('Supabase error:', error);
    } catch(e) { console.warn('Supabase fetch failed:', e); }
  }

  // Fallback: static JSON files
  return loadStaticPosts();
}

async function loadStaticPosts() {
  const slugs = ['why-i-started-this-site','first-iot-project-lessons','energy-nudges-research-notes'];
  const posts = [];
  for (const slug of slugs) {
    try {
      const r = await fetch(`blog/posts/${slug}.json`);
      if (r.ok) posts.push(await r.json());
    } catch(_) {}
  }
  return posts;
}

/* ── EXPERIENCE LOADER ───────────────────────────────────── */
const STATIC_EXPERIENCE = [
  {
    date_range: '2025 – Present',
    role: 'Research Intern',
    org: 'IVCCE — Indorama Ventures Center for Clean Energy, Plaksha',
    description: 'Working on a smart nudging system to reduce household energy consumption. Researching how data-driven behavioural interventions can create measurable impact at scale — without requiring users to change habits by willpower alone. Also led outreach for the IVCCE Energy Conference, building sponsor and participant pipelines across student, academic, and industry networks.'
  },
  {
    date_range: '2024 – 2025',
    role: 'Outreach & Events Leadership',
    org: 'Plaksha University · Fitoor, Eklavya & IVCCE Energy Conference',
    description: 'Drove outreach for Fitoor, Eklavya, and the IVCCE Energy Conference, serving as Outreach Head for Eklavya and the Energy Conference. Across the three events, our teams reached 1,500+ people and brought in 800+ participants — experience that sharpened my communication, stakeholder mapping, follow-up discipline, and ability to turn interest into attendance.'
  },
  {
    date_range: '2025',
    role: 'Management Fellow — YTS Program',
    org: 'Plaksha University',
    description: 'Worked as a management fellow for the Young Technology Scholar program at Plaksha. Helped coordinate and run the program, developing skills in team management, communication, and institutional operations alongside technical studies.'
  },
  {
    date_range: '2024 – Present',
    role: 'B.Tech Engineering Student',
    org: 'Plaksha University, Chandigarh',
    description: 'Second-year engineering student focused on applying CS and AI to real-world systems. Building IoT projects, learning ML algorithms independently, and seeking every opportunity to apply theory to practice.'
  }
];

async function loadExperience() {
  const timeline = document.getElementById('expTimeline');
  if (!timeline) return;

  let entries = [], databaseLoaded = false;
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('experience')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) { entries = data; databaseLoaded = true; }
    } catch(e) { console.warn('Experience fetch failed:', e); }
  }

  // Fall back to static data if DB has nothing
  if (!databaseLoaded) entries = STATIC_EXPERIENCE;

  timeline.innerHTML = entries.map(exp => `
    <div class="tl-item">
      <div class="tl-date">${escapeText(exp.date_range)}</div>
      <div>
        <div class="tl-role">${escapeText(exp.role)}</div>
        <div class="tl-org">${escapeText(exp.org)}</div>
        <p class="tl-desc">${escapeText(exp.description)}</p>
      </div>
    </div>
  `).join('');
}

/* ── RENDER ──────────────────────────────────────────────── */
function renderFeatured(el, post) {
  if (!el) return;
  el.href = `blog/post.html?slug=${encodeURIComponent(post.slug)}`;
  el.style.display = 'grid';
  el.innerHTML = `
    <div class="blog-featured-accent"></div>
    <div class="blog-featured-body">
      <div class="blog-featured-meta">
        <span class="blog-row-tag">${escapeText(post.category || post.cat || 'personal')}</span>
        <span class="blog-featured-date">${fmtDate(post.created_at || post.date)}</span>
        <span class="blog-featured-read">${readTime(post.excerpt)} read</span>
      </div>
      <h3 class="blog-featured-title">${escapeText(post.title)}</h3>
      <p class="blog-featured-excerpt">${escapeText(post.excerpt || '')}</p>
      <span class="blog-featured-cta">Read post →</span>
    </div>`;
}

function makeCard(post) {
  const a = document.createElement('a');
  a.href = `blog/post.html?slug=${encodeURIComponent(post.slug)}`;
  a.className = 'blog-card';
  a.innerHTML = `
    <div class="blog-card-top">
      <span class="blog-row-tag">${escapeText(post.category || post.cat || 'personal')}</span>
      <span class="blog-card-read">${readTime(post.excerpt)}</span>
    </div>
    <h4 class="blog-card-title">${escapeText(post.title)}</h4>
    <p class="blog-card-excerpt">${escapeText(post.excerpt || '')}</p>
    <div class="blog-card-date">${fmtDate(post.created_at || post.date)}</div>`;
  return a;
}

function showSkeleton(featured, grid) {
  if (featured) {
    featured.style.display = 'grid';
    featured.innerHTML = `
      <div class="blog-featured-accent"></div>
      <div class="blog-featured-body">
        <div class="skel" style="width:180px;height:13px;margin-bottom:1rem;"></div>
        <div class="skel" style="width:80%;height:24px;margin-bottom:0.75rem;"></div>
        <div class="skel" style="width:100%;height:14px;margin-bottom:0.4rem;"></div>
        <div class="skel" style="width:65%;height:14px;"></div>
      </div>`;
  }
  grid.innerHTML = [1,2,3,4].map(() => `
    <div class="blog-card" style="pointer-events:none">
      <div class="skel" style="width:80px;height:12px;margin-bottom:0.75rem;"></div>
      <div class="skel" style="width:90%;height:17px;margin-bottom:0.5rem;"></div>
      <div class="skel" style="width:100%;height:13px;margin-bottom:0.25rem;"></div>
      <div class="skel" style="width:55%;height:13px;"></div>
    </div>`).join('');
}

/* ── UTILS ───────────────────────────────────────────────── */
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function readTime(text) {
  const w = (text || '').replace(/<[^>]+>/g,'').split(' ').length;
  return Math.max(1, Math.round(w / 40)) + ' min';
}
