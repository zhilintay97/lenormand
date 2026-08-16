# 卜月 · Oraluna

一个安静的简体中文卡牌占卜站，把两套系统合在一起：**雷诺曼**（36 张小牌 + 7 个牌阵）与**塔罗**（78 张韦特牌，每日一牌 + 三张牌问题占卜）。外加 36 张牌义、15 篇牌组测评、10 篇指南，以及一个把两边抽牌合并起来的本地日历/记录页。无需注册、不留邮箱。

线上：**https://lenormand-rho.vercel.app**（Vercel 项目名为 `oraluna`；免费 `.vercel.app` 域名保留了建站时分配的 `lenormand-rho`）。

大体是纯静态站点——没有框架、没有构建产物需要安装。唯一的例外是可选的 **AI 深入解读**（`api/interpret.js`，一个 Vercel Node 函数），因为调用 Claude API 的密钥绝不能进浏览器。不配置密钥时它优雅降级（提示"尚未启用"），其余页面照常。详见下方「AI 深入解读」。

## 目录结构

手写页（直接编辑，不经构建器）：

```
index.html            双入口落地页（卜月：雷诺曼 / 塔罗 / 牌义·牌组 + 记录入口）
tarot/index.html      塔罗：每日一牌 + 三张牌问题占卜
records/index.html    日历 + 记录（雷诺曼与塔罗合并，纯本地）
```

构建器生成页（改文案要动 `tools/zh-bodies/`，见下）：

```
lenormand/            雷诺曼首页（原站首页，7 个牌阵入口）
cards/<slug>/         36 张牌义页 + 索引
spreads/<slug>/       7 个牌阵页（滑动挑牌）+ 索引
decks/<slug>/         15 篇牌组测评 + 索引
guides/<slug>/        10 篇指南 + 索引
about|faq|contact/    关于、常见问题、联系
privacy-policy|terms-of-service|disclaimer/
404.html
```

脚本、样式与素材：

```
css/style.css         全站样式（海军蓝 #172230 + 香槟金 #d6ae68，色板集中在 :root）
js/card-picker.js     滑动挑牌组件（coverflow 卡组，雷诺曼与塔罗共用）
js/deck.js            雷诺曼 36 张牌数据（编号、中文名、扑克牌、关键词）
js/spreads.js         雷诺曼牌阵定义与位置名
js/interpretations.js 雷诺曼抽牌结果的解读文案模板
js/app.js             雷诺曼抽牌 + 导航汉堡 + 翻牌音效 + 写入本地记录
js/tarot-deck.js      塔罗 78 张牌数据（含正/逆位关键词）
js/tarot-app.js       塔罗每日/问题占卜逻辑 + 模板分段解读 + 问题分类
js/records.js         日历 + 记录页逻辑
js/reading-ai.js      牌阵页可选的「AI 深入解读」前端
images/cards/*.png    雷诺曼 36 张牌面 + 牌背
images/tarot/*.jpg    塔罗 78 张（公版莱德·韦特，1909，已进入公有领域）
sounds/card.mp3       雷诺曼翻牌音效
tools/                翻译与构建工具链（不参与页面渲染）
```

本地抽牌记录（雷诺曼与塔罗共用）存在浏览器 `localStorage` 的 `boyue.records` 键下；`records/` 页据此渲染日历与列表。所有 URL slug 保持英文（`cards/rider/`、`spreads/grand-tableau/`、`tarot/`），只有页面文字是中文。

## 本地预览

纯静态，任何 HTTP 服务器都行（塔罗/雷诺曼的牌图与记录页用的是根相对路径 `/images/...`，所以要从**站点根目录**起服务，别用 `file://`）：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 工具链

**构建器生成页**不是手写的：每页只提供 `<main>` 内部的正文片段，公共外壳（`<head>`/meta/页眉/页脚/脚本引用，以及按页面深度算出的相对路径）由构建脚本统一生成——这样几十个页面的导航和 SEO 标签不会各自漂移。

```bash
python tools/build.py    # 中文片段 + 公共外壳 → 各目录 index.html，并生成 sitemap.xml / robots.txt
python tools/verify.py   # 验收（79 页）
```

- `tools/pages.json` —— 构建器生成页的结构信息（路径、层级、导航高亮、`data-spread`）。
- `tools/zh-bodies/<path>/body.html` —— 中文正文片段。
- `tools/zh-bodies/<path>/meta.json` —— 该页的中文 `title` / `description`（标题统一以「| 卜月」结尾，`verify.py` 会检查）。
- `tools/GLOSSARY.md` —— **改文案前必读**：术语与译名规范。

改**构建器生成页**的正文，只改 `tools/zh-bodies/` 下的片段再重跑 `build.py`；直接编辑 `lenormand/index.html`、`cards/…` 等会在下次构建时被覆盖。改**手写页**（`index.html` 落地页、`tarot/`、`records/`）则直接编辑那些文件——它们不经构建器，不会被覆盖。

`verify.py` 会逐页比对中英文片段的标签序列与 href/src 集合（确保翻译没动结构和链接）、检查牌义页的组合是否齐全、扫描残留英文、并验证全站内链与资源可达。（`tools/en-bodies/` 是英文参考底稿，仅供 `verify.py` 对照，不部署。）

## 部署

部署在 Vercel，从 `main` 分支自动部署。

> ⚠️ **仓库必须保持公开（GitHub public）。** Vercel 免费（Hobby）套餐**不为私有仓库部署非成员作者的提交**——一旦改成私有，之后每次推送都会被标为 **Blocked**（*"the Hobby Plan does not support collaboration for private repositories"*），线上版本冻结、再也更新不了。要么保持公开，要么升级 Vercel Pro。这个坑踩过一次，别再踩。

`tools/build.py` 顶部的 `SITE_URL` 决定构建器生成页的 `canonical` / `og:url` 以及 `sitemap.xml` / `robots.txt`。换域名时改这一行、重跑 `build.py`，并同步手改三个手写页（`index.html`、`tarot/index.html`、`records/index.html`）里的 `canonical`，再推送。

## AI 深入解读（当前暂停）

抽牌后，用户可写下自己的问题，让 AI 结合这次牌阵给一段整合式解读。**目前只接在雷诺曼牌阵页上**（塔罗页尚未接入，用的是纯模板解读）。

密钥安全是核心约束：调用 Claude API 的密钥**绝不能出现在浏览器 JS 里**。所以：

```
浏览器（js/reading-ai.js）
   │  POST /api/interpret  {question, spreadName, cards}
   ▼
Vercel Node 函数（api/interpret.js）  ← 只有它能读到密钥（环境变量）
   │  调用 Claude API（claude-opus-4-8）
   ▼
返回一段中文解读
```

- `api/interpret.js` —— Vercel Node 函数，无第三方依赖。含输入校验、长度上限、来源软校验、`max_tokens` 封顶单次成本、`maxDuration` 60 秒（见 `vercel.json`）。
- `js/reading-ai.js` —— 只在牌阵页、首次抽牌后显示（靠 CSS `body.has-drawn`）。
- AI 面板 HTML 由 `build.py` 注入到 7 个牌阵页（有 `data-spread` 的页面）。

### 启用（两步，都在 Vercel 后台）

1. 到 [console.anthropic.com](https://console.anthropic.com) 拿一个 API 密钥。
2. Vercel → 项目 → **Settings → Environment Variables**，添加 `ANTHROPIC_API_KEY`（值就是密钥）。可选再加 `ALLOWED_ORIGIN`。变量名见 `.env.example`。

保存后重新部署即可。**配置密钥之前，功能显示「尚未启用」而不是报错**，所以推送后即使没配密钥站点也不会坏。密钥**只填在 Vercel 后台**，永远不要写进代码或提交。

> ⚠️ **这是付费接口。** 每次「让 AI 解读」都会消耗你的 Claude API 额度；建议在 Anthropic 后台设消费上限。代码已限制单次成本（`max_tokens=1024`、问题长度上限），但接口是公开的——来源软校验挡得住简单滥用，挡不住有心人。需要更强防护可在 Vercel 层加访问限制或接 KV 限流。

## 仍需人工确认

`contact/`、`privacy-policy/`、`terms-of-service/`、`disclaimer/` 四页的译文忠实于英文原版，但法务文本适用法域不同，请让熟悉当地法规的人过一遍。

## 素材来源

- 雷诺曼牌面、音效与站点设计源自 lenormand.io，文字为其内容的简体中文译本。
- 塔罗牌面为 1909 年莱德·韦特（Pamela Colman Smith 绘）扫描件，已进入公有领域，取自 Wikimedia Commons。

公开部署前请确认你对以上素材拥有使用权。
