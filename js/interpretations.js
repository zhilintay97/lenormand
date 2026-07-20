// ---------- 解读辅助 ----------
// 雷诺曼重「把牌连成句子」，而不是逐张拆解含义。
// 因此单张牌的说明保持简短，末尾的总结再把它们串起来。

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getCardInterpretation(card, positionLabel) {
  return `<strong>${escapeHTML(card.name)}</strong>落在「${escapeHTML(positionLabel)}」：${escapeHTML(card.keywords)}。`;
}

function getReadingSummary(spread, drawnCards) {
  // 大型牌阵（如大牌阵）牌数太多，不适合逐张罗列，
  // 而且它的读法本就以「落在哪个宫位」为主，而非连句。
  if (drawnCards.length >= 10) {
    return (
      `<p class="summary">你的大牌阵已经铺开。每张牌都落在一个编号宫位里 —— 请结合它落在哪一宫、左右邻牌是什么，以及它与你的指示牌（依问卜者性别取「男人」或「女人」）相距多远，来读这张牌。</p>` +
      `<p class="summary">点击上方任意牌名，即可打开该牌的完整含义与它与其余 35 张牌的全部组合。</p>`
    );
  }

  const lines = drawnCards.map((card, i) => {
    const pos = spread.positions[i];
    return `<p class="summary"><strong>${escapeHTML(pos.label)}：</strong>${escapeHTML(card.name)} —— ${escapeHTML(card.keywords)}。</p>`;
  });

  const names = drawnCards.map(c => escapeHTML(c.name));
  const sentence = drawnCards.length === 3
    ? `<p class="summary"><strong>连成一句读：</strong>${names[0]}，接着${names[1]}，最终导向${names[2]}。在雷诺曼里，三张牌构成一整句话 —— 含义在整体之中，而不在零散的碎片里。</p>`
    : `<p class="summary"><strong>合起来读：</strong>${names.join("、")}。在雷诺曼里，这些牌构成一整句话 —— 含义在整体之中，而不在零散的碎片里。</p>`;

  return lines.join("") + sentence;
}
