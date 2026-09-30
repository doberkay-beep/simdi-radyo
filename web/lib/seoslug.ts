// Türkçe-dayanıklı slug — SQL'deki sarki_slug() ile BİREBİR aynı kural
// (seo.sql; biri değişirse ikisi birden değişmeli).

export function sarkiSlug(t: string): string {
  const harita: Record<string, string> = {
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u", I: "i", Â: "a", Î: "i", Û: "u",
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
  };
  return (t || "")
    .replace(/[ÇĞİÖŞÜIÂÎÛçğıöşüâîû]/g, (c) => harita[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
