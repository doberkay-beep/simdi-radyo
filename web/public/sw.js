// ŞİMDİ — servis çalışanı (PWA çevrimdışı kabuk).
// Canlı yayın ve API her zaman ağdan gider; yalnızca uygulama kabuğu ve
// statik varlıklar önbelleğe alınır ki çevrimdışıyken uygulama açılsın.

const SURUM = "simdi-v1";
const KABUK = ["/", "/kesif", "/kose", "/nabiz", "/arsiv", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SURUM).then((c) => c.addAll(KABUK)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SURUM).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // yabancı yayın/host'a dokunma

  // Canlı ses akışı: asla önbelleğe alma, dokunma.
  if (url.pathname.startsWith("/api/stream")) return;

  // Diğer API'ler: taze veri — ağ önce, olmazsa boş geç.
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).catch(() => new Response("{}", { headers: { "Content-Type": "application/json" } })));
    return;
  }

  // Sayfa gezinmeleri: ağ önce, çevrimdışıysa önbellekteki kabuk.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SURUM).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/"))),
    );
    return;
  }

  // Statik varlıklar (_next/static, ikon, font): önbellek önce.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.startsWith("/_next/static") || /\.(?:png|jpg|jpeg|svg|webp|woff2?|ttf|ico)$/.test(url.pathname))) {
            const copy = res.clone();
            caches.open(SURUM).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }),
    ),
  );
});
