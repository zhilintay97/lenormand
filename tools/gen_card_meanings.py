"""Generate js/card-meanings.js from the 36 card body fragments.

Each card page (tools/zh-bodies/cards/<slug>/body.html) has a consistent set of
sections. We pull the reader-facing meaning text so the 解读 panel can show a
card's full meaning inline, instead of making the visitor open the card page:

    LENORMAND_MEANINGS[slug] = { quick, meaning, love, career, advice }

Every value is a single string; multi-paragraph fields join paragraphs with "\n"
so the panel can split them back into <p> blocks.

    python tools/gen_card_meanings.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CARDS = os.path.join(HERE, "zh-bodies", "cards")

# card number order -> slug (from js/deck.js)
ORDER = [
    "rider", "clover", "ship", "house", "tree", "clouds", "snake", "coffin",
    "bouquet", "scythe", "whip", "birds", "child", "fox", "bear", "star",
    "stork", "dog", "tower", "garden", "mountain", "crossroad", "mice", "heart",
    "ring", "book", "letter", "man", "woman", "lily", "sun", "moon", "key",
    "fish", "anchor", "cross",
]

TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
SECTION = re.compile(r'<section class="card-section[^"]*">(.*?)</section>', re.S)
H2 = re.compile(r"<h2>(.*?)</h2>", re.S)
PARA = re.compile(r"<p[^>]*>(.*?)</p>", re.S)
QUICK = re.compile(r'<p class="card-quick-meaning">(.*?)</p>', re.S)


def clean(html):
    return WS.sub(" ", TAG.sub("", html)).strip()


def paras_text(sec):
    return "\n".join(clean(p) for p in PARA.findall(sec) if clean(p))


def main():
    meanings, problems = {}, []
    for slug in ORDER:
        frag = os.path.join(CARDS, slug, "body.html")
        if not os.path.isfile(frag):
            problems.append("missing: %s" % slug)
            continue
        html = open(frag, encoding="utf-8").read()

        entry = {"quick": "", "meaning": "", "love": "", "career": "", "advice": ""}
        q = QUICK.search(html)
        if q:
            entry["quick"] = clean(q.group(1))

        for sec in SECTION.findall(html):
            m = H2.search(sec)
            if not m:
                continue
            h = clean(m.group(1))
            if h.endswith("的组合牌义"):
                continue          # combinations live in combos.js
            elif h.endswith("的牌义"):
                entry["meaning"] = paras_text(sec)
            elif h.endswith("与感情"):
                entry["love"] = paras_text(sec)
            elif h.endswith("与事业"):
                entry["career"] = paras_text(sec)
            elif h.endswith("的建议"):
                entry["advice"] = paras_text(sec)

        for k in ("quick", "meaning", "love", "career", "advice"):
            if not entry[k]:
                problems.append("%s: empty %s" % (slug, k))
        meanings[slug] = entry

    if problems:
        print("PROBLEMS:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    body = json.dumps(meanings, ensure_ascii=False, separators=(",", ":"))
    out = os.path.join(ROOT, "js", "card-meanings.js")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write("// ---------- 雷诺曼单张牌义 ----------\n")
        f.write("// 由 tools/gen_card_meanings.py 从各张牌页自动生成，请勿手工修改。\n")
        f.write("// LENORMAND_MEANINGS[slug] = { quick, meaning, love, career, advice }\n")
        f.write("// 多段文字以 \\n 分段。\n")
        f.write("const LENORMAND_MEANINGS = " + body + ";\n")
    size = os.path.getsize(out)
    print("wrote js/card-meanings.js — %d cards, %d bytes" % (len(meanings), size))


if __name__ == "__main__":
    main()
