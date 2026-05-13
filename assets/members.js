const RDOC_FEATURED_IMAGES = {
  justcallmedeimos: '/assets/streamer-deimos.png',
  headwig: '/assets/streamer-headwig.png',
  holderdiepolder: '/assets/streamer-holderdiepolder.png',
  jazzz: '/assets/streamer-jazzz.png',
  jerichoramirez: '/assets/streamer-jericho.png',
};

const RDOC_FALLBACK_MEMBERS = [
  { name: 'JustCallMeDeimos', handle: 'JustCallMeDeimos', rank: 'Master', membership: 'Main', roles: ['Founder'], url: 'https://robertsspaceindustries.com/citizens/JustCallMeDeimos' },
  { name: 'HEADWiG', handle: 'HEADWiG', rank: 'Master', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/HEADWiG' },
  { name: 'HolderdiePolder', handle: 'HolderdiePolder', rank: 'Master', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/HolderdiePolder' },
  { name: 'jazZz', handle: 'jazZz', rank: 'Master', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/jazZz' },
  { name: 'JerichoRamirez', handle: 'JerichoRamirez', rank: 'Master', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/JerichoRamirez' },
  { name: 'PhantombulletIV', handle: 'PhantombulletIV', rank: 'Experienced', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/PhantombulletIV' },
  { name: 'Bubblegamer', handle: 'Bubb1e', rank: 'Experienced', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/Bubb1e' },
  { name: 'Jejenator', handle: 'Jejenator', rank: 'Experienced', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/Jejenator' },
  { name: 'moe', handle: 'moe86', rank: 'Veteran', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/moe86' },
  { name: 'B4X-H1R', handle: 'B4X-H1R', rank: 'Regular', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/B4X-H1R' },
  { name: 'Licronable', handle: 'Licronable', rank: 'Experienced', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/Licronable' },
  { name: 'Hounddog', handle: 'FEDI_Hounddog', rank: 'Recruit', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/FEDI_Hounddog' },
  { name: 'Listrat', handle: 'Listrat', rank: 'Experienced', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/Listrat' },
  { name: 'Wuk', handle: 'Wukk', rank: 'Experienced', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/Wukk' },
  { name: 'Donnertron', handle: 'Donnertron', rank: 'Experienced', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/Donnertron' },
  { name: 'KervyN', handle: 'KervyN', rank: 'Regular', membership: 'Main', roles: [], url: 'https://robertsspaceindustries.com/citizens/KervyN' },
  { name: 'casishur', handle: 'casishur', rank: 'Veteran', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/casishur' },
  { name: 'Baalin', handle: 'Baalin', rank: 'Expert', membership: 'Affiliate', roles: [], url: 'https://robertsspaceindustries.com/citizens/Baalin' },
];

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function memberKey(member) {
  return String(member.handle || member.name || '').toLowerCase();
}

function memberLabel(member) {
  return [member.rank, member.membership, ...(member.roles || [])].filter(Boolean).join(' · ');
}

function renderFeaturedMember(member, image) {
  return `
    <a class="streamer-card featured" href="${escapeHtml(member.url)}" target="_blank" rel="noopener">
      <img src="${image}" alt="${escapeHtml(member.handle || member.name)}" loading="lazy">
      <div class="streamer-meta">
        <h3>${escapeHtml(member.handle || member.name)}</h3>
        <span>${escapeHtml(memberLabel(member))}</span>
      </div>
    </a>`;
}

function renderMemberRow(member) {
  const sameName = String(member.name || '').toLowerCase() === String(member.handle || '').toLowerCase();
  const handle = sameName ? '' : `<em>${escapeHtml(member.handle)}</em>`;
  return `
    <a href="${escapeHtml(member.url)}" target="_blank" rel="noopener">
      <span>${escapeHtml(member.name || member.handle)}${handle}</span>
      <strong>${escapeHtml(memberLabel(member))}</strong>
    </a>`;
}

function renderMembers(payload, isFallback = false) {
  const featuredWrap = document.getElementById('member-featured');
  const listWrap = document.getElementById('member-list');
  const source = document.getElementById('member-source');
  if (!featuredWrap || !listWrap) return;

  const members = Array.isArray(payload.members) && payload.members.length ? payload.members : RDOC_FALLBACK_MEMBERS;
  const featured = [];
  const regular = [];

  members.forEach(member => {
    const image = RDOC_FEATURED_IMAGES[memberKey(member)];
    if (image) featured.push({ member, image });
    else regular.push(member);
  });

  featuredWrap.innerHTML = featured.map(item => renderFeaturedMember(item.member, item.image)).join('');
  listWrap.innerHTML = regular.map(renderMemberRow).join('');

  if (source) {
    const updated = payload.updated_at ? new Date(payload.updated_at) : null;
    const stamp = updated && !Number.isNaN(updated.getTime())
      ? updated.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
      : '13 May 2026';
    source.innerHTML = `${members.length} public RDOC members. ${isFallback ? 'Fallback snapshot' : `Last sync: ${stamp}`} · <a href="https://robertsspaceindustries.com/en/orgs/RDOC/members" target="_blank" rel="noopener">RSI source</a>`;
  }
}

async function loadRdocMembers() {
  try {
    const res = await fetch('/api/rsi-members.php', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    renderMembers(payload);
  } catch (error) {
    renderMembers({ members: RDOC_FALLBACK_MEMBERS }, true);
  }
}

document.addEventListener('DOMContentLoaded', loadRdocMembers);
