document.addEventListener('DOMContentLoaded', ()=>{
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
  const brg = document.getElementById('brg');
  const drw = document.getElementById('drw');
  if (!brg || !drw) return;
  const open = ()=>{
    drw.hidden = false;
    drw.style.display = 'block';
    requestAnimationFrame(()=> drw.classList.add('open'));
    drw.setAttribute('aria-hidden','false');
    brg.setAttribute('aria-expanded','true');
    document.body.classList.add('no-scroll');
  };
  const close = ()=>{
    drw.classList.remove('open');
    drw.setAttribute('aria-hidden','true');
    brg.setAttribute('aria-expanded','false');
    document.body.classList.remove('no-scroll');
    setTimeout(()=>{
      drw.style.display='none';
      drw.hidden = true;
    }, 250);
  };
  const toggle = ()=> drw.classList.contains('open') ? close() : open();
  brg.addEventListener('click', toggle);
  drw.addEventListener('click', (e)=>{
    const panel = drw.querySelector('.pnl');
    if (panel && !panel.contains(e.target)) close();
  });
  drw.querySelectorAll('a').forEach(a=> a.addEventListener('click', close));
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && drw.classList.contains('open')) close(); });
});

/* ============================================================
   OVERHAUL LAYER — 2026-06
   ============================================================ */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress + hero parallax ---------- */
  const prog = document.getElementById('scroll-prog');
  const heroBg = document.querySelector('.hero-bg');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const sc = h.scrollTop || window.pageYOffset;
      if (prog) prog.style.width = (max > 0 ? (sc / max) * 100 : 0) + '%';
      if (heroBg && !reduceMotion && sc < window.innerHeight) {
        heroBg.style.transform = 'translateY(' + (sc * 0.18) + 'px) scale(1.04)';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveal ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll(
      '.sec-head, .split > div, .sel-col, .rule, .crew, .step, .trad, .ship, .kit, .aar, .card, .kodex-foot, .sel-note, .band blockquote'
    );
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min((i % 6) * 40, 200) + 'ms';
    });
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach((el) => ro.observe(el));
  }

  /* ---------- accent toggle (cyan <-> gold), persisted ---------- */
  const toggle = document.getElementById('accent-toggle');
  if (toggle) {
    const root = document.documentElement;
    const saved = (function () { try { return localStorage.getItem('rdoc-accent'); } catch (e) { return null; } })();
    if (saved === 'gold' || saved === 'cyan') root.setAttribute('data-accent', saved);
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-accent') === 'gold' ? 'cyan' : 'gold';
      root.setAttribute('data-accent', next);
      try { localStorage.setItem('rdoc-accent', next); } catch (e) {}
    });
  }

  /* ---------- OPS-STATUS bar ---------- */
  // live state — mirror the Twitch check
  (function liveStatus() {
    const item = document.getElementById('ops-live');
    if (!item) return;
    const v = item.querySelector('.v');
    const CH = 'justcallmedeimos';
    function check() {
      fetch('/api/twitch-live.php?logins[]=' + encodeURIComponent(CH), { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const live = d && Array.isArray(d.live) && d.live.includes(CH);
          item.classList.toggle('live-on', live);
          item.classList.toggle('live-off', !live);
          if (v) v.textContent = live ? 'LIVE' : 'Offline';
        })
        .catch(() => {});
    }
    check();
    setInterval(check, 60000);
  })();

  // next op countdown — from Discord scheduled events (ISO start_time)
  (function nextOp() {
    const item = document.getElementById('ops-next');
    if (!item) return;
    const v = item.querySelector('.v');
    let target = null;
    function fmt(ms) {
      if (ms <= 0) return 'läuft';
      const s = Math.floor(ms / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      if (d > 0) return 'in ' + d + 'T ' + h + 'h';
      if (h > 0) return 'in ' + h + 'h ' + m + 'm';
      return 'in ' + m + 'm';
    }
    function render() {
      if (!v) return;
      if (!target) { v.textContent = 'keine geplant'; return; }
      v.textContent = fmt(target.getTime() - Date.now());
    }
    fetch('/api/discord-events.php', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(items => {
        if (!Array.isArray(items)) { render(); return; }
        const now = Date.now();
        const future = items
          .map(e => new Date(e.start_time))
          .filter(dt => !Number.isNaN(dt.getTime()) && dt.getTime() > now)
          .sort((a, b) => a - b);
        target = future[0] || null;
        render();
        setInterval(render, 1000);
      })
      .catch(() => { render(); });
  })();

  /* ---------- command palette (Ctrl-K / "/") ---------- */
  (function palette() {
    const cmdk = document.getElementById('cmdk');
    const input = document.getElementById('cmdk-input');
    const results = document.getElementById('cmdk-results');
    if (!cmdk || !input || !results) return;

    // build index from in-page sections + key external actions
    const items = [];
    document.querySelectorAll('.mn a[href^="#"]').forEach(a => {
      items.push({ label: a.textContent.trim(), tag: 'Sektion', href: a.getAttribute('href') });
    });
    items.push(
      { label: 'Ops-Log — After-Action Reports', tag: 'Seite', href: 'ops-log.html' },
      { label: 'Discord beitreten', tag: 'Extern', href: 'https://discord.gg/raumdock', ext: true },
      { label: 'RDOC-Suite / Fleetplanner', tag: 'Extern', href: 'https://suite.raumdock.org/fleetplanner', ext: true },
      { label: 'Financial-Dashboard', tag: 'Extern', href: 'https://financial.raumdock.org/', ext: true },
      { label: 'Twitch — JustCallMeDeimos', tag: 'Extern', href: 'https://twitch.tv/JustCallMeDeimos', ext: true },
      { label: 'RDOC auf RSI', tag: 'Extern', href: 'https://robertsspaceindustries.com/orgs/RDOC', ext: true }
    );

    let view = items.slice();
    let sel = 0;

    function open() {
      cmdk.hidden = false;
      cmdk.classList.add('open');
      document.body.classList.add('no-scroll');
      input.value = '';
      filter('');
      setTimeout(() => input.focus(), 20);
    }
    function close() {
      cmdk.classList.remove('open');
      cmdk.hidden = true;
      document.body.classList.remove('no-scroll');
    }
    function go(it) {
      close();
      if (it.ext) { window.open(it.href, '_blank', 'noopener'); return; }
      if (it.href.startsWith('#')) {
        const el = document.querySelector(it.href);
        if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      } else {
        window.location.href = it.href;
      }
    }
    function render() {
      if (!view.length) { results.innerHTML = '<div class="cmdk-empty">// kein Treffer</div>'; return; }
      results.innerHTML = view.map((it, i) =>
        '<button class="cmdk-item' + (i === sel ? ' sel' : '') + '" data-i="' + i + '">' +
        '<span>' + it.label.replace(/[<>&]/g, '') + '</span><span class="tag">' + it.tag + '</span></button>'
      ).join('');
      results.querySelectorAll('.cmdk-item').forEach(btn => {
        btn.addEventListener('click', () => go(view[+btn.dataset.i]));
      });
    }
    function filter(q) {
      q = q.toLowerCase().trim();
      view = q ? items.filter(it => it.label.toLowerCase().includes(q) || it.tag.toLowerCase().includes(q)) : items.slice();
      sel = 0;
      render();
    }

    input.addEventListener('input', () => filter(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, view.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (view[sel]) go(view[sel]); }
    });
    cmdk.addEventListener('click', (e) => { if (e.target === cmdk) close(); });

    window.addEventListener('keydown', (e) => {
      const typing = /^(input|textarea|select)$/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.classList.contains('open') ? close() : open(); }
      else if (e.key === '/' && !typing && !cmdk.classList.contains('open')) { e.preventDefault(); open(); }
      else if (e.key === 'Escape' && cmdk.classList.contains('open')) { close(); }
    });
  })();
})();
