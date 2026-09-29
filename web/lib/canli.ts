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

/* "Şarkı değiştiği an" — now_playing tablosundaki her değişiklik anında düşer.
   Toplayıcı yazdığı saniye ekran güncellenir; 15 sn'lik yoklama yedeğe iner.
   Gereksinim: liste-canli.sql (tabloyu supabase_realtime yayınına ekler). */
export type SimdiDegisim = {
  station_id: number;
  artist: string | null;
  title: string | null;
  raw_title: string | null;
  updated_at: string;
};

export function simdiDinle(uzerine: (d: SimdiDegisim) => void, durum?: (bagli: boolean) => void): () => void {
  const ch: RealtimeChannel = al().channel("simdi-degisim");
  ch.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "now_playing" },
    (p) => {
      const yeni = (p as { new?: Partial<SimdiDegisim> }).new;
      if (yeni && typeof yeni.station_id === "number") uzerine(yeni as SimdiDegisim);
    },
  );
  ch.subscribe((s) => durum?.(s === "SUBSCRIBED"));
  return () => {
    al().removeChannel(ch).catch(() => {});
  };
}

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
