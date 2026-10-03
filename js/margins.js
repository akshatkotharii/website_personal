(() => {
  'use strict';
  const preview = document.getElementById('marginsPreviewList');
  const list = document.getElementById('marginsList');
  const next = document.getElementById('marginsNext');
  const count = document.getElementById('marginsCount');
  const seed = [
    { text: 'Everything I am working on is a learning curve, and that is exactly how I like it.', context: '' },
    { text: 'I work best in teams.', context: '' },
    { text: 'The best ideas come from people who are different from you.', context: '' }
  ];
  let notes = seed;
  let index = 0;
  const safeURL = value => {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };
  function renderPreview() {
    if (!preview || !notes.length) return;
    index = index % notes.length;
    const note = notes[index];
    const card = document.createElement('article');
    card.className = 'margin-preview-card';
    const label = document.createElement('span');
    label.className = 'margin-preview-kind';
    label.textContent = safeURL(note.url) ? 'A link I saved' : 'A thought';
    const text = document.createElement('p');
    text.className = 'margin-preview-text';
    text.textContent = note.text;
    card.append(label, text);
    if (note.context) {
      const context = document.createElement('p');
      context.className = 'margin-preview-context';
      context.textContent = note.context;
      card.append(context);
    }
    if (safeURL(note.url)) {
      const link = document.createElement('a');
      link.className = 'margin-preview-link';
      link.href = safeURL(note.url);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open the thing I saved ↗';
      card.append(link);
    }
    preview.replaceChildren(card);
    if (count) count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(notes.length).padStart(2, '0')}`;
    if (next) next.disabled = notes.length < 2;
  }
  function renderList() {
    if (!list) return;
    list.replaceChildren(...notes.map((note, i) => {
      const item = document.createElement('article');
      item.className = 'margin-note';
      const button = document.createElement('button');
      button.type = 'button';
      const number = document.createElement('span');
      number.className = 'margin-number';
      number.textContent = String(i + 1).padStart(2, '0');
      const text = document.createElement('span');
      text.textContent = note.text;
      button.append(number, text);
      const context = document.createElement('p');
      context.className = 'margin-context';
      context.id = `margin-context-${i + 1}`;
      context.textContent = note.context || '';
      context.hidden = !note.context;
      if (note.context) {
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', context.id);
      }
      button.addEventListener('click', () => {
        if (!note.context) return;
        context.hidden = !context.hidden;
        button.setAttribute('aria-expanded', String(!context.hidden));
      });
      item.append(button, context);
      if (safeURL(note.url)) {
        const link = document.createElement('a');
        link.className = 'margin-link';
        link.href = safeURL(note.url);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open reference ↗';
        item.append(link);
      }
      return item;
    }));
  }
  if (next) next.addEventListener('click', () => {
    index = (index + 1) % notes.length;
    renderPreview();
  });
  renderPreview();
  renderList();
  const sb = window.getSupabase?.();
  if (sb) sb.from('margins_notes').select('text,context,url').eq('published', true)
    .order('pinned', { ascending: false }).order('sort_order').limit(100)
    .then(({ data, error }) => {
      if (!error && data?.length) {
        notes = data;
        index = 0;
        renderPreview();
        renderList();
      }
    });
})();
