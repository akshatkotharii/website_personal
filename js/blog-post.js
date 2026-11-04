const sb = getSupabase();
const PDF_BUCKET = 'portfolio-pdfs';

// mobile nav
const toggle = document.getElementById('navToggle');
const drawer = document.getElementById('navDrawer');
if (toggle) toggle.addEventListener('click', () => {
  const o = drawer.classList.toggle('open');
  toggle.classList.toggle('open', o);
});
drawer && drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  drawer.classList.remove('open'); toggle.classList.remove('open');
}));

// ── BROWSER FINGERPRINT (for likes, no login needed) ──
function getFingerprint() {
  let fp; try { fp = localStorage.getItem('ak_fp'); } catch {}
  if (!fp) {
    fp = crypto.randomUUID();
    try { localStorage.setItem('ak_fp', fp); } catch {}
  }
  return fp;
}

let currentPostId = null;

// ── LOAD POST ──
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');
  const wrap   = document.getElementById('postWrap');
  if (!slug) { showNotFound(wrap); return; }

  let post = null;
  const staticSlugs = new Set(['why-i-started-this-site', 'five-days-in-singapore', 'aliasearch-research-before-reachout', 'building-a-place-for-clean-energy-research', 'outreach-brain', 'spinsync-shared-laundry', 'smart-energy-nudging']);

  // Repo-backed posts should not wait for a failed database lookup first.
  if (staticSlugs.has(slug)) {
    try {
      const r = await fetch(`../blog/posts/${slug}.json`);
      if (r.ok) post = await r.json();
    } catch (_) {}
  }

  // 1. Try Supabase
  if (!post && sb) {
    try {
      const { data, error } = await sb.from('posts').select('*').eq('slug', slug).single();
      if (!error && data) { post = data; currentPostId = data.id; }
    } catch(e) { console.warn('Supabase:', e); }
  }

  // 2. Try localStorage
  if (!post) {
    const saved = JSON.parse(localStorage.getItem('ak_posts') || '[]');
    post = saved.find(p => p.slug === slug) || null;
  }

  // 3. Try static JSON
  if (!post) {
    try {
      const r = await fetch(`../blog/posts/${slug}.json`);
      if (r.ok) post = await r.json();
    } catch(_) {}
  }

  if (!post) { showNotFound(wrap); return; }
  if (post.content_file) {
    if (!/^posts\/[a-z0-9-]+\.html$/.test(post.content_file)) { showNotFound(wrap); return; }
    try {
      const response = await fetch(`../blog/${post.content_file}`);
      if (!response.ok) throw new Error(`Article content returned ${response.status}`);
      post.html = await response.text();
    } catch (error) {
      console.warn('Static article content could not be loaded:', error);
      showNotFound(wrap);
      return;
    }
  }
  renderPost(wrap, post);

  // Load likes + comments after post renders
  if (currentPostId) {
    loadThread(post);
    loadLikes(currentPostId);
    loadComments(currentPostId);
  }
});

// ── RENDER POST ──
function renderPost(wrap, post) {
  // Fix: Supabase uses created_at, static JSON uses date
  const rawDate = post.created_at || post.date || new Date().toISOString();
  const d       = new Date(rawDate);
  const dateStr = d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });

  const bodyHTML = post.content || post.html
    ? (post.content || post.html)
    : (post.body || '').split(/\n{2,}/).filter(Boolean).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  let imageIndex = 0;
  const safeBodyHTML = safeMarkup(bodyHTML).replace(/<img\b[^>]*>/gi, tag => {
    const first = imageIndex++ === 0;
    if (!/\sloading\s*=/i.test(tag)) tag = tag.replace(/<img\b/i, `<img loading="${first ? 'eager' : 'lazy'}"`);
    if (!/\sdecoding\s*=/i.test(tag)) tag = tag.replace(/<img\b/i, '<img decoding="async"');
    if (first && !/\sfetchpriority\s*=/i.test(tag)) tag = tag.replace(/<img\b/i, '<img fetchpriority="high"');
    return tag;
  });
  const pdfUrl = post.source_pdf_path && sb
    ? sb.storage.from(PDF_BUCKET).getPublicUrl(post.source_pdf_path).data.publicUrl
    : '';
  const pdfViewer = pdfUrl ? `
    <section class="post-pdf" aria-label="Original PDF document">
      <div class="post-pdf-bar"><span>Original document</span><a href="${escapeText(pdfUrl)}" target="_blank" rel="noopener noreferrer">Open PDF ↗</a></div>
      <iframe class="post-pdf-viewer" src="${escapeText(pdfUrl)}#view=FitH" title="PDF: ${escapeText(post.title)}" referrerpolicy="no-referrer"></iframe>
    </section>` : '';

  document.title = `${post.title} — Akshat Kothari`;

  wrap.innerHTML = `
    <a href="index.html" class="post-back">← All posts</a>
    <div class="post-meta">
      <span>${dateStr}</span>
      <span class="post-meta-tag">${escapeText(post.category || post.cat || 'personal')}</span>
    </div>
    <h1 class="post-title">${escapeText(post.title)}</h1>
    <div class="post-divider"></div>
    <aside class="post-thread" id="postThread" style="display:none;"></aside>
    <div class="reading-size" role="group" aria-label="Reading text size">
      <span class="reading-size-label" id="readingSizeLabel">Text size</span>
      <div class="reading-size-control">
        <span aria-hidden="true">A</span>
        <input id="readingSize" type="range" min="100" max="130" step="5" value="100" aria-labelledby="readingSizeLabel" aria-valuetext="100 percent">
        <span aria-hidden="true" class="reading-size-large-a">A</span>
        <output class="reading-size-value" id="readingSizeValue" for="readingSize">100%</output>
      </div>
    </div>
    <div class="post-body">${safeBodyHTML}</div>
    ${pdfViewer}

    <!-- LIKES -->
    <div class="post-engagement" id="engagementBar">
      <button class="like-btn" id="likeBtn" type="button">
        <span class="like-icon">♡</span>
        <span>Like this post</span>
      </button>
      <span class="like-count" id="likeCount">— likes</span>
    </div>

    <!-- COMMENTS -->
    <div class="comments-section">
      <h2 class="comments-title">Comments</h2>
      <p class="comments-sub">All comments are reviewed before appearing.</p>
      <div class="comment-list" id="commentList">
        <div class="comment-empty">Loading comments…</div>
      </div>
      <div class="comment-form">
        <div class="comment-form-row">
          <input class="comment-input" id="commentName" placeholder="Your name *" maxlength="60">
          <input class="comment-input" id="commentEmail" placeholder="Email (not shown)" type="email" maxlength="120">
        </div>
        <textarea class="comment-textarea" id="commentMsg" placeholder="Write a comment…" maxlength="1000"></textarea>
        <button class="comment-submit" id="commentSubmit" type="button">Post comment →</button>
        <div class="comment-notice" id="commentNotice"></div>
      </div>
    </div>

    <div class="post-footer">
      <a href="index.html" class="post-footer-back">← Back to all posts</a>
      <span style="font-family:var(--mono);font-size:11px;color:var(--gray-400);">Akshat Kothari</span>
    </div>
  `;
}

// Render original post plus every linked follow-up, each with its own date.
async function loadThread(post) {
  if (!sb || !currentPostId) return;

  const rootId = post.parent_post_id || post.id;
  try {
    const { data: posts, error } = await sb
      .from('posts')
      .select('id, title, slug, created_at, parent_post_id')
      .or(`id.eq.${rootId},parent_post_id.eq.${rootId}`)
      .order('created_at', { ascending: true });
    if (error || !posts || posts.length < 2) return;

    const thread = document.getElementById('postThread');
    if (!thread) return;
    thread.style.display = 'block';
    thread.innerHTML = `
      <div class="post-thread-label">Story thread · ${posts.length} posts</div>
      ${posts.map((item, index) => {
        const date = new Date(item.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        const current = Number(item.id) === Number(currentPostId);
        const label = index === 0 ? 'Original' : `Update ${index}`;
        return `<a class="post-thread-item" href="post.html?slug=${encodeURIComponent(item.slug)}">
          <span class="post-thread-date">${date}</span>
          <span class="post-thread-title">${label}: ${escapeText(item.title)}</span>
          ${current ? '<span class="post-thread-current">Reading</span>' : ''}
        </a>`;
      }).join('')}`;
  } catch (error) {
    console.warn('Thread fetch failed:', error);
  }
}

// Likes are scoped by a random local token; raw visitor tokens are never public.
let likedHere=false;
function renderLikes(result) {
  likedHere=!!result.liked;
  const btn=document.getElementById('likeBtn'), n=Number(result.count)||0;
  btn.classList.toggle('liked',likedHere);
  btn.innerHTML=likedHere?'<span>♥ Liked</span>':'<span>♡ Like this post</span>';
  document.getElementById('likeCount').textContent=n+' '+(n===1?'like':'likes');
}
async function loadLikes(postId) {
  if(!sb)return;
  const {data,error}=await sb.rpc('portfolio_like_state',{p_post_id:postId,p_token:getFingerprint()});
  if(error){document.getElementById('likeCount').textContent='Likes temporarily unavailable';return;}
  renderLikes(data);
}
async function toggleLike() {
  if(!sb||!currentPostId)return;
  const btn=document.getElementById('likeBtn');btn.disabled=true;
  try{
    const {data,error}=await sb.rpc('portfolio_set_like',{p_post_id:currentPostId,p_token:getFingerprint(),p_liked:!likedHere});
    if(error)throw error;renderLikes(data);
  }catch{document.getElementById('likeCount').textContent='Could not save like. Try again.';}
  finally{btn.disabled=false;}
}

// ── COMMENTS ──
async function loadComments(postId) {
  const list = document.getElementById('commentList');
  if (!list) return;

  if (!sb) {
    list.innerHTML = '<div class="comment-empty">Comments unavailable — Supabase not configured.</div>';
    return;
  }

  const { data: comments, error } = await sb
    .from('comments')
    .select('id, name, message, created_at')
    .eq('post_id', postId)
    .eq('approved', true)
    .order('created_at', { ascending: true });

  if (error || !comments || !comments.length) {
    list.innerHTML = '<div class="comment-empty">No comments yet. Be the first to say something.</div>';
    return;
  }

  list.innerHTML = comments.map(c => {
    const d   = new Date(c.created_at);
    const fmt = d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
    const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    return `
      <div class="comment-item">
        <div class="comment-header">
          <div class="comment-avatar">${escapeText(initials)}</div>
          <span class="comment-name">${escHtml(c.name)}</span>
          <span class="comment-date">${fmt}</span>
        </div>
        <div class="comment-text">${escHtml(c.message)}</div>
      </div>`;
  }).join('');
}

async function submitComment() {
  const name    = document.getElementById('commentName').value.trim();
  const message = document.getElementById('commentMsg').value.trim();
  const btn     = document.getElementById('commentSubmit');
  const notice  = document.getElementById('commentNotice');

  if (!name || !message) {
    notice.textContent = 'Name and comment are required.';
    notice.className   = 'comment-notice err';
    return;
  }
  if (message.length < 3) {
    notice.textContent = 'Comment too short.';
    notice.className   = 'comment-notice err';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Posting…';
  notice.textContent = '';

  if (!sb || !currentPostId) {
    notice.textContent = 'Comments unavailable — Supabase not configured.';
    notice.className   = 'comment-notice err';
    btn.disabled = false;
    btn.textContent = 'Post comment →';
    return;
  }

  const { error } = await sb.from('comments').insert({
    post_id: currentPostId,
    name,
    message,
  });

  btn.disabled    = false;
  btn.textContent = 'Post comment →';

  if (error) {
    notice.textContent = 'Something went wrong. Try again.';
    notice.className   = 'comment-notice err';
  } else {
    document.getElementById('commentName').value = '';
    document.getElementById('commentMsg').value  = '';
    notice.textContent = '✓ Comment submitted — it\'ll appear after review.';
    notice.className   = 'comment-notice ok';
  }
}

function showNotFound(wrap) {
  wrap.innerHTML = `
    <a href="index.html" class="post-back">← All posts</a>
    <div class="not-found">
      <h2>Post not found</h2>
      <p>This post may have been moved or doesn't exist yet.</p>
    </div>`;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
document.getElementById('likeBtn')?.addEventListener('click', toggleLike);
document.getElementById('commentSubmit')?.addEventListener('click', submitComment);
