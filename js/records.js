// ---------- 日历 + 记录（雷诺曼与塔罗合并）----------
// 读取 localStorage 里的 boyue.records，画一个月历（有抽牌的日子标点、可点选筛选），
// 下面列出每次抽牌的详情。纯本地，无需服务器。

(function () {
  "use strict";

  const STORE_KEY = "boyue.records";
  const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
  const SYS = {
    lenormand: { label: "雷诺曼", cls: "sys-leno" },
    tarot: { label: "塔罗", cls: "sys-tarot" },
  };

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function keyOf(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); } // m 从 0 起

  function modeLabel(r) {
    if (r.system === "tarot") return r.mode === "daily" ? "每日一牌" : "问题占卜";
    if (r.system === "lenormand") return r.spread || "牌阵";
    return r.mode || "";
  }
  function cardsText(r) {
    if (!r.cards || !r.cards.length) return "";
    return r.cards
      .map((c) => c.name + (c.orientation ? "（" + c.orientation + "）" : ""))
      .join("、");
  }
  function escapeText(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  const records = loadRecords();
  const byDate = {};
  records.forEach((r) => { (byDate[r.date] = byDate[r.date] || []).push(r); });

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0 起
  let selected = null; // "yyyy-mm-dd" 或 null（看全部）

  const calEl = document.getElementById("calendar");
  const listEl = document.getElementById("recordsList");
  const titleEl = document.getElementById("recordsTitle");

  function systemsOn(k) {
    const set = {};
    (byDate[k] || []).forEach((r) => { set[r.system] = true; });
    return Object.keys(set);
  }

  function renderCalendar() {
    if (!calEl) return;
    const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());

    let html =
      '<div class="cal-head">' +
      '<button class="cal-nav" data-nav="-1" aria-label="上个月">‹</button>' +
      '<div class="cal-title">' + viewYear + "年 " + (viewMonth + 1) + "月</div>" +
      '<button class="cal-nav" data-nav="1" aria-label="下个月">›</button>' +
      "</div>";
    html += '<div class="cal-grid cal-weekdays">' +
      WEEK.map((w) => '<div class="cal-weekday">' + w + "</div>").join("") + "</div>";
    html += '<div class="cal-grid cal-days">';
    for (let i = 0; i < startWeekday; i++) html += '<div class="cal-cell cal-empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const k = keyOf(viewYear, viewMonth, d);
      const syss = systemsOn(k);
      const cls = ["cal-cell"];
      if (syss.length) cls.push("has-records");
      if (k === todayKey) cls.push("is-today");
      if (k === selected) cls.push("is-selected");
      const dots = syss
        .map((s) => '<span class="cal-dot ' + (SYS[s] ? SYS[s].cls : "") + '"></span>')
        .join("");
      html +=
        '<button class="' + cls.join(" ") + '" data-date="' + k + '"' +
        (syss.length ? "" : " disabled") + ">" +
        '<span class="cal-num">' + d + "</span>" +
        '<span class="cal-dots">' + dots + "</span></button>";
    }
    html += "</div>";
    calEl.innerHTML = html;
  }

  function renderList() {
    if (!listEl) return;
    let items = records.slice();
    if (selected) items = items.filter((r) => r.date === selected);
    items = items.reverse(); // 新的在前

    if (titleEl) {
      titleEl.textContent = selected
        ? selected + " · " + items.length + " 次抽牌"
        : "全部记录 · " + items.length + " 次";
    }

    if (!items.length) {
      listEl.innerHTML =
        '<p class="records-empty">' +
        (selected
          ? "这天还没有抽牌记录。"
          : "还没有任何抽牌记录。去雷诺曼或塔罗抽一次，这里就会留下痕迹。") +
        "</p>";
      return;
    }

    listEl.innerHTML = items.map((r) => {
      const sys = SYS[r.system] || { label: r.system, cls: "" };
      const time = r.ts
        ? new Date(r.ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
        : "";
      const q = r.question ? '<div class="record-q">「' + escapeText(r.question) + "」</div>" : "";
      const cat = r.category ? '<span class="record-cat">' + escapeText(r.category) + "问题</span>" : "";
      return (
        '<div class="record-item">' +
        '<div class="record-head">' +
        '<span class="record-badge ' + sys.cls + '">' + sys.label + "</span>" +
        '<span class="record-mode">' + escapeText(modeLabel(r)) + "</span>" +
        cat +
        '<span class="record-date">' + r.date + (time ? " " + time : "") + "</span>" +
        "</div>" +
        q +
        '<div class="record-cards">' + escapeText(cardsText(r)) + "</div>" +
        "</div>"
      );
    }).join("");
  }

  function render() { renderCalendar(); renderList(); }

  if (calEl) {
    calEl.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) {
        viewMonth += parseInt(nav.dataset.nav, 10);
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        renderCalendar();
        return;
      }
      const cell = e.target.closest("[data-date]");
      if (cell && !cell.disabled) {
        selected = selected === cell.dataset.date ? null : cell.dataset.date;
        render();
      }
    });
  }

  const allBtn = document.getElementById("recordsAll");
  if (allBtn) allBtn.addEventListener("click", () => { selected = null; render(); });

  // 移动端汉堡菜单（记录页不加载 app.js，这里自带一份）
  (function initNav() {
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
  })();

  render();
})();
