// Ortam değişkenlerini yükler.
// Yerelde: .env.local varsa okunur. Sunucuda (Railway vb.): dosya yoktur,
// değişkenler panelden gelir (process.env) — o yüzden hata yutulur.
// Bu modül, process.env okuyan diğer modüllerden ÖNCE import edilmeli.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local yok — sunucu ortamı; değişkenler zaten process.env'de.
}
