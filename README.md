# 雷诺曼 · 简体中文站

[lenormand.io](https://lenormand.io) 的简体中文版本：36 张小雷诺曼牌的完整牌义、7 个可交互抽牌的牌阵、15 篇牌组测评和 10 篇长文指南，共 79 个页面。

纯静态站点 —— 没有框架、没有依赖、没有构建产物需要安装。把仓库根目录直接扔给任何静态托管（GitHub Pages / Cloudflare Pages / Netlify / Nginx）即可上线。

唯一的例外是可选的 **AI 深入解读** 功能：它需要一个服务端接口（`api/interpret.js`，Vercel Node 函数），因为调用 Claude API 的密钥绝不能放进浏览器。这个接口不影响其余静态页面；不配置密钥时功能会优雅降级（提示"尚未启用"）。详见下方「AI 深入解读」一节。

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

## 部署

站点部署在 Vercel：**https://lenormand-rho.vercel.app**，从 `main` 分支自动部署。

本仓库为私有仓库，因此 GitHub Pages 不可用（免费账号的 Pages 需要公开仓库）。曾经作为备份副本运行的 `zhilintay97.github.io/lenormand` 已随之下线。

`tools/build.py` 顶部的 `SITE_URL` 决定 `canonical`、`og:url`、`sitemap.xml` 与 `robots.txt` 的内容。换域名时改这一行，重跑 `python tools/build.py` 并推送即可。

生成的网址一律是**绝对路径**，不用根相对路径（`/cards/rider/`）：

- `404.html` 必须如此——它会在访问者输错的**任意路径**下被渲染，此时 `../../css/style.css` 会相对那个错误路径解析，样式和链接全部失效。
- 万一以后站点又被放到某个子路径下（Pages 副本当初就在 `/lenormand/` 之下），绝对路径不会出问题。

## AI 深入解读

抽牌后，用户可以在 7 个牌阵页写下自己的问题，让 AI 结合这次牌阵给出一段整合式解读。

**架构**——密钥安全是这个功能的核心约束：调用 Claude API 的密钥**绝不能出现在浏览器的 JS 里**（任何人查看源码就能拿走去刷额度）。所以：

```
浏览器（js/reading-ai.js）
   │  POST /api/interpret  {question, spreadName, cards}
   ▼
Vercel Node 函数（api/interpret.js）  ← 只有它能读到密钥（环境变量）
   │  调用 Claude API（claude-opus-4-8）
   ▼
返回一段中文解读
```

- `api/interpret.js` —— Vercel Node 函数，无第三方依赖（`fetch` 是 Node 18+ 内置）。含输入校验、长度上限、来源软校验、`max_tokens` 封顶单次成本、`maxDuration` 60 秒（见 `vercel.json`）。系统提示词把模型约束在「只做雷诺曼解读」，并带上与本站一致的免责口径（不提供医疗/法律/财务/心理建议）。
- `js/reading-ai.js` —— 只在牌阵页出现，首次抽牌后才显示（靠 CSS 的 `body.has-drawn`）。负责收集问题、发请求、展示结果，处理加载/错误/未配置各种状态。
- AI 面板的 HTML 由 `tools/build.py` 注入到 7 个牌阵页（有 `data-spread` 的页面），不进牌义/指南/牌组页。

### 启用（两步，都在 Vercel 后台）

1. 到 [console.anthropic.com](https://console.anthropic.com) 拿一个 API 密钥。
2. Vercel → 项目 → **Settings → Environment Variables**，添加 `ANTHROPIC_API_KEY`（值就是密钥）。可选再加 `ALLOWED_ORIGIN`。变量名清单见 `.env.example`。

保存后重新部署即可。**在配置密钥之前，功能会显示「尚未启用」而不是报错**，所以推送后即使还没配密钥，站点也不会坏。

> ⚠️ **这是付费接口。** 每次「让 AI 解读」都会消耗你的 Claude API 额度。上线前建议在 Anthropic 后台设一个消费上限。代码里已经限制了单次成本（`max_tokens=1024`、问题长度上限），但**接口是公开的**——`api/interpret.js` 里的来源校验能挡掉简单的跨站滥用，却挡不住有心人。如需更强的防护，可在 Vercel 层加访问限制，或接一个 KV 做限流。

## 仍需人工确认

`contact/`、`privacy-policy/`、`terms-of-service/`、`disclaimer/` 四个页面的译文忠实于英文原版，但法务文本的适用法域不同。请让熟悉当地法规的人过一遍，尤其是个人信息处理与责任范围的表述。

## 素材来源

牌面图片、音效与站点设计来自 lenormand.io。文字为该站内容的简体中文译本。请确认你对这些素材拥有使用权后再公开部署。
