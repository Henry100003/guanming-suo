// 墨衡｜夜市巷底的算命書生 —— 戀愛八字漏斗劇本
// 所有台詞、選項、提示都在這裡，改劇本不用動程式。
// 背景 bg 對應 public/moheng/<bg>.webp（沒有圖片時用 CSS 場景代替）；
// portrait 對應 public/moheng/<portrait>.webp（墨衡立繪，沒有時不顯示）。

export type SceneBg = "alley" | "table" | "lantern";
export type Portrait = "idle" | "glance" | "writing" | "smile";

export interface Choice {
  label: string;
  /** 選完之後墨衡的回應（可省略，直接進下一幕） */
  reply?: string;
}

export interface Scene {
  id: string;
  bg: SceneBg;
  portrait?: Portrait;
  /** narration = 旁白（斜體、無說話者）；speech = 墨衡說話 */
  kind: "narration" | "speech";
  text: string;
  choices: Choice[];
}

export type InputKind =
  | "birthDate"
  | "birthTime"
  | "birthPlace"
  | "gender"
  | "name"
  | "relationship"
  | "work"
  | "concern"
  | "email";

export interface InputStep {
  kind: InputKind;
  /** 墨衡的提問（大字） */
  prompt: string;
  /** 提問上方的小字鋪陳 */
  lead?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  skipLabel?: string;
  portrait?: Portrait;
}

export const MOHENG = {
  code: "moheng" as const,
  name: "墨衡",
  title: "夜市巷底的算命書生",
  theme: "戀愛八字",
  cover: {
    tagline: "排隊的都是想聽好話的。你不一樣吧？",
    cta: "走進巷子",
    sub: "戀愛八字・約 3 分鐘・先看免費解讀",
  },

  scenes: [
    {
      id: "arrive",
      bg: "alley",
      kind: "narration",
      text: "夜市的喧鬧在身後一點一點變小。巷子最深處，一盞紅燈籠下，擺著一張舊木桌。",
      choices: [
        { label: "走近木桌" },
        { label: "先看看桌邊的招牌", reply: "木牌上的字很瘦：「只看一次。不說好聽話。」" },
      ],
    },
    {
      id: "sit",
      bg: "table",
      portrait: "idle",
      kind: "speech",
      text: "坐。燈籠快熄了，今晚我只再看一個人。",
      choices: [
        { label: "（你怎麼知道我是來算命的？）", reply: "走到這裡的，沒有人是來買雞排的。" },
        { label: "好……（乖乖坐下）", reply: "嗯。比剛才那個乖。" },
      ],
    },
    {
      id: "why",
      bg: "table",
      portrait: "glance",
      kind: "speech",
      text: "你臉上寫著一件事。不過臉會騙人，命盤不會。",
      choices: [
        { label: "那你要看什麼？", reply: "生辰。剩下的，我自己會看。" },
        { label: "我其實不太信這個。", reply: "不信也好。不信的人，比較聽得進實話。" },
      ],
    },
    {
      id: "ledger",
      bg: "lantern",
      portrait: "writing",
      kind: "narration",
      text: "他翻開一本邊角磨白的萬年曆，筆尖停在空白頁上，等你開口。",
      choices: [{ label: "把生辰告訴他" }],
    },
  ] as Scene[],

  inputs: [
    {
      kind: "birthDate",
      prompt: "哪一年、哪一天出生？",
      hint: "國曆、農曆都可以。",
      portrait: "writing",
    },
    {
      kind: "birthTime",
      prompt: "幾點出生？",
      lead: "時辰是命盤的最後一根柱子。",
      skipLabel: "我不知道時間",
      portrait: "writing",
    },
    {
      kind: "birthPlace",
      prompt: "在哪裡出生？",
      hint: "我會依出生地換算真太陽時，時柱才不會差一格。",
      portrait: "writing",
    },
    {
      kind: "gender",
      prompt: "你是……",
      hint: "大運往哪個方向走，要看這個。",
      options: [
        { value: "female", label: "女生" },
        { value: "male", label: "男生" },
      ],
      portrait: "glance",
    },
    {
      kind: "name",
      prompt: "怎麼稱呼你？",
      placeholder: "暱稱也可以",
      portrait: "glance",
    },
    {
      kind: "relationship",
      lead: "他抬眼看了你一下。",
      prompt: "最近，心裡有人嗎？",
      options: [
        { value: "single_long", label: "單身很久了" },
        { value: "crush", label: "有曖昧的對象" },
        { value: "dating", label: "穩定交往中" },
        { value: "breakup", label: "剛分手不久" },
        { value: "married", label: "已經結婚了" },
        { value: "secret", label: "不想說" },
      ],
      portrait: "glance",
    },
    {
      kind: "work",
      lead: "嗯。",
      prompt: "白天都在忙什麼？",
      options: [
        { value: "student", label: "還在念書" },
        { value: "employee", label: "上班族" },
        { value: "business", label: "自己做生意" },
        { value: "freelance", label: "自由工作者" },
        { value: "searching", label: "正在找方向" },
        { value: "secret", label: "不想說" },
      ],
      portrait: "writing",
    },
    {
      kind: "concern",
      lead: "他把筆放下。",
      prompt: "有什麼話，是你沒跟別人說過的？",
      hint: "寫下來，我會在報告裡回答你。只有我看得到。",
      placeholder: "例如：我們會不會復合？我是不是總愛錯人？",
      skipLabel: "沒有，跳過",
      portrait: "idle",
    },
    {
      kind: "email",
      prompt: "最後，留個信箱。",
      hint: "我寫好的東西，會讓燈籠送過去。",
      placeholder: "you@example.com",
      portrait: "smile",
    },
  ] as InputStep[],

  loadingLines: ["他翻過一頁又一頁……", "筆尖在紙上停了很久。", "「……原來是這樣。」"],

  teaserPage: {
    intro: "他把一張薄紙推到你面前。",
    lockedIntro: "剩下的，我寫在另一張紙上了。要不要拿走，你自己決定。",
    cta: "拿走完整的那張紙",
  },

  /** 付費報告的章節（AI 依序撰寫） */
  reportSections: [
    "我看見的你",
    "你在感情裡的樣子",
    "你會被誰吸引，又適合誰",
    "桃花與正緣的時機",
    "你的感情地雷",
    "你問我的那件事",
    "今年：感情與工作",
    "墨衡最後說的三句話",
  ],
};

export const RELATIONSHIP_LABEL: Record<string, string> = Object.fromEntries(
  MOHENG.inputs.find((i) => i.kind === "relationship")!.options!.map((o) => [o.value, o.label]),
);
export const WORK_LABEL: Record<string, string> = Object.fromEntries(
  MOHENG.inputs.find((i) => i.kind === "work")!.options!.map((o) => [o.value, o.label]),
);

/**
 * 角色美術需求（給繪師或 AI 生圖用）。原創角色，請勿參考任何現有作品的角色長相。
 * 尺寸建議：立繪 1080×1440（透明背景 webp），背景 1080×1920（直式 webp）。
 */
export const ART_BRIEF = {
  character:
    "二十多歲的台灣青年書生，清冷、話少。黑色及肩長髮隨意紮起一半，眼神淡但銳利。" +
    "深墨綠色立領長衫，袖口捲起，內搭現代黑色高領；左耳一只小銀環。手上常拿毛筆或一本邊角磨白的萬年曆。",
  portraits: {
    idle: "坐在木桌後，手撐下巴，沒有看鏡頭",
    glance: "微微抬眼直視鏡頭，表情淡，像看穿了什麼",
    writing: "低頭在萬年曆上寫字，筆尖沾墨",
    smile: "嘴角很淺地上揚，眼神難得放鬆",
  },
  backgrounds: {
    alley: "台灣夜市深處的窄巷，遠處是模糊的攤位霓虹，近處潮濕的地面反光，一盞紅燈籠",
    table: "紅燈籠下的舊木桌，桌上有萬年曆、毛筆、一杯冒煙的茶，背景是斑駁磚牆與手寫招牌",
    lantern: "特寫：攤開的萬年曆與紅燈籠光暈，暖紅與墨黑的對比",
  },
  palette: "墨黑 #0f0d0c、燈籠紅 #c8402a、暖金 #d9a85b、霓虹青 #3fb6a8（點綴）",
};
