#!/usr/bin/env python3
"""Download public-domain illustrations from Nils Holgersson book editions (1906-1907)."""

import json
import os
import time
import urllib.request

OUTDIR = os.path.dirname(os.path.abspath(__file__))
API = "https://commons.wikimedia.org/w/api.php"

BAND1_FILES = [
    "Nils Holgersson band 1-Illustration 1.jpg",
    "Nils Holgersson band 1-Illustration 2.jpg",
    "Nils Holgersson band 1-Vittskövle.jpg",
    "Nils Holgersson band 1-Övedsklosters park.jpg",
    "Nils Holgersson band 1-Glimmingehus.jpg",
    "Nils Holgersson band 1-Klipp-port i Kullaberg.jpg",
    "Nils Holgersson band 1-På Kullabergs tak.jpg",
    "Nils Holgersson band 1-Vid Lyckeby å.jpg",
    "Nils Holgersson band 1-Djupafors.jpg",
    "Nils Holgersson band 1-Där land och hav mötas.jpg",
    "Nils Holgersson band 1-Karlskrona.jpg",
    "Nils Holgersson band 1-Väderkvarnar på Öland.jpg",
    "Nils Holgersson band 1-I fara för sälar.jpg",
    "Nils Holgersson band 1-Karlsö, strandparti.jpg",
    "Nils Holgersson band 1-Norra delen av Visby ringmur.jpg",
    "Nils Holgersson band 1-St Katarina ruin (Visby).jpg",
    "Nils Holgersson band 1-Småländsk ryggåsstuga.jpg",
    "Nils Holgersson band 1-Kråkor.jpg",
    "Nils Holgersson band 1-Gammal bondgård.jpg",
    "Nils Holgersson band 1-Jönköping.jpg",
    "Nils Holgersson band 1-Regnbågsfallet i Huskvarnaån.jpg",
    "Nils Holgersson band 1-Tåkern.jpg",
    "Nils Holgersson band 1-Stjärnorps ruin.jpg",
    "Nils Holgersson band 1-Ulvåsa.jpg",
]

BAND2_FILES = [
    "Nils Holgersson band 2-Kolmården norr om Bråviken.jpg",
    "Nils Holgersson band 2-Karr och Gråfäll i Fridskogen.jpg",
    "Nils Holgersson band 2-Eriksberg.jpg",
    "Nils Holgersson band 2-Gripsholm.jpg",
    "Nils Holgersson band 2-Karl IXs sängkammare å Gripsholm.jpg",
    "Nils Holgersson band 2-Örebro slott.jpg",
    "Nils Holgersson band 2-Bondgård från Närkeslätten.jpg",
    "Nils Holgersson band 2-Den gamla hästen.jpg",
    "Nils Holgersson band 2-Gruva med hisstorn.jpg",
    "Hyttnäs2.jpg",
    "Nils Holgersson band 2-Vattenfyllt gruvhål.jpg",
    "Nils Holgersson band 2-Falu gruva.jpg",
    "Nils Holgersson band 2-Leksands kyrka.jpg",
    "Nils Holgersson band 2-Svanor i Hjälstaviken.jpg",
    "Nils Holgersson band 2-Vårsåning på Upplandsslätten.jpg",
    "Nils Holgersson band 2-Uppsala domkyrka.jpg",
    "Nils Holgersson band 2-Uppsala högar.jpg",
    "Nils Holgersson band 2-Strandparti från Stockholmstrakten.jpg",
    "Nils Holgersson band 2-Stockholm från Mälarsidan.jpg",
    "Nils Holgersson band 2-De yttersta skären.jpg",
    "Nils Holgersson band 2-Örnen i fångenskap.jpg",
    "Nils Holgersson band 2-Älvkarlebyfallet.jpg",
    "Nils Holgersson band 2-Sandvikens järnverk.jpg",
    "Nils Holgersson band 2-Ankomsten till fäbodvallen.jpg",
    "Nils Holgersson band 2-Timmerkoja vintertid.jpg",
    "Nils Holgersson band 2-Sågverk på Alnön.jpg",
    "Nils Holgersson band 2-Ångermanälvens dalgång.jpg",
    "Nils Holgersson band 2-Kyrkoby på Västerbottens slättland.jpg",
    "Nils Holgersson band 2-Skogslandskap vid Lule älv.jpg",
    "Nils Holgersson band 2-Kebnekajse.jpg",
    "Nils Holgersson band 2-Gruvhål i Gellivare malmberg.jpg",
    "Nils Holgersson band 2-Lappkåta bland fjällbjörkar.jpg",
    "Nils Holgersson band 2-Renkorna mjölkas.jpg",
    "Nils Holgersson band 2-Torne träsk.jpg",
    "Nils Holgersson band 2-Storsjön och Oviksfjällen.jpg",
    "Nils Holgersson band 2-Ristaforsen.jpg",
    "Nils Holgersson band 2-Klarälven i norra Värmland.jpg",
    "Nils Holgersson band 2-Sonfjället och Ljusnan.jpg",
    "Nils Holgersson band 2-En liten herrgård.jpg",
    "Nils Holgersson band 2-Dalsland omkring Laxsjön.jpg",
    "Nils Holgersson band 2-Fjällbacka fiskeläge.jpg",
    "Nils Holgersson band 2-Båtar på sillfiske.jpg",
    "Nils Holgersson band 2-Jätten från Skalunda hög.jpg",
    "Nils Holgersson band 2-Göteborgs hamn.jpg",
    "Nils Holgersson band 2-En stor herrgård.jpg",
    "Nils Holgersson band 2-Karsefors i Lagan.jpg",
    "Nils Holgersson band 2-Dalälven Lennart Nyblom.jpg",
    "Nils Holgersson band 2-Stockholms slott Prins Eugen.jpg",
]

ALL_FILES = [("band1", f) for f in BAND1_FILES] + [("band2", f) for f in BAND2_FILES]


HEADERS = {"User-Agent": "NilsHolgersson-downloader/1.0 (educational; mailto:maryna.dukhnich@gmail.com)"}
THUMB_WIDTH = 1200


def api_get(params: dict) -> dict:
    for attempt in range(5):
        try:
            req = urllib.request.Request(
                f"{API}?{urllib.parse.urlencode(params)}",
                headers=HEADERS,
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 10 * (2 ** attempt)
                print(f"    rate-limited, waiting {wait}s…")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("exceeded retries")


def get_image_url(title: str) -> str | None:
    data = api_get({
        "action": "query",
        "titles": f"File:{title}",
        "prop": "imageinfo",
        "iiprop": "url|thumburl",
        "iiurlwidth": THUMB_WIDTH,
        "format": "json",
    })
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        info = page.get("imageinfo", [])
        if info:
            return info[0].get("thumburl") or info[0].get("url")
    return None


def download(url: str, dest: str) -> None:
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as f:
                f.write(resp.read())
            return
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 10 * (2 ** attempt)
                print(f"    rate-limited on download, waiting {wait}s…")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("exceeded retries")


import urllib.parse

ok = skipped = failed = 0

for band, filename in ALL_FILES:
    dest = os.path.join(OUTDIR, band, filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)

    if os.path.exists(dest):
        print(f"  skip  {filename}")
        skipped += 1
        continue

    try:
        url = get_image_url(filename)
        if not url:
            print(f"  miss  {filename}")
            failed += 1
            continue
        download(url, dest)
        print(f"  ok    {filename}")
        ok += 1
        time.sleep(2)
    except Exception as e:
        print(f"  fail  {filename}: {e}")
        failed += 1

print(f"\nDone: {ok} downloaded, {skipped} skipped, {failed} failed")
