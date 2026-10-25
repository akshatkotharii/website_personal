(() => {
  'use strict';
  const root = document.getElementById('notebook');
  if (!root) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = value => { try { const u = new URL(value, location.href); return value && ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const labels = {planned:'Up next', building:'In progress', shipped:'Shipped', paused:'On pause', dropped:'Closed chapter'};
  const art = window.PROJECT_ART;
  let projects = [], entries = [], filter = 'now', selected = null, trigger = null, mobileObserver = null;
  const dialog = document.getElementById('notebookDialog');
  const board = document.getElementById('notebookBoard');
  const date = value => new Date(value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
  function activateMobileArt() {
    mobileObserver?.disconnect();
    if (!matchMedia('(max-width: 760px)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    mobileObserver = new IntersectionObserver(items => {
      items.forEach(item => item.target.dataset.mobileVisible = String(item.isIntersecting && item.intersectionRatio >= .55));
      const visible = [...board.querySelectorAll('.notebook-note[data-mobile-visible="true"]')];
      const center = innerHeight / 2;
      const closest = visible.sort((a,b) => Math.abs(a.getBoundingClientRect().top + a.offsetHeight / 2 - center) - Math.abs(b.getBoundingClientRect().top + b.offsetHeight / 2 - center))[0];
      board.querySelectorAll('.notebook-note').forEach(card => card.classList.toggle('is-mobile-active', card === closest));
    }, { threshold: [.55] });
    board.querySelectorAll('.notebook-note').forEach(card => mobileObserver.observe(card));
  }
  function matching(p) {
    if (filter === 'all') return true;
    if (filter === 'shipped') return p.status === 'shipped';
    if (filter === 'archive') return ['paused','dropped'].includes(p.status);
    return !['paused','dropped'].includes(p.status) && p.pinned;
  }
  function render() {
    const visible = projects.filter(matching);
    const connections='<svg class="notebook-connectors" viewBox="0 0 720 500" preserveAspectRatio="none" aria-hidden="true"><path d="M100 220 C40 260 280 290 180 320 M350 220 C310 270 580 280 540 320 M640 220 C700 290 640 320 610 345"/></svg>';
    board.innerHTML = visible.length ? connections + visible.map((p,i) => `<button class="notebook-note note-${i % 5}" type="button" data-project="${escape(p.id)}" data-project-icon="${escape(p.icon || 'spark')}" data-project-motion="${escape(p.animation || 'breathe')}" aria-haspopup="dialog" aria-label="Open ${escape(p.title)} project details">
      <span class="note-top"><span class="note-kind">${escape(p.kind)}</span><span class="note-illustration" aria-hidden="true">${art.render(p.icon)}</span></span>
      <span class="note-title">${escape(p.title)}</span><span class="note-summary">${escape(p.summary)}</span>
      <span class="note-bottom"><span class="note-status status-${escape(p.status)}">${labels[p.status] || 'In progress'}</span><span class="note-open" aria-hidden="true">↗</span></span>
    </button>`).join('') : '<p class="notebook-empty">Nothing here yet. Every chapter has its own pace.</p>';
    document.querySelectorAll('[data-notebook-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.notebookFilter === filter)));
    activateMobileArt();
  }
  function open(id, source, revealJournal = false) {
    selected = projects.find(p => p.id === id);
    if (!selected) return;
    trigger = source;
    const p = selected;
    const logs = entries.filter(e => e.project_id === p.id);
    const link = (url,label) => safeURL(url) ? `<a class="notebook-link" href="${escape(safeURL(url))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : '';
    const isLearningSprint = p.kind === 'Learning' && Number.isFinite(Number(p.progress));
    const moments = [
      ['Now', p.current || 'A new chapter. Notes will appear here as it develops.'],
      p.thinking ? ['Thinking through', p.thinking] : null,
      p.next_step ? ['Next', p.next_step] : null
    ].filter(Boolean);
    dialog.innerHTML = `<div class="notebook-page">
      <div class="notebook-page-top"><span class="note-kind">${escape(p.kind)} / ${labels[p.status]}</span><button type="button" class="notebook-close" aria-label="Close notebook">×</button></div>
      <div class="notebook-page-hero"><span class="notebook-page-art" data-project-motion="${escape(p.animation || 'breathe')}" aria-hidden="true">${art.render(p.icon)}</span><div><h2 id="notebookTitle">${escape(p.title)}</h2><p class="notebook-deck">${escape(p.summary)}</p></div></div>
      <div class="notebook-moments">${moments.map(([label,copy], index) => `<article class="notebook-moment ${index === 0 ? 'is-now' : ''}"><span>${escape(label)}</span><p>${escape(copy)}</p></article>`).join('')}</div>
      ${p.start_date ? `<p class="notebook-date">${p.status === 'planned' ? 'Planned start' : 'Started'} · ${date(p.start_date+'T12:00:00+05:30')}</p>` : ''}
      <div class="notebook-links">${link(p.url,'Explore project')}${link(p.thread_url,'Read the thread')}</div>
      <details class="notebook-journal" ${revealJournal ? 'open' : ''}><summary><span>Updates</span><small>${logs.length ? `${logs.length} ${logs.length === 1 ? 'update' : 'updates'}` : 'No updates'}</small></summary>
        <div class="notebook-journal-content">${isLearningSprint ? `<div class="sprint-caption"><span>Learning trail</span><span>${Number(p.progress)||0} / 30 days completed</span></div><div class="sprint-days" aria-label="${Number(p.progress)||0} of 30 days completed">${Array.from({length:30},(_,i) => `<button type="button" data-sprint-day="${i+1}" class="sprint-day ${i < (p.progress||0)?'done':''}" aria-label="Day ${i+1}${i<(p.progress||0)?', completed':''}">${i+1}</button>`).join('')}</div><div id="sprintDayNote" class="sprint-day-note" aria-live="polite"></div>` : ''}<div class="notebook-trail">${logs.length ? logs.map(e => `<article><time datetime="${escape(e.created_at)}">${date(e.created_at)}</time><h3>${escape(e.title)}</h3><p>${escape(e.body)}</p>${link(e.url,'Read more')}</article>`).join('') : '<p class="notebook-empty">No updates yet.</p>'}</div>${link(p.thread_url,'Open the full blog thread')}</div>
      </details>
      ${p.updated_at ? `<p class="notebook-updated">Last edited ${date(p.updated_at)}</p>`:''}
    </div>`;
    dialog.showModal();
    document.body.classList.add('notebook-is-open');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && source) {
      const a = source.getBoundingClientRect(), b = dialog.getBoundingClientRect();
      dialog.animate([{transform:`translate(${a.x+a.width/2-b.x-b.width/2}px,${a.y+a.height/2-b.y-b.height/2}px) scale(.65)`,opacity:.25},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    dialog.querySelector('.notebook-close').focus();
  }
  board.addEventListener('click', e => { const b=e.target.closest('[data-project]'); if(b) open(b.dataset.project,b); });
  root.addEventListener('click', e => { const b=e.target.closest('[data-notebook-filter]'); if(b){filter=b.dataset.notebookFilter;render();} });
  dialog.addEventListener('click', e => {
    if(e.target.closest('.notebook-close')) dialog.close();
    const day=e.target.closest('[data-sprint-day]');
    if(day){const number=Number(day.dataset.sprintDay),notes=entries.filter(x=>x.project_id===selected.id&&x.sprint_day===number);dialog.querySelector('#sprintDayNote').innerHTML='<strong>Day '+number+'</strong>'+ (notes.length?notes.map(x=>'<p>'+escape(x.title)+'</p><p>'+escape(x.body)+'</p>').join(''):'<p>No note published for this day yet.</p>');dialog.querySelectorAll('[data-sprint-day]').forEach(x=>x.setAttribute('aria-pressed',String(x===day)));}
    if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}
  });
  dialog.addEventListener('close',()=>{document.body.classList.remove('notebook-is-open');trigger?.focus();});
  async function load() {
    projects=window.NOTEBOOK_SEED;render();
    const sb=window.getSupabase?.(); if(!sb)return;
    try {
      const [p,e]=await Promise.all([sb.from('notebook_projects').select('*').order('sort_order'),sb.from('notebook_entries').select('*').eq('published',true).order('created_at',{ascending:false}).limit(200)]);
      if(!p.error && p.data){projects=p.data;render();}
      if(!e.error){entries=e.data||[];const latest=entries.find(x=>projects.some(p=>p.id===x.project_id));if(latest){const button=document.getElementById('notebookLatest');button.hidden=false;button.textContent='Latest note · '+date(latest.created_at)+' — '+latest.title;button.onclick=()=>open(latest.project_id,button,true);}}
    } catch { /* Seed cards remain available when offline. */ }
  }
  load();
})();
