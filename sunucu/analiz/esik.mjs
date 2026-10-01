// Senkron eşiği analizi — aktif TR istasyonları (ikizler kapalı), son 7 gün.
const url='https://uiouzizblrkojmsqvbjk.supabase.co';
const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM';
const H={apikey:key,Authorization:'Bearer '+key};
const g=async(p)=>{const r=await fetch(url+'/rest/v1/'+p,{headers:H});return r.json();};
const katla=t=>String(t||'').replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const st=await g('stations?select=id,slug,name&band=eq.tr&is_active=eq.true&limit=1000');
const ad=new Map(st.map(s=>[s.id,s]));
const bas=new Date(Date.now()-7*864e5).toISOString();
let ps=[];for(let off=0;;off+=1000){const p=await g(`plays?select=artist,title,station_id,started_at&started_at=gte.${bas}&station_id=in.(${[...ad.keys()].join(',')})&order=started_at&limit=1000&offset=${off}`);ps.push(...p);if(p.length<1000)break;}
ps=ps.filter(p=>p.artist&&p.title&&katla(p.artist)!==katla(p.title)&&katla(p.artist)!==katla(ad.get(p.station_id).name)&&!/jingle|reklam|https?:|~/i.test(p.artist+p.title));
const grup=new Map();for(const p of ps){const k=katla(p.artist)+'|'+katla(p.title);if(!grup.has(k))grup.set(k,[]);grup.get(k).push(p);}
for(const PEN of [60e3,120e3,240e3]){
  const say={2:0,3:0,4:0};const ornek=[];
  for(const [k,l] of grup){l.sort((a,b)=>Date.parse(a.started_at)-Date.parse(b.started_at));
    for(let i=0;i<l.length;i++){const t=Date.parse(l[i].started_at);const s=new Set();let j=i;for(;j<l.length&&Date.parse(l[j].started_at)-t<=PEN;j++)s.add(l[j].station_id);
      if(s.size>=2){say[Math.min(s.size,4)]++; if(PEN===60e3&&ornek.length<6)ornek.push(`${l[i].artist} — ${l[i].title} · ${[...s].map(x=>ad.get(x).name).join(' + ')} · ${l[i].started_at.slice(5,16)}`); i=j-1;}}}
  console.log(`pencere ${PEN/60e3} dk → 2 radyo: ${say[2]} · 3: ${say[3]} · 4+: ${say[4]}  (7 günde; günde ~${(say[2]/7).toFixed(1)} adet 2'li)`);
  if(PEN===60e3) console.log('  örnek:\n  '+ornek.join('\n  '));
}
console.log('çalma:',ps.length);
