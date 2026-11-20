// Tek seferlik deneme: kayıtlı ilk aboneye bir bildirim gönderir. Kullanım: node dene.mjs
import http2 from "node:http2"; import crypto from "node:crypto"; import { readFileSync } from "node:fs"; import pg from "pg";
const env = { ...Object.fromEntries(readFileSync("/opt/simdi-collector/.env.local","utf8").split("\n").filter(s=>s.includes("=")).map(s=>[s.slice(0,s.indexOf("=")),s.slice(s.indexOf("=")+1).trim()])),
  ...Object.fromEntries(readFileSync("apns.env","utf8").split("\n").filter(s=>s.includes("=")&&!s.startsWith("#")).map(s=>[s.slice(0,s.indexOf("=")),s.slice(s.indexOf("=")+1).trim()])) };
const db = new pg.Pool({ connectionString: env.ARSIV_PG_URL });
const { rows: [a] } = await db.query("select token, ortam from bildirim_abone order by son_gorulme desc limit 1");
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const veri = `${b64({alg:"ES256",kid:env.APNS_KEY_ID})}.${b64({iss:env.APNS_TEAM_ID,iat:Math.floor(Date.now()/1000)})}`;
const jwt = `${veri}.${crypto.sign("sha256",Buffer.from(veri),{key:readFileSync(env.APNS_KEY_PATH,"utf8"),dsaEncoding:"ieee-p1363"}).toString("base64url")}`;
const s = http2.connect(a.ortam==="sandbox"?"https://api.sandbox.push.apple.com":"https://api.push.apple.com");
const r = s.request({":method":"POST",":path":`/3/device/${a.token}`,authorization:`bearer ${jwt}`,"apns-topic":"co.berkaydogan.nowby","apns-push-type":"alert","apns-priority":"10","content-type":"application/json"});
let g=""; r.setEncoding("utf8"); r.on("response",h=>{r.on("data",d=>g+=d);r.on("end",()=>{console.log("apns", h[":status"], g||"(boş)");s.close();db.end();});});
r.end(JSON.stringify({aps:{alert:{title:"♪ Sevdiğin şarkı çalıyor",body:"Bu bir deneme — dokun, Radyo Eksen açılsın · nowby."},sound:"default","thread-id":"sevilen"},slug:"radyo-eksen"}));
