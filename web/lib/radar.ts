"use client";

// Sanatçı Radarı Push — izlediğin sanatçı herhangi bir radyoda çalmaya
// başlayınca (site kapalıyken bile) bildirim. Tarayıcı web push aboneliği
// radar_esitle RPC'siyle Supabase'e yazılır; gönderimi sunucudaki nöbetçi yapar.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { izlenenOku } from "./avlar";

const URL = "https://uiouzizblrkojmsqvbjk.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM";
// VAPID public anahtarı — gizli değildir; sunucudaki özel anahtarın eşi.
const VAPID_PUBLIC =
  "BJ-eDDpODjBt6yuXYTxs63Z911uBQNZ3M2MQfqOn863CKxJWotlsBLdzF9IkbQdYV2kE6utYT2Wn97FgBj-YiWs";

let istemci: SupabaseClient | null = null;
function al(): SupabaseClient {
  istemci ??= createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  return istemci;
}

function b64ToU8(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const ham = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(ham, (c) => c.charCodeAt(0));
}

export function radarDestekleniyor(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function radarAcikMi(): boolean {
  try {
    return localStorage.getItem("radarAcik") === "1";
  } catch {
    return false;
  }
}

/* Radarı aç: izin iste → push aboneliği → izlenenleri sunucuya eşitle. */
export async function radarAc(): Promise<"acik" | "izin-yok" | "desteklenmiyor" | "hata"> {
  if (!radarDestekleniyor()) return "desteklenmiyor";
  try {
    const izin = await Notification.requestPermission();
    if (izin !== "granted") return "izin-yok";
    const sw = await navigator.serviceWorker.ready;
    const abone =
      (await sw.pushManager.getSubscription()) ??
      (await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(VAPID_PUBLIC).buffer as ArrayBuffer,
      }));
    const { error } = await al().rpc("radar_esitle", {
      p_abone: abone.toJSON(),
      p_sanatcilar: izlenenOku(),
    });
    if (error) return "hata";
    try {
      localStorage.setItem("radarAcik", "1");
    } catch {
      // yoksay
    }
    return "acik";
  } catch {
    return "hata";
  }
}

/* İzlenen listesi değiştiğinde sessizce eşitle (radar açıksa). */
export async function radarEsitle(): Promise<void> {
  if (!radarAcikMi() || !radarDestekleniyor()) return;
  try {
    const sw = await navigator.serviceWorker.ready;
    const abone = await sw.pushManager.getSubscription();
    if (!abone) return;
    await al().rpc("radar_esitle", { p_abone: abone.toJSON(), p_sanatcilar: izlenenOku() });
  } catch {
    // sessiz — bir sonraki değişiklikte yeniden dener
  }
}

/* Radarı kapat: sunucudaki kayıtları boşalt + aboneliği bırak. */
export async function radarKapat(): Promise<void> {
  try {
    const sw = await navigator.serviceWorker.ready;
    const abone = await sw.pushManager.getSubscription();
    if (abone) {
      await al().rpc("radar_esitle", { p_abone: abone.toJSON(), p_sanatcilar: [] });
      await abone.unsubscribe();
    }
  } catch {
    // yoksay
  } finally {
    try {
      localStorage.setItem("radarAcik", "0");
    } catch {
      // yoksay
    }
  }
}
