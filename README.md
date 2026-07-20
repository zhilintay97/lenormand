# 雷诺曼 · 简体中文站

[lenormand.io](https://lenormand.io) 的简体中文版本：36 张小雷诺曼牌的完整牌义、7 个可交互抽牌的牌阵、15 篇牌组测评和 10 篇长文指南，共 79 个页面。

纯静态站点 —— 没有框架、没有依赖、没有构建产物需要安装。把仓库根目录直接扔给任何静态托管（GitHub Pages / Cloudflare Pages / Netlify / Nginx）即可上线。

## 目录结构

```
index.html            首页
cards/<slug>/         36 张牌义页 + 索引页
spreads/<slug>/       7 个牌阵页（可交互抽牌）+ 索引页
decks/<slug>/         15 篇牌组测评 + 索引页
guides/<slug>/        10 篇指南 + 索引页
about|faq|contact/    关于、常见问题、联系
privacy-policy|terms-of-service|disclaimer/
css/style.css         全站样式（含中文字体栈与排版微调）
js/deck.js            36 张牌的数据：编号、中文名、扑克牌、关键词
js/spreads.js         7 个牌阵定义与位置名
js/interpretations.js 抽牌结果的解读文案模板
js/app.js             导航、滚动动画、洗牌抽牌与翻牌音效
images/cards/*.png    36 张牌面 + 牌背
sounds/card.mp3       翻牌音效
tools/                翻译与构建工具链（不参与页面渲染）
```

所有 URL slug 保持英文原样（`cards/rider/`、`spreads/grand-tableau/`），只有页面文字是中文 —— 这样与英文站的路径结构一一对应，牌面图片和内链都能直接复用。

## 本地预览

站点是纯静态的，任何 HTTP 服务器都行：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

直接用 `file://` 打开也能看，但抽牌音效会被浏览器拦截。

## 工具链

页面不是手写的。每个页面只提供 `<main>` 内部的正文片段，公共外壳（`<head>` / meta / 页眉 / 页脚 / 脚本引用，以及按页面深度计算的相对路径）由构建脚本统一生成 —— 这样 79 个页面的导航和 SEO 标签不会各自漂移。

```bash
python tools/mirror.py           # 抓取英文源站到 tools/en-mirror/（参考底稿）
python tools/extract_bodies.py   # 抽出 <main> 片段 → tools/en-bodies/ + tools/pages.json
python tools/build.py            # 中文片段 + 公共外壳 → 各目录的 index.html，并生成 sitemap.xml / robots.txt
python tools/verify.py           # 验收
```

- `tools/pages.json` —— 页面的结构信息（路径、层级、导航高亮、`data-spread` 属性）。与语言无关。
- `tools/zh-bodies/<path>/body.html` —— 中文正文片段。
- `tools/zh-bodies/<path>/meta.json` —— 该页的中文 `title` 与 `description`。
- `tools/GLOSSARY.md` —— **改文案前必读**：36 张牌的标准译名、牌阵与位置名、通用术语、行文规范。

改正文只改 `tools/zh-bodies/` 下的片段，然后重跑 `build.py`；直接编辑根目录的 `index.html` 会在下次构建时被覆盖。

`tools/verify.py` 会逐页比对中英文片段的标签序列与 href/src 集合（确保翻译没有动结构和链接）、检查牌义页的 35 条组合是否齐全、扫描残留英文、并验证全站内链与资源路径可达。

## 上线前需要改的两处

1. **`tools/build.py` 顶部的 `SITE_URL`** —— 目前是 `https://lenormand.io`，它决定 `<link rel="canonical">`、og:/twitter: 的 URL 和 `sitemap.xml` 的内容。换成中文站实际的域名后重跑 `python tools/build.py`。
2. **`contact/`、`privacy-policy/`、`terms-of-service/`、`disclaimer/` 四个页面** —— 译文忠实于英文原版，但法务文本的适用法域不同。正式上线前请让熟悉当地法规的人过一遍，尤其是个人信息处理与责任范围的表述。

## 素材来源

牌面图片、音效与站点设计来自 lenormand.io。文字为该站内容的简体中文译本。请确认你对这些素材拥有使用权后再公开部署。
