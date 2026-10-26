# -*- coding: utf-8 -*-
"""nowby. dünya listesi Instagram gönderisi (4 kare, 1080x1350) + story (1080x1920).

Veri her çalıştırmada canlı uçtan çekilir (nowby.co/api/liste?a=hafta&ulke=…); sayılar uydurulmaz.
Paylaşmadan hemen önce yeniden çalıştır:  python3 kampanya/instagram/dunya-liste/uret.py
Çıktı: ~/Desktop/3-Basin-Tanitim/nowby-dunya-listesi/ (post/ ve story/)
"""
import html, json, os, subprocess, urllib.request, datetime

BURASI = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.expanduser("~/Desktop/3-Basin-Tanitim/nowby-dunya-listesi")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ULKELER = [("tr", "Türkiye"), ("us", "ABD"), ("gb", "Birleşik Krallık"), ("de", "Almanya"), ("fr", "Fransa"),
           ("it", "İtalya"), ("es", "İspanya"), ("jp", "Japonya"), ("br", "Brezilya")]


def liste(ulke):
    with urllib.request.urlopen(f"https://nowby.co/api/liste?a=hafta&ulke={ulke}", timeout=30) as r:
        d = json.load(r)
    if "satirlar" not in d:
        raise SystemExit(f"{ulke}: {d}")
    return d["satirlar"]


def bayrak(k):
    return "".join(chr(0x1F1E6 + ord(c) - 97) for c in k)


def e(s):
    return html.escape(str(s))


STIL = """<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Inter:wght@500;600;700&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:__H__px;background:#0b0605;color:#f8f3ef;font-family:Inter,sans-serif;overflow:hidden;position:relative}
.isik{position:absolute;inset:0;background:radial-gradient(circle at 80% 0%,rgba(255,106,61,.30),rgba(11,6,5,0) 55%)}
.ust{position:absolute;top:__UST__px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:baseline}
.marka{font-family:"Playfair Display",serif;font-weight:600;font-size:46px}.marka b{color:#ff6a3d}
.etiket{font-weight:700;font-size:21px;letter-spacing:.22em;color:#ff6a3d}
.ic{position:absolute;left:80px;right:80px;top:__IC__px}
.buyuk{font-family:"Playfair Display",serif;font-weight:600;font-size:104px;line-height:1.02}
.alt-baslik{font-family:"Playfair Display",serif;font-style:italic;font-size:40px;line-height:1.35;color:rgba(248,243,239,.75);margin-top:36px}
.sira{display:flex;align-items:baseline;gap:26px;padding:12px 0;border-bottom:1px solid rgba(248,243,239,.10)}
.no{font-family:"Playfair Display",serif;font-weight:600;font-size:38px;width:54px;color:rgba(248,243,239,.45)}
.no.ilk{color:#ff6a3d}
.sarki{flex:1;min-width:0}.sarki .t{font-weight:600;font-size:30px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sarki .a{font-size:24px;color:rgba(248,243,239,.6);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sayi{text-align:right;font-size:22px;color:rgba(248,243,239,.55);white-space:nowrap}.sayi b{display:block;font-size:30px;color:#f8f3ef}
.izgara{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:40px}
.ulke{background:rgba(248,243,239,.06);border:1px solid rgba(248,243,239,.10);border-radius:26px;padding:24px 22px;height:250px;display:flex;flex-direction:column}
.ulke .b{font-size:42px}.ulke .ad{font-weight:700;font-size:18px;letter-spacing:.14em;text-transform:uppercase;color:#ff6a3d;margin-top:10px}
.ulke .t{font-family:"Playfair Display",serif;font-weight:600;font-size:27px;line-height:1.15;margin-top:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ulke .a{font-size:19px;color:rgba(248,243,239,.6);margin-top:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dip{position:absolute;left:80px;right:80px;bottom:__DIP__px;display:flex;justify-content:space-between;font-weight:500;font-size:24px;color:rgba(248,243,239,.55)}
</style>"""


def sayfa(govde, h, ust, ic, dip):
    s = STIL.replace("__H__", str(h)).replace("__UST__", str(ust)).replace("__IC__", str(ic)).replace("__DIP__", str(dip))
    return f'<!doctype html><html><head><meta charset="utf-8">{s}</head><body><div class="isik"></div>{govde}</body></html>'


def uret(h):
    story = h == 1920
    ust, dip = (150, 200) if story else (70, 70)
    tarih = datetime.date.today().strftime("%d.%m.%Y")
    marka = f'<div class="ust"><div class="marka">nowby<b>.</b></div><div class="etiket">BU HAFTA</div></div>'
    alt = f'<div class="dip"><span>nowby.co/liste</span><span>{tarih}</span></div>'
    dunya, ulkeler = VERI
    toplam_istasyon, toplam_ulke = SAYILAR

    kapak = sayfa(marka + f'''<div class="ic"><div class="buyuk">Dünyanın<br>radyolarında<br>bu hafta</div>
<div class="alt-baslik">{toplam_ulke} ülkeden {toplam_istasyon} radyonun gerçek sayımı. Beğeniyle değil, çalmayla.</div></div>''' + alt,
                  h, ust, 760 if story else 400, dip)

    satirlar = "".join(f'''<div class="sira"><div class="no{' ilk' if i == 1 else ''}">{i}</div>
<div class="sarki"><div class="t">{e(r['title'])}</div><div class="a">{e(r['artist'])}</div></div>
<div class="sayi"><b>{r['kez']}</b>{r['istasyon']} radyo</div></div>''' for i, r in enumerate(dunya[:10], 1))
    ilk10 = sayfa(marka + f'<div class="ic"><div class="etiket" style="color:rgba(248,243,239,.55)">DÜNYA · İLK 10</div>{satirlar}</div>' + alt,
                  h, ust, 420 if story else 150, dip)

    kutular = "".join(f'''<div class="ulke"><div class="b">{bayrak(k)}</div><div class="ad">{e(ad)}</div>
<div class="t">{e(r['title'])}</div><div class="a">{e(r['artist'])}</div></div>''' for (k, ad), r in ulkeler)
    birinciler = sayfa(marka + f'<div class="ic"><div class="buyuk" style="font-size:76px">Her ülkenin<br>bir numarası</div><div class="izgara">{kutular}</div></div>' + alt,
                       h, ust, 360 if story else 170, dip)

    davet = sayfa(marka + f'''<div class="ic"><div class="buyuk">Senin ülkende<br>ne çalıyor?</div>
<div class="alt-baslik">Bayrağını seç, radyoların bu hafta gerçekten neyi çaldığını gör.</div>
<div style="font-weight:700;font-size:44px;color:#ff6a3d;margin-top:60px">nowby.co/liste</div></div>''' + alt,
                  h, ust, 760 if story else 420, dip)
    return [("1-kapak", kapak), ("2-dunya-ilk-10", ilk10), ("3-ulke-birincileri", birinciler), ("4-davet", davet)]


def ciz(ad, icerik, klasor, h):
    os.makedirs(klasor, exist_ok=True)
    yol = os.path.join(BURASI, f"_{ad}-{h}.html")
    open(yol, "w", encoding="utf-8").write(icerik)
    png = os.path.join(klasor, ad + ".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=6000",
                    f"--window-size=1080,{h}", f"--screenshot={png}", "file://" + yol], capture_output=True)
    os.remove(yol)
    return png


if __name__ == "__main__":
    dunya = liste("hepsi")
    ulkeler = [((k, ad), liste(k)[0]) for k, ad in ULKELER]
    VERI = (dunya, ulkeler)
    with urllib.request.urlopen("https://nowby.co/api/now", timeout=30) as r:
        ist = json.load(r)["stations"]
    SAYILAR = (len(ist), len({s.get("country") for s in ist if s.get("country") not in (None, "www")}))
    for h, alt in ((1350, "post"), (1920, "story")):
        for ad, icerik in uret(h):
            print(ciz(ad, icerik, os.path.join(CIKTI, alt), h))
