// Modern çizgi ikon seti — oynatıcı ve çipler için (emoji dönemi bitti).
// 24 birimlik tuvalde, currentColor konturlu; boyut px olarak dışarıdan.

const YOLLAR: Record<string, React.ReactNode> = {
  kalp: (
    <path d="M12 20s-7-4.6-9.2-9A5.2 5.2 0 0 1 12 6.4 5.2 5.2 0 0 1 21.2 11C19 15.4 12 20 12 20Z" />
  ),
  yakala: (
    <>
      <path d="M6 3.5h12v17l-6-4-6 4v-17Z" />
      <path d="M9.5 9h5M12 6.5v5" />
    </>
  ),
  not: (
    <>
      <path d="M4 20l1.2-4.2L16.4 4.6a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8.2 18.8 4 20Z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  kart: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M13 9.5h4.5M13 12.5h4.5M6.5 15.5h11" />
    </>
  ),
  odak: (
    <path d="M17.5 14.8A7.2 7.2 0 0 1 9.2 6.5a7.2 7.2 0 1 0 8.3 8.3Z" />
  ),
  esitle: (
    <>
      <path d="M5 10v4M9 6.5v11M13 9v6M17 5v14M21 11v2" />
    </>
  ),
  ses: (
    <>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z" />
      <path d="M15.5 9a4.4 4.4 0 0 1 0 6M18 6.8a8 8 0 0 1 0 10.4" />
    </>
  ),
  sessiz: (
    <>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  kulaklik: (
    <>
      <path d="M4.5 17v-4.5a7.5 7.5 0 0 1 15 0V17" />
      <rect x="3.5" y="13.8" width="3.6" height="6" rx="1.6" />
      <rect x="16.9" y="13.8" width="3.6" height="6" rx="1.6" />
    </>
  ),
};

export default function Ikon({ ad, boy = 15 }: { ad: keyof typeof YOLLAR | string; boy?: number }) {
  return (
    <svg
      width={boy}
      height={boy}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {YOLLAR[ad]}
    </svg>
  );
}
