(() => {
  'use strict';
  const root = document.getElementById('notebook');
  if (!root) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = value => { try { const u = new URL(value, location.href); return value && ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const labels = {planned:'Up next', building:'In progress', shipped:'Shipped', paused:'On pause', dropped:'Closed chapter'};
  const symbols = {Building:'⌁', Research:'◌', Product:'↗', Learning:'✳', Personal:'✎'};
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
    board.innerHTML = visible.length ? connections + visible.map((p,i) => `<button class="notebook-note note-${i % 5}" type="button" data-project="${escape(p.id)}" aria-haspopup="dialog">
      <span class="note-top"><span class="note-kind">${escape(p.kind)}</span><span class="note-symbol" aria-hidden="true">${symbols[p.kind] || '✎'}</span></span>
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
      <div class="notebook-tabs" role="tablist" aria-label="Explore this chapter">${['doing','thinking','trail'].map((t,i) => `<button type="button" role="tab" id="note-tab-${t}" aria-controls="note-panel-${t}" aria-selected="${i===0}" data-note-tab="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div>
      <div id="note-panel-doing" role="tabpanel" aria-labelledby="note-tab-doing" data-note-panel="doing">
        <div class="notebook-focus"><span class="hand-note">on my desk</span><p>${escape(p.current || 'A new chapter. Notes coming as it develops.')}</p></div>
        ${p.start_date ? `<p class="notebook-date">${p.status === 'planned' ? 'Planned start' : 'Started'} · ${date(p.start_date+'T12:00:00+05:30')}</p>` : ''}
        ${p.id==='ml-sprint' ? `<div class="sprint-caption"><span>Learning trail</span><span>${Number(p.progress)||0} / 30 days completed</span></div><div class="sprint-days" aria-label="${Number(p.progress)||0} of 30 days completed">${Array.from({length:30},(_,i) => `<button type="button" data-sprint-day="${i+1}" class="sprint-day ${i < (p.progress||0)?'done':''}" aria-label="Day ${i+1}${i<(p.progress||0)?', completed':''}">${i+1}</button>`).join('')}</div><div id="sprintDayNote" class="sprint-day-note" aria-live="polite"></div><p class="notebook-caption">Tap a day to explore its notes. Progress follows completed work, not the calendar.</p>` : ''}
        ${p.next_step ? `<div class="notebook-next"><span class="hand-note">next little step</span><p>${escape(p.next_step)}</p></div>`:''}
        <div class="notebook-links">${link(p.url,'Explore project')}${link(p.thread_url,'Read the thread')}</div>
      </div>
      <div id="note-panel-thinking" role="tabpanel" aria-labelledby="note-tab-thinking" data-note-panel="thinking" hidden><span class="hand-note">behind the decisions</span><blockquote class="notebook-thought">${escape(p.thinking || 'Still thinking this through. I’ll share the questions and decisions here as they take shape.')}</blockquote><p class="notebook-caption">A work in progress, including the thinking.</p></div>
      <div id="note-panel-trail" role="tabpanel" aria-labelledby="note-tab-trail" data-note-panel="trail" hidden><span class="hand-note">notes along the way</span><div class="notebook-trail">${logs.length ? logs.map(e => `<article><time datetime="${escape(e.created_at)}">${date(e.created_at)}</time><h3>${escape(e.title)}</h3><p>${escape(e.body)}</p>${link(e.url,'Read more')}</article>`).join('') : '<p class="notebook-empty">No updates published yet. The first page is still waiting.</p>'}</div>${link(p.thread_url,'Open the full blog thread')}</div>
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
  dialog.addEventListener('keydown',e=>{if(!e.target.matches('[data-note-tab]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...dialog.querySelectorAll('[data-note-tab]')];let i=tabs.indexOf(e.target);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tabs[i].focus();showTab(tabs[i].dataset.noteTab);});
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
