import Link from "next/link";

// Şairin mührü — sayfaların altına düşen imza. Her yerde aynı ses.
export default function Muhur({ dize }: { dize?: string }) {
  return (
    <div className="mt-16 border-t pt-6" style={{ borderColor: "var(--line)" }}>
      {dize && (
        <p className="read text-base italic" style={{ color: "var(--muted)" }}>
          ❧ {dize}
        </p>
      )}
      <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
        <span className="brand font-bold" style={{ color: "var(--fg)" }}>
          ŞİMDİ
        </span>{" "}
        — bir şairin frekansı ·{" "}
        <Link href="/hakkinda" className="underline">
          geliştiren
        </Link>{" "}
        Berkay Doğan
      </p>
    </div>
  );
}
