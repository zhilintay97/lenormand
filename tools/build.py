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
# Where the Chinese site is actually served from; used for <link rel="canonical">,
# the og:/twitter: URLs, sitemap.xml and robots.txt. Note this is a GitHub Pages
# *project* site, so it lives under a /lenormand/ sub-path — which is why every
# generated URL must be absolute rather than root-relative.
SITE_URL = "https://zhilintay97.github.io/lenormand"
SITE_NAME = "雷诺曼"
OG_IMAGE = SITE_URL + "/images/lenormand_featured.jpg"

NAV = [
    ("", "首页", "Home"),
    ("cards/", "牌义", "Cards"),
    ("spreads/", "牌阵", "Spreads"),
    ("decks/", "牌组", "Decks"),
    ("guides/", "指南", "Guides"),
]

SPREAD_SCRIPTS = ["deck.js", "spreads.js", "interpretations.js", "app.js"]


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def head(page, p):
    """<head> for one page. `p` is the relative prefix ('', '../', '../../')."""
    title, desc = page["title"], page["description"]
    url = SITE_URL + "/" + page["path"]
    t, d = esc(title), esc(desc)
    return f"""  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{t}</title>
  <link rel="icon" type="image/png" href="{p}images/icon.png" />
  <link rel="apple-touch-icon" href="{p}images/icon.png" />
  <meta name="description" content="{d}" />
  <link rel="canonical" href="{url}" />
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
        <span class="brand-mark">✴</span>
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
            <span class="brand-mark">✴</span>
            <span>{SITE_NAME}</span>
          </a>
          <p>一个免费的雷诺曼占卜网站 —— 完整的 36 张牌义，以及安静的线上抽牌。</p>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">探索</div>
          <ul>
            <li><a href="{p}cards/">牌义</a></li>
            <li><a href="{p}spreads/">牌阵</a></li>
            <li><a href="{p}spreads/grand-tableau/">大牌阵</a></li>
            <li><a href="{p}decks/">牌组</a></li>
            <li><a href="{p}guides/">指南</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">网站</div>
          <ul>
            <li><a href="{p}">首页</a></li>
            <li><a href="{p}faq/">常见问题</a></li>
            <li><a href="{p}about/">关于我们</a></li>
            <li><a href="{p}contact/">联系我们</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">条款</div>
          <ul>
            <li><a href="{p}privacy-policy/">隐私政策</a></li>
            <li><a href="{p}terms-of-service/">服务条款</a></li>
            <li><a href="{p}disclaimer/">免责声明</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 {SITE_NAME}</span>
        <span>仅供自省与娱乐之用</span>
      </div>
    </div>
  </footer>"""


def render(page, body):
    p = "../" * page["depth"]
    attrs = (" " + page["body_attrs"]) if page.get("body_attrs") else ""
    scripts = SPREAD_SCRIPTS if page.get("body_attrs") else ["app.js"]
    script_tags = "\n".join(f'  <script src="{p}js/{s}"></script>' for s in scripts)

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
{body.rstrip()}
  </main>

{footer(p)}

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

    # ---- sitemap.xml ----
    locs = "\n".join(
        "  <url><loc>%s/%s</loc></url>" % (SITE_URL, pg["path"])
        for pg in sorted(pages, key=lambda x: x["path"])
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
