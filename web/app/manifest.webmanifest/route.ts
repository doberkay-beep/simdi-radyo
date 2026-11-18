import { siteManifesti } from "./manifest-verisi";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(siteManifesti()), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
