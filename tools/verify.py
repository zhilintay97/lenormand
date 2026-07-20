"""Verify the Chinese site against the English reference.

Checks, in order of how badly they bite:
  1. coverage      — every page has a translated body + meta
  2. structure     — identical tag sequence vs the English fragment
  3. attributes    — identical href/src sets (slugs and asset paths untouched)
  4. combos        — card pages still list all 35 combinations
  5. untranslated  — leftover English prose in visible text
  6. links         — every internal href resolves to a file that exists
  7. assets        — every src resolves to a file that exists

    python tools/verify.py
"""
import json, os, re, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EN, ZH = os.path.join(HERE, "en-bodies"), os.path.join(HERE, "zh-bodies")

# Proper nouns and technical tokens that are *meant* to stay in Latin script.
ALLOW = {
    "lenormand", "tarot", "cloudflare", "google", "analytics", "cookie",
    "cookies", "html", "css", "javascript", "url", "seo", "faq", "png", "jpg",
    "com", "io", "www", "http", "https", "email", "gmail", "the", "of", "and",
    # Shuffling techniques have no settled Chinese name, so the guide gives the
    # Chinese term with the English in parentheses.
    "overhand", "riffle", "bridge", "mash", "smoosh", "shuffle",
    # Likewise for card-game and historical terms cited alongside the Chinese.
    "piquet", "das", "spiel", "der", "hoffnung",
}

# Places where the Chinese site deliberately differs from the English source,
# so the attribute-parity check does not flag them forever.
#   {page path: {english value: chinese value}}
INTENTIONAL_DIVERGENCES = {
    # The English source links "Next card → The Ship" back to the card index
    # instead of to /cards/ship/. Fixed here rather than inherited.
    "cards/clover/": {"../": "../ship/"},
}

problems = []


def fail(page, kind, msg):
    problems.append((page, kind, msg))


class Tags(HTMLParser):
    """Collect tag sequence, href/src attributes and visible text."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags, self.hrefs, self.srcs, self.text = [], [], [], []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        d = dict(attrs)
        if d.get("href"):
            self.hrefs.append(d["href"])
        if d.get("src"):
            self.srcs.append(d["src"])
        if tag in ("script", "style"):
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.text.append(data)


def parse(html):
    p = Tags()
    p.feed(html)
    return p


def load(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def main():
    pages = json.load(open(os.path.join(HERE, "pages.json"), encoding="utf-8"))

    for page in pages:
        path = page["path"]
        name = path or "(home)"
        sub = path or "home/"
        en_f, zh_f = os.path.join(EN, sub, "body.html"), os.path.join(ZH, sub, "body.html")
        meta_f = os.path.join(ZH, sub, "meta.json")

        # 1. coverage
        if not os.path.isfile(zh_f):
            fail(name, "coverage", "missing body.html")
            continue
        if not os.path.isfile(meta_f):
            fail(name, "coverage", "missing meta.json")
            continue

        try:
            meta = json.load(open(meta_f, encoding="utf-8"))
        except Exception as e:
            fail(name, "coverage", "meta.json unreadable: %s" % e)
            continue
        for key in ("title", "description"):
            if not meta.get(key, "").strip():
                fail(name, "coverage", "meta.%s is empty" % key)
        if meta.get("title") and not meta["title"].rstrip().endswith("雷诺曼"):
            fail(name, "coverage", "title does not end with the site suffix: %r" % meta["title"])

        en, zh = parse(load(en_f)), parse(load(zh_f))

        # 2. structure
        if en.tags != zh.tags:
            extra = len(zh.tags) - len(en.tags)
            first = next((i for i, (a, b) in enumerate(zip(en.tags, zh.tags)) if a != b), min(len(en.tags), len(zh.tags)))
            fail(name, "structure",
                 "tag sequence differs (en=%d zh=%d, delta=%+d, first mismatch at #%d: en=%r zh=%r)"
                 % (len(en.tags), len(zh.tags), extra, first,
                    en.tags[first] if first < len(en.tags) else None,
                    zh.tags[first] if first < len(zh.tags) else None))

        # 3. attributes — links and assets must be byte-identical, except for
        #    the handful of deliberate fixes listed above.
        fixes = INTENTIONAL_DIVERGENCES.get(path, {})
        if fixes:
            patched, used = [], dict(fixes)
            for h in en.hrefs:
                patched.append(used.pop(h) if h in used else h)
            if used:
                fail(name, "attrs", "stale divergence entry, en href not present: %r" % list(used))
            en.hrefs = patched
        if en.hrefs != zh.hrefs:
            only_en = [h for h in en.hrefs if h not in zh.hrefs]
            only_zh = [h for h in zh.hrefs if h not in en.hrefs]
            fail(name, "attrs", "href mismatch; missing=%r added=%r" % (only_en[:5], only_zh[:5]))
        if en.srcs != zh.srcs:
            fail(name, "attrs", "src mismatch; en=%r zh=%r" % (en.srcs[:5], zh.srcs[:5]))

        # 4. combination lists on card pages
        if path.startswith("cards/") and path != "cards/":
            en_n = load(en_f).count("<li><strong>")
            zh_n = load(zh_f).count("<li><strong>")
            if en_n != zh_n:
                fail(name, "combos", "combination items: en=%d zh=%d" % (en_n, zh_n))

        # 5. leftover English prose in visible text.
        #    Deck names, author names and Roman numerals are *meant* to stay in
        #    Latin script, and they are capitalised; untranslated prose is
        #    mostly lowercase function words. So only lowercase words count.
        text = " ".join(zh.text)
        words = re.findall(r"\b[a-z][a-z'’-]{2,}\b", text)
        leftover = [w for w in words if w not in ALLOW]
        if len(leftover) > 6:
            uniq = sorted(set(leftover))
            fail(name, "untranslated",
                 "%d lowercase Latin words in visible text: %s"
                 % (len(leftover), ", ".join(uniq[:15])))

    # 6/7. link + asset integrity across the *built* site
    for page in pages:
        built = os.path.join(ROOT, page["path"].replace("/", os.sep), "index.html")
        if not os.path.isfile(built):
            continue
        p = parse(load(built))
        base = os.path.dirname(built)
        for href in p.hrefs:
            if href.startswith(("http", "mailto:", "#", "/")):
                continue
            target = os.path.normpath(os.path.join(base, href.replace("/", os.sep)))
            if os.path.isdir(target):
                target = os.path.join(target, "index.html")
            if not os.path.exists(target):
                fail(page["path"] or "(home)", "links", "dead link %r" % href)
        for src in p.srcs:
            if src.startswith(("http", "data:", "/")):
                continue
            target = os.path.normpath(os.path.join(base, src.replace("/", os.sep)))
            if not os.path.exists(target):
                fail(page["path"] or "(home)", "assets", "missing asset %r" % src)

    # 8. cross-page consistency of recurring UI strings. These short labels
    #    repeat across dozens of pages and are the easiest thing to translate
    #    three different ways, so report every distinct variant for review.
    variants = {}
    for page in pages:
        built = os.path.join(ROOT, page["path"].replace("/", os.sep), "index.html")
        if not os.path.isfile(built):
            continue
        html = load(built)
        for cls in ("card-nav-direction", "card-detail-label", "hero-eyebrow",
                    "section-eyebrow", "footer-col-title", "btn"):
            for m in re.finditer(r'class="[^"]*\b%s\b[^"]*"[^>]*>([^<]{1,40})<' % cls, html):
                variants.setdefault(cls, {}).setdefault(m.group(1).strip(), set()).add(page["path"] or "(home)")

    print("--- recurring UI strings (review for consistency) ---")
    for cls in sorted(variants):
        vals = variants[cls]
        print("  %s: %d distinct" % (cls, len(vals)))
        for val, where in sorted(vals.items(), key=lambda kv: -len(kv[1]))[:14]:
            print("      %-26s x%-3d e.g. %s" % (val[:26], len(where), sorted(where)[0]))
    print()

    # ---- report ----
    if not problems:
        print("PASS — %d pages, no problems found." % len(pages))
        return 0

    by_kind = {}
    for _, kind, _ in problems:
        by_kind[kind] = by_kind.get(kind, 0) + 1
    print("FAIL — %d problems across %d pages" % (len(problems), len({p for p, _, _ in problems})))
    print("by kind:", by_kind)
    print()
    for page, kind, msg in problems[:80]:
        print("  [%s] %s: %s" % (kind, page, msg))
    if len(problems) > 80:
        print("  ... and %d more" % (len(problems) - 80))
    return 1


if __name__ == "__main__":
    sys.exit(main())
