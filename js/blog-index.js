const PER_PAGE = 10;
let page = 0, totalCount = 0, activeFilter = 'all';
const STATIC_POST_SLUGS = ['smart-energy-nudging','outreach-brain','spinsync-shared-laundry','building-a-place-for-clean-energy-research','aliasearch-research-before-reachout','why-i-started-this-site','five-days-in-singapore'];
let staticPostsRequest, databasePostsRequest, loadRequest = 0;

// mobile nav
const toggle = document.getElementById('navToggle');
const drawer = document.getElementById('navDrawer');
if (toggle) toggle.addEventListener('click', () => { const o = drawer.classList.toggle('open'); toggle.classList.toggle('open', o); });
drawer && drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { drawer.classList.remove('open'); toggle.classList.remove('open'); }));

// filters
document.getElementById('blogFilters').addEventListener('click', e => {
  const pill = e.target.closest('.filter-pill');
  if (!pill) return;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  activeFilter = pill.dataset.cat;
  page = 0;
  loadPosts();
});

// pagination
document.getElementById('prevBtn').addEventListener('click', () => { page--; loadPosts(); });
document.getElementById('nextBtn').addEventListener('click', () => { page++; loadPosts(); });

async function loadPosts() {
  const requestId = ++loadRequest;
  const list = document.getElementById('blogAllList');
  const pag  = document.getElementById('blogPagination');

  list.innerHTML = [1,2,3,4].map(() => `
    <div class="blog-skel-row">
      <div><div class="skel" style="width:48px;height:12px;margin-bottom:6px;"></div><div class="skel" style="width:32px;height:12px;"></div></div>
      <div><div class="skel" style="width:75%;height:20px;margin-bottom:10px;"></div><div class="skel" style="width:100%;height:13px;margin-bottom:5px;"></div><div class="skel" style="width:60%;height:13px;"></div></div>
    </div>`).join('');

  // Fetch static stories in parallel with the database request; reuse both across filters/pages.
  staticPostsRequest ||= Promise.all(STATIC_POST_SLUGS.map(async slug => {
    try {
      const response = await fetch(`posts/${slug}.json`);
      return response.ok ? await response.json() : null;
    } catch(_) { return null; }
  })).then(posts => posts.filter(Boolean));
  databasePostsRequest ||= (async () => {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      const { data, error } = await sb.from('posts')
        .select('id,title,slug,category,excerpt,created_at')
        .order('created_at', { ascending: false })
        .range(0, 999);
      if (!error) return data || [];
      console.warn('Blog list query failed:', error);
    } catch(e) { console.warn('Blog list query failed:', e); }
    return [];
  })();
  const [databasePosts, staticPosts] = await Promise.all([databasePostsRequest, staticPostsRequest]);
  if (requestId !== loadRequest) return;

  // Merge code-published stories with admin posts before paging, so no entries vanish between pages.
  const knownSlugs = new Set(databasePosts.map(post => post.slug));
  const combined = [...databasePosts, ...staticPosts.filter(post => !knownSlugs.has(post.slug))];
  const filtered = combined.filter(post => activeFilter === 'all' || (post.category || post.cat) === activeFilter);
  filtered.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
  totalCount = filtered.length;
  const posts = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (!posts.length) {
    list.innerHTML = `<div class="blog-notice">No posts${activeFilter!=='all'?' in this category':''} yet — <a href="../admin/index.html">write one</a>.</div>`;
    pag.style.display = 'none';
    return;
  }

  list.innerHTML = '';
  posts.forEach(p => {
    const d = new Date(p.created_at || p.date);
    const a = document.createElement('a');
    a.href = `post.html?slug=${encodeURIComponent(p.slug)}`;
    a.className = 'blog-all-row';
    a.innerHTML = `
      <div class="blog-all-date">${d.toLocaleString('en',{month:'short'})} ${d.getDate()}<br>${d.getFullYear()}</div>
      <div><div class="blog-all-title">${escapeText(p.title)}</div><div class="blog-all-excerpt">${escapeText(p.excerpt||'')}</div></div>
      <div class="blog-all-tag">${escapeText(p.category||p.cat||'personal')}</div>`;
    list.appendChild(a);
  });

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  if (totalPages > 1) {
    pag.style.display = 'flex';
    document.getElementById('prevBtn').disabled = page === 0;
    document.getElementById('nextBtn').disabled = page >= totalPages - 1;
    document.getElementById('pageInfo').textContent = `Page ${page+1} of ${totalPages}`;
  } else { pag.style.display = 'none'; }
}

loadPosts();
