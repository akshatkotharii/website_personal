(() => {
  'use strict';
  const root = document.getElementById('notebook');
  if (!root) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = value => { try { const u = new URL(value, location.href); return value && ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const labels = {planned:'Up next', building:'In progress', shipped:'Shipped', paused:'On pause', dropped:'Closed chapter'};
  const art = {
    'spin-sync':'<svg viewBox="0 0 52 52"><rect x="9" y="5" width="34" height="42" rx="7"/><path d="M16 12h3m5 0h12"/><circle class="washer-drum" cx="26" cy="29" r="11"/><circle cx="26" cy="29" r="6"/></svg>',
    'outreach-brain':'<svg viewBox="0 0 52 52"><path class="message-pulse" d="M8 13h36v25H25l-10 7v-7H8z"/><path d="M16 22h20M16 29h13"/><circle class="message-dot" cx="39" cy="11" r="4"/></svg>',
    'energy-nudging':'<svg viewBox="0 0 52 52"><path d="M9 40h35M12 34l9-9 8 5 13-17"/><path class="energy-spark" d="M29 7 19 25h9l-4 15 11-21h-9l3-12z"/></svg>',
    'ml-sprint':'<svg viewBox="0 0 52 52"><path d="M26 8c-8-8-20 1-16 10-8 5-4 17 2 18-2 9 8 13 14 7 6 6 16 2 14-7 7-4 7-14 1-18 3-10-7-17-15-10z"/><path d="M26 10v33M18 18l8 5 8-7M15 31l11-3 10 6M19 39l7-5 8 5"/></svg>',
    'this-site':'<svg viewBox="0 0 52 52"><path class="site-cursor" d="m13 8 24 18-11 2-5 12z"/><path d="m31 33 7 8"/></svg>'
  };
  let projects = [], entries = [], filter = 'now', selected = null, trigger = null;
  const dialog = document.getElementById('notebookDialog');
  const board = document.getElementById('notebookBoard');
  const date = value => new Date(value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
  function matching(p) {
    if (filter === 'all') return true;
    if (filter === 'shipped') return p.status === 'shipped';
    if (filter === 'archive') return ['paused','dropped'].includes(p.status);
    return !['paused','dropped'].includes(p.status) && p.pinned;
  }
  function render() {
    const visible = projects.filter(matching);
    const connections='<svg class="notebook-connectors" viewBox="0 0 720 500" preserveAspectRatio="none" aria-hidden="true"><path d="M100 220 C40 260 280 290 180 320 M350 220 C310 270 580 280 540 320 M640 220 C700 290 640 320 610 345"/></svg>';
    board.innerHTML = visible.length ? connections + visible.map((p,i) => `<button class="notebook-note note-${i % 5}" type="button" data-project="${escape(p.id)}" data-project-art="${art[p.id] ? escape(p.id) : 'default'}" aria-haspopup="dialog" aria-label="Open ${escape(p.title)} project details">
      <span class="note-top"><span class="note-kind">${escape(p.kind)}</span><span class="note-illustration" aria-hidden="true">${art[p.id] || '<svg viewBox="0 0 52 52"><path d="M8 40h36M12 32l10-10 7 6 12-15"/><circle cx="41" cy="13" r="3"/></svg>'}</span></span>
      <span class="note-title">${escape(p.title)}</span><span class="note-summary">${escape(p.summary)}</span>
      <span class="note-bottom"><span class="note-status status-${escape(p.status)}">${labels[p.status] || 'In progress'}</span><span class="note-open" aria-hidden="true">↗</span></span>
    </button>`).join('') : '<p class="notebook-empty">Nothing here yet. Every chapter has its own pace.</p>';
    document.querySelectorAll('[data-notebook-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.notebookFilter === filter)));
  }
  function showTab(tab) {
    dialog.querySelectorAll('[data-note-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.noteTab === tab)));
    dialog.querySelectorAll('[data-note-panel]').forEach(p => p.hidden = p.dataset.notePanel !== tab);
  }
  function open(id, source) {
    selected = projects.find(p => p.id === id);
    if (!selected) return;
    trigger = source;
    const p = selected;
    const logs = entries.filter(e => e.project_id === p.id);
    const link = (url,label) => safeURL(url) ? `<a class="notebook-link" href="${escape(safeURL(url))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : '';
    dialog.innerHTML = `<div class="notebook-page">
      <div class="notebook-page-top"><span class="note-kind">${escape(p.kind)} / ${labels[p.status]}</span><button type="button" class="notebook-close" aria-label="Close notebook">×</button></div>
      <h2 id="notebookTitle">${escape(p.title)}</h2><p class="notebook-deck">${escape(p.summary)}</p>
      <div class="notebook-tabs" role="tablist" aria-label="Explore this chapter">${[['now','Current focus'],['trail','Progress so far']].map(([id,label],i) => `<button type="button" role="tab" id="note-tab-${id}" aria-controls="note-panel-${id}" aria-selected="${i===0}" data-note-tab="${id}">${label}</button>`).join('')}</div>
      <div id="note-panel-now" role="tabpanel" aria-labelledby="note-tab-now" data-note-panel="now">
        <div class="notebook-focus"><span class="hand-note">what I’m working on</span><p>${escape(p.current || 'A new chapter. Notes coming as it develops.')}</p></div>
        ${p.thinking ? `<div class="notebook-next"><span class="hand-note">why this way</span><p>${escape(p.thinking)}</p></div>`:''}
        ${p.start_date ? `<p class="notebook-date">${p.status === 'planned' ? 'Planned start' : 'Started'} · ${date(p.start_date+'T12:00:00+05:30')}</p>` : ''}
        ${p.id==='ml-sprint' ? `<div class="sprint-caption"><span>Learning trail</span><span>${Number(p.progress)||0} / 30 days completed</span></div><div class="sprint-days" aria-label="${Number(p.progress)||0} of 30 days completed">${Array.from({length:30},(_,i) => `<button type="button" data-sprint-day="${i+1}" class="sprint-day ${i < (p.progress||0)?'done':''}" aria-label="Day ${i+1}${i<(p.progress||0)?', completed':''}">${i+1}</button>`).join('')}</div><div id="sprintDayNote" class="sprint-day-note" aria-live="polite"></div><p class="notebook-caption">Tap a day to explore its notes. Progress follows completed work, not the calendar.</p>` : ''}
        ${p.next_step ? `<div class="notebook-next"><span class="hand-note">next little step</span><p>${escape(p.next_step)}</p></div>`:''}
        <div class="notebook-links">${link(p.url,'Explore project')}${link(p.thread_url,'Read the thread')}</div>
      </div>
      <div id="note-panel-trail" role="tabpanel" aria-labelledby="note-tab-trail" data-note-panel="trail" hidden><span class="hand-note">what’s been done</span><div class="notebook-trail">${logs.length ? logs.map(e => `<article><time datetime="${escape(e.created_at)}">${date(e.created_at)}</time><h3>${escape(e.title)}</h3><p>${escape(e.body)}</p>${link(e.url,'Read more')}</article>`).join('') : '<p class="notebook-empty">No updates published yet. The first page is still waiting.</p>'}</div>${link(p.thread_url,'Open the full blog thread')}</div>
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
    const b=e.target.closest('[data-note-tab]'); if(b) showTab(b.dataset.noteTab);
    const day=e.target.closest('[data-sprint-day]');
    if(day){const number=Number(day.dataset.sprintDay),notes=entries.filter(x=>x.project_id===selected.id&&x.sprint_day===number);dialog.querySelector('#sprintDayNote').innerHTML='<strong>Day '+number+'</strong>'+ (notes.length?notes.map(x=>'<p>'+escape(x.title)+'</p><p>'+escape(x.body)+'</p>').join(''):'<p>No note published for this day yet.</p>');dialog.querySelectorAll('[data-sprint-day]').forEach(x=>x.setAttribute('aria-pressed',String(x===day)));}
    if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}
  });
  dialog.addEventListener('keydown',e=>{if(!e.target.matches('[data-note-tab]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...dialog.querySelectorAll('[data-note-tab]')];let i=tabs.indexOf(e.target);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[i].focus();showTab(tabs[i].dataset.noteTab);});
  dialog.addEventListener('close',()=>{document.body.classList.remove('notebook-is-open');trigger?.focus();});
  async function load() {
    projects=window.NOTEBOOK_SEED;render();
    const sb=window.getSupabase?.(); if(!sb)return;
    try {
      const [p,e]=await Promise.all([sb.from('notebook_projects').select('*').order('sort_order'),sb.from('notebook_entries').select('*').eq('published',true).order('created_at',{ascending:false}).limit(200)]);
      if(!p.error && p.data){projects=p.data;render();}
      if(!e.error){entries=e.data||[];const latest=entries.find(x=>projects.some(p=>p.id===x.project_id));if(latest){const button=document.getElementById('notebookLatest');button.hidden=false;button.textContent='Latest note · '+date(latest.created_at)+' — '+latest.title;button.onclick=()=>{open(latest.project_id,button);showTab('trail');};}}
    } catch { /* Seed cards remain available when offline. */ }
  }
  load();
})();
