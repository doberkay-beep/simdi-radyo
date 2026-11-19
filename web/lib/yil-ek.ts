/** Yıla yönelme eki: 2027'ye, 2028'e, 2030'a, 2000'e. Sayının okunuşundaki son sözcüğe göre. */
export function yilaEk(y: number): string {
  const birler = ["", "e", "ye", "e", "e", "e", "ya", "ye", "e", "a"]; // bir iki üç dört beş altı yedi sekiz dokuz
  const onlar = ["", "a", "ye", "a", "a", "ye", "a", "e", "e", "a"]; // on yirmi otuz kırk elli altmış yetmiş seksen doksan
  const b = y % 10, o = Math.floor(y / 10) % 10;
  const ek = b ? birler[b] : o ? onlar[o] : y % 1000 === 0 ? "e" : "e"; // yüz, bin → 'e
  return `${y}'${ek}`;
}
