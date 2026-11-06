(() => {
  'use strict';
  const root = document.getElementById('notebook');
  if (!root) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = value => { try { const u = new URL(value, location.href); return value && ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const labels = {planned:'Up next', building:'In progress', shipped:'Shipped', paused:'On pause', dropped:'Closed chapter'};
  const skillCollectionId = 'c855b879-8b70-4d05-8be0-8e31af5c5968';
  const skillScenes = {
    'evidence-trail': {label:'Evidence trail',steps:['Brief','Identity','Fit','Evidence'],detail:[
      'Start with the real offer, buyer, market and exclusions. If the brief is vague, pause and clarify.',
      'Find the exact person or organization. Confirm the profile and role before judging fit.',
      'Check whether their role and context connect to the actual offer. Don’t stretch a weak match.',
      'Keep the profile and supporting evidence together. Return only qualified matches and leave outreach unsent for a person to review.'
    ]},
    'workflow-map': {label:'Workflow map',steps:['Input','Process','Review','Output'],detail:[
      'What goes into this skill: a clear task, the context it needs, and any limits.',
      'How it works through that input, shown as a small sequence rather than a black box.',
      'Where a person checks the result and corrects missing or uncertain information.',
      'What the skill returns, with useful links and context ready to reuse.'
    ]},
    'field-guide': {label:'Field guide',steps:['Notice','Try','Keep','Share'],detail:[
      'The problem or pattern that made this skill worth building.',
      'The practical method the skill uses to address it.',
      'The useful output or lesson worth keeping.',
      'The source, example or next step another person can explore.'
    ]},
    'performance-lab': {label:'Performance lab',steps:['Measure','Diagnose','Improve','Verify','Explain'],detail:[
      'Capture a baseline first. Separate real-user field data from repeatable lab runs.',
      'Find causes in traces, waterfalls, layout shifts and backend timing. Rank by user impact.',
      'Fix the biggest measured bottleneck while keeping accessibility and working features intact.',
      'Repeat comparable runs and exercise key journeys, including mobile and slower connections.',
      'Show evidence, conditions, limitations and remaining work. Never claim a metric you did not measure.'
    ]}
  };
  const art = window.PROJECT_ART;
  let projects = [], entries = [], filter = 'now', selected = null, trigger = null, mobileObserver = null, activeSkillIndex = 0, activeSkillStage = 0;
  const dialog = document.getElementById('notebookDialog');
  const board = document.getElementById('notebookBoard');
  const date = value => new Date(value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
  const fallbackSkills = () => [
    {title:'Aliasearch',body:'Researches whether a person or organization fits a real offer, then keeps the evidence visible for a human decision.',url:'https://github.com/akshatkotharii/aliasearch',scene_type:'evidence-trail'},
    {title:'AliasOpti',body:'A measurement-first skill for finding real website performance bottlenecks, making focused fixes and showing what changed.',url:'https://github.com/akshatkotharii/aliasopti',scene_type:'performance-lab'}
  ];
  const collectionSkills = rows => {
    const existing = new Map(rows.map(row => [row.title.toLowerCase(),row]));
    const known = fallbackSkills().map(seed => ({...seed,...existing.get(seed.title.toLowerCase())}));
    const knownTitles = new Set(known.map(skill => skill.title.toLowerCase()));
    return [...known,...rows.filter(row => !knownTitles.has(row.title.toLowerCase()))];
  };
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
    board.innerHTML = visible.length ? visible.map((p,i) => `<button class="notebook-note note-${i % 5} ${p.id === skillCollectionId ? 'notebook-note-skills' : ''}" type="button" data-project="${escape(p.id)}" data-project-icon="${escape(p.icon || 'spark')}" data-project-motion="${escape(p.animation || 'breathe')}" aria-haspopup="dialog" aria-label="Open ${escape(p.title)} project details">
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
    activeSkillIndex = 0; activeSkillStage = 0;
    const p = selected;
    const logs = entries.filter(e => e.project_id === p.id);
    const link = (url,label) => safeURL(url) ? `<a class="notebook-link" href="${escape(safeURL(url))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : '';
    const isLearningSprint = p.kind === 'Learning' && Number.isFinite(Number(p.progress));
    const isSkillCollection = p.id === skillCollectionId;
    const skills = isSkillCollection ? collectionSkills(logs) : logs;
    const moments = [
      ['Now', p.current || 'A new chapter. Notes will appear here as it develops.'],
      p.thinking ? ['Thinking through', p.thinking] : null,
      p.next_step ? ['Next', p.next_step] : null
    ].filter(Boolean);
    dialog.innerHTML = `<div class="notebook-page">
      <div class="notebook-page-top"><span class="note-kind">${escape(p.kind)} / ${labels[p.status]}</span><button type="button" class="notebook-close" aria-label="Close notebook">×</button></div>
      <div class="notebook-page-hero"><span class="notebook-page-art" data-project-motion="${escape(p.animation || 'breathe')}" aria-hidden="true">${art.render(p.icon)}</span><div><h2 id="notebookTitle">${escape(p.title)}</h2><p class="notebook-deck">${escape(p.summary)}</p></div></div>
      ${isSkillCollection ? renderSkillCollection(skills) : `<div class="notebook-moments">${moments.map(([label,copy], index) => `<article class="notebook-moment ${index === 0 ? 'is-now' : ''}"><span>${escape(label)}</span><p>${escape(copy)}</p></article>`).join('')}</div>`}
      ${p.start_date ? `<p class="notebook-date">${p.status === 'planned' ? 'Planned start' : 'Started'} · ${date(p.start_date+'T12:00:00+05:30')}</p>` : ''}
      ${isSkillCollection ? '' : `<div class="notebook-links">${link(p.url,'Explore project')}${link(p.thread_url,'Read the thread')}</div>`}
      ${isSkillCollection ? '' : `<details class="notebook-journal" ${revealJournal ? 'open' : ''}><summary><span>Updates</span><small>${logs.length ? `${logs.length} ${logs.length === 1 ? 'update' : 'updates'}` : 'No updates'}</small></summary>
        <div class="notebook-journal-content">${isLearningSprint ? `<div class="sprint-caption"><span>Learning trail</span><span>${Number(p.progress)||0} / 30 days completed</span></div><div class="sprint-days" aria-label="${Number(p.progress)||0} of 30 days completed">${Array.from({length:30},(_,i) => `<button type="button" data-sprint-day="${i+1}" class="sprint-day ${i < (p.progress||0)?'done':''}" aria-label="Day ${i+1}${i<(p.progress||0)?', completed':''}">${i+1}</button>`).join('')}</div><div id="sprintDayNote" class="sprint-day-note" aria-live="polite"></div>` : ''}<div class="notebook-trail">${logs.length ? logs.map(e => `<article><time datetime="${escape(e.created_at)}">${date(e.created_at)}</time><h3>${escape(e.title)}</h3><p>${escape(e.body)}</p>${link(e.url,'Read more')}</article>`).join('') : '<p class="notebook-empty">No updates yet.</p>'}</div>${link(p.thread_url,'Open the full blog thread')}</div>
      </details>`}
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
  function skillPanel(skill, index, total, stageIndex = 0) {
    const href = safeURL(skill.url), scene = skillScenes[skill.scene_type] || skillScenes['evidence-trail'];
    const stage = Math.min(Math.max(stageIndex,0),scene.steps.length-1);
    const metrics = skill.scene_type === 'performance-lab' ? `<div class="skill-vitals" aria-label="Core Web Vitals reference targets"><button type="button" data-vital="lcp" aria-pressed="true"><span>LCP</span><b>≤ 2.5s</b></button><button type="button" data-vital="inp" aria-pressed="false"><span>INP</span><b>≤ 200ms</b></button><button type="button" data-vital="cls" aria-pressed="false"><span>CLS</span><b>≤ 0.1</b></button></div><div class="skill-vital-note" aria-live="polite"><b>LCP · Largest Contentful Paint</b><span>Time until main content appears. Good target: 2.5 seconds or less.</span></div><p class="skill-vitals-caption">Core Web Vitals good thresholds · reference targets, not measurements of this site · <a href="https://web.dev/articles/vitals" target="_blank" rel="noopener noreferrer">web.dev source ↗</a></p>` : '';
    return `<article class="skill-specimen" data-skill-tone="${index % 4}" role="tabpanel" aria-labelledby="skillTab-${index}" aria-live="polite">
      <div class="skill-specimen-top"><span>${escape(scene.label)}</span><span>${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span></div>
      <div class="skill-title-row"><div><h3>${escape(skill.title)}</h3><p>${escape(skill.body)}</p></div><span class="skill-source-stamp" aria-hidden="true">FIELD<br>NOTES</span></div>
      ${metrics}
      <div class="skill-trail" role="group" aria-label="Explore ${escape(skill.title)} ${escape(scene.label.toLowerCase())}" style="--trail-count:${scene.steps.length};--trail-inset:${50/scene.steps.length}%">
        <div class="skill-trail-line" aria-hidden="true"><span style="--trail-progress:${stage/(scene.steps.length-1)*100}%"></span></div>
        ${scene.steps.map((label,i)=>`<button type="button" class="skill-trail-step" data-skill-stage="${i}" aria-pressed="${i===stage}" aria-label="${escape(label)}, step ${i+1} of ${scene.steps.length}"><span>${String(i+1).padStart(2,'0')}</span><b>${escape(label)}</b></button>`).join('')}
      </div>
      <div class="skill-trail-note"><span>${String(stage+1).padStart(2,'0')} / ${escape(scene.steps[stage])}</span><p>${escape(scene.detail[stage])}</p></div>
      <div class="skill-specimen-foot">${href ? `<a class="skill-source-link" href="${escape(href)}" target="_blank" rel="noopener noreferrer">Explore the source ↗</a>` : '<span class="skill-source-link">Source coming soon</span>'}<span>Built to be opened, studied and reused.</span></div>
    </article>`;
  }
  function renderSkillCollection(skills) {
    return `<section class="skill-cabinet" aria-label="Skills and tools">
      <div class="skill-cabinet-heading"><span>Choose a skill</span><span>${String(skills.length).padStart(2,'0')} ${skills.length === 1 ? 'skill' : 'skills'}</span></div>
      <div class="skill-cabinet-layout"><div class="skill-index" role="tablist" aria-label="Choose a skill">${skills.map((skill,index) => `<button type="button" id="skillTab-${index}" role="tab" data-skill-index="${index}" aria-selected="${index===0}" aria-controls="skillSpecimen"><span>${String(index+1).padStart(2,'0')}</span>${escape(skill.title)}</button>`).join('')}</div>
      <div id="skillSpecimen">${skills.length ? skillPanel(skills[0],0,skills.length) : '<p class="notebook-empty">First skill is taking shape.</p>'}</div></div>
    </section>`;
  }
  board.addEventListener('click', e => { const b=e.target.closest('[data-project]'); if(b) open(b.dataset.project,b); });
  root.addEventListener('click', e => { const b=e.target.closest('[data-notebook-filter]'); if(b){filter=b.dataset.notebookFilter;render();} });
  dialog.addEventListener('click', e => {
    if(e.target.closest('.notebook-close')) dialog.close();
    const skillTab=e.target.closest('[data-skill-index]');
    if(skillTab && selected?.id===skillCollectionId){const list=collectionSkills(entries.filter(x=>x.project_id===selected.id));activeSkillIndex=Number(skillTab.dataset.skillIndex);activeSkillStage=0;dialog.querySelectorAll('[data-skill-index]').forEach(x=>x.setAttribute('aria-selected',String(x===skillTab)));dialog.querySelector('#skillSpecimen').innerHTML=skillPanel(list[activeSkillIndex],activeSkillIndex,list.length);}
    const stage=e.target.closest('[data-skill-stage]');
    if(stage && selected?.id===skillCollectionId){const list=collectionSkills(entries.filter(x=>x.project_id===selected.id));activeSkillStage=Number(stage.dataset.skillStage);dialog.querySelector('#skillSpecimen').innerHTML=skillPanel(list[activeSkillIndex]||list[0],activeSkillIndex,list.length,activeSkillStage);}
    const vital=e.target.closest('[data-vital]');
    if(vital){const notes={lcp:['LCP · Largest Contentful Paint','Time until main content appears. Good target: 2.5 seconds or less.'],inp:['INP · Interaction to Next Paint','How quickly a page responds to interaction. Good target: 200 milliseconds or less.'],cls:['CLS · Cumulative Layout Shift','How much content shifts unexpectedly. Good target: 0.1 or less.']}[vital.dataset.vital];if(notes){dialog.querySelectorAll('[data-vital]').forEach(button=>button.setAttribute('aria-pressed',String(button===vital)));dialog.querySelector('.skill-vital-note').innerHTML=`<b>${escape(notes[0])}</b><span>${escape(notes[1])}</span>`;}}
    const day=e.target.closest('[data-sprint-day]');
    if(day){const number=Number(day.dataset.sprintDay),notes=entries.filter(x=>x.project_id===selected.id&&x.sprint_day===number);dialog.querySelector('#sprintDayNote').innerHTML='<strong>Day '+number+'</strong>'+ (notes.length?notes.map(x=>'<p>'+escape(x.title)+'</p><p>'+escape(x.body)+'</p>').join(''):'<p>No note published for this day yet.</p>');dialog.querySelectorAll('[data-sprint-day]').forEach(x=>x.setAttribute('aria-pressed',String(x===day)));}
    if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}
  });
  dialog.addEventListener('close',()=>{document.body.classList.remove('notebook-is-open');trigger?.focus();});
  async function load() {
    projects=window.NOTEBOOK_SEED;render();
    if(new URLSearchParams(location.search).has('local-preview'))return;
    const sb=window.getSupabase?.(); if(!sb)return;
    try {
      const [p,e]=await Promise.all([sb.from('notebook_projects').select('*').order('sort_order'),sb.from('notebook_entries').select('*').eq('published',true).order('created_at',{ascending:false}).limit(200)]);
      if(!p.error && p.data){const seedSkills=window.NOTEBOOK_SEED.find(project=>project.id===skillCollectionId);projects=p.data.map(project=>project.id===skillCollectionId && project.title==='Aliasearch' ? {...project,...seedSkills} : project);if(!projects.some(project=>project.id===skillCollectionId))projects.push(seedSkills);render();}
      if(!e.error){entries=e.data||[];const latest=entries.find(x=>projects.some(p=>p.id===x.project_id));if(latest){const button=document.getElementById('notebookLatest');button.hidden=false;button.textContent='Latest note · '+date(latest.created_at)+' — '+latest.title;button.onclick=()=>open(latest.project_id,button,true);}}
    } catch { /* Seed cards remain available when offline. */ }
  }
  load();
})();
