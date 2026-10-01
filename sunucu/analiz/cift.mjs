// İki istasyonun kısmi ikizlik analizi: genel örtüşme + saat saat örtüşme.
const [A,B]=(process.argv[2]||'metro-fm,radio-mydonose').split(',');
const url='https://uiouzizblrkojmsqvbjk.supabase.co';
const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM';
const H={apikey:key,Authorization:'Bearer '+key};
const g=async(p)=>(await fetch(url+'/rest/v1/'+p,{headers:H})).json();
const katla=t=>String(t||'').toLowerCase().replace(/[^a-z0-9ğüşöçı]+/g,' ').trim();
const st=await g(`stations?select=id,slug,name,band&slug=in.(${A},${B})`);
console.log(st.map(s=>`${s.slug}=${s.name}(${s.band})`).join(' · '));
const id=Object.fromEntries(st.map(s=>[s.slug,s.id]));
const bas=new Date(Date.now()-7*864e5).toISOString();
const al=async(i)=>{let ps=[];for(let o=0;;o+=1000){const p=await g(`plays?select=artist,title,started_at&station_id=eq.${i}&started_at=gte.${bas}&order=started_at&limit=1000&offset=${o}`);ps.push(...p);if(p.length<1000)break;}return ps.filter(p=>p.artist&&p.title).map(p=>[katla(p.artist)+'|'+katla(p.title),Date.parse(p.started_at)]);};
const pa=await al(id[A]),pb=await al(id[B]);
const mb=new Map();for(const [k,t] of pb){if(!mb.has(k))mb.set(k,[]);mb.get(k).push(t);}
const saat=Array.from({length:24},()=>[0,0]);let es=0;
for(const [k,t] of pa){const h=(new Date(t+3*3600e3)).getUTCHours();saat[h][1]++;const x=mb.get(k);if(x&&x.some(y=>Math.abs(y-t)<=120e3)){es++;saat[h][0]++;}}
console.log(`${A}: ${pa.length} çalma · ${B}: ${pb.length} · ±2dk eşleşme: ${es} (${(100*es/pa.length).toFixed(1)}%)`);
console.log('saat (TR) eşleşme/çalma: '+saat.map((s,h)=>`${h}:${s[0]}/${s[1]}`).join(' '));
const sa=new Set(pa.map(x=>x[0])),sb=new Set(pb.map(x=>x[0]));const ortak=[...sa].filter(x=>sb.has(x)).length;
console.log(`farklı şarkı: ${A} ${sa.size} · ${B} ${sb.size} · ortak repertuvar ${ortak}`);
