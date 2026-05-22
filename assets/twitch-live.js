(function () {
  const CHANNEL = 'justcallmedeimos';
  const ENDPOINT = '/api/twitch-live.php?logins[]=' + encodeURIComponent(CHANNEL);
  const POLL_MS = 60000;

  function update(badge) {
    fetch(ENDPOINT, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const live = data && Array.isArray(data.live) && data.live.includes(CHANNEL);
        badge.hidden = !live;
      })
      .catch(() => { badge.hidden = true; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const badge = document.getElementById('twitch-live');
    if (!badge) return;
    update(badge);
    setInterval(() => update(badge), POLL_MS);
  });
})();
