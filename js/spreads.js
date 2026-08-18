// ---------- 雷诺曼牌阵 ----------
// 雷诺曼只有两种正宗阵形：一行（线阵），或方阵（Tableau）。
// 牌不是逐个「牌位」单独解，而是像一句话一样连起来读，靠相邻两张的
// 组合产生含义。下面四个阵都遵循这一点：
//   · 三张 / 五张 —— 线阵，读成一句话，中间那张是主题。
//   · 九张 —— 3×3 方阵，中央是核心，横看是时间，纵看是脉络。
//   · 大牌阵 —— 36 张全上，按宫位读。

// 大牌阵（Grand Tableau）的宫位名称，按 1-36 的传统顺序排列。
const LENORMAND_HOUSE_NAMES = [
  "骑士", "幸运草", "船", "房屋", "树", "云", "蛇",
  "棺材", "花束", "镰刀", "鞭子", "飞鸟", "孩童", "狐狸",
  "熊", "星星", "鹳鸟", "狗", "高塔", "花园", "高山",
  "十字路口", "老鼠", "心", "戒指", "书", "信", "男人",
  "女人", "百合", "太阳", "月亮", "钥匙", "鱼", "锚", "十字架"
];

const SPREADS = {
  three_card_spread: {
    slug: "3-card-spread",
    name: "三张牌阵",
    cards: 3,
    layout: "line",
    positions: [
      { label: "过去", meaning: "是什么塑造了这个问题" },
      { label: "现在", meaning: "事情的核心，此刻的处境" },
      { label: "未来", meaning: "事情正走向何方" }
    ]
  },
  five_card_spread: {
    slug: "5-card-spread",
    name: "五张牌阵",
    cards: 5,
    layout: "line",
    positions: [
      { label: "过去",   meaning: "是什么塑造了这个问题" },
      { label: "近期",   meaning: "刚刚离去的" },
      { label: "现在",   meaning: "事情的核心，整列的焦点" },
      { label: "不久后", meaning: "正在靠近的" },
      { label: "结果",   meaning: "事情正走向何方" }
    ]
  },
  // 九张 = 3×3 方阵（Box）。中央那张（第 5）是核心；
  // 上行是过去/来路，中行是当下，下行是未来/去向；也可按列读。
  nine_card_spread: {
    slug: "9-card-spread",
    name: "九张牌阵",
    cards: 9,
    layout: "box",
    positions: [
      { label: "左上", meaning: "上行 · 过去与来路" },
      { label: "正上", meaning: "上行 · 过去与来路" },
      { label: "右上", meaning: "上行 · 过去与来路" },
      { label: "左中", meaning: "中行 · 当下的现实" },
      { label: "核心", meaning: "全局焦点 · 事情的正中央" },
      { label: "右中", meaning: "中行 · 当下的现实" },
      { label: "左下", meaning: "下行 · 事情的去向" },
      { label: "正下", meaning: "下行 · 事情的去向" },
      { label: "右下", meaning: "下行 · 事情的去向" }
    ]
  },
  grand_tableau: {
    slug: "grand-tableau",
    name: "大牌阵",
    cards: 36,
    layout: "tableau",
    positions: LENORMAND_HOUSE_NAMES.map((house, i) => ({
      label: `${i + 1}`,
      meaning: `${house}之宫`
    }))
  }
};
