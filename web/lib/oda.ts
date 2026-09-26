"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

// Birlikte Dinle — davet linkiyle ortak dinleme odası (Supabase Realtime).
// Oda sahibi istasyon değiştirince odadaki herkes birlikte geçer; kalpler odaya düşer.
// Sunucu tarafında hiçbir şey saklanmaz; oda, son üye ayrılınca buharlaşır.

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

export function odaKoduUret(): string {
  // Okunaklı, karışmayan harfler (0/O, 1/I yok).
  const H = "abcdefghjkmnpqrstuvwxyz23456789";
  let k = "";
  for (let i = 0; i < 6; i++) k += H[Math.floor(Math.random() * H.length)];
  return k;
}

export type Oda = {
  istasyonYolla: (slug: string) => void;
  kalpYolla: () => void;
  ayril: () => void;
};

export function odaBaglan(
  kod: string,
  rol: "host" | "uye",
  uzerine: {
    sayi?: (n: number) => void;
    istasyon?: (slug: string) => void;
    kalp?: () => void;
    hostGitti?: () => void;
  },
): Oda {
  let sonSlug: string | null = null;
  const ch: RealtimeChannel = al().channel(`oda:${kod}`, {
    config: { presence: { key: anonId() }, broadcast: { self: false } },
  });

  const hostuBul = () => {
    const durum = ch.presenceState() as Record<string, { rol?: string; slug?: string }[]>;
    let hostVar = false;
    for (const kayitlar of Object.values(durum)) {
      for (const k of kayitlar) {
        if (k.rol === "host") {
          hostVar = true;
          if (k.slug && k.slug !== sonSlug) {
            sonSlug = k.slug;
            if (rol === "uye") uzerine.istasyon?.(k.slug);
          }
        }
      }
    }
    return hostVar;
  };

  let hostGorundu = false;
  ch.on("presence", { event: "sync" }, () => {
    uzerine.sayi?.(Object.keys(ch.presenceState()).length);
    const hostVar = hostuBul();
    if (hostVar) hostGorundu = true;
    else if (hostGorundu && rol === "uye") uzerine.hostGitti?.();
  });
  ch.on("broadcast", { event: "istasyon" }, (p) => {
    const s = (p as { payload?: { slug?: string } }).payload?.slug;
    if (typeof s === "string" && s && rol === "uye") {
      sonSlug = s;
      uzerine.istasyon?.(s);
    }
  });
  ch.on("broadcast", { event: "kalp" }, () => uzerine.kalp?.());

  ch.subscribe((durum) => {
    if (durum === "SUBSCRIBED") ch.track({ rol, t: Date.now() }).catch(() => {});
  });

  return {
    istasyonYolla: (slug: string) => {
      if (rol !== "host") return;
      ch.track({ rol, slug, t: Date.now() }).catch(() => {});
      ch.send({ type: "broadcast", event: "istasyon", payload: { slug } }).catch(() => {});
    },
    kalpYolla: () => {
      ch.send({ type: "broadcast", event: "kalp", payload: {} }).catch(() => {});
    },
    ayril: () => {
      al().removeChannel(ch).catch(() => {});
    },
  };
}
