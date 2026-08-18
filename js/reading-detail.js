// ---------- 解读面板（本地牌义 + 组合 + 结构读法，无 AI）----------
// 抽牌后，用户点「解读」即可看到三部分：
//   1. 这个牌阵怎么读 —— 按正宗雷诺曼的结构（线阵连句 / 3×3 方阵的行列中心）
//      把你**实际抽到的牌**分区讲清楚，而不是给某个位置钉死一个固定判词。
//   2. 每张牌的牌义 —— 逐张，可就地展开细读（牌义 / 感情 / 事业 / 建议），
//      不用一张张点进牌页。
//   3. 牌与牌的组合 —— 相邻两张的组合含义（雷诺曼的核心）。
// 数据来自 js/combos.js 与 js/card-meanings.js，以及本次抽牌
// （window.__lenoReading）。不访问服务器、不含 AI。日后要加 AI 就接在这个面板里。
//
// 3×3 方阵读法遵循主流正宗教学：中央=核心；三行=层次（上·心上／中·当下／
// 下·根基）；三列=时间（左·过去／中·现在／右·未来）；四角=速览。行列只是
// 「框架」，具体含义永远由落在其中的实际牌 + 相邻组合决定。

(function () {
  const btn = document.getElementById("readBtn");
  const box = document.getElementById("readBody");
  if (!btn || !box) return; // 非牌阵页

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }

  // 取实际抽到的牌名（已转义），idxs 为下标数组。
  function nms(cards, idxs) {
    return idxs.map((i) => (cards[i] ? esc(cards[i].name) : "—")).join("、");
  }
  function nm(cards, i) {
    return cards[i] ? esc(cards[i].name) : "—";
  }

  function comboText(a, b) {
    return (typeof LENORMAND_COMBOS !== "undefined" &&
      LENORMAND_COMBOS[a] && LENORMAND_COMBOS[a][b]) || "";
  }
  function meaningOf(slug) {
    return (typeof LENORMAND_MEANINGS !== "undefined" && LENORMAND_MEANINGS[slug]) || null;
  }

  // ---- 1. 结构读法：依牌阵形状，套用到实际抽到的牌 ----
  function framework(r) {
    const c = r.cards;
    if (r.layout === "line" && c.length === 3) {
      return {
        lead: "三张连成一句话来读，不逐张单解。中间那张是主题（句子的主语），左右两张为它修饰、交代前因后果。",
        zones: [
          { name: "中 · 主题", cards: nms(c, [1]), desc: "句子的主语、事情的核心，先抓住它。" },
          { name: "左 · 来路", cards: nms(c, [0]), desc: "通向主题的前因、背景、过去。" },
          { name: "右 · 去向", cards: nms(c, [2]), desc: "主题通向哪里——走向、结果、未来。" },
        ],
        weave: `连起来读：先看中间的 ${nm(c, 1)} 定主题，再把 ${nm(c, 0)}＋${nm(c, 1)}、${nm(c, 1)}＋${nm(c, 2)} 两组相邻牌（见下方「牌与牌的组合」）当桥梁串成一句话。左是来路，右是去向。`,
        person: "若人物牌（男人 / 女人）落在阵里，它左边是它身后／过去的事，右边是它面前／将来的事。",
      };
    }
    if (r.layout === "line" && c.length === 5) {
      return {
        lead: "五张一列，中央（第 3 张）是主题；左两张是来路，右两张是去向。读成一句话，不逐张单解。",
        zones: [
          { name: "中央 · 主题", cards: nms(c, [2]), desc: "整条线的核心，先读它定调。" },
          { name: "左两张 · 来路", cards: nms(c, [0, 1]), desc: "过去、起因、把事情带到此刻的背景（越靠外越远）。" },
          { name: "右两张 · 去向", cards: nms(c, [3, 4]), desc: "未来、走向、事情往哪去（越靠外越远）；只讲会怎样，不是建议。" },
        ],
        weave: `先看中央 ${nm(c, 2)} 定主题，重心在紧贴它的两组 ${nm(c, 1)}＋${nm(c, 2)}、${nm(c, 2)}＋${nm(c, 3)}。再从左到右把五张当一句话顺读，一切收回中央。`,
        person: "若人物牌（男人 / 女人）落在阵里，它左边偏过去、右边偏将来；紧贴它的牌影响最大。",
      };
    }
    if (r.layout === "box" && c.length === 9) {
      return {
        lead: "3×3 方阵的读法<strong>围绕正中那一张</strong>展开 —— 只有它是核心（事情的心、主题），其余八张都绕着它、为它补背景。先读懂中间这张，再看它四周。",
        zones: [
          { name: "核心 · 正中", cards: nms(c, [4]), desc: "事情的心、主题所在。它是唯一和其余八张都相邻的牌，先读它定调；其余八张都在修饰它。" },
          { name: "头顶（正上）", cards: nms(c, [1]), desc: "压在核心上方、心上的事：念头、目标、你正惦记或担心的。" },
          { name: "脚下（正下）", cards: nms(c, [7]), desc: "垫在核心下方、根基／潜流：底子、暗中的推力、没说出口的。" },
          { name: "身后（正左）", cards: nms(c, [3]), desc: "核心身后的来路：过去、起因、已经发生的。" },
          { name: "面前（正右）", cards: nms(c, [5]), desc: "核心面前的去向：未来、走向、正在靠近的。" },
          { name: "四角 · 外框", cards: nms(c, [0, 2, 6, 8]), desc: "四个角是更外围的背景，先扫一眼给整盘定个大轮廓。" },
        ],
        weave: `先读正中的 ${nm(c, 4)}，它是这盘的心。再把它和四张贴身牌两两组合（见下方「牌与牌的组合」）：头顶 ${nm(c, 1)} 压在心上、脚下 ${nm(c, 7)} 垫着根基、身后 ${nm(c, 3)} 是来路、面前 ${nm(c, 5)} 是去向。最后用四角补背景。八张都在讲同一件事：中间这张。`,
        optional: "想更细，可把三列当时间线（左过去 → 中现在 → 右未来）、三行当层次（上念头 / 中现实 / 下根基）各读一句 —— 但这是可选的进阶层，核心永远只是正中那一张。",
        person: "若人物牌（男人 / 女人，或你用来代表某人的牌）落在核心，此人／此题就是主题；落在四周，就代表那个人在核心的哪一侧 —— 头顶＝心头挂念、脚下＝暗中牵动、身后＝过去的人事、面前＝将要来的。紧贴核心的那张，往往是当前最影响你的。",
      };
    }
    if (r.layout === "tableau") {
      return {
        lead: "大牌阵按「人生地图」读，36 张不逐张连句 —— 先抓大方向再往细里挖，顺着下面几步走。",
        steps: [
          "先扫四角和第一行，给整盘定个大基调。",
          "找到你的指示牌（男性用「男人」，女性用「女人」）—— 它落在盘中哪一区、面朝哪边，就点出你此刻的处境与关注方向。",
          "精读指示牌四周贴身的一圈牌（上下左右加四斜角），这是最强的影响圈。",
          "横读指示牌那一行：左边是过去 / 来路，右边是未来 / 去向；越贴近越近发生，越远越晚。",
          "纵读指示牌那一列：上面是心上 / 明面，下面是根基 / 潜流。",
          "进阶可叠加宫位（每格有固定宫位主题，只有大牌阵才有）、镜像、骑士跳，补出更隐蔽的关联。",
        ],
        person: "指示牌不占固定牌位——它落在盘里的哪一区、面朝哪边，本身就是最重要的信息。",
      };
    }
    return null;
  }

  function renderStructure(r) {
    const f = framework(r);
    if (!f) return "";
    let h = '<div class="rd-block"><h3>这个牌阵怎么读</h3>';
    h += '<p class="rd-structure-lead">' + f.lead + "</p>";
    if (f.zones) {
      h += '<ul class="rd-zones">';
      f.zones.forEach((z) => {
        h += '<li class="rd-zone"><div class="rd-zone-head">' +
          '<span class="rd-zone-name">' + z.name + "</span>" +
          '<span class="rd-zone-cards">' + z.cards + "</span></div>" +
          '<div class="rd-zone-desc">' + z.desc + "</div></li>";
      });
      h += "</ul>";
    }
    if (f.steps) {
      h += '<ol class="rd-zones rd-steps">';
      f.steps.forEach((s) => { h += '<li class="rd-zone"><div class="rd-zone-desc">' + s + "</div></li>"; });
      h += "</ol>";
    }
    if (f.weave) h += '<p class="rd-structure-lead rd-weave">' + f.weave + "</p>";
    if (f.optional) h += '<p class="reading-detail-hint rd-optional">' + f.optional + "</p>";
    if (f.person) h += '<p class="reading-detail-hint">' + f.person + "</p>";
    h += "</div>";
    return h;
  }

  // ---- 2. 每张牌的牌义（可就地展开）----
  function facet(label, text) {
    return '<div class="rd-facet"><span class="rd-facet-label">' + esc(label) +
      '</span><span class="rd-facet-text">' + esc(text) + "</span></div>";
  }
  function renderCards(r) {
    const c = r.cards;
    let h = '<div class="rd-block"><h3>每张牌的牌义</h3>';
    if (r.layout === "tableau") {
      h += '<p class="rd-structure-lead">牌较多，点任意一张展开细读。</p>';
    }
    c.forEach((card) => {
      const m = meaningOf(card.slug);
      h += '<details class="rd-card"><summary>' +
        '<span class="rd-pos">' + esc(card.position) + "</span>" +
        '<span class="rd-name-plain">' + esc(card.name) + "</span>" +
        '<span class="rd-kw">' + esc(card.keywords) + "</span>" +
        '<span class="rd-more">展开细读</span></summary>' +
        '<div class="rd-card-body">';
      if (m) {
        (m.meaning || "").split("\n").filter(Boolean).forEach((p) => {
          h += '<p class="rd-m">' + esc(p) + "</p>";
        });
        if (m.love) h += facet("感情", m.love);
        if (m.career) h += facet("事业", m.career);
        if (m.advice) h += facet("建议", m.advice);
      }
      h += '<a class="rd-cardlink" href="../../cards/' + esc(card.slug) +
        '/" target="_blank" rel="noopener">打开' + esc(card.name) + "完整牌义页 →</a>";
      h += "</div></details>";
    });
    h += "</div>";
    return h;
  }

  // ---- 3. 牌与牌的组合 ----
  function buildPairs(r) {
    const c = r.cards, pairs = [];
    if (r.layout === "box" && c.length === 9) {
      const center = c[4];
      [{ i: 1, tag: "头顶 · 心上" }, { i: 3, tag: "身后 · 来路" },
       { i: 5, tag: "面前 · 去向" }, { i: 7, tag: "脚下 · 根基" }].forEach((n) => {
        if (c[n.i]) pairs.push({ a: center, b: c[n.i], tag: n.tag });
      });
    } else if (r.layout === "line") {
      for (let i = 0; i < c.length - 1; i++) pairs.push({ a: c[i], b: c[i + 1] });
    }
    return pairs;
  }
  function renderCombos(r) {
    const pairs = buildPairs(r);
    if (!pairs.length) return "";
    let h = '<div class="rd-block"><h3>牌与牌的组合</h3>' +
      '<p class="rd-combo-note">雷诺曼的含义在相邻两张的组合里 —— 把它们连起来读：</p>' +
      '<ul class="rd-combos">';
    pairs.forEach((p) => {
      const t = comboText(p.a.slug, p.b.slug);
      h += '<li><span class="rd-combo-pair"><strong>' + esc(p.a.name) + " + " + esc(p.b.name) + "</strong>" +
        (p.tag ? ' <span class="rd-combo-tag">' + esc(p.tag) + "</span>" : "") + "</span>" +
        '<span class="rd-combo-text">' + (t ? esc(t) : "——") + "</span></li>";
    });
    h += "</ul></div>";
    return h;
  }

  function render() {
    const r = window.__lenoReading;
    if (!r || !r.cards || !r.cards.length) {
      box.innerHTML = '<p class="reading-detail-hint">请先抽牌，再点「解读」。</p>';
      box.classList.add("visible");
      return;
    }
    box.innerHTML = renderStructure(r) + renderCards(r) + renderCombos(r);
    box.classList.add("visible");
  }

  btn.addEventListener("click", render);

  document.addEventListener("leno:drawn", function () {
    box.innerHTML = "";
    box.classList.remove("visible");
  });
})();
