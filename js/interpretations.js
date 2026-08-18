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
  const layout = (spread && spread.layout) || "line";
  const names = drawnCards.map(c => escapeHTML(c.name));

  // 大牌阵：牌数太多，不逐张罗列，读法本就以「落在哪个宫位」为主。
  if (layout === "tableau" || drawnCards.length >= 10) {
    return `<p class="summary">大牌阵已经铺开 —— 36 张牌各自落进一个宫位。先找到你的指示牌（依问卜者性别取「男人」或「女人」），看它落在哪一宫、四周与对角是什么牌，再顺着读开。想看每张牌的含义，点下面的<strong>解读</strong>。</p>`;
  }

  // 九张 3×3 方阵：只有正中是核心，其余八张绕着它补背景。
  if (layout === "box") {
    const center = names[4] || "中央那张";
    return `<p class="summary"><strong>先看正中央的${center}</strong> —— 只有它是这盘的核心，其余八张都绕着它、为它补背景：头顶是心上、脚下是根基、身后是来路、面前是去向，四角给外框。想看每张牌的含义、以及核心牌与四邻的组合，点下面的<strong>解读</strong>。</p>`;
  }

  // 线阵（三张 / 五张）：读成一句话，中间那张是主题。
  const sentence = drawnCards.length === 3
    ? `${names[0]}，接着${names[1]}，最终导向${names[2]}`
    : names.join(" — ");
  return `<p class="summary"><strong>连成一句读：</strong>${sentence}。在雷诺曼里，这一列牌是一整句话 —— 含义在整体之中，中间那张是主题。想看每张牌的含义与相邻组合，点下面的<strong>解读</strong>。</p>`;
}
