"""Normalise recurring UI strings across the translated fragments.

79 pages were translated in parallel, so the boilerplate that repeats on every
card / deck / guide page drifted: "The Rider Meaning" came back as 「骑士的牌义」,
「骑士牌义」 and 「骑士的含义」 on different pages. Rather than hand-patching, this
derives each fixed heading deterministically from the English original plus the
canonical card name in js/deck.js, so a re-run always converges.

Content prose is never touched — only headings and labels with a fixed form.

    python tools/normalize.py [--dry-run]
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EN, ZH = os.path.join(HERE, "en-bodies"), os.path.join(HERE, "zh-bodies")
DRY = "--dry-run" in sys.argv

# ---- canonical card names, straight from the deck the site actually ships ----
deck_js = open(os.path.join(ROOT, "js", "deck.js"), encoding="utf-8").read()
CARD_ZH = dict(re.findall(r'slug:\s*"(\w+)".*?name:\s*"([^"]+)"', deck_js))
assert len(CARD_ZH) == 36, "expected 36 cards in deck.js, got %d" % len(CARD_ZH)

# ---- fixed headings on card pages: English form -> Chinese form ----
CARD_H2 = [
    (re.compile(r"^The (.+) Meaning$"),           "{zh}的牌义"),
    (re.compile(r"^The (.+) in Love$"),           "{zh}与感情"),
    (re.compile(r"^The (.+) in Career$"),         "{zh}与事业"),
    (re.compile(r"^The (.+) as Advice$"),         "{zh}的建议"),
    (re.compile(r"^The (.+) in Combinations$"),   "{zh}的组合牌义"),
    (re.compile(r"^Symbolism$"),                  "图像象征"),
    (re.compile(r"^Card Details$"),               "牌面信息"),
]

# ---- deck "Details" labels: English label -> canonical Chinese ----
DECK_LABELS = {
    "Artist": "绘者", "Author": "作者", "Cards": "牌数",
    "Creator": "创作者", "Creators": "创作者", "First Published": "首次出版",
    "Origin": "源起", "Publisher": "出版社", "Style": "风格",
    "Tradition": "传统",
}

# ---- call-to-action buttons that repeat verbatim across guides ----
CTA = {
    "Try a 3-Card Reading": "试试三张牌解读",
    "Browse All 36 Cards": "浏览全部 36 张牌",
    "Browse the 36 Cards": "浏览 36 张牌",
}

changes, unmatched = [], []


def paired(section):
    """Yield (slug, english html, chinese path, chinese html) for a section."""
    base = os.path.join(EN, section)
    if not os.path.isdir(base):
        return
    for slug in sorted(os.listdir(base)):
        fe = os.path.join(base, slug, "body.html")
        fz = os.path.join(ZH, section, slug, "body.html")
        if os.path.isfile(fe) and os.path.isfile(fz):
            yield slug, open(fe, encoding="utf-8").read(), fz, open(fz, encoding="utf-8").read()


def rewrite_nth(html, pattern, index, new):
    """Replace the index-th match's captured group 1 with `new`."""
    hits = list(re.finditer(pattern, html))
    if index >= len(hits):
        return html, False
    m = hits[index]
    if m.group(1).strip() == new:
        return html, False
    return html[:m.start(1)] + new + html[m.end(1):], True


def main():
    # ---------- card pages: h2 headings + the "Card N ·" eyebrow ----------
    for slug, en, fz, zh in paired("cards"):
        if slug not in CARD_ZH:
            continue
        name = CARD_ZH[slug]
        en_h2 = re.findall(r"<h2>([^<]+)</h2>", en)
        for i, raw in enumerate(en_h2):
            for rx, tmpl in CARD_H2:
                if rx.match(raw.strip()):
                    want = tmpl.format(zh=name)
                    zh, hit = rewrite_nth(zh, r"<h2>([^<]+)</h2>", i, want)
                    if hit:
                        changes.append((slug, "h2", raw.strip(), want))
                    break
            else:
                unmatched.append((slug, "h2", raw.strip()))

        # measure word for the card number: 「第 N 号」 -> 「第 N 张」
        new = re.sub(r'(hero-eyebrow">\s*第\s*\d+\s*)号', r"\1张", zh)
        if new != zh:
            changes.append((slug, "eyebrow", "第 N 号", "第 N 张"))
            zh = new

        if not DRY:
            open(fz, "w", encoding="utf-8", newline="\n").write(zh)

    # ---------- deck pages: detail labels ----------
    for slug, en, fz, zh in paired("decks"):
        en_lab = re.findall(r'card-detail-label">([^<]+)<', en)
        for i, raw in enumerate(en_lab):
            want = DECK_LABELS.get(raw.strip())
            if not want:
                unmatched.append((slug, "label", raw.strip()))
                continue
            zh, hit = rewrite_nth(zh, r'card-detail-label">([^<]+)<', i, want)
            if hit:
                changes.append((slug, "label", raw.strip(), want))
        if not DRY:
            open(fz, "w", encoding="utf-8", newline="\n").write(zh)

    # ---------- guides + everything else: repeated CTA buttons ----------
    for section in ("guides", "cards", "decks", "spreads"):
        for slug, en, fz, zh in paired(section):
            en_btn = re.findall(r'class="btn[^"]*"[^>]*>([^<]+)<', en)
            for i, raw in enumerate(en_btn):
                want = CTA.get(raw.strip())
                if not want:
                    continue
                zh, hit = rewrite_nth(zh, r'class="btn[^"]*"[^>]*>([^<]+)<', i, want)
                if hit:
                    changes.append((slug, "cta", raw.strip(), want))
            if not DRY:
                open(fz, "w", encoding="utf-8", newline="\n").write(zh)

    # ---------- report ----------
    print("%s%d normalisations" % ("[dry-run] " if DRY else "", len(changes)))
    by_kind = {}
    for _, kind, _, _ in changes:
        by_kind[kind] = by_kind.get(kind, 0) + 1
    print("by kind:", by_kind)
    for slug, kind, was, now in changes[:40]:
        print("  %-18s %-8s %s -> %s" % (slug, kind, was, now))
    if len(changes) > 40:
        print("  ... and %d more" % (len(changes) - 40))

    if unmatched:
        uniq = sorted({(k, v) for _, k, v in unmatched})
        print("\nunrecognised fixed strings (left untouched, review if unexpected):")
        for kind, val in uniq[:20]:
            print("  %-8s %s" % (kind, val))


if __name__ == "__main__":
    main()
