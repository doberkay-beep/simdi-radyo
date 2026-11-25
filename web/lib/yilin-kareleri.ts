/* YILIN ON İKİ KARESİ — 31 Aralık gecesi gece yarısı ekranında akan, 2026'nın her ayından bir kare
 * (frameby. köprüsü). Kareler frameby kataloğundan (berkaydogan.co/frameby). Son liste frameby
 * oturumunda hazırlanır ve berkaydogan.co/frameby/yilin-kareleri.json olarak yayımlanır; burada
 * yalnız okunur (10 dk önbellek). O dosya yoksa ya da bozuksa aşağıdaki yer tutucu liste kullanılır.
 * Kural: listeye burada ekleme yapılmaz (yüz, ev çevresi denetimi frameby tarafında).
 */

export type Kare = {
  ay: number; // 1–12
  id: string;
  semt: string;
  saat: string; // çekim saati ("16:39") ya da arşivde yıl
  radyo: string; // nowby istasyon slug'ı — hapta canlı çalan
  dikey?: boolean;
  fotografci?: string | null;
  gorsel: string; // tam adres
};

const KOK = "https://www.berkaydogan.co/frameby";
const LISTE_URL = `${KOK}/yilin-kareleri.json`;

// YER TUTUCU (25 Kas): katalogdan; gerçek ay eşleşmesi olanlar iPhone tarihinden (Nis, Haz, Tem, Kas). Ocak için katalogdaki tek 2026 karesi (iph-20260109-141) ev içi, alınmadı.
const YER_TUTUCU: Omit<Kare, "gorsel">[] = [
  { ay: 1, id: "r50-0214", semt: "İstiklal, Beyoğlu", saat: "00:52", radyo: "kiyi-gece" },
  { ay: 2, id: "r50-0017", semt: "Galata, Beyoğlu", saat: "16:57", radyo: "radio-paradise-mellow" },
  { ay: 3, id: "r50-0307", semt: "Boğaz, vapurdan", saat: "17:20", radyo: "radio-paradise-mellow" },
  { ay: 4, id: "iph-20260418-155", semt: "Cihangir", saat: "17:38", radyo: "kiyi-turkce", dikey: true },
  { ay: 5, id: "r50-1140", semt: "Büyükada", saat: "13:10", radyo: "joyturk-akustik" },
  { ay: 6, id: "iph-20260612-171", semt: "Arnavutköy", saat: "14:46", radyo: "kiyi-turkce" },
  { ay: 7, id: "iph-20260725-184", semt: "Moda", saat: "12:07", radyo: "smooth-jazz-deluxe" },
  { ay: 8, id: "r50-0564", semt: "Eminönü, Galata Köprüsü", saat: "15:22", radyo: "retro-turk" },
  { ay: 9, id: "r50-0656", semt: "Anadolu yakası, Adalara karşı", saat: "16:23", radyo: "groove-wave-lounge" },
  { ay: 10, id: "r50-0968", semt: "Karaköy, Galata Köprüsü", saat: "16:41", radyo: "radio-paradise-mellow" },
  { ay: 11, id: "iph-20261110-200", semt: "Eminönü", saat: "16:44", radyo: "radio-paradise-mellow" },
  { ay: 12, id: "iph-20230807-013", semt: "Üsküdar, Kız Kulesi", saat: "20:39", radyo: "kiyi-gece" },
];

const tamamla = (k: Omit<Kare, "gorsel">): Kare => ({ ...k, gorsel: `${KOK}/kareler/${encodeURIComponent(k.id)}.jpg` });

function gecerli(x: unknown): x is Omit<Kare, "gorsel"> {
  const k = x as Kare;
  return !!k && Number.isInteger(k.ay) && k.ay >= 1 && k.ay <= 12 && /^[\w().-]+$/.test(k.id ?? "")
    && typeof k.semt === "string" && typeof k.saat === "string" && /^[a-z0-9-]+$/.test(k.radyo ?? "");
}

/** On iki kare, aya göre sıralı. frameby'ın yayımladığı liste varsa o, yoksa yer tutucu. */
export async function yilinKareleri(): Promise<{ kareler: Kare[]; kaynak: "frameby" | "yer-tutucu" }> {
  try {
    const r = await fetch(LISTE_URL, { next: { revalidate: 600 }, signal: AbortSignal.timeout(4000) });
    if (r.ok) {
      const d = await r.json();
      const liste = (Array.isArray(d) ? d : d?.kareler) as unknown[];
      if (Array.isArray(liste) && liste.length === 12 && liste.every(gecerli)) {
        return { kareler: (liste as Omit<Kare, "gorsel">[]).sort((a, b) => a.ay - b.ay).map(tamamla), kaynak: "frameby" };
      }
    }
  } catch { /* yer tutucu */ }
  return { kareler: YER_TUTUCU.map(tamamla), kaynak: "yer-tutucu" };
}

/** Zamanlama (izleyicinin yerel saati): 12 kare × 4 dk, son kare 23:56–00:00; 00:00'da "yıl" sahnesi 10 dk. */
export const KARE_DK = 4;
export const YIL_SAHNESI_DK = 10;
