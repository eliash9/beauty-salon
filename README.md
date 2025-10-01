# beauty-salon
Google Sheets booking (Apps Script)

1) Buat Spreadsheet dengan header kolom:
   date | time | serviceId | service | stylistId | stylist | customer | createdAt | status

2) Apps Script (Extensions -> Apps Script), tempel kode berikut lalu deploy Web App (Execute as: Me, Access: Anyone):

   function doGet(e) {
     const action = (e.parameter.action||'').toLowerCase();
     if (action === 'slots') {
       const date = e.parameter.date; // 'YYYY-MM-DD'
       const stylistId = e.parameter.stylistId || '';
       const serviceId = e.parameter.serviceId || '';
       // Konfigurasi default slots
       const defaultSlots = ['09:00','10:30','11:40','12:00','13:30','14:30','16:00','17:30'];
       // Ambil sheet data bookings
       const sh = SpreadsheetApp.getActive().getSheetByName('Bookings') || SpreadsheetApp.getActive().getActiveSheet();
       const range = sh.getDataRange().getValues();
       const header = range.shift();
       const rows = range.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]])));
       const taken = new Set(rows.filter(r=> r.date===date && (!stylistId || String(r.stylistId)===String(stylistId))).map(r=> r.time));
       const slots = defaultSlots.map(t=>({ time:t, available: !taken.has(t) }));
       return ContentService.createTextOutput(JSON.stringify({ slots })).setMimeType(ContentService.MimeType.JSON);
     }
     return ContentService.createTextOutput(JSON.stringify({ hello:"ok"})).setMimeType(ContentService.MimeType.JSON);
   }

   function doPost(e){
     const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
     if ((body.action||'').toLowerCase() === 'book'){
       const d = body.data||{};
       const sh = SpreadsheetApp.getActive().getSheetByName('Bookings') || SpreadsheetApp.getActive().getActiveSheet();
       if (sh.getLastRow()===0){ sh.appendRow(['date','time','serviceId','service','stylistId','stylist','customer','createdAt','status']); }
       sh.appendRow([d.date,d.time,d.serviceId,d.service,d.stylistId,d.stylist,d.customer,d.createdAt,'booked']);
       return ContentService.createTextOutput(JSON.stringify({ ok:true })).setMimeType(ContentService.MimeType.JSON);
     }
     return ContentService.createTextOutput(JSON.stringify({ ok:false })).setMimeType(ContentService.MimeType.JSON);
   }

3) Set `bookingEndpoint` di config.json ke URL Web App yang di-deploy. Klien akan:
   - GET ?action=slots&date=YYYY-MM-DD&stylistId=...&serviceId=... untuk memuat slot dan menandai booked.
   - POST { action:'book', data:{ ... } } untuk menyimpan booking baru (status default: booked).

4) Update status di Google Sheets (booked/available) sesuai proses internal Anda. UI otomatis disable slot yang sudah booked pada tanggal/stylist yang sama.
