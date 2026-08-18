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
        lead: "3×3 方阵：正中那张是核心，先读它。三行是层次（上＝心上／念头、中＝当下／现实、下＝根基／潜流），三列是时间（左＝过去、中＝现在、右＝未来）。每格都是「某层次 × 某时间」，靠相邻组合连读，别给整行整列钉死一个固定判词。",
        zones: [
          { name: "核心 · 中央", cards: nms(c, [4]), desc: "事情的心脏与焦点，一切从这里读起。" },
          { name: "上排 · 心上（意识）", cards: nms(c, [0, 1, 2]), desc: "头顶、心上的事：念头、想法、目标、明面上惦记的。" },
          { name: "中排 · 当下（现实）", cards: nms(c, [3, 4, 5]), desc: "此刻真正在发生的样子，全局的现实基线。" },
          { name: "下排 · 根基（潜流）", cards: nms(c, [6, 7, 8]), desc: "脚下的根基、暗流、隐情，推动局面却不易看见的底层。" },
          { name: "左列 · 过去", cards: nms(c, [0, 3, 6]), desc: "来路，事情之前是什么样。" },
          { name: "中列 · 现在", cards: nms(c, [1, 4, 7]), desc: "当前的处境（核心就在这一列）。" },
          { name: "右列 · 未来", cards: nms(c, [2, 5, 8]), desc: "去向，事情之后往哪走。" },
          { name: "四角 · 速览", cards: nms(c, [0, 2, 6, 8]), desc: "开盘先扫四角，给整盘一个大背景概览。" },
        ],
        weave: `先读中央 ${nm(c, 4)} 定调，再把它与上邻 ${nm(c, 1)}、下邻 ${nm(c, 7)}、左邻 ${nm(c, 3)}、右邻 ${nm(c, 5)} 两两组合（见下方「牌与牌的组合」）。然后把三列（过去→现在→未来）各读成一句看主线，再把三行（心上／当下／根基）各读一句看同一件事在三层的样子，一切收回核心。`,
        person: "若人物牌（男人 / 女人，或你用来代表某人的牌）落在某区：落中央＝此人／此题就是核心；落左列偏过去、右列偏将来；落上排偏停在念头，落下排偏受潜流牵引。紧贴它的那张，往往是当前最影响你的人事物。",
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
      [{ i: 1, tag: "核心 · 上邻" }, { i: 3, tag: "核心 · 左邻" },
       { i: 5, tag: "核心 · 右邻" }, { i: 7, tag: "核心 · 下邻" }].forEach((n) => {
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
