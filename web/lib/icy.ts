// ICY (Shoutcast/Icecast) metadata okuyucu — sunucu tarafı (route handler).
// Bir istasyonun ŞU ANKİ "çalan" başlığını canlı çeker. Ham soket kullanır;
// "ICY 200 OK" durum satırını da kabul eder, ilk başlığı alınca bağlantıyı kapatır.
// Node runtime gerekir (net/tls) — edge değil.

import net from "node:net";
import tls from "node:tls";

export type IcyResult = { status: "ok" | "none" | "dead"; title?: string; reason?: string };

function parseStreamTitle(metaBuf: Buffer): string {
  let text = metaBuf.toString("utf8");
  if (text.includes("�")) text = metaBuf.toString("latin1");
  text = text.replace(/\0+/g, "");
  const m = /StreamTitle='([\s\S]*?)';/.exec(text);
  return m ? m[1].trim() : "";
}

export function probeIcy(
  streamUrl: string,
  { timeout = 7000, redirects = 3 }: { timeout?: number; redirects?: number } = {},
): Promise<IcyResult> {
  return new Promise((resolve) => {
    let settled = false;
    let socket: net.Socket | tls.TLSSocket | undefined;
    let deadline: ReturnType<typeof setTimeout>;

    const finish = (result: IcyResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      try {
        socket?.destroy();
      } catch {
        // kapanıyoruz
      }
      resolve(result);
    };

    // Mutlak süre sınırı — sürekli ses akıtıp metadata vermeyen istasyonlar asmasın.
    deadline = setTimeout(() => finish({ status: "dead", reason: "sure-doldu" }), timeout);

    let u: URL;
    try {
      u = new URL(streamUrl);
    } catch {
      return finish({ status: "dead", reason: "gecersiz-url" });
    }

    const followRedirect = (location: string) => {
      if (settled) return;
      settled = true;
      try {
        socket?.destroy();
      } catch {
        // kapanıyoruz
      }
      let next: string;
      try {
        next = new URL(location, streamUrl).toString();
      } catch {
        return resolve({ status: "dead", reason: "gecersiz-yonlendirme" });
      }
      probeIcy(next, { timeout, redirects: redirects - 1 }).then(resolve);
    };

    const isTls = u.protocol === "https:";
    const port = u.port ? Number(u.port) : isTls ? 443 : 80;
    const path = (u.pathname || "/") + (u.search || "");
    const request =
      `GET ${path} HTTP/1.0\r\n` +
      `Host: ${u.host}\r\n` +
      `User-Agent: Simdi/0.1\r\n` +
      `Icy-MetaData: 1\r\n` +
      `Accept: */*\r\n` +
      `Connection: close\r\n\r\n`;

    const onConnect = () => socket!.write(request);

    if (isTls) {
      socket = tls.connect(
        { host: u.hostname, port, servername: u.hostname, rejectUnauthorized: false },
        onConnect,
      );
    } else {
      socket = net.connect({ host: u.hostname, port }, onConnect);
    }

    socket.setTimeout(timeout, () => finish({ status: "dead", reason: "zaman-asimi" }));
    socket.on("error", (err: NodeJS.ErrnoException) =>
      finish({ status: "dead", reason: err?.code || err?.message || "hata" }),
    );
    socket.on("close", () => finish({ status: "dead", reason: "kapandi" }));

    let buf: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let headersParsed = false;
    let metaint = 0;
    let audioLeft = 0;
    let lenByteRead = false;
    let metaLeft = 0;
    const metaChunks: Buffer<ArrayBufferLike>[] = [];

    socket.on("data", (chunk: Buffer) => {
      buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;

      if (!headersParsed) {
        const idx = buf.indexOf("\r\n\r\n");
        if (idx === -1) {
          if (buf.length > 65536) finish({ status: "dead", reason: "basliksiz" });
          return;
        }
        const lines = buf.subarray(0, idx).toString("latin1").split("\r\n");
        const headers: Record<string, string> = {};
        for (let i = 1; i < lines.length; i++) {
          const c = lines[i].indexOf(":");
          if (c === -1) continue;
          headers[lines[i].slice(0, c).trim().toLowerCase()] = lines[i].slice(c + 1).trim();
        }
        headersParsed = true;

        const codeMatch = (lines[0] || "").match(/\b(\d{3})\b/);
        const code = codeMatch ? Number(codeMatch[1]) : 0;
        if ([301, 302, 303, 307, 308].includes(code) && headers["location"] && redirects > 0) {
          return followRedirect(headers["location"]);
        }
        if (code && (code < 200 || code >= 300)) {
          return finish({ status: "dead", reason: `http-${code}` });
        }

        const metaHeader = headers["icy-metaint"];
        if (!metaHeader) return finish({ status: "none", reason: "metaint-yok" });
        metaint = parseInt(metaHeader, 10);
        if (!Number.isFinite(metaint) || metaint <= 0) {
          return finish({ status: "none", reason: "gecersiz-metaint" });
        }
        audioLeft = metaint;
        buf = buf.subarray(idx + 4);
      }

      while (buf.length) {
        if (audioLeft > 0) {
          const skip = Math.min(audioLeft, buf.length);
          audioLeft -= skip;
          buf = buf.subarray(skip);
          if (audioLeft > 0) return;
        }
        if (!lenByteRead) {
          if (buf.length < 1) return;
          metaLeft = buf[0] * 16;
          buf = buf.subarray(1);
          lenByteRead = true;
          if (metaLeft === 0) {
            lenByteRead = false;
            audioLeft = metaint;
            continue;
          }
        }
        if (buf.length < metaLeft) {
          metaChunks.push(buf);
          metaLeft -= buf.length;
          buf = Buffer.alloc(0);
          return;
        }
        metaChunks.push(buf.subarray(0, metaLeft));
        return finish({ status: "ok", title: parseStreamTitle(Buffer.concat(metaChunks)) });
      }
    });
  });
}
