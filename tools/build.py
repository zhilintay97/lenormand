"""Build the Chinese Lenormand site.

Each page contributes only its <main> body fragment (tools/zh-bodies/**/body.html)
plus a metadata entry (tools/zh-pages.json). This script wraps every fragment in
the shared chrome — head/meta/header/nav/footer/scripts — computing the correct
relative path prefix for the page's depth, and writes the final index.html files.

Also emits sitemap.xml and robots.txt.

    python tools/build.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BODIES = os.path.join(HERE, "zh-bodies")
# Structural page data (path, depth, nav_active, body_attrs) is language
# independent, so it comes straight from the extraction step. The Chinese
# <title>/description live next to each translated fragment in meta.json.
PAGES_JSON = os.path.join(HERE, "pages.json")

# ---------------------------------------------------------------- config ----
# The canonical home of the site; used for <link rel="canonical">, the og:/twitter:
# URLs, sitemap.xml and robots.txt. No trailing slash — paths are appended with one.
# Vercel is now the only live deployment: the repository is private, which
# disables GitHub Pages, so the secondary copy that used to run at
# https://zhilintay97.github.io/lenormand is gone.
#
# Generated URLs stay absolute rather than root-relative. 404.html requires it
# (see below), and it keeps the output correct if the site is ever served from a
# sub-path again — which is what the Pages copy did, under /lenormand/.
SITE_URL = "https://lenormand-rho.vercel.app"
SITE_NAME = "卜月"
OG_IMAGE = SITE_URL + "/images/lenormand_featured.jpg"

NAV = [
    ("lenormand/", "雷诺曼", "Lenormand"),
    ("tarot/", "塔罗", "Tarot"),
    ("guides/", "指南", "Guides"),
    ("records/", "记录", "Records"),
]

# ---- 底部标签栏（手机上固定在底部；桌面用顶部导航）----
ICON_HOME = ('<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
             'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
             '<path d="M3 10.5 12 4l9 6.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>')
ICON_LENO = ('<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
             'stroke-width="1.6" stroke-linejoin="round">'
             '<rect x="4" y="5.5" width="8.5" height="13" rx="1.5"/>'
             '<rect x="11" y="5.5" width="8.5" height="13" rx="1.5"/></svg>')
ICON_TAROT = ('<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
              'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
              '<path d="M17.2 15.4A6.4 6.4 0 1 1 11 5a5 5 0 0 0 6.2 10.4Z"/>'
              '<path d="m18.5 3.6.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/></svg>')
ICON_REC = ('<svg class="tab-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
            '<rect x="4" y="5" width="16" height="15" rx="2"/>'
            '<path d="M4 9.5h16M8.5 3v4M15.5 3v4"/></svg>')

TAB_ITEMS = [
    ("", "首页", "home", ICON_HOME),
    ("lenormand/", "雷诺曼", "Lenormand", ICON_LENO),
    ("tarot/", "塔罗", "Tarot", ICON_TAROT),
    ("records/", "记录", "Records", ICON_REC),
]


def tab_bar(p, active):
    links = []
    for href, label, key, icon in TAB_ITEMS:
        cls = ' class="active"' if active == key else ""
        cur = ' aria-current="page"' if active == key else ""
        links.append(f'      <a href="{p}{href}"{cls}{cur}>{icon}<span>{label}</span></a>')
    return '  <nav class="tab-bar" aria-label="主导航">\n' + "\n".join(links) + "\n  </nav>"


def tab_active(path):
    if path.startswith("tarot"):
        return "Tarot"
    if path.startswith("records"):
        return "Records"
    if path == "":
        return "home"
    if path.startswith(("lenormand", "spreads", "guides", "cards")):
        return "Lenormand"
    return ""

SPREAD_SCRIPTS = ["deck.js", "spreads.js", "combos.js", "interpretations.js", "card-picker.js", "app.js", "reading-detail.js"]

# The 解读 panel, injected only on spread pages (the ones with data-spread).
# It sits after the drawing UI, inside its own .container for consistent gutters,
# and stays hidden until the first draw (CSS: body.has-drawn .reading-detail).
# It reads entirely from local data (js/combos.js) — no server, no AI — and shows
# each card's meaning by position plus the combination meanings between neighbours,
# so a visitor never has to open 35 separate card pages. See js/reading-detail.js.
# (An AI deep-reading may later be added on this same panel.)
READING_PANEL_HTML = """    <div class="container">
      <section class="reading-detail" aria-label="解读">
        <h2>解读</h2>
        <p class="reading-detail-intro">把这次牌阵展开看：每张牌落在它的位置上说了什么，以及相邻的牌连起来又是什么意思 —— 不用一张张点进去看。</p>
        <button type="button" class="btn" id="readBtn">解读这次牌阵</button>
        <div class="reading-detail-body" id="readBody" aria-live="polite"></div>
        <p class="ai-disclaimer">解读仅供自省与娱乐，不构成医疗、法律、财务或心理方面的建议。</p>
      </section>
    </div>"""

# The 404 page is rendered for whatever path the visitor got wrong, so the
# browser's base URL is unknown at build time and depth-relative links would
# break — "../../css/style.css" resolves against the bad path. Every link and
# asset here is therefore absolute.
NOT_FOUND_TITLE = "页面不存在 | 卜月"
NOT_FOUND_DESC = "你要找的页面不存在。回到首页，或从这里进入 36 张牌的牌义、四个牌阵与十篇雷诺曼指南。"
NOT_FOUND_BODY = """    <div class="container">
      <section class="page-head fade-up">
        <div class="hero-eyebrow">404</div>
        <h1>这一页<em>不在这里</em></h1>
        <div class="hero-divider"><span>✦</span></div>
        <p class="intro">
          你要找的页面不存在——也许网址里少了一个字母，也许这一页从来就没有过。
          牌都还在，只是这条路走不通。
        </p>
        <div class="hero-cta">
          <a href="{p}" class="btn">回到首页</a>
          <a href="{p}cards/" class="btn-ghost">浏览 36 张牌</a>
        </div>
      </section>

      <section class="card-section fade-up">
        <h2>你可能想找的</h2>
        <ul>
          <li><a href="{p}cards/">36 张牌的完整牌义</a>——从骑士到十字架，每张牌都附它与其余 35 张的组合读法。</li>
          <li><a href="{p}spreads/">四个牌阵</a>——从三张牌的横列，到摊满 36 张的大牌阵，都可以直接抽。</li>
          <li><a href="{p}guides/">十篇指南</a>——怎么读、怎么问、怎么洗牌，以及大牌阵的宫位是什么。</li>
          <li><a href="{p}decks/">十五副牌组测评</a>——当代艺术风、德国传统经典，以及奠基性的历史版本。</li>
        </ul>
        <p>如果你是顺着本站的链接走到这里的，那是我们的问题——欢迎<a href="{p}contact/">告诉我们</a>。</p>
      </section>
    </div>
"""


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def head(page, p):
    """<head> for one page. `p` is the relative prefix ('', '../', '../../')."""
    title, desc = page["title"], page["description"]
    url = SITE_URL + "/" + page["path"]
    t, d = esc(title), esc(desc)
    # The 404 page is served in place of every unknown path, so it must not
    # claim a canonical URL of its own — that would map arbitrary broken URLs
    # onto a real page — and it must not be indexed.
    indexing = ('  <meta name="robots" content="noindex" />'
                if page.get("noindex")
                else f'  <link rel="canonical" href="{url}" />')
    return f"""  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{t}</title>
  <link rel="icon" type="image/png" href="{p}images/icon.png" />
  <link rel="apple-touch-icon" href="{p}images/icon.png" />
  <meta name="description" content="{d}" />
{indexing}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="{SITE_NAME}" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:title" content="{t}" />
  <meta property="og:description" content="{d}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{OG_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{t}" />
  <meta name="twitter:description" content="{d}" />
  <meta name="twitter:image" content="{OG_IMAGE}" />
  <link rel="stylesheet" href="{p}css/style.css" />"""


def header(page, p):
    links = []
    for href, label, key in NAV:
        cls = ' class="active"' if page.get("nav_active") == key else ""
        links.append(f'        <a href="{p}{href}"{cls}>{label}</a>')
    nav = "\n".join(links)
    return f"""  <header class="site-header">
    <div class="site-header-inner">
      <a class="brand" href="{p}">
        <span class="brand-mark" aria-hidden="true">✴</span>
        <span>{SITE_NAME}</span>
      </a>
      <button class="nav-toggle" aria-label="展开或收起导航菜单" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="main-nav" id="mainNav">
{nav}
      </nav>
    </div>
  </header>"""


def footer(p):
    return f"""  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-brand">
          <a class="footer-logo" href="{p}">
            <span class="brand-mark" aria-hidden="true">✴</span>
            <span>{SITE_NAME}</span>
          </a>
          <p>安静的线上卡牌占卜 —— 雷诺曼与塔罗，完整牌义，无需注册。</p>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">探索</div>
          <ul>
            <li><a href="{p}lenormand/">雷诺曼</a></li>
            <li><a href="{p}tarot/">塔罗</a></li>
            <li><a href="{p}guides/">指南</a></li>
            <li><a href="{p}records/">记录</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 {SITE_NAME}</span>
        <span>仅供自省与娱乐之用</span>
      </div>
    </div>
  </footer>"""


def render(page, body, prefix=None):
    p = prefix if prefix is not None else "../" * page["depth"]
    attrs = (" " + page["body_attrs"]) if page.get("body_attrs") else ""
    is_spread = bool(page.get("body_attrs"))
    scripts = SPREAD_SCRIPTS if is_spread else ["app.js"]
    script_tags = "\n".join(f'  <script src="{p}js/{s}"></script>' for s in scripts)
    # Spread pages get the optional AI panel appended inside <main>.
    main_body = body.rstrip() + ("\n\n" + READING_PANEL_HTML if is_spread else "")

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
{head(page, p)}
</head>
<body{attrs}>
  <div class="bg-layer">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>
    <div class="bg-stars"></div>
    <div class="bg-noise"></div>
  </div>

{header(page, p)}

  <main>
{main_body}
  </main>

{footer(p)}

{tab_bar(p, tab_active(page["path"]))}

{script_tags}
</body>
</html>
"""


def main():
    with open(PAGES_JSON, encoding="utf-8") as f:
        pages = json.load(f)

    written, missing = 0, []
    for page in pages:
        base = os.path.join(BODIES, page["path"] or "home/")
        frag, meta_path = os.path.join(base, "body.html"), os.path.join(base, "meta.json")
        if not (os.path.isfile(frag) and os.path.isfile(meta_path)):
            missing.append(page["path"] or "(home)")
            continue
        with open(frag, encoding="utf-8") as f:
            body = f.read()
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
        page = dict(page, title=meta["title"], description=meta["description"])

        dest = os.path.join(ROOT, page["path"].replace("/", os.sep), "index.html")
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8", newline="\n") as f:
            f.write(render(page, body))
        written += 1

    # ---- 404.html (absolute links; excluded from the sitemap) ----
    absolute = SITE_URL + "/"
    not_found = {
        "path": "", "depth": 0, "nav_active": "", "body_attrs": "",
        "title": NOT_FOUND_TITLE, "description": NOT_FOUND_DESC, "noindex": True,
    }
    with open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(render(not_found, NOT_FOUND_BODY.format(p=absolute), prefix=absolute))

    # ---- sitemap.xml ----
    # The landing ("") and the tarot page are hand-written (not in pages.json),
    # so add them explicitly alongside the generated pages.
    # records/ is noindex (per-user local data), so it stays out of the sitemap.
    STATIC_PATHS = ["", "tarot/"]
    all_paths = sorted(set(STATIC_PATHS + [pg["path"] for pg in pages]))
    locs = "\n".join(
        "  <url><loc>%s/%s</loc></url>" % (SITE_URL, path) for path in all_paths
    )
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                + locs + "\n</urlset>\n")

    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE_URL)

    print("built %d/%d pages" % (written, len(pages)))
    if missing:
        print("MISSING body fragments (%d):" % len(missing))
        for m in missing:
            print("  -", m)
        sys.exit(1)
    print("wrote sitemap.xml + robots.txt")


if __name__ == "__main__":
    main()
