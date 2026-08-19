import Link from "next/link";
import { YOK } from "@/lib/sozler";

export default function NotFound() {
  return (
    <div className="spread min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center px-5">
        <span className="brand text-5xl font-bold tracking-tight">ŞİMDİ</span>
        <h1 className="read mt-6 text-3xl italic" style={{ color: "var(--fg)" }}>
          {YOK.baslik}
        </h1>
        <p className="read mt-2 text-lg italic" style={{ color: "var(--muted)" }}>
          {YOK.alt}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
          style={{ background: "var(--fg)", color: "var(--bg)" }}
        >
          ← şimdi
        </Link>
      </div>
    </div>
  );
}
