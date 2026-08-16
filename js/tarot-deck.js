// ---------- 塔罗牌组（78 张 · 韦特体系）----------
// 22 张大阿尔卡纳 + 56 张小阿尔卡纳（权杖/圣杯/宝剑/星币，各 14 张）。
// 每张牌含 slug（英文，供网址/图片用）、编号、中文名、花色/类别，
// 以及正位（upright）与逆位（reversed）的简短关键词。
// slug 与图片文件名保持英文，中文名用于展示。

const TAROT_DECK = [
  // ===== 大阿尔卡纳 Major Arcana =====
  { slug: "fool",           num: 0,  name: "愚人",       group: "major", upright: "新的开始、纯真、冒险、自由", reversed: "鲁莽、逃避、不切实际" },
  { slug: "magician",       num: 1,  name: "魔术师",     group: "major", upright: "行动力、创造、专注、显化", reversed: "操纵、拖延、才华错用" },
  { slug: "high-priestess", num: 2,  name: "女祭司",     group: "major", upright: "直觉、潜意识、神秘、内在智慧", reversed: "忽视直觉、秘密、表里不一" },
  { slug: "empress",        num: 3,  name: "皇后",       group: "major", upright: "丰饶、母性、感官、滋养", reversed: "依赖、创造受阻、过度呵护" },
  { slug: "emperor",        num: 4,  name: "皇帝",       group: "major", upright: "权威、秩序、稳固、掌控", reversed: "专制、僵化、失控" },
  { slug: "hierophant",     num: 5,  name: "教皇",       group: "major", upright: "传统、信仰、指引、体制", reversed: "墨守成规、叛逆、教条" },
  { slug: "lovers",         num: 6,  name: "恋人",       group: "major", upright: "爱、结合、选择、和谐", reversed: "失衡、诱惑、错误的选择" },
  { slug: "chariot",        num: 7,  name: "战车",       group: "major", upright: "意志、前进、掌控、胜利", reversed: "失控、方向不明、受阻" },
  { slug: "strength",       num: 8,  name: "力量",       group: "major", upright: "勇气、耐心、内在力量、柔韧", reversed: "自我怀疑、失控、软弱" },
  { slug: "hermit",         num: 9,  name: "隐者",       group: "major", upright: "内省、独处、寻找、指引", reversed: "孤立、逃避、迷失" },
  { slug: "wheel",          num: 10, name: "命运之轮",   group: "major", upright: "转变、机运、循环、转折", reversed: "厄运、失控、抗拒变化" },
  { slug: "justice",        num: 11, name: "正义",       group: "major", upright: "公正、因果、真相、平衡", reversed: "不公、逃避责任、偏颇" },
  { slug: "hanged-man",     num: 12, name: "倒吊人",     group: "major", upright: "暂停、放下、换个角度、牺牲", reversed: "拖延、抗拒、无谓的牺牲" },
  { slug: "death",          num: 13, name: "死神",       group: "major", upright: "结束、转化、重生、放手", reversed: "抗拒改变、停滞、恐惧" },
  { slug: "temperance",     num: 14, name: "节制",       group: "major", upright: "平衡、调和、耐心、中庸", reversed: "失衡、极端、缺乏耐心" },
  { slug: "devil",          num: 15, name: "恶魔",       group: "major", upright: "束缚、欲望、执着、阴影", reversed: "挣脱、觉醒、放下执念" },
  { slug: "tower",          num: 16, name: "高塔",       group: "major", upright: "突变、崩塌、真相、觉醒", reversed: "逃避剧变、拖延崩解、恐惧" },
  { slug: "star",           num: 17, name: "星星",       group: "major", upright: "希望、疗愈、灵感、指引", reversed: "失望、信心动摇、迷惘" },
  { slug: "moon",           num: 18, name: "月亮",       group: "major", upright: "潜意识、幻象、不安、直觉", reversed: "释放恐惧、真相浮现、迷雾散去" },
  { slug: "sun",            num: 19, name: "太阳",       group: "major", upright: "喜悦、成功、活力、光明", reversed: "暂时受挫、过度乐观、延迟的快乐" },
  { slug: "judgement",      num: 20, name: "审判",       group: "major", upright: "觉醒、召唤、清算、重生", reversed: "自我批判、逃避召唤、悔恨" },
  { slug: "world",          num: 21, name: "世界",       group: "major", upright: "圆满、完成、整合、成就", reversed: "未竟、拖延、差一步" },

  // ===== 权杖 Wands（火）=====
  { slug: "wands-ace",    num: 1,  name: "权杖一",     group: "wands", upright: "灵感、契机、行动的火花、潜能", reversed: "延迟、动力不足、错失时机" },
  { slug: "wands-2",      num: 2,  name: "权杖二",     group: "wands", upright: "规划、抉择、远景、掌控", reversed: "犹豫、格局受限、计划落空" },
  { slug: "wands-3",      num: 3,  name: "权杖三",     group: "wands", upright: "展望、扩张、等待回报、远行", reversed: "受阻、短视、延误" },
  { slug: "wands-4",      num: 4,  name: "权杖四",     group: "wands", upright: "庆祝、稳定、归属、里程碑", reversed: "不稳、过渡期、缺乏归属" },
  { slug: "wands-5",      num: 5,  name: "权杖五",     group: "wands", upright: "竞争、冲突、分歧、磨合", reversed: "化解冲突、内耗、回避竞争" },
  { slug: "wands-6",      num: 6,  name: "权杖六",     group: "wands", upright: "胜利、认可、荣耀、领导", reversed: "失利、骄傲、认可延迟" },
  { slug: "wands-7",      num: 7,  name: "权杖七",     group: "wands", upright: "坚守、防卫、挑战、立场", reversed: "退缩、力不从心、放弃立场" },
  { slug: "wands-8",      num: 8,  name: "权杖八",     group: "wands", upright: "迅速、进展、消息、行动", reversed: "延迟、混乱、仓促" },
  { slug: "wands-9",      num: 9,  name: "权杖九",     group: "wands", upright: "坚持、戒备、韧性、最后一关", reversed: "精疲力竭、防卫过度、快要放弃" },
  { slug: "wands-10",     num: 10, name: "权杖十",     group: "wands", upright: "重担、责任、压力、承担", reversed: "卸下重担、过劳、推卸" },
  { slug: "wands-page",   num: 11, name: "权杖侍从",   group: "wands", upright: "热情、探索、消息、初生的火", reversed: "三分钟热度、方向不明、拖延" },
  { slug: "wands-knight", num: 12, name: "权杖骑士",   group: "wands", upright: "冲劲、冒险、行动、热血", reversed: "鲁莽、急躁、虎头蛇尾" },
  { slug: "wands-queen",  num: 13, name: "权杖王后",   group: "wands", upright: "自信、魅力、热情、独立", reversed: "缺乏自信、善妒、消耗" },
  { slug: "wands-king",   num: 14, name: "权杖国王",   group: "wands", upright: "远见、领导、魄力、感召", reversed: "专断、冲动、刚愎" },

  // ===== 圣杯 Cups（水）=====
  { slug: "cups-ace",    num: 1,  name: "圣杯一",     group: "cups", upright: "爱、情感萌发、慈悲、丰盈", reversed: "情感压抑、空虚、错失" },
  { slug: "cups-2",      num: 2,  name: "圣杯二",     group: "cups", upright: "结合、共鸣、伙伴、吸引", reversed: "失和、分歧、关系失衡" },
  { slug: "cups-3",      num: 3,  name: "圣杯三",     group: "cups", upright: "欢聚、友谊、庆祝、社群", reversed: "过度放纵、闲言、聚散" },
  { slug: "cups-4",      num: 4,  name: "圣杯四",     group: "cups", upright: "倦怠、内省、错失、不满足", reversed: "重燃兴趣、走出低潮、接受" },
  { slug: "cups-5",      num: 5,  name: "圣杯五",     group: "cups", upright: "失落、遗憾、哀伤、执着于失去", reversed: "接受、疗愈、看见剩下的" },
  { slug: "cups-6",      num: 6,  name: "圣杯六",     group: "cups", upright: "回忆、纯真、旧情、温暖", reversed: "沉溺过去、放下旧事、成长" },
  { slug: "cups-7",      num: 7,  name: "圣杯七",     group: "cups", upright: "幻想、选择、诱惑、白日梦", reversed: "看清、聚焦、务实" },
  { slug: "cups-8",      num: 8,  name: "圣杯八",     group: "cups", upright: "离开、寻找、放下、转身", reversed: "徘徊、逃避、勉强留下" },
  { slug: "cups-9",      num: 9,  name: "圣杯九",     group: "cups", upright: "满足、如愿、享受、丰足", reversed: "表面满足、贪求、落差" },
  { slug: "cups-10",     num: 10, name: "圣杯十",     group: "cups", upright: "圆满、家庭、幸福、和谐", reversed: "表面和睦、失谐、期望落差" },
  { slug: "cups-page",   num: 11, name: "圣杯侍从",   group: "cups", upright: "感性、灵感、讯息、初心", reversed: "情绪化、逃避、幼稚" },
  { slug: "cups-knight", num: 12, name: "圣杯骑士",   group: "cups", upright: "浪漫、追求、理想、邀约", reversed: "空想、善变、失约" },
  { slug: "cups-queen",  num: 13, name: "圣杯王后",   group: "cups", upright: "温柔、直觉、共情、包容", reversed: "情绪淹没、依赖、边界不清" },
  { slug: "cups-king",   num: 14, name: "圣杯国王",   group: "cups", upright: "沉稳、包容、情感成熟、外柔内定", reversed: "情绪压抑、冷漠、操控" },

  // ===== 宝剑 Swords（风）=====
  { slug: "swords-ace",    num: 1,  name: "宝剑一",   group: "swords", upright: "真相、清晰、突破、决断", reversed: "混乱、错判、滥用力量" },
  { slug: "swords-2",      num: 2,  name: "宝剑二",   group: "swords", upright: "两难、僵持、回避、平衡", reversed: "打破僵局、看清、逃避太久" },
  { slug: "swords-3",      num: 3,  name: "宝剑三",   group: "swords", upright: "心碎、伤痛、分离、真相刺人", reversed: "疗愈、走出伤痛、释怀" },
  { slug: "swords-4",      num: 4,  name: "宝剑四",   group: "swords", upright: "休息、疗养、沉淀、暂停", reversed: "复出、疲惫未消、被迫停歇" },
  { slug: "swords-5",      num: 5,  name: "宝剑五",   group: "swords", upright: "冲突、输赢、代价、逞强", reversed: "和解、放下、两败俱伤" },
  { slug: "swords-6",      num: 6,  name: "宝剑六",   group: "swords", upright: "过渡、离开、驶向平静、疗愈之旅", reversed: "滞留、放不下、艰难的迁移" },
  { slug: "swords-7",      num: 7,  name: "宝剑七",   group: "swords", upright: "策略、隐瞒、投机、独行", reversed: "坦白、被识破、收手" },
  { slug: "swords-8",      num: 8,  name: "宝剑八",   group: "swords", upright: "受困、自缚、无力、思维牢笼", reversed: "松绑、看见出路、自我解放" },
  { slug: "swords-9",      num: 9,  name: "宝剑九",   group: "swords", upright: "焦虑、失眠、担忧、心魔", reversed: "走出焦虑、面对、夸大的恐惧" },
  { slug: "swords-10",     num: 10, name: "宝剑十",   group: "swords", upright: "终结、谷底、放手、痛的尽头", reversed: "触底反弹、复原、最坏已过" },
  { slug: "swords-page",   num: 11, name: "宝剑侍从", group: "swords", upright: "好奇、机敏、讯息、求知", reversed: "多疑、口舌、鲁莽言语" },
  { slug: "swords-knight", num: 12, name: "宝剑骑士", group: "swords", upright: "果决、直率、行动如风、进取", reversed: "莽撞、咄咄逼人、失控" },
  { slug: "swords-queen",  num: 13, name: "宝剑王后", group: "swords", upright: "理性、独立、洞察、界线分明", reversed: "冷峻、苛刻、封闭" },
  { slug: "swords-king",   num: 14, name: "宝剑国王", group: "swords", upright: "理智、公正、权威、清明", reversed: "专断、冷酷、滥权" },

  // ===== 星币 Pentacles（土）=====
  { slug: "pentacles-ace",    num: 1,  name: "星币一",   group: "pentacles", upright: "机会、务实、丰盛的种子、落地", reversed: "错失、贪小、根基不稳" },
  { slug: "pentacles-2",      num: 2,  name: "星币二",   group: "pentacles", upright: "平衡、取舍、灵活、多线并行", reversed: "失衡、分身乏术、财务吃紧" },
  { slug: "pentacles-3",      num: 3,  name: "星币三",   group: "pentacles", upright: "协作、技艺、打磨、认可", reversed: "各自为政、粗糙、不被认可" },
  { slug: "pentacles-4",      num: 4,  name: "星币四",   group: "pentacles", upright: "稳守、积累、掌控、安全感", reversed: "吝啬、执着、该松手" },
  { slug: "pentacles-5",      num: 5,  name: "星币五",   group: "pentacles", upright: "匮乏、失援、困顿、寒冬", reversed: "转机、援助到来、走出困境" },
  { slug: "pentacles-6",      num: 6,  name: "星币六",   group: "pentacles", upright: "给予、互助、平衡的施与受、慷慨", reversed: "施受不均、附带条件、依赖" },
  { slug: "pentacles-7",      num: 7,  name: "星币七",   group: "pentacles", upright: "耕耘、等待、评估、长线", reversed: "焦躁、收成不如预期、放弃太早" },
  { slug: "pentacles-8",      num: 8,  name: "星币八",   group: "pentacles", upright: "专注、精进、勤勉、技艺", reversed: "敷衍、停滞、只求数量" },
  { slug: "pentacles-9",      num: 9,  name: "星币九",   group: "pentacles", upright: "丰足、独立、自享其成、优雅", reversed: "依赖、透支、表面光鲜" },
  { slug: "pentacles-10",     num: 10, name: "星币十",   group: "pentacles", upright: "富足、传承、家业、长久", reversed: "财务纠纷、短视、根基动摇" },
  { slug: "pentacles-page",   num: 11, name: "星币侍从", group: "pentacles", upright: "学习、务实、机会、脚踏实地", reversed: "拖延、空想、不切实际" },
  { slug: "pentacles-knight", num: 12, name: "星币骑士", group: "pentacles", upright: "踏实、可靠、勤恳、稳步", reversed: "停滞、保守、乏味" },
  { slug: "pentacles-queen",  num: 13, name: "星币王后", group: "pentacles", upright: "务实、丰盛、照顾、经营", reversed: "操劳、失衡、忽略自己" },
  { slug: "pentacles-king",   num: 14, name: "星币国王", group: "pentacles", upright: "富足、稳健、务实、掌局", reversed: "贪婪、固执、以钱衡量" },
];

// 花色的中文名与元素，供展示用。
const TAROT_GROUPS = {
  major:     { name: "大阿尔卡纳", element: "" },
  wands:     { name: "权杖", element: "火" },
  cups:      { name: "圣杯", element: "水" },
  swords:    { name: "宝剑", element: "风" },
  pentacles: { name: "星币", element: "土" },
};

function buildTarotDeck() {
  return [...TAROT_DECK];
}

// 洗牌（Fisher–Yates）。
function shuffleTarot(deck) {
  const s = [...deck];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

// 抽 count 张牌，每张随机决定正位/逆位，并附上当前朝向的关键词。
function drawTarot(count) {
  const drawn = shuffleTarot(TAROT_DECK).slice(0, count);
  return drawn.map((card) => {
    const reversed = Math.random() < 0.5;
    return {
      ...card,
      reversedDraw: reversed,
      orientation: reversed ? "逆位" : "正位",
      keywords: reversed ? card.reversed : card.upright,
    };
  });
}
