async function loadSuiteEvents() {
  const wrap = document.getElementById('suite-events');
  if (!wrap) return;
  wrap.innerHTML = '<p class="crew-note">Fleetplanner-Events werden geladen…</p>';
  try {
    const res = await fetch('/api/suite-events.php', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    wrap.innerHTML = '';
    if (!Array.isArray(items) || !items.length) {
      wrap.innerHTML = '<p class="crew-note">Aktuell sind keine öffentlichen Fleetplanner-Operationen geplant. Schau in den Discord für kurzfristige Einsätze.</p>';
      return;
    }
    // Markup matches rdoc3.css `.events .row` (.ev + .pill).
    items.slice(0, 6).forEach((ev) => {
      const a = document.createElement('a');
      a.className = 'row';
      a.href = ev.url || 'https://suite.raumdock.org/fleetplanner';
      a.target = '_blank';
      a.rel = 'noopener';
      const when = [ev.date, ev.time].filter(Boolean).join(' · ');
      const sub = [when, ev.leader, ev.guild].filter(Boolean).join(' · ');
      a.innerHTML = `
        <span class="ev"><b>${escapeText(ev.title || 'RDOC Fleet Operation')}</b>${sub ? ` · ${escapeText(sub)}` : ''}</span>
        <span class="pill">${escapeText(ev.type || 'Op')}</span>`;
      wrap.appendChild(a);
    });
  } catch (error) {
    wrap.innerHTML = '<p class="crew-note">Fleetplanner-Operationen konnten nicht geladen werden.</p>';
  }
}

function escapeText(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

document.addEventListener('DOMContentLoaded', loadSuiteEvents);
