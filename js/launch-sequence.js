/* First-visit launch. Query ?intro=1 replays it without clearing visitor storage. */
(() => {
  const launch = document.getElementById('siteLaunch');
  if (!launch) return;

  const key = 'akshat-launch-seen-v1';
  const cards = [...launch.querySelectorAll('[data-launch-card]')];
  const skip = launch.querySelector('[data-launch-skip]');
  const force = new URLSearchParams(window.location.search).get('intro') === '1';
  let seen = false;
  try { seen = localStorage.getItem(key) === 'true'; } catch (_) { /* Storage can be disabled. */ }

  if (seen && !force) {
    launch.hidden = true;
    return;
  }

  document.documentElement.classList.add('launch-open');
  document.body.classList.add('launch-active');
  let index = 0;
  let touchStart = null;
  const setCard = next => {
    index = Math.max(0, Math.min(next, cards.length - 1));
    launch.dataset.stage = String(index + 1);
    cards.forEach((card, cardIndex) => {
      const active = cardIndex === index;
      card.classList.toggle('is-active', active);
      card.tabIndex = active ? 0 : -1;
    });
  };
  const finish = () => {
    if (launch.classList.contains('is-exiting')) return;
    try { localStorage.setItem(key, 'true'); } catch (_) { /* Intro remains usable without storage. */ }
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
  setCard(0);
})();
