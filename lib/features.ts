// 規則層：把命盤轉成可讀的特徵描述。免費頁直接顯示部分內容，付費報告交給 AI 潤飾成完整解讀。
import type { Chart, Element } from "./bazi";

export const DAY_MASTER_TEXT: Record<string, { image: string; traits: string; growth: string }> = {
  甲: {
    image: "參天大樹",
    traits: "個性正直、有主見，習慣往上長，做事重原則也重承諾，是團體中自然的支柱。",
    growth: "大樹不易彎，堅持是優點，但遇到變局時學會調整方向，路會走得更寬。",
  },
  乙: {
    image: "花草藤蔓",
    traits: "柔軟而有韌性，善於觀察環境、借力使力，人際手腕細膩，適應力強。",
    growth: "擅長配合別人，也要練習說出自己的需要，別讓體貼變成委屈。",
  },
  丙: {
    image: "太陽",
    traits: "熱情外放、樂於分享，存在感強，總能帶動氣氛，也願意照顧身邊的人。",
    growth: "能量給得太快容易透支，留一點光給自己，熱情才走得長遠。",
  },
  丁: {
    image: "燭火燈光",
    traits: "細膩溫暖、思考深入，專注力好，對在乎的人與事有很深的投入。",
    growth: "燭火怕風，情緒起伏時先照顧好自己的心，再去照亮別人。",
  },
  戊: {
    image: "高山厚土",
    traits: "穩重可靠、包容力強，做事踏實不浮躁，是讓人安心的存在。",
    growth: "穩定之餘別忘了主動求變，偶爾走出舒適圈，會看見新的風景。",
  },
  己: {
    image: "田園沃土",
    traits: "務實細心、懂得經營，擅長把資源整合成果實，重視生活中的實際感受。",
    growth: "容易想得多、顧慮多，放下一些「萬一」，行動會更輕盈。",
  },
  庚: {
    image: "刀劍礦石",
    traits: "果斷直接、重義氣，有行動力與執行力，遇到困難反而更有鬥志。",
    growth: "說話直接是坦率，也可能讓人受傷；剛中帶柔，影響力會更大。",
  },
  辛: {
    image: "珠玉首飾",
    traits: "精緻敏銳、品味好，自我要求高，重視形象與細節，有獨特的審美。",
    growth: "對自己太嚴格容易焦慮，接受不完美，反而更能發光。",
  },
  壬: {
    image: "江河大海",
    traits: "聰明靈活、視野開闊，喜歡自由與變化，學習力與應變力都強。",
    growth: "想法多、流動快，找到一個值得深耕的方向，能量才會匯聚成勢。",
  },
  癸: {
    image: "雨露細流",
    traits: "感受力強、直覺準，內斂而有想像力，善於在安靜中累積實力。",
    growth: "容易把情緒藏在心裡，找到信任的人說出來，心會更清澈。",
  },
};

export const ELEMENT_HINT: Record<Element, { color: string; direction: string; field: string }> = {
  木: { color: "綠、青", direction: "東方", field: "教育、文創、設計、出版、植栽、醫護" },
  火: { color: "紅、紫、橘", direction: "南方", field: "科技、媒體、餐飲、行銷、能源、表演" },
  土: { color: "黃、棕、米", direction: "中央", field: "不動產、建築、行政管理、農業、顧問" },
  金: { color: "白、金、銀", direction: "西方", field: "金融、法律、機械、工程、精密製造" },
  水: { color: "黑、藍", direction: "北方", field: "貿易、物流、旅遊、資訊、研究、傳播" },
};

const GROUP_TEXT: Record<string, { strong: string; career: string; love: string }> = {
  比劫: {
    strong: "自我意識與行動力強，重視朋友與夥伴",
    career: "適合需要獨立判斷、團隊作戰或自行創業的環境",
    love: "感情中重視平等與尊重，需要彼此保有個人空間",
  },
  食傷: {
    strong: "表達力與創意突出，思路活潑、不喜歡被框住",
    career: "適合內容創作、企劃、教學、技術研發等能發揮想法的工作",
    love: "感情中重視溝通與情趣，喜歡能一起玩、一起聊的對象",
  },
  財星: {
    strong: "務實、重視成果，對資源與機會很敏銳",
    career: "適合業務、經營管理、投資理財、商業開發等與資源相關的領域",
    love: "感情中付出實際，習慣用行動照顧對方",
  },
  官殺: {
    strong: "責任感與自律性強，重視規則、名聲與成就",
    career: "適合組織內發展、公職、管理職或需要高度專業紀律的工作",
    love: "感情中認真專一，重視承諾，對伴侶期待也較高",
  },
  印星: {
    strong: "學習力與思考深度佳，重視精神層面與安全感",
    career: "適合研究、教育、顧問、文書專業或需要持續進修的領域",
    love: "感情中渴望被理解與照顧，喜歡安穩、可靠的關係",
  },
};

export const SHISHEN_YEAR_THEME: Record<string, string> = {
  比肩: "自我與同儕的一年，適合建立人脈、找夥伴合作，留意花費與競爭",
  劫財: "變動與競爭較多，合夥與金錢往來宜謹慎，也是突破的機會",
  食神: "心情與創造力提升，適合學習才藝、經營生活品質，人緣佳",
  傷官: "想法多、想改變現況，適合發揮才華，但言語上要多留意分寸",
  偏財: "機會型財運活躍，人脈帶來資源，投資與社交都較活絡",
  正財: "穩定經營與累積的一年，工作努力容易換來實際回報",
  七殺: "壓力與挑戰變多，也是展現魄力、升級能力的好時機",
  正官: "名聲、職位與責任相關的事情增加，適合爭取升遷或考證照",
  偏印: "思考與靈感豐富，適合進修、轉換跑道或研究冷門領域",
  正印: "貴人與長輩助力較多，適合學習、考試、休養與沉澱",
};

export interface Features {
  dayMaster: (typeof DAY_MASTER_TEXT)[string] & { gan: string; element: Element };
  dominant: { group: string; value: number; text: (typeof GROUP_TEXT)[string] }[];
  weakest: { group: string; value: number };
  elementNotes: string[];
  strengthNote: string;
  favorableHints: { element: Element; color: string; direction: string; field: string }[];
  yearTheme: string;
  daYunTheme: string | null;
}

export function extractFeatures(c: Chart): Features {
  const dm = DAY_MASTER_TEXT[c.dayMaster.gan];
  const groups = Object.entries(c.shiShenCounts).sort((a, b) => b[1] - a[1]);
  const dominant = groups.slice(0, 2).map(([group, value]) => ({ group, value, text: GROUP_TEXT[group] }));
  const [wg, wv] = groups[groups.length - 1];

  const elementNotes: string[] = [];
  Object.entries(c.elementScores).forEach(([el, v]) => {
    if (v === 0) elementNotes.push(`命局缺${el}，可在生活中適度補足${el}的能量`);
    else if (v >= 35) elementNotes.push(`${el}氣偏旺（約 ${v}%），特質鮮明，也要注意過猶不及`);
  });

  const strengthNote =
    c.strength.level === "身強"
      ? "日主能量充足，主見強、抗壓性好，適合主動出擊，把力量用在輸出與成果上。"
      : c.strength.level === "身弱"
        ? "日主能量較細緻，善於借助環境與他人之力，穩紮穩打、找到支持系統會更順。"
        : "命局五行相對均衡，進退有度，順勢調整即可發揮所長。";

  return {
    dayMaster: { ...dm, gan: c.dayMaster.gan, element: c.dayMaster.element },
    dominant,
    weakest: { group: wg, value: wv },
    elementNotes,
    strengthNote,
    favorableHints: c.favorable.map((e) => ({ element: e, ...ELEMENT_HINT[e] })),
    yearTheme: SHISHEN_YEAR_THEME[c.currentYear.ganShiShen],
    daYunTheme: c.currentDaYun ? SHISHEN_YEAR_THEME[c.currentDaYun.ganShiShen] : null,
  };
}
