// Basit, bağımlılıksız rate-limit (kayan pencere, bellek içi).
// Not: Sunucu örneği başına tutulur (Vercel'de örnekler arası paylaşılmaz),
// yani mutlak değil — ama önemsiz uçlarda (kalp/not/push) kaba kuvvet spam'ini
// ciddi biçimde zorlaştırır. Kalıcı/global sınır gerekirse Supabase'e taşınır.

type Kayit = number[];
const KOVA = new Map<string, Kayit>();
const MAX_ANAHTAR = 5000; // bellek koruması

// İzin varsa true. `limit` istek / `pencereMs` içinde.
export function rateLimit(anahtar: string, limit: number, pencereMs: number): boolean {
  const simdi = Date.now();
  const esik = simdi - pencereMs;
  let vurus = KOVA.get(anahtar);
  if (!vurus) {
    // Harita çok büyüdüyse en eskileri temizle (kaba ama yeterli).
    if (KOVA.size > MAX_ANAHTAR) {
      for (const k of KOVA.keys()) {
        KOVA.delete(k);
        if (KOVA.size <= MAX_ANAHTAR / 2) break;
      }
    }
    vurus = [];
    KOVA.set(anahtar, vurus);
  }
  // Pencere dışındakileri at.
  while (vurus.length && vurus[0] < esik) vurus.shift();
  if (vurus.length >= limit) return false;
  vurus.push(simdi);
  return true;
}

// İstekten kaba bir istemci kimliği (IP) çıkar.
export function istemciKimlik(request: Request): string {
  const h = request.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "bilinmeyen";
}
