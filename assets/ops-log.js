// Ops-Log — concluded ("after-action") operations pulled live from the
// Fleetmanager via /api/ops-log.php (scrapes Fleetplanner ?past=1, completed/
// cancelled only). No invented reports: if the feed is empty or unreachable we
// show an honest empty state, never placeholder facts.
//
// Renders into two targets when present:
//   #reports        — full report cards on ops-log.html (with type filter)
//   #aar-featured   — compact teaser cards on index.html (data-limit="N")

const OPS_TYPE_MAP = {
  combat:      { cat: 'combat',    img: 'mission-combat.png' },
  pve:         { cat: 'combat',    img: 'mission-combat.png' },
  mining:      { cat: 'mining',    img: 'mission-mining.png' },
  salvage:     { cat: 'salvage',   img: 'mission-salvage.png' },
  transport:   { cat: 'transport', img: 'mission-transport.png' },
  exploration: { cat: 'recon',     img: 'mission-exploration.png' },
  social:      { cat: 'social',    img: 'mission-social.png' },
  training:    { cat: 'combat',    img: 'mission-combat.png' },
  mixed:       { cat: 'combat',    img: 'mission-combat.png' },
};

function opsEscape(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function opsMapType(type) {
  const key = String(type || '').toLowerCase().trim();
  return OPS_TYPE_MAP[key] || { cat: 'combat', img: 'mission-combat.png' };
}

function opsStatusPill(status) {
  const s = String(status || '').toLowerCase();
  if (s.indexOf('cancelled') !== -1 || s.indexOf('abbruch') !== -1) return { cls: 'abort fail', label: '● Abbruch' };
  return { cls: 'ok', label: '● Erfolg' };
}

// ---- full report card (ops-log.html) ----
function renderReport(r) {
  const map = opsMapType(r.type);
  const st = opsStatusPill(r.status);
  const meta = [
    r.date ? `<span>${opsEscape(r.date)}</span>` : '',
    `<span class="${st.cls}">${st.label}</span>`,
    r.units ? `<span>${opsEscape(r.units)}</span>` : '',
    r.guild ? `<span>${opsEscape(r.guild)}</span>` : '',
    r.leader ? `<span>${opsEscape(r.leader)}</span>` : '',
  ].filter(Boolean).join('');

  const el = document.createElement(r.url ? 'a' : 'article');
  el.className = 'report';
  el.setAttribute('data-type', map.cat);
  if (r.url) { el.href = r.url; el.target = '_blank'; el.rel = 'noopener'; el.style.color = 'inherit'; el.style.textDecoration = 'none'; }
  el.innerHTML = `
    <div class="vis">
      <span class="otag">${opsEscape(r.type || 'OP')}</span>
      <img src="/assets/${map.img}" alt="${opsEscape(r.title || 'RDOC Operation')}" loading="lazy" />
    </div>
    <div class="rb">
      <div class="rmeta">${meta}</div>
      <h2>${opsEscape(r.title || 'RDOC Fleet Operation')}</h2>
      <p>Abgeschlossene Operation der RDOC-Crew. Sitze, Rollen und Verlauf im Fleetmanager.</p>
    </div>`;
  return el;
}

// ---- compact teaser card (index.html #aar-featured) ----
function renderAarTeaser(r) {
  const map = opsMapType(r.type);
  const st = opsStatusPill(r.status);
  const meta = [
    r.date ? `<span>${opsEscape(r.date)}</span>` : '',
    `<span class="${st.cls.indexOf('abort') !== -1 ? 'fail' : 'ok'}">${st.label}</span>`,
    r.units ? `<span>${opsEscape(r.units)}</span>` : '',
  ].filter(Boolean).join('');
  const sub = [r.leader, r.guild].filter(Boolean).map(opsEscape).join(' · ');

  // Markup matches rdoc3.css `.aar > a` (.th/.tg/.bd/.mt). The parent
  // #aar-featured carries class="aar" (the grid container).
  const a = document.createElement('a');
  a.href = r.url || 'ops-log.html';
  if (r.url) { a.target = '_blank'; a.rel = 'noopener'; }
  a.innerHTML = `
    <div class="th"><span class="tg">${opsEscape(r.type || 'OP')}</span><img src="/assets/${map.img}" alt="${opsEscape(r.title || 'RDOC Operation')}" loading="lazy" /></div>
    <div class="bd">
      <div class="mt">${meta}</div>
      <h3>${opsEscape(r.title || 'RDOC Fleet Operation')}</h3>
      <p>${sub || 'Abgeschlossene Operation der RDOC-Crew — Details im Fleetmanager.'}</p>
      <div class="lesson"><b>Fleetmanager //</b> vollständiger Verlauf &amp; Sitze ↗</div>
    </div>`;
  return a;
}

function bindFilter() {
  const chips = document.querySelectorAll('.fchip');
  chips.forEach((c) => {
    c.addEventListener('click', () => {
      chips.forEach((x) => x.classList.remove('on'));
      c.classList.add('on');
      const f = c.getAttribute('data-f');
      document.querySelectorAll('.report').forEach((r) => {
        r.classList.toggle('hide', f !== 'all' && r.getAttribute('data-type') !== f);
      });
    });
  });
}

async function loadOpsLog() {
  const reportsWrap = document.getElementById('reports');
  const featuredWrap = document.getElementById('aar-featured');
  if (!reportsWrap && !featuredWrap) return;

  let items = [];
  try {
    const res = await fetch('/api/ops-log.php', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) items = data;
    }
  } catch (error) { /* keep items = [] -> honest empty state */ }

  // full list
  if (reportsWrap) {
    const filter = document.getElementById('filter');
    if (items.length) {
      reportsWrap.innerHTML = '';
      items.forEach((r) => reportsWrap.appendChild(renderReport(r)));
      if (filter) { filter.hidden = false; bindFilter(); }
    } else {
      reportsWrap.innerHTML = '<div class="ops-empty">// Noch keine abgeschlossenen Operationen im Log. Sobald eine Op im Fleetmanager abgeschlossen ist, taucht sie hier auf. Schreib deinen AAR im Discord.</div>';
      if (filter) filter.hidden = true;
    }
  }

  // index teaser
  if (featuredWrap) {
    const limit = parseInt(featuredWrap.getAttribute('data-limit') || '2', 10);
    if (items.length) {
      featuredWrap.innerHTML = '';
      items.slice(0, limit).forEach((r) => featuredWrap.appendChild(renderAarTeaser(r)));
    } else {
      featuredWrap.innerHTML = '<p class="crew-note">Noch keine abgeschlossenen Operationen im Log — die nächsten Berichte landen direkt aus dem Fleetmanager hier.</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', loadOpsLog);
