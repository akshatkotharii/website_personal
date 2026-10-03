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
  let touchStartX = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const safeURL = value => {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };
  const noteKind = note => {
    if (safeURL(note.url)) return 'link';
    if (/^[“\"']|[”\"']$/.test(note.text.trim())) return 'quote';
    if (/\b(idea|could|should|what if|build|make)\b/i.test(note.text)) return 'idea';
    return 'thought';
  };
  const noteMeta = kind => ({
    link: ['Found on the internet', 'saved link'],
    quote: ['Words worth keeping', 'quotation'],
    idea: ['Something forming', 'open thought'],
    thought: ['Note to myself', 'thought in orbit']
  }[kind]);
  function wordReveal(text, target) {
    text.trim().split(/\s+/).forEach((part, wordIndex) => {
      const span = document.createElement('span');
      span.textContent = part;
      span.style.setProperty('--word-index', wordIndex);
      target.append(span);
    });
  }
  function renderPreview() {
    if (!preview || !notes.length) return;
    index = index % notes.length;
    const note = notes[index];
    const kind = noteKind(note);
    const [kindLabel, signalLabel] = noteMeta(kind);
    const stage = document.createElement('div');
    stage.className = 'margins-stage';
    const rail = document.createElement('div');
    rail.className = 'margins-index';
    rail.setAttribute('aria-label', 'Choose a margin note');
    notes.forEach((_, noteIndex) => {
      const railButton = document.createElement('button');
      railButton.type = 'button';
      railButton.textContent = String(noteIndex + 1).padStart(2, '0');
      railButton.setAttribute('aria-label', `Show note ${noteIndex + 1}`);
      railButton.setAttribute('aria-current', String(noteIndex === index));
      railButton.addEventListener('click', () => { index = noteIndex; renderPreview(); });
      rail.append(railButton);
    });
    const card = document.createElement('article');
    card.className = 'margin-preview-card';
    const label = document.createElement('span');
    label.className = 'margin-preview-kind';
    label.textContent = kindLabel;
    const text = document.createElement('p');
    text.className = 'margin-preview-text';
    if (note.text.length > 115) text.classList.add('is-long');
    else if (note.text.length > 65) text.classList.add('is-medium');
    wordReveal(note.text, text);
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
    const signal = document.createElement('div');
    signal.className = 'margins-signal';
    signal.setAttribute('aria-hidden', 'true');
    const signalCore = document.createElement('span');
    signalCore.className = 'margins-signal-core';
    const signalText = document.createElement('span');
    signalText.className = 'margins-signal-label';
    signalText.textContent = signalLabel;
    signal.append(signalCore, signalText);
    stage.append(rail, card, signal);
    preview.dataset.kind = kind;
    preview.replaceChildren(stage);
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
  if (preview) {
    preview.addEventListener('pointermove', event => {
      if (reducedMotion.matches || event.pointerType === 'touch') return;
      const box = preview.getBoundingClientRect();
      preview.style.setProperty('--pointer-x', `${event.clientX - box.left}px`);
      preview.style.setProperty('--pointer-y', `${event.clientY - box.top}px`);
      const core = preview.querySelector('.margins-signal-core');
      if (core) {
        const x = ((event.clientX - box.left) / box.width - .5) * 18;
        const y = ((event.clientY - box.top) / box.height - .5) * 18;
        core.style.translate = `${x}px ${y}px`;
      }
    });
    preview.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    preview.addEventListener('touchend', event => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) < 48 || notes.length < 2) return;
      index = (index + (distance < 0 ? 1 : notes.length - 1)) % notes.length;
      renderPreview();
    }, { passive: true });
    preview.tabIndex = 0;
    preview.setAttribute('aria-label', 'Margin note viewer. Use left and right arrow keys to change notes.');
    preview.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || notes.length < 2) return;
      event.preventDefault();
      index = (index + (event.key === 'ArrowRight' ? 1 : notes.length - 1)) % notes.length;
      renderPreview();
    });
  }
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
