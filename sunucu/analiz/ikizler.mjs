// İkiz yayın taraması: aynı yayını farklı adreslerden veren istasyon çiftleri.
// Ölçüt: son 3 günde A'nın çaldıklarının kaçı B'de ±90 sn içinde de başlamış.
const url='https://uiouzizblrkojmsqvbjk.supabase.co';
const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM';
const H={apikey:key,Authorization:'Bearer '+key};
const g=async(p)=>{const r=await fetch(url+'/rest/v1/'+p,{headers:H});return r.json();};
const katla=t=>String(t||'').replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const st=await g('stations?select=id,slug,name,band,is_active&band=eq.tr&is_active=eq.true&limit=1000');
const ad=new Map(st.map(s=>[s.id,s.slug]));
const bas=new Date(Date.now()-3*864e5).toISOString();
let ps=[];for(let off=0;;off+=1000){const p=await g(`plays?select=artist,title,station_id,started_at&started_at=gte.${bas}&station_id=in.(${[...ad.keys()].join(',')})&order=started_at&limit=1000&offset=${off}`);ps.push(...p);if(p.length<1000)break;}
const ist=new Map();for(const p of ps){if(!p.artist||!p.title)continue;const k=katla(p.artist)+'|'+katla(p.title);if(!ist.has(p.station_id))ist.set(p.station_id,[]);ist.get(p.station_id).push([k,Date.parse(p.started_at)]);}
const idx=new Map();for(const [s,l] of ist){const m=new Map();for(const [k,t] of l){if(!m.has(k))m.set(k,[]);m.get(k).push(t);}idx.set(s,m);}
const sonuc=[];const ids=[...ist.keys()];
for(const a of ids)for(const b of ids){if(a>=b)continue;const la=ist.get(a),mb=idx.get(b);let es=0;for(const [k,t] of la){const tb=mb.get(k);if(tb&&tb.some(x=>Math.abs(x-t)<=90e3))es++;}
 const oran=es/Math.min(la.length,ist.get(b).length);if(oran>0.3)sonuc.push([oran.toFixed(2),ad.get(a),ad.get(b),la.length,ist.get(b).length,es]);}
sonuc.sort((x,y)=>y[0]-x[0]);console.log('TR istasyon:',ids.length,'· çalma:',ps.length);console.log(sonuc.map(x=>x.join(' | ')).join('\n')||'ikiz yok');
