// Hetzner'deki arşiv veritabanına çift yazma (23 Eki). Supabase yine asıl kayıt;
// buradaki her hata yalnız loglanır, toplayıcının Supabase yolunu asla durdurmaz.
import pg from "pg";

const url = process.env.ARSIV_PG_URL;
const havuz = url ? new pg.Pool({ connectionString: url, max: 4, idleTimeoutMillis: 30_000 }) : null;
const log = (...a) => console.log(new Date().toISOString(), ...a);

async function calistir(sql, degerler) {
  if (!havuz) return;
  try {
    await havuz.query(sql, degerler);
  } catch (err) {
    log("! arşiv (Hetzner):", err.message);
  }
}

/** Supabase'in verdiği satır numarası ve zamanla aynısını yazar. */
export function arsivePlay(satir, stationId, parsed) {
  return calistir(
    `insert into plays (id, station_id, artist, title, raw_title, started_at)
     values ($1, $2, $3, $4, $5, $6) on conflict (id) do nothing`,
    [satir.id, stationId, parsed.artist, parsed.title, parsed.raw_title, satir.started_at],
  );
}

export function arsivNowPlaying(stationId, parsed) {
  return calistir(
    `insert into now_playing (station_id, artist, title, raw_title, updated_at)
     values ($1, $2, $3, $4, now())
     on conflict (station_id) do update set artist = excluded.artist, title = excluded.title,
       raw_title = excluded.raw_title, updated_at = excluded.updated_at`,
    [stationId, parsed.artist, parsed.title, parsed.raw_title],
  );
}

/** İstasyon listesinin tamamını (pasifler dahil) eşitler. */
export async function arsivIstasyonlar(satirlar) {
  if (!havuz || !satirlar.length) return;
  // meta_gizli radyolar arşivde pasif görünür: geçmişleri hiçbir arşiv sayfasında çıkmaz (Vanilla Radio koşulu).
  satirlar = satirlar.map((s) => (s.meta_gizli ? { ...s, is_active: false } : s));
  const kolonlar = ["id", "slug", "name", "city", "frequency", "stream_url", "homepage", "accent_color",
    "band", "metadata_quality", "is_active", "sort_order", "created_at", "genre"];
  const guncelle = kolonlar.filter((k) => k !== "id").map((k) => `${k} = excluded.${k}`).join(", ");
  for (let i = 0; i < satirlar.length; i += 200) {
    const parca = satirlar.slice(i, i + 200);
    const degerler = [];
    const yerler = parca.map((s, j) => `(${kolonlar.map((_, k) => `$${j * kolonlar.length + k + 1}`).join(", ")})`);
    for (const s of parca) for (const k of kolonlar) degerler.push(s[k] ?? null);
    await calistir(
      `insert into stations (${kolonlar.join(", ")}) values ${yerler.join(", ")}
       on conflict (id) do update set ${guncelle}`,
      degerler,
    );
  }
}
