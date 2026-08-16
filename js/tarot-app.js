// ---------- 塔罗 App：滑动挑牌 ----------
// 交互：铺一排背面牌 → 用户滑动、点选自己想要的 N 张 → 翻牌，出解读。
// 每日一牌（挑 1 张，每天一次，存本地）；问题占卜（挑 3 张）。
// 依赖 js/tarot-deck.js（TAROT_DECK / drawTarot / TAROT_GROUPS）。
// 记录写入 localStorage，供以后的日历/记录页读取（键：boyue.records）。

(function () {
  "use strict";

  // ---------- 本地记录（雷诺曼与塔罗共用同一份）----------
  const STORE_KEY = "boyue.records";

  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveRecord(rec) {
    try {
      const all = loadRecords();
      all.push({ ts: Date.now(), ...rec });
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) {
      /* localStorage 不可用时静默跳过 */
    }
  }
  function todayKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  // ---------- 牌面（真实莱德·韦特图，公版）----------
  function buildFace(card) {
    // card 含 slug/orientation/reversedDraw（drawTarot 已赋值）；逆位时图片旋转 180°
    const el = document.createElement("div");
    el.className = "tcard-face" + (card.reversedDraw ? " reversed" : "");
    // 正常走站内文件；自包含预览可通过 window.__TAROT_IMG[slug] 注入内嵌图
    const src = (window.__TAROT_IMG && window.__TAROT_IMG[card.slug]) || `/images/tarot/${card.slug}.jpg`;
    el.innerHTML =
      `<img class="tface-img" src="${src}" alt="${card.name}" draggable="false" />` +
      `<div class="tface-tag">${card.name} · ${card.orientation}</div>`;
    return el;
  }

  // 整副洗好、含正逆位的牌，喂给 CardPicker：第 i 格 => deck[i]，
  // 你点到哪张、翻出来就是哪张（点选那刻牌就定了，公平随机）。
  function fullTarotDeck() {
    return drawTarot(TAROT_DECK.length);
  }

  // ---------- 问题占卜（挑 3 张）----------
  function initQuestion() {
    const root = document.getElementById("tarotQuestion");
    if (!root) return;
    const input = root.querySelector("#tqInput");
    const startBtn = root.querySelector("#tqStart");
    const stage = root.querySelector("#tqStage");
    const result = root.querySelector("#tqResult");

    const POSITIONS = ["现状", "阻碍", "建议"];

    startBtn.addEventListener("click", () => {
      const q = (input.value || "").trim();
      result.innerHTML = "";
      result.classList.remove("visible");
      CardPicker.mount(stage, {
        cards: fullTarotDeck(),
        count: 3,
        hintText: `从 ${TAROT_DECK.length} 张里任选 3 张`,
        onReveal: (cards) => {
          renderReading(stage, result, cards, POSITIONS, q);
          saveRecord({
            date: todayKey(), system: "tarot", mode: "question",
            category: guessCategory(q),
            question: q, cards: cards.map(cardRec),
          });
        },
      });
      const smooth = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      stage.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    });
  }

  function cardRec(c) {
    return { slug: c.slug, name: c.name, orientation: c.orientation };
  }

  function renderReading(stage, result, cards, positions, question) {
    stage.innerHTML = "";
    const row = document.createElement("div");
    row.className = "reading-row";
    cards.forEach((card, i) => {
      const col = document.createElement("div");
      col.className = "reading-col";
      col.appendChild(buildFace(card));
      const pos = document.createElement("div");
      pos.className = "reading-pos";
      pos.textContent = positions[i] || "";
      col.appendChild(pos);
      const kw = document.createElement("div");
      kw.className = "reading-kw";
      kw.textContent = card.keywords;
      col.appendChild(kw);
      row.appendChild(col);
    });
    stage.appendChild(row);

    result.innerHTML = weaveReading(cards, positions, question);
    result.classList.add("visible");
  }

  // 把抽到的牌按位置串成一段可读的解读（纯模板，不依赖 AI）
  function firstKeyword(c) {
    return String(c.keywords || "").split(/[、,，/]/)[0].trim() || c.name;
  }

  // 从问题文字里粗略判断类别（感情/事业/财运/学业/健康/人际/综合），用于顶部标签与记录归类
  function guessCategory(question) {
    const q = String(question || "");
    const groups = [
      ["感情", ["喜欢", "爱", "感情", "恋", "分手", "复合", "暧昧", "心动", "对象", "男朋友", "女朋友", "男友", "女友", "结婚", "婚姻", "前任", "表白", "相亲", "异地", "这段关系"]],
      ["事业", ["工作", "事业", "职业", "换工作", "跳槽", "老板", "同事", "项目", "面试", "升职", "加薪", "创业", "生意", "公司", "职场", "offer", "上司", "离职", "副业"]],
      ["财运", ["钱", "财运", "投资", "收入", "赚", "理财", "买房", "股票", "基金", "债务", "破财"]],
      ["学业", ["考试", "学业", "学习", "考研", "升学", "毕业", "论文", "上岸", "录取", "成绩"]],
      ["健康", ["健康", "身体", "生病", "康复", "手术", "失眠"]],
      ["人际", ["朋友", "家人", "父母", "家庭", "人际", "室友", "闺蜜"]],
    ];
    let best = "综合", bestN = 0;
    for (const [name, kws] of groups) {
      let n = 0;
      for (const k of kws) if (q.indexOf(k) >= 0) n++;
      if (n > bestN) { bestN = n; best = name; }
    }
    return best;
  }
  // 一张解读卡片：标题（可带位置小标签）+ 正文
  function readingBox(title, body, opts) {
    opts = opts || {};
    const cls = "reading-card" + (opts.variant ? " reading-card--" + opts.variant : "");
    const tag = opts.tag ? `<span class="reading-pos-inline">${opts.tag}</span>` : "";
    return (
      `<div class="${cls}"><div class="reading-card-head">${tag}` +
      `<span class="reading-card-title">${title}</span></div>` +
      `<p class="reading-card-body">${body}</p></div>`
    );
  }

  // 三张牌的完整解读（分段：直接结论 / 问题重点 / 现状·阻碍·建议 / 综合趋势 / 行动建议）
  // 纯模板：内容由牌面正逆位与关键词推导，结构对齐 june；更贴合问题的深度需接 AI。
  function weaveReading(cards, positions, question) {
    // 非三张的兜底：逐张列出
    if (cards.length !== 3) {
      const simple = cards
        .map((c, i) => readingBox(`${c.name} · ${c.orientation}`, `${c.keywords}。`, { tag: positions[i] }))
        .join("");
      return `<div class="reading-body">${simple}</div>`;
    }

    const [a, b, c] = cards;
    const rev = cards.filter((x) => x.reversedDraw).length;
    const stance =
      rev === 0 ? "整体偏顺、偏正面"
      : rev === 1 ? "整体偏顺，但有一处要留意"
      : rev === 2 ? "阻力偏多，需要主动调整"
      : "当前阻力很大，先稳住再谈推进";
    const advKw = firstKeyword(c);

    const conclusion =
      `牌面${stance}。就你问的这件事，方向更接近「${advKw}」——` +
      `${c.reversedDraw ? "眼下更适合先收一收、别急着用力" : "可以主动一点、往前一步"}。`;

    const focus = question
      ? `你真正想弄清楚的，是「${escapeText(question)}」。下面从现状、阻碍、建议三个角度回应它。`
      : "";

    const BODY = {
      "现状": (x) => `眼下的状态是——${x.keywords}。`,
      "阻碍": (x) => `真正卡住你的，是——${x.keywords}。`,
      "建议": (x) => `牌面给的建议是——${x.keywords}。`,
    };
    const posBoxes = cards
      .map((x, i) =>
        readingBox(`${x.name} · ${x.orientation}`, (BODY[positions[i]] || ((y) => `${y.keywords}。`))(x), {
          tag: positions[i],
        })
      )
      .join("");

    const tone =
      rev === 0 ? "三张都是正位，路比较顺，可以放心推进。"
      : rev === 3 ? "三张都是逆位，短期阻力明显，更适合先向内调整、别硬来。"
      : `其中 ${rev} 张逆位，中间有卡点，别只看顺的一面。`;
    const trend = `现状落在「${firstKeyword(a)}」，卡点是「${firstKeyword(b)}」，出路指向「${advKw}」——${tone}`;

    const action = c.reversedDraw
      ? `先别用力过猛：把「${advKw}」往回收一收，稳住节奏，等时机更明朗再推进，会比硬来省力。`
      : `顺着「${advKw}」去做：主动一点、往前迈一步，比反复内耗更有用。`;

    return (
      `<div class="reading-body">` +
      (question ? `<div class="reading-cat">${guessCategory(question)}问题</div>` : "") +
      readingBox("直接结论", conclusion) +
      (focus ? readingBox("问题重点", focus) : "") +
      posBoxes +
      readingBox("综合趋势", trend) +
      readingBox("行动建议", action, { variant: "synth" }) +
      `</div>`
    );
  }

  // 从本地记录（只存了 slug/name/orientation）还原成可渲染的牌，用于"今天已抽过"回显
  function hydrateCard(saved) {
    const base = TAROT_DECK.find((c) => c.slug === saved.slug) || {};
    const reversed = saved.orientation === "逆位";
    return {
      slug: saved.slug,
      name: saved.name || base.name || "",
      group: base.group,
      num: base.num,
      reversedDraw: reversed,
      orientation: saved.orientation,
      keywords: reversed ? base.reversed : base.upright,
    };
  }

  // 每日一牌的统一渲染（首次抽 / 今天已抽过 都走这里，都带牌图）
  function renderDaily(stage, result, card, already) {
    stage.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "reading-row single";
    const col = document.createElement("div");
    col.className = "reading-col";
    col.appendChild(buildFace(card));
    wrap.appendChild(col);
    stage.appendChild(wrap);
    result.innerHTML =
      `<div class="reading-body"><div class="reading-card">` +
      `<div class="reading-card-head"><span class="reading-pos-inline">今日</span><span class="reading-card-title">${card.name} · ${card.orientation}</span></div>` +
      `<p class="reading-card-body">${card.keywords || ""}。${card.reversedDraw ? "逆位，提醒你今天多往内看、慢一点、别急着下结论。" : "正位，是顺的信号，适合把想做的事往前带一步。"}</p></div></div>` +
      `<p class="reading-note">${already ? "今天已经抽过了，明天再来。" : "让今天的牌面落定，回看时它会提醒你此刻的状态。"}</p>`;
    result.classList.add("visible");
  }

  function escapeText(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // ---------- 每日一牌（挑 1 张，每天一次）----------
  function initDaily() {
    const root = document.getElementById("tarotDaily");
    if (!root) return;
    const dateEl = root.querySelector("#tdDate");
    const stage = root.querySelector("#tdStage");
    const result = root.querySelector("#tdResult");
    if (dateEl) dateEl.textContent = todayKey();

    // 今天抽过了就直接展示
    const existing = loadRecords().find(
      (r) => r.system === "tarot" && r.mode === "daily" && r.date === todayKey()
    );
    if (existing) {
      renderDaily(stage, result, hydrateCard(existing.cards[0]), true);
      return;
    }

    CardPicker.mount(stage, {
      cards: fullTarotDeck(),
      count: 1,
      hintText: `从 ${TAROT_DECK.length} 张里抽 1 张`,
      onReveal: (cards) => {
        renderDaily(stage, result, cards[0], false);
        saveRecord({
          date: todayKey(), system: "tarot", mode: "daily",
          cards: [cardRec(cards[0])],
        });
      },
    });
  }

  // ---------- 简易 tab 切换 ----------
  function initTabs() {
    const tabs = document.querySelectorAll(".tarot-tab");
    const panels = document.querySelectorAll(".tarot-panel");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        const panel = document.getElementById(tab.dataset.panel);
        if (panel) panel.classList.add("active");
      });
    });
  }

  // 移动端汉堡菜单（与 app.js 的行为一致，塔罗页不加载 app.js，这里自带一份）
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
    }
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    nav.addEventListener("click", (e) => { if (e.target.tagName === "A") setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  function init() {
    initNav();
    initTabs();
    initDaily();
    initQuestion();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
