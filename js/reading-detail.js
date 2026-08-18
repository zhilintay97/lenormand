// ---------- 解读面板（本地牌义 + 组合，无 AI）----------
// 抽牌后，用户点「解读」即可看到：
//   1. 每张牌落在它的位置上说了什么（逐张牌义）；
//   2. 相邻两张牌连起来的组合含义（雷诺曼的核心）——线阵取相邻对，
//      3×3 方阵取核心牌与它的四邻。
// 全部数据来自 js/combos.js 与本次抽牌（window.__lenoReading），不访问服务器。
// 这个面板只在牌阵页出现（由 tools/build.py 注入）；没有该面板的页面上无操作。
//
// 日后若要加入 AI 深入解读，就接在这个面板里。

(function () {
  const btn = document.getElementById("readBtn");
  const body = document.getElementById("readBody");
  if (!btn || !body) return; // 非牌阵页

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function comboText(aSlug, bSlug) {
    return (typeof LENORMAND_COMBOS !== "undefined" &&
            LENORMAND_COMBOS[aSlug] && LENORMAND_COMBOS[aSlug][bSlug]) || "";
  }

  // 依牌阵形状决定要展示哪些「相邻组合」。
  function buildPairs(reading) {
    const cards = reading.cards;
    const pairs = [];
    if (reading.layout === "box" && cards.length === 9) {
      // 3×3：核心（第 5 张，下标 4）与上/左/右/下四邻，是方阵最关键的组合。
      const c = cards[4];
      [
        { i: 1, tag: "核心 · 上邻" },
        { i: 3, tag: "核心 · 左邻" },
        { i: 5, tag: "核心 · 右邻" },
        { i: 7, tag: "核心 · 下邻" },
      ].forEach((n) => {
        if (cards[n.i]) pairs.push({ a: c, b: cards[n.i], tag: n.tag });
      });
    } else if (reading.layout === "line") {
      // 线阵：顺着读，相邻两张为一对。
      for (let i = 0; i < cards.length - 1; i++) {
        pairs.push({ a: cards[i], b: cards[i + 1] });
      }
    }
    // 大牌阵牌太多，不逐对罗列（改用宫位提示）。
    return pairs;
  }

  function render() {
    const reading = window.__lenoReading;
    if (!reading || !reading.cards || !reading.cards.length) {
      body.innerHTML = '<p class="reading-detail-hint">请先抽牌，再点「解读」。</p>';
      body.classList.add("visible");
      return;
    }

    const cards = reading.cards;
    let html = "";

    // 1) 逐张牌义
    html += '<div class="rd-block"><h3>每张牌在说什么</h3><ul class="rd-cards">';
    cards.forEach((c) => {
      html +=
        '<li>' +
        '<span class="rd-pos">' + esc(c.position) + '</span>' +
        '<a class="rd-name" href="../../cards/' + esc(c.slug) + '/" target="_blank" rel="noopener">' + esc(c.name) + '</a>' +
        '<span class="rd-kw">' + esc(c.keywords) + '</span>' +
        '</li>';
    });
    html += "</ul></div>";

    // 2) 组合含义
    const pairs = buildPairs(reading);
    if (pairs.length) {
      html += '<div class="rd-block"><h3>牌与牌的组合</h3>' +
              '<p class="rd-combo-note">雷诺曼的含义在相邻两张的组合里 —— 把它们连起来读：</p>' +
              '<ul class="rd-combos">';
      pairs.forEach((p) => {
        const t = comboText(p.a.slug, p.b.slug);
        html +=
          '<li>' +
          '<span class="rd-combo-pair"><strong>' + esc(p.a.name) + ' + ' + esc(p.b.name) + '</strong>' +
          (p.tag ? ' <span class="rd-combo-tag">' + esc(p.tag) + '</span>' : '') + '</span>' +
          '<span class="rd-combo-text">' + (t ? esc(t) : "——") + '</span>' +
          '</li>';
      });
      html += "</ul></div>";
    }

    // 3) 大牌阵：给宫位读法的提示，而不是逐对组合。
    if (reading.layout === "tableau") {
      html +=
        '<p class="reading-detail-hint">大牌阵按宫位读：先找到你的指示牌（男人 / 女人），' +
        '看它落在哪一宫、四周与对角是什么牌。点上方任意牌名，可看它与其余 35 张的全部组合。</p>';
    }

    body.innerHTML = html;
    body.classList.add("visible");
  }

  btn.addEventListener("click", render);

  // 重新抽牌后清空上一次的解读，避免旧解读配新牌造成误解。
  document.addEventListener("leno:drawn", function () {
    body.innerHTML = "";
    body.classList.remove("visible");
  });
})();
