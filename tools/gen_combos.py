"""Generate js/combos.js from the 36 card body fragments.

Each card page (tools/zh-bodies/cards/<slug>/body.html) carries a
<ul class="combo-list"> with 35 <li><strong>甲 + 乙</strong> 含义。</li> items.
We extract them all into a flat map LENORMAND_COMBOS[slugA][slugB] = "含义",
so the reading page can show combination meanings inline without the visitor
opening 35 separate card pages.

    python tools/gen_combos.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CARDS = os.path.join(HERE, "zh-bodies", "cards")

# name -> slug, taken from js/deck.js (the 36 traditional cards).
NAME_SLUG = {
    "骑士": "rider", "幸运草": "clover", "船": "ship", "房屋": "house",
    "树": "tree", "云": "clouds", "蛇": "snake", "棺材": "coffin",
    "花束": "bouquet", "镰刀": "scythe", "鞭子": "whip", "飞鸟": "birds",
    "孩童": "child", "狐狸": "fox", "熊": "bear", "星星": "star",
    "鹳鸟": "stork", "狗": "dog", "高塔": "tower", "花园": "garden",
    "高山": "mountain", "十字路口": "crossroad", "老鼠": "mice", "心": "heart",
    "戒指": "ring", "书": "book", "信": "letter", "男人": "man",
    "女人": "woman", "百合": "lily", "太阳": "sun", "月亮": "moon",
    "钥匙": "key", "鱼": "fish", "锚": "anchor", "十字架": "cross",
}

LI_RE = re.compile(r"<li><strong>(.+?)\s*\+\s*(.+?)</strong>\s*(.+?)</li>", re.S)


def main():
    combos = {}
    problems = []
    for slug in sorted(set(NAME_SLUG.values())):
        frag = os.path.join(CARDS, slug, "body.html")
        if not os.path.isfile(frag):
            problems.append("missing body: %s" % slug)
            continue
        with open(frag, encoding="utf-8") as f:
            html = f.read()
        # Only parse inside the combo-list, so stray <li><strong> elsewhere
        # cannot leak in.
        m = re.search(r'<ul class="combo-list">(.*?)</ul>', html, re.S)
        if not m:
            problems.append("no combo-list: %s" % slug)
            continue
        block = m.group(1)
        pairs = LI_RE.findall(block)
        entry = {}
        for a_name, b_name, text in pairs:
            a_name, b_name, text = a_name.strip(), b_name.strip(), text.strip()
            a_slug, b_slug = NAME_SLUG.get(a_name), NAME_SLUG.get(b_name)
            if not a_slug or not b_slug:
                problems.append("unknown name in %s: %r + %r" % (slug, a_name, b_name))
                continue
            if a_slug != slug:
                problems.append("wrong owner in %s: got %s" % (slug, a_slug))
            entry[b_slug] = text
        if len(entry) != 35:
            problems.append("%s has %d combos (expected 35)" % (slug, len(entry)))
        combos[slug] = entry

    if problems:
        print("PROBLEMS:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    # Deterministic key order: by traditional card number.
    order = list(NAME_SLUG.values())
    ordered = {a: {b: combos[a][b] for b in order if b in combos[a]} for a in order}

    body = json.dumps(ordered, ensure_ascii=False, separators=(",", ":"))
    out = os.path.join(ROOT, "js", "combos.js")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write("// ---------- 雷诺曼组合牌义 ----------\n")
        f.write("// 由 tools/gen_combos.py 从各张牌页自动生成，请勿手工修改。\n")
        f.write("// LENORMAND_COMBOS[甲][乙] = 「甲 + 乙」的组合含义。\n")
        f.write("const LENORMAND_COMBOS = " + body + ";\n")
    total = sum(len(v) for v in ordered.values())
    print("wrote js/combos.js — %d cards, %d combos" % (len(ordered), total))


if __name__ == "__main__":
    main()
