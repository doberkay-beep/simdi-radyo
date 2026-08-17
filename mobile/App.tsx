import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

// Yayındaki API. Uygulama veriyi buradan okur.
const API = "https://berkaydoganco-wnub.vercel.app";
const DEFAULT_ACCENT = "#6b7280";

type NowPlaying = {
  artist: string | null;
  title: string | null;
  rawTitle: string | null;
  updatedAt: string;
} | null;

type Station = {
  slug: string;
  name: string;
  city: string | null;
  frequency: string | null;
  accentColor: string | null;
  band: string;
  nowPlaying: NowPlaying;
};

// Rengin üstünde siyah mı beyaz mı okunur?
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0a0a0b" : "#ffffff";
}

function trackLine(np: NowPlaying, fallback: string): string {
  if (!np) return fallback;
  if (np.artist && np.title && np.artist !== np.title) return `${np.artist} — ${np.title}`;
  return np.title || np.rawTitle || fallback;
}

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const player = useAudioPlayer();

  // Sessiz modda da ses çıksın.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  async function load() {
    try {
      const res = await fetch(`${API}/api/now`);
      const data = await res.json();
      setStations(data.stations ?? []);
    } catch {
      // sessizce geç; bir sonraki turda tekrar dener
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

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
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.h1}>ŞİMDİ</Text>
            <Text style={styles.tag}>radyoda şu an ne çalıyor</Text>
          </View>
          <Text style={styles.live}>● canlı</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#888" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={stations}
            keyExtractor={(s) => s.slug}
            contentContainerStyle={{ paddingBottom: current ? 96 : 24 }}
            renderItem={({ item: s }) => {
              const c = s.accentColor || DEFAULT_ACCENT;
              const isPlaying = playing === s.slug;
              const np = s.nowPlaying;
              const artist = np?.artist?.trim() || null;
              const title = np?.title?.trim() || null;
              const same = !!artist && !!title && artist === title;
              return (
                <Pressable
                  onPress={() => toggle(s)}
                  style={[styles.row, isPlaying && { backgroundColor: c + "22" }]}
                >
                  <View style={[styles.bar, { backgroundColor: c }]} />
                  <View style={{ flex: 1 }}>
                    {np ? (
                      same ? (
                        <Text style={styles.trackBold} numberOfLines={1}>
                          {title}
                        </Text>
                      ) : (
                        <Text style={styles.track} numberOfLines={1}>
                          <Text style={styles.trackBold}>{artist ?? title}</Text>
                          {artist && title ? (
                            <Text style={{ color: "#8a8a92" }}> — {title}</Text>
                          ) : null}
                        </Text>
                      )
                    ) : (
                      <Text style={[styles.track, { color: "#8a8a92" }]}>—</Text>
                    )}
                    <Text style={styles.sub} numberOfLines={1}>
                      <Text style={{ color: c }}>{s.name}</Text>
                      {s.frequency ? ` · ${s.frequency}` : ""}
                      {s.city ? ` · ${s.city}` : ""}
                    </Text>
                  </View>
                  <Text style={{ color: isPlaying ? c : "#555", fontSize: 16, marginLeft: 8 }}>
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
                {trackLine(current.nowPlaying, current.name)}
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
  root: { flex: 1, backgroundColor: "#0a0a0b" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  h1: { color: "#ececee", fontSize: 34, fontWeight: "900", letterSpacing: -1 },
  tag: { color: "#8a8a92", fontSize: 13, marginTop: 2 },
  live: { color: "#3ddc84", fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1c1c20",
  },
  bar: { width: 3, height: 34, borderRadius: 2 },
  track: { color: "#ececee", fontSize: 16 },
  trackBold: { color: "#ececee", fontSize: 16, fontWeight: "600" },
  sub: { color: "#8a8a92", fontSize: 12, marginTop: 3 },
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
