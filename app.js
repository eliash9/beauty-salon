window.APP = window.APP || (function(){
  const APP = {
    cfg: null,
    load: async function(){
      if (this.cfg) return this.cfg;
      const res = await fetch('./config.json', { cache: 'no-store' }).catch(()=>null);
      this.cfg = res && res.ok ? await res.json() : {};
      return this.cfg;
    },
    formatIDR(n){ try { return 'Rp ' + (n||0).toLocaleString('id-ID'); } catch(e){ return 'Rp ' + n; }
    },
    _fmtYMD(d){ try{ return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); }catch(e){ return ''; } },
    async getSlots({ date, stylistId, serviceId }){
      try{
        const cfg = this.cfg || {};
        const ymd = this._fmtYMD(date instanceof Date ? date : new Date(date));
        const fallback = (cfg.timeSlots||[]).map(t=>({ time:t, available:true }));
        const url = (cfg.bookingEndpoint||cfg.slotsEndpoint||'').trim();
        if(!url){ return fallback; }
        const q = new URLSearchParams({ action:'slots', date: ymd, stylistId: String(stylistId||''), serviceId: String(serviceId||'') });
        const res = await fetch(url + (url.includes('?')?'&':'?') + q.toString(), { cache:'no-store' }).catch(()=>null);
        if(!res || !res.ok) return fallback;
        const data = await res.json().catch(()=>null);
        if(Array.isArray(data)){
          return data.map(it=> typeof it==='string' ? { time:it, available:true } : it);
        }
        if (data && Array.isArray(data.slots)) return data.slots;
        return fallback;
      }catch(e){ return (this.cfg.timeSlots||[]).map(t=>({time:t, available:true})); }
    },
    async postBooking(payload){
      try{
        const url = (this.cfg && (this.cfg.bookingEndpoint||this.cfg.slotsEndpoint)) || '';
        if(!url) return { ok:false, reason:'no-endpoint' };
        // Use text/plain to avoid CORS preflight on Apps Script
        const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify({ action:'book', data: payload }) }).catch(()=>null);
        if(!res) return { ok:false };
        // If opaque (no-cors), treat as best-effort success
        if (res.type === 'opaque') return { ok:true, opaque:true };
        const body = await res.json().catch(()=>({}));
        return { ok: res.ok, body };
      }catch(e){ return { ok:false, error:e?.message }; }
    },
    injectSchema: function(){
      try{
        const cfg = this.cfg || {};
        const head = document.head || document.getElementsByTagName('head')[0];
        if(!head) return;
        const removeOld = document.getElementById('schemaLD');
        if(removeOld && removeOld.parentNode) removeOld.parentNode.removeChild(removeOld);

        // Derive telephone
        let telephone = cfg.telephone || cfg.ownerWhatsApp || '';
        if (telephone && !/^\+/.test(telephone)) telephone = '+' + telephone;

        // Address object
        const addr = cfg.addressFields || {};
        const postalAddress = {
          '@type': 'PostalAddress',
          streetAddress: addr.streetAddress || cfg.address || '',
          addressLocality: addr.addressLocality || '',
          addressRegion: addr.addressRegion || '',
          postalCode: addr.postalCode || '',
          addressCountry: addr.addressCountry || 'ID'
        };

        // Aggregate rating from team
        let aggregateRating;
        if (Array.isArray(cfg.team) && cfg.team.length){
          const valid = cfg.team.map(t=> +t.rating).filter(v=> !isNaN(v));
          if (valid.length){
            const avg = valid.reduce((a,b)=>a+b,0)/valid.length;
            aggregateRating = { '@type':'AggregateRating', ratingValue: +avg.toFixed(1), reviewCount: valid.length };
          }
        }

        // Price range from services
        let priceMin = Infinity, priceMax = 0;
        (cfg.services||[]).forEach(s=> (s.prices||[]).forEach(p=>{
          const v = +p.price; if(!isNaN(v)){ if(v<priceMin) priceMin=v; if(v>priceMax) priceMax=v; }
        }));
        const priceRange = (priceMin!==Infinity) ? `Rp ${priceMin.toLocaleString('id-ID')} - Rp ${priceMax.toLocaleString('id-ID')}` : undefined;

        // Images: pick some team photos as gallery
        const images = (cfg.images && cfg.images.length)? cfg.images : (cfg.team||[]).slice(0,3).map(t=>t.photo).filter(Boolean);

        // Opening hours
        const openingHours = Array.isArray(cfg.openingHours) ? cfg.openingHours : undefined;

        // Offers / Services catalog
        const serviceCatalog = {
          '@type':'OfferCatalog',
          name: 'Daftar Layanan',
          itemListElement: (cfg.services||[]).map(s=>({
            '@type':'OfferCatalog',
            name: s.name,
            itemListElement: (s.prices||[]).map(it=>({
              '@type':'Offer',
              priceCurrency: 'IDR',
              price: it.price,
              itemOffered: { '@type':'Service', name: it.name }
            }))
          }))
        };

        const schema = {
          '@context':'https://schema.org',
          '@type':'BeautySalon',
          name: cfg.salonName || 'Salon',
          url: cfg.url || location.origin + location.pathname,
          telephone: telephone || undefined,
          image: images && images.length ? images : undefined,
          address: postalAddress,
          geo: (cfg.geo && typeof cfg.geo.lat==='number' && typeof cfg.geo.lng==='number') ? { '@type':'GeoCoordinates', latitude: cfg.geo.lat, longitude: cfg.geo.lng } : undefined,
          openingHours: openingHours,
          priceRange: cfg.priceRange || priceRange,
          sameAs: Array.isArray(cfg.sameAs) ? cfg.sameAs : undefined,
          aggregateRating: aggregateRating,
          hasOfferCatalog: serviceCatalog
        };

        // Clean undefined keys for smaller payload
        Object.keys(schema).forEach(k=> schema[k]===undefined && delete schema[k]);

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'schemaLD';
        script.text = JSON.stringify(schema);
        head.appendChild(script);
      }catch(e){ /* ignore */ }
    }
  };
  return APP;
})();
