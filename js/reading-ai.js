// ---------- AI 深入解读（可选功能）----------
// 抽牌后，用户可以写下自己的问题，让服务端的 AI 结合这次牌阵给出一段整合式解读。
//
// 前端只负责收集问题、把「问题 + 抽到的牌」发给 /api/interpret，并展示返回的文字。
// 真正调用 Claude API 的密钥只存在于服务端（见 api/interpret.py），永远不进浏览器。
//
// 这个面板只在牌阵页出现（由 tools/build.py 注入），并在首次抽牌后才显示
// （靠 CSS 的 body.has-drawn 控制）。此脚本在没有该面板的页面上是无操作的。

(function () {
  const form = document.getElementById("aiForm");
  const input = document.getElementById("aiQuestion");
  const btn = document.getElementById("aiAskBtn");
  const answer = document.getElementById("aiAnswer");
  if (!form || !input || !btn || !answer) return; // 非牌阵页，直接退出

  const ENDPOINT = "/api/interpret";
  let busy = false;

  function setStatus(kind, html) {
    // kind: "loading" | "error" | "answer"
    answer.className = "ai-answer ai-answer--" + kind + " visible";
    answer.innerHTML = html;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // 把返回的纯文本按空行分段，渲染成 <p>，避免用 innerHTML 注入。
  function renderParagraphs(text) {
    answer.className = "ai-answer ai-answer--answer visible";
    answer.innerHTML = "";
    text
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((para) => {
        const p = document.createElement("p");
        // 段内的单个换行保留为软换行
        para.split(/\n/).forEach((line, i) => {
          if (i) p.appendChild(document.createElement("br"));
          p.appendChild(document.createTextNode(line));
        });
        answer.appendChild(p);
      });
  }

  async function ask() {
    if (busy) return;

    const reading = window.__lenoReading;
    if (!reading || !reading.cards || !reading.cards.length) {
      setStatus("error", "请先抽牌，再让 AI 解读。");
      return;
    }

    const question = input.value.trim();
    if (!question) {
      setStatus("error", "请先写下你想问的问题。");
      input.focus();
      return;
    }

    busy = true;
    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = "解读中……";
    setStatus("loading", "正在结合你的问题解读这个牌阵……");

    try {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          spreadName: reading.spreadName,
          cards: reading.cards,
        }),
      });

      let data = {};
      try {
        data = await resp.json();
      } catch (e) {
        /* 保底：无法解析 JSON */
      }

      if (resp.ok && data.interpretation) {
        renderParagraphs(data.interpretation);
      } else {
        const msg =
          (data && data.message) ||
          "解读服务暂时不可用，请稍后再试。";
        setStatus("error", escapeHTML(msg));
      }
    } catch (e) {
      setStatus("error", "网络似乎出了点问题，请检查连接后再试一次。");
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask();
  });

  // 每次重新抽牌都清空上一次的解读，避免旧解读配新牌造成误解。
  document.addEventListener("leno:drawn", () => {
    answer.className = "ai-answer";
    answer.innerHTML = "";
  });
})();
