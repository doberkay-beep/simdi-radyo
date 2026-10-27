"use client";

// Aynı anda — yeni dünya anı yakalanınca web push. Yalnız düğmeye basana gider; abonelik
// ayni_anda_abone_ol RPC'siyle Supabase'e yazılır, gönderimi sunucudaki nowby-dunya-ani yapar.
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const URL = "https://uiouzizblrkojmsqvbjk.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM";
// Radar ile aynı VAPID çifti (public anahtar gizli değildir).
const VAPID_PUBLIC =
  "BJ-eDDpODjBt6yuXYTxs63Z911uBQNZ3M2MQfqOn863CKxJWotlsBLdzF9IkbQdYV2kE6utYT2Wn97FgBj-YiWs";
const ANAHTAR = "ayniAndaAbone";

const METIN = {
  tr: {
    dugme: "Bir dahaki anı bana haber ver",
    not: "Ortalama üç günde bir. Başka hiçbir şey gönderilmez.",
    acik: "Bir dahaki anı haber vereceğim.",
    birak: "Vazgeç",
    izinYok: "Tarayıcın bildirimlere izin vermedi. Ayarlardan açabilirsin.",
    destekYok: "Bu tarayıcı bildirim desteklemiyor. iPhone'da önce siteyi Ana Ekran'a ekle.",
    hata: "Olmadı, birazdan yeniden dene.",
  },
  en: {
    dugme: "Tell me the next time it happens",
    not: "About once every three days. Nothing else, ever.",
    acik: "I'll tell you about the next one.",
    birak: "Stop",
    izinYok: "Your browser didn't allow notifications. You can turn them on in settings.",
    destekYok: "This browser doesn't support notifications. On iPhone, add the site to your Home Screen first.",
    hata: "That didn't work. Try again in a moment.",
  },
};

function b64ToU8(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const ham = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(ham, (c) => c.charCodeAt(0));
}
const destekli = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const sb = () => createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

export default function AyniAndaAbone({ dil }: { dil: "tr" | "en" }) {
  const m = METIN[dil];
  const [durum, setDurum] = useState<"kapali" | "acik" | "bekliyor" | "izinYok" | "destekYok" | "hata">("kapali");

  useEffect(() => {
    try {
      if (localStorage.getItem(ANAHTAR) === "1") setDurum("acik");
    } catch {
      // yoksay
    }
  }, []);

  async function ac() {
    if (!destekli()) return setDurum("destekYok");
    setDurum("bekliyor");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setDurum("izinYok");
      const sw = await navigator.serviceWorker.ready;
      const abone =
        (await sw.pushManager.getSubscription()) ??
        (await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID_PUBLIC).buffer as ArrayBuffer }));
      const { error } = await sb().rpc("ayni_anda_abone_ol", { p_abone: abone.toJSON(), p_dil: dil });
      if (error) return setDurum("hata");
      try { localStorage.setItem(ANAHTAR, "1"); } catch { /* yoksay */ }
      setDurum("acik");
    } catch {
      setDurum("hata");
    }
  }

  async function birak() {
    try {
      const sw = await navigator.serviceWorker.ready;
      const abone = await sw.pushManager.getSubscription();
      // Aynı abonelik sanatçı radarında da kullanılıyor olabilir: tarayıcı aboneliği bırakılmaz, yalnız bu liste.
      if (abone) await sb().rpc("ayni_anda_abone_birak", { p_endpoint: abone.endpoint });
    } catch {
      // yoksay
    }
    try { localStorage.setItem(ANAHTAR, "0"); } catch { /* yoksay */ }
    setDurum("kapali");
  }

  return (
    <div className="mt-6 rounded-2xl border px-4 py-4" style={{ borderColor: "var(--line-hi)" }}>
      {durum === "acik" ? (
        <p className="text-sm">
          🔔 {m.acik}{" "}
          <button type="button" onClick={birak} className="nav-link underline" style={{ color: "var(--muted)" }}>{m.birak}</button>
        </p>
      ) : (
        <>
          <button type="button" onClick={ac} disabled={durum === "bekliyor"} className="press rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: "var(--glow-hi)", color: "#160806", opacity: durum === "bekliyor" ? 0.6 : 1 }}>
            🌍 {m.dugme}
          </button>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{m.not}</p>
          {(durum === "izinYok" || durum === "destekYok" || durum === "hata") && (
            <p className="mt-2 text-xs" role="status">{m[durum]}</p>
          )}
        </>
      )}
    </div>
  );
}
