async function loadDiscordEvents(){
  const wrap = document.getElementById('discord-events');
  if (!wrap) return;
  wrap.innerHTML = '<p>Events werden geladen…</p>';
  try{
    const res = await fetch('/api/discord-events.php', {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const items = await res.json();
    wrap.innerHTML = '';
    if(!Array.isArray(items) || !items.length){
      wrap.innerHTML = '<p>Aktuell sind keine Events geplant.</p>';
      return;
    }
    const fmt = new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    items.forEach(ev => {
      const a = document.createElement('a');
      a.className = 'lnk';
      a.href = ev.url || '#';
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `
        <span>
          <strong>${ev.name}</strong><br>
          <small>${fmt.format(new Date(ev.start_time))}${ev.end_time ? ' – ' + fmt.format(new Date(ev.end_time)) : ''}${ev.location ? ' · ' + ev.location : ''}</small>
          ${ev.description ? `<br><small style="opacity:.8">${ev.description.substring(0,140)}${ev.description.length>140?'…':''}</small>`:''}
        </span>
        <span class="pill">Discord</span>`;
      wrap.appendChild(a);
    });
  }catch(e){
    wrap.innerHTML = '<p>Events konnten nicht geladen werden.</p>';
  }
}
document.addEventListener('DOMContentLoaded', loadDiscordEvents);
