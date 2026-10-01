// Etiket seferi için sanatçıların SON 7 GÜN sayıları (anon, salt okuma).
const url='https://uiouzizblrkojmsqvbjk.supabase.co';
const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM';
const H={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
const rpc=async(ad,g)=>{const r=await fetch(url+'/rest/v1/rpc/'+ad,{method:'POST',headers:H,body:JSON.stringify(g)});return r.json();};
for(const s of (process.argv[2]||'hadise,blok3,manifest,elif-buse-dogan,eypio,bora-duran,poizi,imael-angel').split(',')){
  const o=await rpc('sanatci_ozet',{p_slug:s});
  console.log(JSON.stringify({s,ad:o.ad,kez7:o.kez7,ist7:o.istasyonSay7,zirve7:o.sarkilar7?.slice(0,2).map(x=>x.title+'·'+x.kez),ist7lst:o.istasyonlar7?.slice(0,3).map(x=>x.name+'·'+x.kez)}));
}
const l=await rpc('liste_araligi',{bastan:new Date(Date.now()-7*864e5).toISOString(),sona:new Date().toISOString(),adet:10});
console.log('7 GÜN LİSTE:',l.map((x,i)=>`${i+1}.${x.artist} — ${x.title} (${x.kez}·${x.istasyon})`).join(' | '));
