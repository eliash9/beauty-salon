function renderBottomNav(containerId){
  const elc = document.getElementById(containerId || 'bottomnav');
  if(!elc) return;
  const iconMap = { home: '&#127968;', services: '&#128135;', team: '&#128101;', portfolio: '&#128248;', about: '&#8505;', contact: '&#9742;' };
  elc.innerHTML = '';
  const pages = (window.APP && window.APP.cfg && window.APP.cfg.pages) || [];
  pages.forEach(p=>{
    const isActive = location.pathname.endsWith(p.href);
    const a = document.createElement('a');
    a.href = p.href;
    a.className = 'flex-1 flex flex-col items-center justify-center rounded-xl py-1.5 ' + (isActive?'text-pink-600 font-semibold':'text-slate-600');
    a.innerHTML = '<span class="text-lg">'+(iconMap[p.id]||'&#8226;')+'</span><span>'+p.name+'</span>';
    elc.appendChild(a);
  });
}

function applyBrand(brandId){
  const el = document.getElementById(brandId || 'brand');
  if (el) el.textContent = (window.APP && window.APP.cfg && window.APP.cfg.salonName) || 'Salon';
}


