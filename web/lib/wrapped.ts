"use client";

// Wrapped temeli — her başarılı "çal" ânını anonim günlüğe düşer.
// Aralık'ta "Senin 2026'n" kartları bu tohumdan büyür. Sessizce çalışır;
// başarısız olursa kimseyi rahatsız etmez.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = "https://uiouzizblrkojmsqvbjk.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb3V6aXpibHJrb2ptc3F2YmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODExMTQsImV4cCI6MjEwMjM1NzExNH0.rAPFD8zjD_LdGf4hnZW_asnxUS705XCxTII-RqhmZDM";

let istemci: SupabaseClient | null = null;
function al(): SupabaseClient {
  istemci ??= createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  return istemci;
}

// canli.ts ile AYNI anahtar — tek anonim kimlik, tüm canlı özellikler ortak.
function dinleyiciId(): string {
  try {
    let id = localStorage.getItem("dinleyiciId");
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem("dinleyiciId", id);
    }
    return id;
  } catch {
    return "anonim";
  }
}

export function dinlemeKaydet(slug: string): void {
  try {
    al().rpc("dinleme_kaydet", { p_dinleyici: dinleyiciId(), p_slug: slug }).then(() => {}, () => {});
  } catch {
    // sessiz
  }
}
