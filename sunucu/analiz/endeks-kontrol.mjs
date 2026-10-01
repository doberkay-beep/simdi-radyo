const url='https://uiouzizblrkojmsqvbjk.supabase.co';
const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM';
const r=await fetch(url+'/rest/v1/rpc/endeks_ozet',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_ay:'2026-09'})});
const d=await r.json();
console.log('toplam:',d.toplam,'· ayın sanatçısı:',JSON.stringify(d.sanatci));
d.liste.slice(0,10).forEach((s,i)=>console.log(`${i+1}. ${s.artist} — ${s.title} (${s.kez} kez · ${s.istasyon} ist)`));
