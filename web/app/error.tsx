"use client";

import { useEffect } from "react";

// Beklenmedik bir hata olduğunda — şairce, suçlamayan bir sayfa.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // sessizce geç; istersen buraya bir günlükleme bağlayabilirsin.
  }, []);

  return (
    <div className="spread min-h-screen" style={{ ["--accent" as string]: "#9c5f7c" }}>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center px-5">
        <span className="brand text-5xl font-bold tracking-tight">ŞİMDİ</span>
        <h1 className="read mt-6 text-3xl italic" style={{ color: "var(--fg)" }}>
          ses bir an için kesildi
        </h1>
        <p className="read mt-2 text-lg italic" style={{ color: "var(--muted)" }}>
          bir yerde bir tel koptu. tekrar dene — müzik hâlâ bir yerde çalıyor.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={reset}
            className="press inline-flex rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            tekrar dene
          </button>
          <a
            href="/"
            className="press inline-flex rounded-full border px-6 py-3 text-sm"
            style={{ borderColor: "var(--line)", color: "var(--fg)" }}
          >
            başa dön
          </a>
        </div>
      </div>
    </div>
  );
}
