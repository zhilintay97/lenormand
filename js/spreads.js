// ---------- 雷诺曼牌阵 ----------

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
    positions: [
      { label: "过去", meaning: "是什么塑造了这个问题" },
      { label: "现在", meaning: "你此刻所处的位置" },
      { label: "未来", meaning: "事情正走向何方" }
    ]
  },
  five_card_spread: {
    slug: "5-card-spread",
    name: "五张牌阵",
    cards: 5,
    positions: [
      { label: "过去",   meaning: "是什么塑造了这个问题" },
      { label: "近期",   meaning: "刚刚离去的" },
      { label: "现在",   meaning: "事情的核心" },
      { label: "不久后", meaning: "正在靠近的" },
      { label: "结果",   meaning: "事情正走向何方" }
    ]
  },
  seven_card_spread: {
    slug: "7-card-spread",
    name: "七张牌阵",
    cards: 7,
    positions: [
      { label: "过去",   meaning: "是什么塑造了这个问题" },
      { label: "近期",   meaning: "刚刚离去的" },
      { label: "外在影响", meaning: "周遭的客观条件" },
      { label: "现在",   meaning: "事情的核心" },
      { label: "牌的建议", meaning: "牌给出的忠告" },
      { label: "不久后", meaning: "正在靠近的" },
      { label: "结果",   meaning: "事情正走向何方" }
    ]
  },
  nine_card_spread: {
    slug: "9-card-spread",
    name: "九张牌阵",
    cards: 9,
    positions: [
      { label: "过去的影响", meaning: "是什么塑造了此事" },
      { label: "近期",       meaning: "刚刚离去的" },
      { label: "正在靠近",   meaning: "已在路上的" },
      { label: "你自己",     meaning: "你在此事中的位置" },
      { label: "事情核心",   meaning: "全局的焦点牌" },
      { label: "他人",       meaning: "局外的相关者" },
      { label: "期待与恐惧", meaning: "你渴望的与你害怕的" },
      { label: "前行之路",   meaning: "最明智的下一步" },
      { label: "结果",       meaning: "事情正走向何方" }
    ]
  },
  grand_tableau: {
    slug: "grand-tableau",
    name: "大牌阵",
    cards: 36,
    positions: LENORMAND_HOUSE_NAMES.map((house, i) => ({
      label: `${i + 1}`,
      meaning: `${house}之宫`
    }))
  },
  relationship_spread: {
    slug: "relationship-spread",
    name: "关系牌阵",
    cards: 5,
    positions: [
      { label: "你",     meaning: "你在这段关系中的状态" },
      { label: "对方",   meaning: "对方的状态" },
      { label: "联结",   meaning: "你们之间的纽带" },
      { label: "阻碍",   meaning: "横在中间的难题" },
      { label: "结果",   meaning: "事情正走向何方" }
    ]
  },
  love_spread: {
    slug: "love-spread",
    name: "爱情牌阵",
    cards: 5,
    positions: [
      { label: "感情现状",   meaning: "你此刻的感情处境" },
      { label: "你的给予",   meaning: "你在爱里的天赋" },
      { label: "你的阻碍",   meaning: "妨碍亲密的东西" },
      { label: "爱的诉求",   meaning: "爱对你的要求" },
      { label: "正在靠近",   meaning: "已在路上的" }
    ]
  }
};
