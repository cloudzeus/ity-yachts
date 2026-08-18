#!/usr/bin/env python3
"""
Pull the Panotour/krpano 360 tours off iyc.de before the site is deleted.

There is no directory listing, so nothing can be crawled: every URL has to be
derived from each tour's own krpano XML. The tiles are a cube pyramid —
{scene}/{face 0-5}/{level}/{row}_{col}.jpg — and the XML says how many levels
there are and how big each one is.

Python enumerates; curl fetches. Doing the fetching here too was the first
attempt and it managed 160 files in ten minutes: urllib opens a fresh TCP and
TLS handshake per tile, and there are sixty thousand tiles. curl --parallel
holds connections open and the same server answers in 0.3s.

Re-runnable: files already on disk are left out of the list, so an interrupted
run continues where it stopped.
"""
import json, os, re, subprocess, sys, urllib.request, urllib.error

BASE = "https://www.iyc.de/dl/360_degrees"
OUT = os.path.dirname(os.path.abspath(__file__))
TOURS = [
    "200620_roxana", "200703_maria", "200703_nirikos", "200703_penelope",
    "200703_sirios", "210709_kalypso", "210709_oneiro", "210724_aiolos",
    "210724_ionio", "210807_nikitas", "210925_maistros", "210926_athene",
    "220625_electra", "220625_lola", "240507_thalassa",
]
FACES = ["front", "right", "back", "left", "up", "down"]  # krpano order = 0..5


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=45) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def parse(tour):
    """Scenes, their folders, titles and tile pyramid, straight from the XML."""
    xml = get(f"{BASE}/{tour}data/{tour}.xml").decode("utf-8-sig")
    raw = get(f"{BASE}/{tour}data/{tour}_messages_en.xml")
    msg = raw.decode("utf-8-sig") if raw else ""
    titles = dict(re.findall(r'<data name="en_(pano\d+)_title"><!\[CDATA\[(.*?)\]\]>', msg, re.S))
    titles = {k: v.strip() for k, v in titles.items()}
    pm = re.search(r'<data name="en_project_title"><!\[CDATA\[(.*?)\]\]>', msg, re.S)

    scenes = []
    for block in re.split(r"(?=<scene )", xml):
        if not block.startswith("<scene "):
            continue
        name = re.search(r'name="(pano\d+)"', block)
        # The multires image only; the androidstock fallback carries no levels.
        multi = re.search(r'<image type="CUBE" multires="true"[^>]*tilesize="(\d+)"(.*?)</image>', block, re.S)
        if not (name and multi):
            continue
        tilesize, body = int(multi.group(1)), multi.group(2)
        folder, levels = None, []
        for lv in re.finditer(r'<level tiledimagewidth="(\d+)"[^>]*>(.*?)</level>', body, re.S):
            u = re.search(r'<front url="([^"]+)"', lv.group(2))
            if not u:
                continue
            # {folder}/{face}/{level}/{v}_{u}.jpg — the level is the third
            # segment. Reading the second gave the cube face instead, so every
            # level resolved to "0" and only the 2x2 base of each scene came
            # down: 32 files where there are 414.
            parts = u.group(1).split("/")
            folder, width = parts[0], int(lv.group(1))
            levels.append({"level": parts[2], "size": width,
                           "grid": -(-width // tilesize)})
        if folder:
            scenes.append({"id": name.group(1), "folder": folder,
                           "title": titles.get(name.group(1), folder),
                           "tilesize": tilesize,
                           "levels": sorted(levels, key=lambda x: x["size"])})
    return {"tour": tour, "project": pm.group(1).strip() if pm else "",
            "faceOrder": FACES, "scenes": scenes}


def files_for(tour, meta):
    for sc in meta["scenes"]:
        d = sc["folder"]
        yield f"{d}/preview.jpg"
        yield f"{d}/thumbnail.jpg"
        # 1024px whole faces — the cheap base layer shown under the tiles.
        for f in range(6):
            yield f"{d}/mobile/{f}.jpg"
        for lv in sc["levels"]:
            for f in range(6):
                for v in range(lv["grid"]):
                    for u in range(lv["grid"]):
                        yield f"{d}/{f}/{lv['level']}/{v}_{u}.jpg"


def main():
    only = sys.argv[1:] or TOURS
    index = []
    for tour in only:
        meta = parse(tour)
        os.makedirs(f"{OUT}/{tour}", exist_ok=True)

        # retile-tour360.mjs records the re-cut grid on each scene in this same
        # file. Rewriting the manifest from the XML wiped it, and the importer
        # then found every scene incomplete — so carry it across.
        prev = f"{OUT}/{tour}/tour.json"
        if os.path.exists(prev):
            try:
                old_scenes = {s["folder"]: s for s in json.load(open(prev)).get("scenes", [])}
                for sc in meta["scenes"]:
                    keep = old_scenes.get(sc["folder"], {}).get("psv")
                    if keep:
                        sc["psv"] = keep
            except Exception:
                pass

        with open(prev, "w") as f:
            json.dump(meta, f, indent=1)

        wanted = list(files_for(tour, meta))
        todo = [p for p in wanted
                if not (os.path.exists(f"{OUT}/{tour}/{p}") and os.path.getsize(f"{OUT}/{tour}/{p}") > 512)]
        print(f"{tour}: {len(meta['scenes'])} scenes, {len(wanted)} files, {len(todo)} to fetch", flush=True)

        if todo:
            """
            Batches of a hundred, eight at a time.

            curl's own --parallel was the obvious answer and it does not work
            against this host: over HTTP/2 it fails with "error in the HTTP2
            framing layer", and pinned to HTTP/1.1 with 24 streams it simply
            stopped — zero files a minute while a single request still answered
            in 0.3s. One curl per batch keeps the connection open across the
            hundred files in it, and xargs supplies the concurrency instead.
            """
            os.makedirs(f"{OUT}/.batches", exist_ok=True)
            for old_batch in os.listdir(f"{OUT}/.batches"):
                os.remove(f"{OUT}/.batches/{old_batch}")
            SIZE = 100
            batches = []
            for i in range(0, len(todo), SIZE):
                b = f"{OUT}/.batches/{tour}-{i // SIZE}.curl"
                with open(b, "w") as f:
                    for p in todo[i:i + SIZE]:
                        d = os.path.dirname(f"{OUT}/{tour}/{p}")
                        os.makedirs(d, exist_ok=True)
                        f.write(f'url = "{BASE}/{tour}data/{p}"\noutput = "{OUT}/{tour}/{p}"\n')
                batches.append(b)
            subprocess.run(
                ["xargs", "-P", "8", "-I", "{}", "curl", "--config", "{}",
                 "--retry", "3", "--retry-delay", "1", "--fail", "--silent",
                 "--show-error", "--remove-on-error", "--max-time", "60"],
                input="\n".join(batches), text=True, check=False,
            )

        have = sum(1 for p in wanted
                   if os.path.exists(f"{OUT}/{tour}/{p}") and os.path.getsize(f"{OUT}/{tour}/{p}") > 512)
        print(f"{tour}: {have}/{len(wanted)} on disk", flush=True)
        index.append({"tour": tour, "project": meta["project"],
                      "scenes": [{"folder": s["folder"], "title": s["title"]} for s in meta["scenes"]]})

    with open(f"{OUT}/index.json", "w") as f:
        json.dump(index, f, indent=1)
    print("DONE", flush=True)


main()
