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
SITE_NAME = "雷诺曼"
OG_IMAGE = SITE_URL + "/images/lenormand_featured.jpg"

NAV = [
    ("", "首页", "Home"),
    ("cards/", "牌义", "Cards"),
    ("spreads/", "牌阵", "Spreads"),
    ("decks/", "牌组", "Decks"),
    ("guides/", "指南", "Guides"),
]

SPREAD_SCRIPTS = ["deck.js", "spreads.js", "interpretations.js", "app.js", "reading-ai.js"]

# Optional AI panel, injected only on spread pages (the ones with data-spread).
# It sits after the drawing UI, inside its own .container for consistent gutters,
# and stays hidden until the first draw (CSS: body.has-drawn .ai-reading).
# The server-side interpreter lives at api/interpret.py; the browser never sees
# the API key. See js/reading-ai.js.
AI_PANEL_HTML = """    <div class="container">
      <section class="ai-reading" aria-label="AI 深入解读">
        <h2>让 AI 深入解读</h2>
        <p class="ai-intro">写下你此刻真正想问的问题，让 AI 结合上面这次牌阵，给出一段更完整的解读。</p>
        <form class="ai-form" id="aiForm">
          <textarea id="aiQuestion" maxlength="500"
            placeholder="例如：这段关系接下来会怎么发展？我该不该换工作？"></textarea>
          <button type="submit" class="btn ai-submit" id="aiAskBtn">让 AI 解读这次牌阵</button>
        </form>
        <div class="ai-answer" id="aiAnswer" aria-live="polite"></div>
        <p class="ai-disclaimer">AI 解读仅供自省与娱乐，不构成医疗、法律、财务或心理方面的建议。</p>
      </section>
    </div>"""

# The 404 page is rendered for whatever path the visitor got wrong, so the
# browser's base URL is unknown at build time and depth-relative links would
# break — "../../css/style.css" resolves against the bad path. Every link and
# asset here is therefore absolute.
NOT_FOUND_TITLE = "页面不存在 | 雷诺曼"
NOT_FOUND_DESC = "你要找的页面不存在。回到首页，或从这里进入 36 张牌的牌义、七个牌阵与十篇雷诺曼指南。"
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
          <li><a href="{p}spreads/">七个牌阵</a>——从三张牌的横列，到摊满 36 张的大牌阵，都可以直接抽。</li>
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


def render(page, body, prefix=None):
    p = prefix if prefix is not None else "../" * page["depth"]
    attrs = (" " + page["body_attrs"]) if page.get("body_attrs") else ""
    is_spread = bool(page.get("body_attrs"))
    scripts = SPREAD_SCRIPTS if is_spread else ["app.js"]
    script_tags = "\n".join(f'  <script src="{p}js/{s}"></script>' for s in scripts)
    # Spread pages get the optional AI panel appended inside <main>.
    main_body = body.rstrip() + ("\n\n" + AI_PANEL_HTML if is_spread else "")

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
