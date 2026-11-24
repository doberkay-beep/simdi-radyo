import { X509Certificate, verify } from "node:crypto";
import { rootCertificates } from "node:tls";

// Alexa isteğinin gerçekten Amazon'dan geldiğini doğrular (Alexa Skills Kit, "Verifying that
// the request was sent by Alexa"). Sertifika adresi, sertifika zinciri, imza ve zaman damgası.
// Ek paket yok: Node'un kendi X509Certificate'ı ve kök sertifika listesi.

const ZAMAN_PAYI_MS = 150_000;
const onbellek = new Map<string, { at: number; yaprak: X509Certificate }>();

function adresUygun(ham: string): boolean {
  let u: URL;
  try {
    u = new URL(ham);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (u.hostname.toLowerCase() !== "s3.amazonaws.com") return false;
  if (u.port && u.port !== "443") return false;
  // URL ".." bölümlerini çözer: normalleşmiş yol /echo.api/ ile başlamalı (büyük-küçük harf duyarlı).
  return u.pathname.startsWith("/echo.api/");
}

function pemleriAyir(metin: string): string[] {
  return metin.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];
}

const kokler = rootCertificates.map((p) => new X509Certificate(p));

async function yaprakSertifika(adres: string): Promise<X509Certificate | null> {
  const k = onbellek.get(adres);
  if (k && Date.now() - k.at < 3_600_000 && Date.parse(k.yaprak.validTo) > Date.now()) return k.yaprak;

  const r = await fetch(adres, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  if (!r.ok) return null;
  const zincir = pemleriAyir(await r.text()).map((p) => new X509Certificate(p));
  if (zincir.length === 0) return null;
  const yaprak = zincir[0];

  const simdi = Date.now();
  if (Date.parse(yaprak.validFrom) > simdi || Date.parse(yaprak.validTo) < simdi) return null;
  if (!(yaprak.subjectAltName ?? "").split(/,\s*/).includes("DNS:echo-api.amazon.com")) return null;

  // Zincirde her sertifika bir sonrakince imzalanmış olmalı; sonuncusu güvenilir bir köke bağlanmalı.
  for (let i = 0; i < zincir.length - 1; i++) {
    if (!zincir[i].checkIssued(zincir[i + 1]) || !zincir[i].verify(zincir[i + 1].publicKey)) return null;
  }
  const son = zincir[zincir.length - 1];
  const koke = kokler.some((kok) => kok.fingerprint256 === son.fingerprint256 || (son.checkIssued(kok) && son.verify(kok.publicKey)));
  if (!koke) return null;

  onbellek.set(adres, { at: simdi, yaprak });
  return yaprak;
}

/** Gövde ham metin olarak verilmeli (JSON'a çevrilmeden önce). */
export async function alexaIstegiMi(govde: string, basliklar: Headers): Promise<boolean> {
  try {
    const adres = basliklar.get("signaturecertchainurl");
    const imza = basliklar.get("signature-256");
    if (!adres || !imza || !adresUygun(adres)) return false;

    const yaprak = await yaprakSertifika(adres);
    if (!yaprak) return false;
    if (!verify("sha256", Buffer.from(govde, "utf8"), yaprak.publicKey, Buffer.from(imza, "base64"))) return false;

    const zaman = Date.parse((JSON.parse(govde) as { request?: { timestamp?: string } }).request?.timestamp ?? "");
    return Number.isFinite(zaman) && Math.abs(Date.now() - zaman) <= ZAMAN_PAYI_MS;
  } catch {
    return false;
  }
}

export const _deneme = { adresUygun };
