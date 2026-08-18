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
  // 九张 = 3×3 方阵（Box）。只有正中（第 5）是核心；其余八张绕着它、
  // 为它补背景：正上=头顶（心上）、正下=脚下（根基）、正左=身后（来路）、
  // 正右=面前（去向），四角是更外围的框架。
  nine_card_spread: {
    slug: "9-card-spread",
    name: "九张牌阵",
    cards: 9,
    layout: "box",
    positions: [
      { label: "左上", meaning: "外框 · 背景" },
      { label: "头顶", meaning: "心上 · 念头" },
      { label: "右上", meaning: "外框 · 背景" },
      { label: "身后", meaning: "来路 · 过去" },
      { label: "核心", meaning: "事情的核心" },
      { label: "面前", meaning: "去向 · 未来" },
      { label: "左下", meaning: "外框 · 背景" },
      { label: "脚下", meaning: "根基 · 潜流" },
      { label: "右下", meaning: "外框 · 背景" }
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
