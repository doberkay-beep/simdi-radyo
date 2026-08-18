import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

// Yayındaki API. Uygulama veriyi buradan okur.
const API = "https://necaliyor.co";
const DEFAULT_ACCENT = "#6b7280";

type NowPlaying = {
  artist: string | null;
  title: string | null;
  rawTitle: string | null;
} | null;

type Station = {
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accentColor: string | null;
  band: string;
  genre: string | null;
  nowPlaying: NowPlaying;
};

const DARK = { bg: "#0a0a0b", fg: "#ececee", muted: "#8a8a92", line: "#1c1c20" };
const LIGHT = { bg: "#faf9f7", fg: "#1a1a1e", muted: "#6f6f77", line: "#e6e4df" };

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0b" : "#ffffff";
}

function trackLine(np: NowPlaying, fallback: string): string {
  if (!np) return fallback;
  if (np.artist && np.title && np.artist !== np.title) return `${np.artist} — ${np.title}`;
  return np.title || np.rawTitle || fallback;
}

// Şarkı bilgisi vermeyen istasyonlar için türe uygun "havalı" cümleler.
const TAGLINES: Record<string, string[]> = {
  caz: ["kadehler, duman ve saksofon", "gece yarısı bir kulüpte", "swing'in tam kıvamı"],
  klasik: ["yaylılar ve sonsuzluk", "bir konser salonunun sükûneti", "notaların en zarifi"],
  elektronik: ["şafağa kadar süren bir set", "bas, ışık, tekrar", "dört dörtlük bir groove"],
  rock: ["gitarlar sonuna kadar açık", "distortion ve ter", "sahnenin en önü"],
  metal: ["duvarları titreten riffler", "sonuna kadar aç"],
  pop: ["radyonun en parlak yüzü", "nakaratı hazır tut", "listelerin zirvesi"],
  "türkçe pop": ["camlar açık, yol uzun", "en sevilen nakaratlar", "hepimizin şarkısı"],
  türkü: ["bir bağlama, bir uzun hava", "toprak kokan ezgiler", "yürekten yakılan türküler"],
  arabesk: ["bir sigara, bir dert, bir şarkı", "gecenin en hüzünlü sesi", "kalbe dokunan sözler"],
  tsm: ["makamlar ve incelik", "bir başka zarafet"],
  nostalji: ["eski bir kasetin sıcaklığı", "yıllar öncesine bir bilet", "unutulmayanlar"],
  alternatif: ["keşfedilmeyi bekleyen sesler", "listelerin dışında bir yer", "farklı bir frekans"],
};
const DEFAULT_TAGLINES = ["müzik hiç durmaz", "sadece dinle", "frekans açık"];

function tagline(genre: string | null, slug: string): string {
  const pool = (genre && TAGLINES[genre]) || DEFAULT_TAGLINES;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [liveNP, setLiveNP] = useState<NowPlaying>(null);
  const player = useAudioPlayer();
  const C = dark ? DARK : LIGHT;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  async function load() {
    try {
      const res = await fetch(`${API}/api/now`);
      const data = await res.json();
      setStations(data.stations ?? []);
    } catch {
      // sessizce geç
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  // Çalan istasyonu canlı yokla (dinlenenle yazı eşleşsin).
  useEffect(() => {
    if (!playing) {
      setLiveNP(null);
      return;
    }
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const r = await fetch(`${API}/api/live/${playing}`);
        const d = await r.json();
        if (!cancelled) setLiveNP(d.live ?? null);
      } catch {
        // sessizce geç
      }
    };
    setLiveNP(null);
    fetchLive();
    const id = setInterval(fetchLive, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [playing]);

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of stations) if (s.genre) counts.set(s.genre, (counts.get(s.genre) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [stations]);

  const shown = useMemo(
    () => (genre ? stations.filter((s) => s.genre === genre) : stations),
    [stations, genre],
  );

  const current = stations.find((s) => s.slug === playing) ?? null;
  const accent = current?.accentColor || DEFAULT_ACCENT;

  function toggle(s: Station) {
    if (playing === s.slug) {
      player.pause();
      setPlaying(null);
      return;
    }
    try {
      player.replace({ uri: `${API}/api/stream/${s.slug}` });
      player.play();
      setPlaying(s.slug);
    } catch {
      setPlaying(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style={dark ? "light" : "dark"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.h1, { color: C.fg }]}>ŞİMDİ</Text>
            <Text style={[styles.tag, { color: C.muted }]}>radyoda şu an ne çalıyor</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Pressable onPress={() => setDark(!dark)} hitSlop={10}>
              <Text style={{ color: C.muted, fontSize: 16 }}>{dark ? "☀︎" : "☾"}</Text>
            </Pressable>
            <Text style={{ color: "#3ddc84", fontSize: 12 }}>● canlı</Text>
          </View>
        </View>

        {/* Tür çipleri */}
        {genres.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {[null, ...genres].map((g) => {
              const active = genre === g;
              return (
                <Pressable
                  key={g ?? "all"}
                  onPress={() => setGenre(g)}
                  style={[
                    styles.chip,
                    { borderColor: active ? C.fg : C.line, backgroundColor: active ? C.fg : "transparent" },
                  ]}
                >
                  <Text style={{ color: active ? C.bg : C.muted, fontSize: 12 }}>{g ?? "tümü"}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator color={C.muted} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={(s) => s.slug}
            contentContainerStyle={{ paddingBottom: current ? 96 : 24 }}
            renderItem={({ item: s }) => {
              const c = s.accentColor || DEFAULT_ACCENT;
              const isPlaying = playing === s.slug;
              const np = isPlaying && liveNP ? liveNP : s.nowPlaying;
              const artist = np?.artist?.trim() || null;
              const title = np?.title?.trim() || null;
              const same = !!artist && !!title && artist === title;
              return (
                <Pressable
                  onPress={() => toggle(s)}
                  style={[
                    styles.row,
                    { borderBottomColor: C.line },
                    isPlaying && { backgroundColor: c + "22" },
                  ]}
                >
                  <View style={[styles.bar, { backgroundColor: c }]} />
                  <View style={{ flex: 1 }}>
                    {np ? (
                      same ? (
                        <Text style={[styles.trackBold, { color: C.fg }]} numberOfLines={1}>
                          {title}
                        </Text>
                      ) : (
                        <Text style={[styles.track, { color: C.fg }]} numberOfLines={1}>
                          <Text style={styles.trackBold}>{artist ?? title}</Text>
                          {artist && title ? <Text style={{ color: C.muted }}> — {title}</Text> : null}
                        </Text>
                      )
                    ) : (
                      <Text
                        style={[styles.track, { color: C.muted, fontStyle: "italic" }]}
                        numberOfLines={1}
                      >
                        {tagline(s.genre, s.slug)}
                      </Text>
                    )}
                    <Text style={[styles.sub, { color: C.muted }]} numberOfLines={1}>
                      <Text style={{ color: c }}>{s.name}</Text>
                      {s.frequency ? ` · ${s.frequency}` : ""}
                      {s.city ? ` · ${s.city}` : ""}
                      {isPlaying && liveNP ? " · canlı" : ""}
                    </Text>
                  </View>
                  <Text style={{ color: isPlaying ? c : C.muted, fontSize: 16, marginLeft: 8 }}>
                    {isPlaying ? "❚❚" : "▶"}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        {current && (
          <Pressable
            onPress={() => toggle(current)}
            style={[styles.nowbar, { backgroundColor: accent }]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: readableOn(accent), fontWeight: "700", fontSize: 14 }}
                numberOfLines={1}
              >
                {trackLine(liveNP ?? current.nowPlaying, tagline(current.genre, current.slug))}
              </Text>
              <Text style={{ color: readableOn(accent), opacity: 0.8, fontSize: 12 }} numberOfLines={1}>
                {current.name}
              </Text>
            </View>
            <Text style={{ color: readableOn(accent), fontWeight: "700", fontSize: 16 }}>❚❚</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  h1: { fontSize: 34, fontWeight: "900", letterSpacing: -1 },
  tag: { fontSize: 13, marginTop: 2 },
  chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: { width: 3, height: 34, borderRadius: 2 },
  track: { fontSize: 16 },
  trackBold: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 12, marginTop: 3 },
  nowbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
  },
});
