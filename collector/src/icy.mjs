// ICY (Shoutcast/Icecast) metadata okuyucu — ürün sürümü.
//
// Ham soket kullanırız çünkü birçok Shoutcast sunucusu "HTTP/1.0 200 OK"
// yerine "ICY 200 OK" yazar; Node'un HTTP ayrıştırıcısı bunu reddeder.
// İlk başlık bloğunu alır almaz bağlantıyı kapatırız — bant genişliği yakmayız.

import net from "node:net";
import tls from "node:tls";

// Metadata bloğundan StreamTitle içeriğini ayıklar. Önce UTF-8, bozuksa latin1.
export function parseStreamTitle(metaBuf) {
  let text = metaBuf.toString("utf8");
  if (text.includes("�")) text = metaBuf.toString("latin1");
  text = text.replace(/\0+/g, "");
  const m = /StreamTitle='([\s\S]*?)';/.exec(text);
  return m ? m[1].trim() : "";
}

// Tek akışı yoklar. Döner: { status: 'ok'|'none'|'dead', title?, reason? }
export function probeIcy(streamUrl, { timeout = 8000 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let socket;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      try {
        if (socket) socket.destroy();
      } catch {
        // kapanıyoruz zaten
      }
      resolve(result);
    };

    let u;
    try {
      u = new URL(streamUrl);
    } catch {
      return finish({ status: "dead", reason: "gecersiz-url" });
    }

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

    const onConnect = () => socket.write(request);

    if (isTls) {
      socket = tls.connect(
        { host: u.hostname, port, servername: u.hostname, rejectUnauthorized: false },
        onConnect,
      );
    } else {
      socket = net.connect({ host: u.hostname, port }, onConnect);
    }

    socket.setTimeout(timeout, () => finish({ status: "dead", reason: "zaman-asimi" }));
    socket.on("error", (err) =>
      finish({ status: "dead", reason: err?.code || err?.message || "hata" }),
    );
    socket.on("close", () => finish({ status: "dead", reason: "kapandi" }));

    let buf = Buffer.alloc(0);
    let headersParsed = false;
    let metaint = 0;
    let audioLeft = 0;
    let lenByteRead = false;
    let metaLeft = 0;
    const metaChunks = [];

    socket.on("data", (chunk) => {
      buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;

      if (!headersParsed) {
        const idx = buf.indexOf("\r\n\r\n");
        if (idx === -1) {
          if (buf.length > 65536) finish({ status: "dead", reason: "basliksiz" });
          return;
        }
        const lines = buf.slice(0, idx).toString("latin1").split("\r\n");
        const headers = {};
        for (let i = 1; i < lines.length; i++) {
          const c = lines[i].indexOf(":");
          if (c === -1) continue;
          headers[lines[i].slice(0, c).trim().toLowerCase()] = lines[i].slice(c + 1).trim();
        }
        headersParsed = true;
        const metaHeader = headers["icy-metaint"];
        if (!metaHeader) return finish({ status: "none", reason: "metaint-yok" });
        metaint = parseInt(metaHeader, 10);
        if (!Number.isFinite(metaint) || metaint <= 0) {
          return finish({ status: "none", reason: "gecersiz-metaint" });
        }
        audioLeft = metaint;
        buf = buf.slice(idx + 4);
      }

      while (buf.length) {
        if (audioLeft > 0) {
          const skip = Math.min(audioLeft, buf.length);
          audioLeft -= skip;
          buf = buf.slice(skip);
          if (audioLeft > 0) return;
        }
        if (!lenByteRead) {
          if (buf.length < 1) return;
          metaLeft = buf[0] * 16;
          buf = buf.slice(1);
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
        metaChunks.push(buf.slice(0, metaLeft));
        return finish({ status: "ok", title: parseStreamTitle(Buffer.concat(metaChunks)) });
      }
    });
  });
}
