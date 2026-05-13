document.addEventListener('DOMContentLoaded', ()=>{
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
  const brg = document.getElementById('brg');
  const drw = document.getElementById('drw');
  if (!brg || !drw) return;
  const open = ()=>{
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
    setTimeout(()=>{ drw.style.display='none'; }, 250);
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
