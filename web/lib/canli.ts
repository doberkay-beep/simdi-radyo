"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

// Canlı varlık katmanı — "yalnız değilsin": aynı istasyonu şu an kaç kişinin
// dinlediği (presence) + kalplerin ve defter notlarının herkese anında düşmesi
// (broadcast). Anahtarlar public anon; RLS her zamanki gibi korur.

const URL = "https://uiouzizblrkojmsqvbjk.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM";

let istemci: SupabaseClient | null = null;
function al(): SupabaseClient {
  istemci ??= createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return istemci;
}

// Aynı kişi birden çok bileşenden katılırsa tek sayılsın diye kalıcı anonim kimlik.
function anonId(): string {
  try {
    let id = localStorage.getItem("dinleyiciId");
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem("dinleyiciId", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export type CanliKanal = {
  kalpYolla: () => void;
  notYolla: (metin: string) => void;
  ayril: () => void;
};

export function dinleyiciKatil(
  slug: string,
  uzerine: {
    sayi?: (n: number) => void;
    kalp?: () => void;
    not?: (metin: string) => void;
  },
): CanliKanal {
  const ch: RealtimeChannel = al().channel(`dinleyici:${slug}`, {
    config: { presence: { key: anonId() }, broadcast: { self: false } },
  });
  ch.on("presence", { event: "sync" }, () => {
    uzerine.sayi?.(Object.keys(ch.presenceState()).length);
  });
  ch.on("broadcast", { event: "kalp" }, () => uzerine.kalp?.());
  ch.on("broadcast", { event: "not" }, (p) => {
    const m = (p as { payload?: { metin?: string } }).payload?.metin;
    if (typeof m === "string" && m) uzerine.not?.(m);
  });
  ch.subscribe((durum) => {
    if (durum === "SUBSCRIBED") ch.track({ t: Date.now() }).catch(() => {});
  });
  return {
    kalpYolla: () => {
      ch.send({ type: "broadcast", event: "kalp", payload: {} }).catch(() => {});
    },
    notYolla: (metin: string) => {
      ch.send({ type: "broadcast", event: "not", payload: { metin } }).catch(() => {});
    },
    ayril: () => {
      al().removeChannel(ch).catch(() => {});
    },
  };
}
