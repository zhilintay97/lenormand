"""Mirror lenormand.io to a local directory as the English reference source."""
import os, re, sys, time, urllib.request, urllib.error

BASE = "https://lenormand.io"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "en-mirror")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")


def get(path, binary=False):
    url = BASE + path
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=45) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", "replace")


def save(relpath, data):
    dest = os.path.join(OUT, relpath.replace("/", os.sep))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    mode = "wb" if isinstance(data, bytes) else "w"
    kw = {} if isinstance(data, bytes) else {"encoding": "utf-8", "newline": "\n"}
    with open(dest, mode, **kw) as f:
        f.write(data)
    return dest


def main():
    os.makedirs(OUT, exist_ok=True)

    # 1. sitemap -> page list
    sitemap = get("/sitemap.xml")
    save("sitemap.xml", sitemap)
    pages = [u.replace(BASE + "/", "").replace(BASE, "")
             for u in re.findall(r"<loc>(.*?)</loc>", sitemap)]
    print("pages in sitemap:", len(pages))

    ok = fail = 0
    for p in pages:
        rel = (p if p else "") + "index.html"
        try:
            save(rel, get("/" + p))
            ok += 1
        except Exception as e:
            print("  FAIL page", p, e)
            fail += 1
        time.sleep(0.12)
    print("pages: ok=%d fail=%d" % (ok, fail))

    # 2. static assets
    assets = ["/css/style.css", "/js/deck.js", "/js/spreads.js",
              "/js/interpretations.js", "/js/app.js", "/robots.txt",
              "/sounds/card.mp3", "/images/icon.png", "/images/cards/back.png"]

    # 36 card images, slugs from deck.js
    deck = get("/js/deck.js")
    slugs = re.findall(r'slug:\s*"([^"]+)"', deck)
    print("card slugs found:", len(slugs))
    assets += ["/images/cards/%s.png" % s for s in slugs]

    # any other images referenced across the mirrored HTML
    extra = set()
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith(".html"):
                continue
            with open(os.path.join(root, fn), encoding="utf-8") as f:
                html = f.read()
            for m in re.findall(r'(?:src|href)="([^"]+\.(?:png|jpg|jpeg|svg|webp|ico|mp3))"', html):
                m = m.split("?")[0]
                if m.startswith("http"):
                    if m.startswith(BASE):
                        extra.add(m[len(BASE):])
                elif m.startswith("/"):
                    extra.add(m)
                else:
                    extra.add("/" + m.lstrip("./").replace("../", ""))
    for e in sorted(extra):
        if e not in assets:
            assets.append(e)

    aok = afail = 0
    for a in assets:
        try:
            save(a.lstrip("/"), get(a, binary=True))
            aok += 1
        except Exception as e:
            print("  FAIL asset", a, e)
            afail += 1
        time.sleep(0.08)
    print("assets: ok=%d fail=%d" % (aok, afail))
    print("OUT =", OUT)


if __name__ == "__main__":
    main()
