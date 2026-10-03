/* ============================================================
   main.js — Index page
   Blog: shows 1 featured post plus 4 cards (5 total).
   Experience: loaded from Supabase, falls back to hardcoded.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initSmoothScroll();
  initAboutTabs();
  await Promise.all([loadBlog(), loadExperience()]);
});

/* ── ABOUT: choose a thread, keep the page short ──────────── */
function initAboutTabs() {
  const root = document.querySelector('[data-about-story]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-about-tab]')];
  const select = tab => {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll('[data-about-panel]').forEach(panel => {
      panel.hidden = panel.dataset.aboutPanel !== tab.dataset.aboutTab;
    });
  };
  root.addEventListener('click', event => {
    const tab = event.target.closest('[data-about-tab]');
    if (tab) select(tab);
  });
  root.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    tabs[next].focus();
    select(tabs[next]);
  });
  tabs.forEach((tab, index) => { tab.tabIndex = index ? -1 : 0; });
}

/* ── NAV ─────────────────────────────────────────────────── */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (toggle && drawer) {
    const setOpen = open => {
      drawer.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      setOpen(false);
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
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
  if (!posts.length) posts = await fetchPosts(4);

  if (!posts.length) {
    if (featured) featured.style.display = 'none';
    grid.innerHTML = `<div class="blog-empty">No posts yet — <a href="admin/index.html">write your first one</a>.</div>`;
    return;
  }

  renderFeatured(featured, posts[0]);
  grid.innerHTML = '';
  posts.slice(1, 4).forEach((p, index) => grid.appendChild(makeCard(p, index + 2)));
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
      .limit(4);
    if (!error && data) return data;
  } catch(e) { console.warn('Featured fetch failed:', e); }
  return [];
}

async function fetchPosts(limit = 4, offset = 0) {
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
  const slugs = ['why-i-started-this-site'];
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

  let entries = STATIC_EXPERIENCE;
  const show = index => {
    const exp = entries[index];
    if (!exp) return;
    timeline.querySelectorAll('[data-experience]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.experience) === index)));
    timeline.querySelector('#experienceStory').innerHTML = `<p class="experience-story-kicker">A chapter in the story</p><h3>${escapeText(exp.role)}</h3><p class="experience-story-place">${escapeText(exp.org)} · ${escapeText(exp.date_range)}</p><p>${escapeText(exp.description)}</p>`;
  };
  const render = () => {
    timeline.innerHTML = `<div class="experience-points" role="group" aria-label="Experience chapters">${entries.map((exp, i) => `
      <button type="button" class="experience-point" data-experience="${i}" aria-controls="experienceStory" aria-pressed="${i === 0}">
        <span class="experience-dot" aria-hidden="true"></span><span class="tl-date">${escapeText(exp.date_range)}</span>
        <span class="tl-role">${escapeText(exp.role)}</span><span class="tl-org">${escapeText(exp.org)}</span>
      </button>`).join('')}</div><article id="experienceStory" class="experience-story" aria-live="polite"></article>`;
    show(0);
  };
  timeline.addEventListener('click', event => { const button = event.target.closest('[data-experience]'); if (button) show(Number(button.dataset.experience)); });
  render();
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data, error } = await sb.from('experience').select('*').order('sort_order', { ascending: true });
    if (!error && data?.length) { entries = data; render(); }
  } catch(e) { console.warn('Experience fetch failed:', e); }
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

function makeCard(post, number) {
  const a = document.createElement('a');
  a.href = `blog/post.html?slug=${encodeURIComponent(post.slug)}`;
  a.className = 'blog-card blog-reading-row';
  a.innerHTML = `
    <span class="blog-reading-number">${String(number).padStart(2, '0')}</span>
    <span class="blog-reading-title">${escapeText(post.title)}</span>
    <span class="blog-reading-meta">${escapeText(post.category || post.cat || 'personal')} · ${fmtDate(post.created_at || post.date)}</span>
    <span class="blog-reading-arrow" aria-hidden="true">↗</span>`;
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
