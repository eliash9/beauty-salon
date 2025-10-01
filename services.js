function renderServicesWithPrices(services, servicesContainerId, pricesContainerId, onSelect){
  const servicesWrap = document.getElementById(servicesContainerId);
  const pricesWrap = document.getElementById(pricesContainerId);
  if(!servicesWrap) return;
  servicesWrap.innerHTML = '';

  function formatIDR(n){ try { return 'Rp ' + (n||0).toLocaleString('id-ID'); } catch(e){ return 'Rp ' + n; } }
  function renderPriceList(service){
    if(!pricesWrap) return; pricesWrap.innerHTML='';
    const items = (service && Array.isArray(service.prices))? service.prices : [];
    if(!items.length){ pricesWrap.appendChild(el('<div class="text-xs text-slate-500 col-span-2">Harga belum tersedia.</div>')); return; }
    items.forEach(it=> pricesWrap.appendChild(el('<div class="rounded-2xl bg-pink-50 px-3 py-2 flex items-center justify-between"><span>'+it.name+'</span><span class="font-semibold text-pink-700">'+formatIDR(it.price)+'</span></div>')) );
  }

  services.forEach((s,i)=>{
    const node = el('\n      <button data-id="'+s.id+'" class="group rounded-2xl bg-white border border-pink-100 p-4 text-center flex flex-col items-center justify-center gap-2 hover:border-pink-300">\n        <span class="text-2xl">'+s.icon+'</span>\n        <span class="text-xs font-medium">'+s.name+'</span>\n      </button>\n    ');
    node.addEventListener('click', ()=>{
      ;[].forEach.call(servicesWrap.children, c=>c.classList.remove('ring-2','ring-pink-400'));
      node.classList.add('ring-2','ring-pink-400');
      renderPriceList(s);
      if (onSelect) onSelect(s);
    });
    servicesWrap.appendChild(node);
    if(i===0){ node.classList.add('ring-2','ring-pink-400'); renderPriceList(s); if(onSelect) onSelect(s); }
  });
}

