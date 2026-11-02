/* Play introduction on every page load. */
(() => {
  const launch = document.getElementById('siteLaunch');
  if (!launch) return;

  const cards = [...launch.querySelectorAll('[data-launch-card]')];
  const skip = launch.querySelector('[data-launch-skip]');

  document.documentElement.classList.add('launch-open');
  document.body.classList.add('launch-active');
  let index = 0;
  let touchStart = null;
  let autoAdvance;
  const stopAutoAdvance = () => window.clearTimeout(autoAdvance);
  const scheduleAutoAdvance = () => {
    stopAutoAdvance();
    if (!document.hidden && !launch.hidden) autoAdvance = window.setTimeout(next, 10000);
  };
  const setCard = next => {
    index = Math.max(0, Math.min(next, cards.length - 1));
    launch.dataset.stage = String(index + 1);
    cards.forEach((card, cardIndex) => {
      const active = cardIndex === index;
      card.classList.toggle('is-active', active);
      card.tabIndex = active ? 0 : -1;
    });
    scheduleAutoAdvance();
  };
  const finish = () => {
    if (launch.classList.contains('is-exiting') || launch.classList.contains('is-handing-off')) return;
    stopAutoAdvance();
    const currentPhoto = cards[index]?.querySelector('.launch-photo');
    const heroPhoto = document.querySelector('.hero-photo');
    if (index === cards.length - 1 && currentPhoto && heroPhoto && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const from = currentPhoto.getBoundingClientRect();
      const flyer = document.createElement('div');
      const image = currentPhoto.querySelector('img');
      flyer.className = 'launch-flyer';
      flyer.innerHTML = `<img src="${image.currentSrc}" alt="">`;
      flyer.style.left = `${from.left}px`;
      flyer.style.top = `${from.top}px`;
      flyer.style.width = `${from.width}px`;
      flyer.style.height = `${from.height}px`;
      flyer.style.borderRadius = '2px';
      flyer.style.opacity = '1';
      document.body.append(flyer);
      const duration = 920;
      const easeOut = progress => 1 - Math.pow(1 - progress, 4);
      window.requestAnimationFrame(() => {
        document.documentElement.classList.add('launch-handoff');
        launch.classList.add('is-handing-off');
        document.body.classList.remove('launch-active');
        document.documentElement.classList.remove('launch-open');
        const startedAt = performance.now();
        const move = now => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = easeOut(progress);
          const to = heroPhoto.getBoundingClientRect();
          flyer.style.left = `${from.left + (to.left - from.left) * eased}px`;
          flyer.style.top = `${from.top + (to.top - from.top) * eased}px`;
          flyer.style.width = `${from.width + (to.width - from.width) * eased}px`;
          flyer.style.height = `${from.height + (to.height - from.height) * eased}px`;
          flyer.style.borderRadius = `${eased * 50}%`;
          if (progress < 1) {
            window.requestAnimationFrame(move);
            return;
          }
          document.documentElement.classList.remove('launch-handoff');
          flyer.style.transition = 'opacity .18s ease';
          window.requestAnimationFrame(() => { flyer.style.opacity = '0'; });
          window.setTimeout(() => {
            flyer.remove();
            launch.hidden = true;
          }, 190);
        };
        window.requestAnimationFrame(move);
      });
      return;
    }
    document.documentElement.classList.remove('launch-open');
    document.body.classList.remove('launch-active');
    launch.classList.add('is-exiting');
    window.setTimeout(() => { launch.hidden = true; }, 460);
  };
  const next = () => index === cards.length - 1 ? finish() : setCard(index + 1);

  cards.forEach(card => card.addEventListener('click', next));
  skip.addEventListener('click', finish);
  launch.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
  launch.addEventListener('touchend', event => {
    const end = event.changedTouches[0]?.clientX;
    if (touchStart === null || typeof end !== 'number') return;
    const distance = end - touchStart;
    touchStart = null;
    if (Math.abs(distance) < 44) return;
    if (distance < 0) next(); else setCard(index - 1);
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (launch.hidden) return;
    if (event.key === 'Escape') { finish(); return; }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setCard(index - 1); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoAdvance(); else scheduleAutoAdvance();
  });
  setCard(0);
})();
