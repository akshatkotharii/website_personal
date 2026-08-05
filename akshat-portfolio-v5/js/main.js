/* ============================================================
   main.js — Index page
   Shows latest 4 posts dynamically. Never edit HTML for posts.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initSmoothScroll();
  await loadBlog();
});

/* ── NAV ─────────────────────────────────────────────────── */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      toggle.classList.toggle('open', open);
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

  const posts = await fetchPosts(4); // only need 4 for index

  if (!posts.length) {
    if (featured) featured.style.display = 'none';
    grid.innerHTML = `<div class="blog-empty">No posts yet — <a href="/admin">write your first one</a>.</div>`;
    return;
  }

  renderFeatured(featured, posts[0]);
  grid.innerHTML = '';
  posts.slice(1).forEach(p => grid.appendChild(makeCard(p)));
}

/* ── FETCH POSTS ─────────────────────────────────────────── */
async function fetchPosts(limit = 20, offset = 0) {
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

/* ── RENDER ──────────────────────────────────────────────── */
function renderFeatured(el, post) {
  if (!el) return;
  el.href = `blog/post.html?slug=${post.slug}`;
  el.style.display = 'grid';
  el.innerHTML = `
    <div class="blog-featured-accent"></div>
    <div class="blog-featured-body">
      <div class="blog-featured-meta">
        <span class="blog-row-tag">${post.category || post.cat || 'personal'}</span>
        <span class="blog-featured-date">${fmtDate(post.created_at || post.date)}</span>
        <span class="blog-featured-read">${readTime(post.excerpt)} read</span>
      </div>
      <h3 class="blog-featured-title">${post.title}</h3>
      <p class="blog-featured-excerpt">${post.excerpt || ''}</p>
      <span class="blog-featured-cta">Read post →</span>
    </div>`;
}

function makeCard(post) {
  const a = document.createElement('a');
  a.href = `blog/post.html?slug=${post.slug}`;
  a.className = 'blog-card';
  a.innerHTML = `
    <div class="blog-card-top">
      <span class="blog-row-tag">${post.category || post.cat || 'personal'}</span>
      <span class="blog-card-read">${readTime(post.excerpt)}</span>
    </div>
    <h4 class="blog-card-title">${post.title}</h4>
    <p class="blog-card-excerpt">${post.excerpt || ''}</p>
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
  grid.innerHTML = [1,2,3].map(() => `
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
