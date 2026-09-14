"use client";

// Ortak çalma yardımcısı: kaynak HLS (.m3u8) ise hls.js ile bağlar (Safari
// native çalar), değilse eski yol — /api/stream proxy/302 — aynen sürer.
// Tek <audio> elemanına bağlı hls örneği audio.__hls üzerinde taşınır ki
// istasyon değişiminde sızıntısız yıkılabilsin.

type HlsAudio = HTMLAudioElement & { __hls?: { destroy: () => void } | null };

let HlsCtor: (typeof import("hls.js"))["default"] | null = null;

export function hlsYik(audio: HTMLAudioElement) {
  const a = audio as HlsAudio;
  try {
    a.__hls?.destroy();
  } catch {
    // yoksay
  }
  a.__hls = null;
}

// Kaynağı bağlayıp çalmayı başlatır. play() reddi (autoplay engeli) fırlatılır;
// çağıran taraf mevcut hata akışıyla yakalar.
export async function kaynagiCalistir(audio: HTMLAudioElement, slug: string): Promise<void> {
  const a = audio as HlsAudio;
  hlsYik(a);

  let meta: { hls?: boolean; url?: string } = {};
  try {
    meta = await fetch(`/api/stream/${slug}?meta=1`, { cache: "force-cache" }).then((r) => r.json());
  } catch {
    // meta alınamadıysa eski yola düş
  }

  if (meta.hls && meta.url) {
    if (a.canPlayType("application/vnd.apple.mpegurl")) {
      a.src = meta.url; // Safari — native HLS
    } else {
      if (!HlsCtor) HlsCtor = (await import("hls.js")).default;
      if (HlsCtor.isSupported()) {
        const h = new HlsCtor({ maxBufferLength: 30, backBufferLength: 30 });
        h.loadSource(meta.url);
        h.attachMedia(a);
        a.__hls = h;
      } else {
        a.src = meta.url; // son çare: tarayıcı ne yapabiliyorsa
      }
    }
  } else {
    a.src = `/api/stream/${slug}?r=${Date.now()}`;
  }
  return a.play();
}
