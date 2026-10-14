(() => {
  'use strict';
  const icons = {
    washer: {label:'Washing machine', svg:'<svg viewBox="0 0 64 64"><rect x="12" y="6" width="40" height="52" rx="8"/><path d="M12 18h40M20 12h1m7 0h14"/><circle class="art-motion" cx="32" cy="38" r="14"/><path class="art-detail" d="M23 36c4-5 9-5 18 0-2 8-7 12-13 9-4-2-6-5-5-9Z"/></svg>'},
    network: {label:'People network', svg:'<svg viewBox="0 0 64 64"><path class="art-detail" d="M20 25 32 17l12 8M20 39l12 8 12-8M20 25v14m24-14v14M32 17v30"/><g class="art-motion"><circle cx="32" cy="15" r="6"/><circle cx="18" cy="27" r="6"/><circle cx="46" cy="27" r="6"/><circle cx="18" cy="42" r="6"/><circle cx="46" cy="42" r="6"/><circle cx="32" cy="49" r="6"/></g></svg>'},
    energy: {label:'Energy signal', svg:'<svg viewBox="0 0 64 64"><path d="M10 50h44M14 44l12-13 10 7 15-23"/><path class="art-motion" d="m37 8-14 25h12l-6 23 17-30H34Z"/></svg>'},
    brain: {label:'Learning brain', svg:'<svg viewBox="0 0 64 64"><path d="M32 11c-9-9-23 1-18 12-9 6-5 20 3 21-2 11 10 15 15 7 6 8 18 4 16-7 8-5 8-17 1-21 4-11-8-21-17-12Z"/><g class="art-motion"><path d="M32 13v38M22 23l10 6 10-8M19 38l13-4 12 7M24 48l8-7 9 7"/></g></svg>'},
    browser: {label:'Website window', svg:'<svg viewBox="0 0 64 64"><rect x="7" y="10" width="50" height="43" rx="6"/><path d="M7 21h50M14 16h1m6 0h1m6 0h1"/><path class="art-motion" d="m27 28 17 13-8 1-4 9Z"/></svg>'},
    rocket: {label:'Launch rocket', svg:'<svg viewBox="0 0 64 64"><path class="art-motion" d="M38 8c8 3 14 9 17 17L35 45 19 29Z"/><circle cx="40" cy="23" r="5"/><path d="m22 32-10 3-4 10 16-2m8-1-3 11-10 4 2-16m1 8-7 7"/></svg>'},
    compass: {label:'Compass', svg:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="3"/><path class="art-motion" d="m41 19-5 17-13 9 5-17Z"/><path d="M32 4v5m0 46v5M4 32h5m46 0h5"/></svg>'},
    notebook: {label:'Open notebook', svg:'<svg viewBox="0 0 64 64"><path d="M7 14c9-3 17-1 25 5v36c-8-6-16-8-25-5Zm50 0c-9-3-17-1-25 5v36c8-6 16-8 25-5Z"/><g class="art-motion"><path d="M14 24h11M14 31h11M39 24h11M39 31h8"/></g></svg>'},
    spark: {label:'Idea spark', svg:'<svg viewBox="0 0 64 64"><path class="art-motion" d="m32 7 4 17 15-9-9 15 17 3-17 4 9 15-15-9-4 17-4-17-15 9 9-15-17-4 17-3-9-15 15 9Z"/><circle cx="32" cy="33" r="6"/></svg>'}
  };
  const motions = {none:'Still', breathe:'Soft pulse', float:'Gentle float', draw:'Draw itself', spin:'Turn / rotate'};
  const icon = name => icons[name] || icons.spark;
  window.PROJECT_ART = Object.freeze({icons, motions, icon, render:name=>icon(name).svg});
})();
