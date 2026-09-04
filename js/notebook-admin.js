(() => {
  'use strict';
  const root=document.getElementById('notebookAdmin'), client=getSupabase();
  if(!root||!client)return;
  const esc=escapeText;
  let projects=[],entries=[],active=null,entryId=null,loading=false;
  const statuses=['planned','building','shipped','paused','dropped'];
  const kinds=['Building','Research','Product','Learning','Personal'];
  const input=(name,label,value='',type='text')=>`<label for="nb-${name}">${label}</label><input id="nb-${name}" name="${name}" type="${type}" value="${esc(value??'')}" ${type==='text'?'maxlength="240"':''}>`;
  const area=(name,label,value='')=>`<label for="nb-${name}">${label}</label><textarea id="nb-${name}" name="${name}" maxlength="4000">${esc(value)}</textarea>`;
  const select=(name,label,values,value)=>`<label for="nb-${name}">${label}</label><select id="nb-${name}" name="${name}">${values.map(v=>`<option ${v===value?'selected':''}>${v}</option>`).join('')}</select>`;
  function message(text){const el=root.querySelector('#nbMessage');if(el)el.textContent=text;}
  function url(value){if(!value)return '';const u=new URL(value,location.origin);if(!['https:','http:'].includes(u.protocol))throw Error('Links must use https:// or a site path.');return u.href;}
  async function refresh(){
    const [p,e]=await Promise.all([client.from('notebook_projects').select('*').order('sort_order'),client.from('notebook_entries').select('*').order('created_at',{ascending:false}).limit(1000)]);
    if(p.error||e.error)throw Error('Notebook database needs setup. Run admin/notebook-migration.sql, add your admin user, then refresh.');
    projects=p.data||[];entries=e.data||[];
  }
  function render(){
    const p=projects.find(x=>x.id===active)||{id:'',title:'',kind:'Building',status:'planned',pinned:true,sort_order:projects.length};
    root.innerHTML=`<div class="nb-admin-header"><div><h2>Your open notebook</h2><p>Small updates. Clear chapters. Your thinking, in public.</p></div><button class="nb-secondary" id="nbNew">+ New chapter</button></div>
    <div class="nb-workspace"><div class="nb-project-list">${projects.map(x=>`<button type="button" data-edit-project="${esc(x.id)}" aria-pressed="${x.id===active}">${esc(x.title)}<small>${esc(x.status)}${x.pinned?' · on desk':''}</small></button>`).join('')||'<p class="nb-help">Add your first chapter.</p>'}</div>
    <div class="nb-editor"><form id="nbProjectForm">
      ${input('title','Chapter name *',p.title)}${input('summary','One-sentence introduction',p.summary)}
      <div class="nb-pair"><div>${select('kind','Kind',kinds,p.kind)}</div><div>${select('status','Status',statuses,p.status)}</div></div>
      <p class="nb-help">Shipped stays in Shipped; paused and dropped move to On the shelf. Pin up to five chapters to your desk.</p>
      ${area('current','What are you doing?',p.current)}${area('thinking','What are you thinking? Why does it matter?',p.thinking)}${area('next_step','Next small step',p.next_step)}
      <div class="nb-pair"><div>${input('url','Project link',p.url)}</div><div>${input('thread_url','Blog thread link',p.thread_url)}</div></div>
      <div class="nb-pair"><div>${input('start_date','Start date (optional)',p.start_date,'date')}</div><div>${input('sort_order','Display order',p.sort_order,'number')}</div></div>
      ${p.id==='ml-sprint'?input('progress','ML days completed (0–30)',p.progress??0,'number'):''}
      <label><input name="pinned" type="checkbox" ${p.pinned?'checked':''}> Show on my desk</label>
      <div class="nb-actions"><button type="submit">Save chapter</button>${p.id?'<button type="button" id="nbRemove">Delete chapter</button>':''}</div>
    </form><div class="nb-message" id="nbMessage" role="status"></div>
    ${p.id?`<details class="nb-log" open><summary>Updates for this chapter</summary><form id="nbEntryForm">${input('entry_title','Update title *')}${area('entry_body','What happened? *')}${input('entry_url','Read more link (optional)')}${p.id==='ml-sprint'?input('entry_day','Sprint day (1–30, optional)','','number'):''}<label><input name="published" type="checkbox"> Publish on website (leave unchecked for draft)</label><div class="nb-actions"><button type="submit">Save update</button><button type="button" id="nbResetEntry">Clear</button></div></form><div>${entries.filter(e=>e.project_id===p.id).map(e=>`<div class="nb-entry-row"><span>${esc(e.title)}<small> · ${e.published?'public':'draft'} · ${new Date(e.created_at).toLocaleDateString('en-GB')}</small></span><span><button type="button" data-edit-entry="${e.id}">Edit</button> <button type="button" data-delete-entry="${e.id}">Delete</button></span></div>`).join('')}</div></details>`:''}
    </div></div>
    <section class="nb-recap"><h3>A week in the notebook</h3><p class="nb-help">Turn published updates into an editable blog draft. Draft notes stay private. Email a published recap using its envelope button after server email setup.</p><div class="nb-actions"><label>Week starting <input type="date" id="nbWeek" value="${weekStart()}"></label><button type="button" id="nbGenerate">Generate recap</button></div><textarea id="nbRecap" aria-label="Weekly recap draft" placeholder="Your weekly recap will appear here. Review it before publishing."></textarea><button type="button" class="nb-secondary" id="nbToBlog">Move to blog editor</button><p id="nbRecapStatus" class="nb-help" role="status"></p></section>`;
    root.querySelector('[name=title]').required=true;
    root.querySelectorAll('[name=entry_title],[name=entry_body]').forEach(x=>x.required=true);
    const progress=root.querySelector('[name=progress]');if(progress){progress.min=0;progress.max=30;progress.step=1;}
    root.querySelector('#nbProjectForm').onsubmit=saveProject;
    if(p.id)root.querySelector('#nbEntryForm').onsubmit=saveEntry;
  }
  function weekStart(){const d=new Date();const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  async function saveProject(event){
    event.preventDefault();const form=event.target,button=form.querySelector('[type=submit]');button.disabled=true;
    try {
      const d=new FormData(form),status=d.get('status'),pinned=d.has('pinned')&&!['paused','dropped'].includes(status);
      if(pinned&&projects.filter(p=>p.pinned&&p.id!==active).length>=5)throw Error('Your desk holds five chapters. Unpin one or move it to the shelf first.');
      const payload={id:active||crypto.randomUUID(),title:d.get('title').trim(),summary:d.get('summary').trim(),kind:d.get('kind'),status,pinned,current:d.get('current').trim(),thinking:d.get('thinking').trim(),next_step:d.get('next_step').trim(),url:url(d.get('url').trim()),thread_url:url(d.get('thread_url').trim()),start_date:d.get('start_date')||null,sort_order:Number(d.get('sort_order'))||0,updated_at:new Date().toISOString()};
      if(!payload.title)throw Error('Chapter name is required.');
      if(d.has('progress'))payload.progress=Number(d.get('progress'));
      const {error}=await client.from('notebook_projects').upsert(payload);if(error)throw error;
      active=payload.id;await refresh();render();message('Saved. Your website will show this chapter on refresh.');
    }catch(error){message(error.message||'Save failed. Your edits are still here.');}finally{button.disabled=false;}
  }
  async function saveEntry(event){
    event.preventDefault();const form=event.target,button=form.querySelector('[type=submit]');button.disabled=true;
    try {
      const d=new FormData(form),payload={project_id:active,title:d.get('entry_title').trim(),body:d.get('entry_body').trim(),url:url(d.get('entry_url').trim()),published:d.has('published'),sprint_day:d.get('entry_day')?Number(d.get('entry_day')):null};
      if(!payload.title||!payload.body)throw Error('Title and update are required.');
      const query=entryId?client.from('notebook_entries').update(payload).eq('id',entryId):client.from('notebook_entries').insert(payload);
      const {error}=await query;if(error)throw error;
      entryId=null;await refresh();render();message(payload.published?'Update published.':'Draft saved privately.');
    }catch(error){message(error.message||'Could not save update.');}finally{button.disabled=false;}
  }
  root.addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b)return;
    try {
      if(b.dataset.editProject){active=b.dataset.editProject;entryId=null;render();}
      if(b.id==='nbNew'){active=null;entryId=null;render();root.querySelector('[name=title]').focus();}
      if(b.id==='nbRemove'){
        if(!confirm('Permanently delete this chapter and all its updates? Use paused or dropped to preserve its story.'))return;
        const {error}=await client.from('notebook_projects').delete().eq('id',active);if(error)throw error;
        active=null;await refresh();render();message('Chapter and updates deleted.');
      }
      if(b.dataset.editEntry){const e=entries.find(x=>String(x.id)===b.dataset.editEntry);if(!e)return;entryId=e.id;const f=root.querySelector('#nbEntryForm');f.entry_title.value=e.title;f.entry_body.value=e.body;f.entry_url.value=e.url||'';f.published.checked=e.published;if(f.entry_day)f.entry_day.value=e.sprint_day||'';f.scrollIntoView({block:'center',behavior:'smooth'});}
      if(b.id==='nbResetEntry'){entryId=null;root.querySelector('#nbEntryForm').reset();}
      if(b.dataset.deleteEntry){if(!confirm('Delete this update permanently?'))return;const {error}=await client.from('notebook_entries').delete().eq('id',b.dataset.deleteEntry);if(error)throw error;entryId=null;await refresh();render();}
      if(b.id==='nbGenerate'){
        const day=root.querySelector('#nbWeek').value;if(!day)throw Error('Choose a week first.');
        const start=new Date(day+'T00:00:00+05:30'),end=new Date(start.getTime()+7*86400000);
        const {data,error}=await client.from('notebook_entries').select('*').eq('published',true).gte('created_at',start.toISOString()).lt('created_at',end.toISOString()).order('created_at');if(error)throw error;
        const text=data.length?`A week in my notebook — ${day}\n\n`+data.map(e=>`${projects.find(p=>p.id===e.project_id)?.title||'Notebook'}: ${e.title}\n${e.body}${e.url?'\n'+e.url:''}`).join('\n\n'):'No published updates in this week yet.';
        root.querySelector('#nbRecap').value=text;root.querySelector('#nbRecapStatus').textContent=`${data.length} published updates included. Review before moving to the blog editor.`;
      }
      if(b.id==='nbToBlog'){
        const text=root.querySelector('#nbRecap').value.trim();if(!text||text==='No published updates in this week yet.')throw Error('Generate or write a recap first.');
        if(document.getElementById('fTitle').value&&!confirm('Replace the current unsaved blog editor content with this recap?'))return;
        clearForm();const chunks=text.split(/\n\n+/);document.getElementById('fTitle').value=chunks.shift();document.getElementById('fExcerpt').value='A few things I built, learned and thought about this week.';setEditorContent(chunks.map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join(''));document.getElementById('fCategory').value='personal';document.getElementById('fTitle').scrollIntoView({behavior:'smooth',block:'center'});setStatus('Recap draft ready. Review and publish when ready.');
      }
    }catch(error){message(error.message||'Could not complete action.');}
  });
  async function start(){if(loading)return;loading=true;try{
    const {data:{session}}=await client.auth.getSession();if(!session){root.innerHTML='';return;}
    const {data:allowed,error:accessError}=await client.rpc('is_portfolio_admin');if(accessError||allowed!==true)throw Error('Admin access requires notebook-migration.sql with your login email.');await refresh();active=active||projects[0]?.id||null;render();
  }catch(error){root.innerHTML=`<div class="nb-recap"><h3>Notebook setup needed</h3><p>${esc(error.message)}</p><p class="nb-help">Your existing blog remains available. See <a href="../SETUP.md">SETUP.md</a> for the migration and admin access instructions.</p></div>`;}finally{loading=false;}}
  client.auth.onAuthStateChange(()=>setTimeout(start,0));start();
})();
