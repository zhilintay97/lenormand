// ---------- 雷诺曼牌组 ----------
// 36 张牌，沿用传统编号。每张牌包含 slug（用于网址与图片）、编号、
// 中文名、对应的扑克牌，以及简短的关键词。

const LENORMAND_DECK = [
  { slug: "rider",     number: 1,  name: "骑士",     playingCard: "红桃 9",  keywords: "消息、讯息、迅速到来" },
  { slug: "clover",    number: 2,  name: "幸运草",   playingCard: "方块 6",  keywords: "幸运、机会、短暂的欢喜" },
  { slug: "ship",      number: 3,  name: "船",       playingCard: "黑桃 10", keywords: "旅行、远方、启程" },
  { slug: "house",     number: 4,  name: "房屋",     playingCard: "红桃 K",  keywords: "家庭、亲人、根基" },
  { slug: "tree",      number: 5,  name: "树",       playingCard: "红桃 7",  keywords: "健康、成长、深植的根" },
  { slug: "clouds",    number: 6,  name: "云",       playingCard: "梅花 K",  keywords: "疑虑、混乱、不确定" },
  { slug: "snake",     number: 7,  name: "蛇",       playingCard: "梅花 Q",  keywords: "纠葛、背叛、心机" },
  { slug: "coffin",    number: 8,  name: "棺材",     playingCard: "方块 9",  keywords: "结束、失去、蜕变" },
  { slug: "bouquet",   number: 9,  name: "花束",     playingCard: "黑桃 Q",  keywords: "礼物、魅力、善意" },
  { slug: "scythe",    number: 10, name: "镰刀",     playingCard: "方块 J",  keywords: "突变、斩断、决断" },
  { slug: "whip",      number: 11, name: "鞭子",     playingCard: "梅花 J",  keywords: "冲突、重复、争执" },
  { slug: "birds",     number: 12, name: "飞鸟",     playingCard: "方块 7",  keywords: "交谈、焦虑、两个声音" },
  { slug: "child",     number: 13, name: "孩童",     playingCard: "黑桃 J",  keywords: "崭新、纯真、微小之事" },
  { slug: "fox",       number: 14, name: "狐狸",     playingCard: "梅花 9",  keywords: "机敏、工作、自力更生" },
  { slug: "bear",      number: 15, name: "熊",       playingCard: "梅花 10", keywords: "力量、权威、财务" },
  { slug: "star",      number: 16, name: "星星",     playingCard: "红桃 6",  keywords: "希望、指引、线上世界" },
  { slug: "stork",     number: 17, name: "鹳鸟",     playingCard: "红桃 Q",  keywords: "改变、迁移、新篇章" },
  { slug: "dog",       number: 18, name: "狗",       playingCard: "红桃 10", keywords: "忠诚、友谊、信任" },
  { slug: "tower",     number: 19, name: "高塔",     playingCard: "黑桃 6",  keywords: "权威、孤立、体制" },
  { slug: "garden",    number: 20, name: "花园",     playingCard: "黑桃 8",  keywords: "社交、公众、聚会" },
  { slug: "mountain",  number: 21, name: "高山",     playingCard: "梅花 8",  keywords: "阻碍、延迟、僵局" },
  { slug: "crossroad", number: 22, name: "十字路口", playingCard: "方块 Q",  keywords: "抉择、选项、分岔" },
  { slug: "mice",      number: 23, name: "老鼠",     playingCard: "梅花 7",  keywords: "损耗、磨蚀、暗中流失" },
  { slug: "heart",     number: 24, name: "心",       playingCard: "红桃 J",  keywords: "爱、温柔、情意" },
  { slug: "ring",      number: 25, name: "戒指",     playingCard: "梅花 A",  keywords: "承诺、契约、循环" },
  { slug: "book",      number: 26, name: "书",       playingCard: "方块 10", keywords: "秘密、知识、研习" },
  { slug: "letter",    number: 27, name: "信",       playingCard: "黑桃 7",  keywords: "讯息、文件、白纸黑字" },
  { slug: "man",       number: 28, name: "男人",     playingCard: "红桃 A",  keywords: "男性问卜者、伴侣、男性人物" },
  { slug: "woman",     number: 29, name: "女人",     playingCard: "黑桃 A",  keywords: "女性问卜者、伴侣、女性人物" },
  { slug: "lily",      number: 30, name: "百合",     playingCard: "黑桃 K",  keywords: "安宁、成熟、纯净" },
  { slug: "sun",       number: 31, name: "太阳",     playingCard: "方块 A",  keywords: "喜悦、成功、生命力" },
  { slug: "moon",      number: 32, name: "月亮",     playingCard: "红桃 8",  keywords: "情感、直觉、声誉" },
  { slug: "key",       number: 33, name: "钥匙",     playingCard: "方块 8",  keywords: "突破、笃定、开启" },
  { slug: "fish",      number: 34, name: "鱼",       playingCard: "方块 K",  keywords: "金钱、生意、丰盛" },
  { slug: "anchor",    number: 35, name: "锚",       playingCard: "黑桃 9",  keywords: "稳定、工作、坚守" },
  { slug: "cross",     number: 36, name: "十字架",   playingCard: "梅花 6",  keywords: "重担、宿命、磨难" }
];

function buildDeck() {
  return [...LENORMAND_DECK];
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function drawCards(deck, count) {
  return shuffleDeck(deck).slice(0, count);
}
