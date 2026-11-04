(() => {
  const STORAGE_KEY = 'ak_blog_reading_scale';

  function setupReadingSize() {
    const control = document.getElementById('readingSize');
    const body = document.querySelector('.post-body');
    const output = document.getElementById('readingSizeValue');
    if (!control || !body || !output || control.dataset.ready === 'true') return;

    let saved = 100;
    try {
      const candidate = Number(localStorage.getItem(STORAGE_KEY));
      if (candidate >= 100 && candidate <= 130 && candidate % 5 === 0) saved = candidate;
    } catch (_) {}

    const update = (value, persist = true) => {
      const percent = Number(value);
      body.style.setProperty('--reading-scale', String(percent / 100));
      control.value = String(percent);
      control.setAttribute('aria-valuetext', `${percent} percent`);
      output.value = `${percent}%`;
      output.textContent = `${percent}%`;
      if (persist) {
        try { localStorage.setItem(STORAGE_KEY, String(percent)); } catch (_) {}
      }
    };

    control.dataset.ready = 'true';
    control.addEventListener('input', () => update(control.value));
    update(saved, false);
  }

  const observeRenderedPost = () => {
    setupReadingSize();
    const observer = new MutationObserver(() => {
      setupReadingSize();
      if (document.getElementById('readingSize')?.dataset.ready === 'true') observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeRenderedPost, { once: true });
  } else {
    observeRenderedPost();
  }
})();
