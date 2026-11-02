// 八字排盤核心：以 lunar-javascript 依節氣計算四柱，再整理成前端與報告用的資料結構
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Solar } = require("lunar-javascript");

export type Gender = "male" | "female";
export type Element = "木" | "火" | "土" | "金" | "水";
export const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

export interface BirthInput {
  name: string;
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour: number | null; // null = 不知道時辰
  minute: number;
}

export interface Pillar {
  label: "年柱" | "月柱" | "日柱" | "時柱";
  gan: string;
  zhi: string;
  ganElement: Element;
  zhiElement: Element;
  ganShiShen: string; // 天干十神（日柱為「日主」）
  hideGan: { gan: string; element: Element; shiShen: string }[];
  diShi: string; // 十二長生
  naYin: string;
}

export interface DaYun {
  ganZhi: string;
  startAge: number;
  startYear: number;
  endYear: number;
  ganShiShen: string;
  zhiShiShen: string;
}

export interface Chart {
  input: BirthInput;
  lunarText: string;
  zodiac: string;
  pillars: Pillar[];
  dayMaster: { gan: string; element: Element; yinYang: "陽" | "陰" };
  elementScores: Record<Element, number>; // 加權後的五行分布（百分比）
  strength: { score: number; level: "身強" | "中和" | "身弱" };
  favorable: Element[]; // 喜用（簡化扶抑法）
  unfavorable: Element[];
  shiShenCounts: Record<string, number>; // 五大類：比劫、食傷、財星、官殺、印星
  daYun: DaYun[];
  yunStart: { years: number; months: number; days: number };
  currentYear: { year: number; ganZhi: string; ganShiShen: string; zhiShiShen: string };
  currentDaYun: DaYun | null;
  hourKnown: boolean;
}

// ---------- 基礎對照 ----------
const GAN_ELEMENT: Record<string, Element> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const GAN_YANG: Record<string, boolean> = {
  甲: true, 乙: false, 丙: true, 丁: false, 戊: true, 己: false, 庚: true, 辛: false, 壬: true, 癸: false,
};
const ZHI_ELEMENT: Record<string, Element> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};
// 地支藏干（本氣、中氣、餘氣）
const HIDE_GAN: Record<string, string[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"], 辰: ["戊", "乙", "癸"], 巳: ["丙", "戊", "庚"],
  午: ["丁", "己"], 未: ["己", "丁", "乙"], 申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"],
};
const GENERATES: Record<Element, Element> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS: Record<Element, Element> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const ZODIAC: Record<string, string> = {
  子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龍", 巳: "蛇", 午: "馬", 未: "羊", 申: "猴", 酉: "雞", 戌: "狗", 亥: "豬",
};

// 函式庫輸出為簡體，轉成繁體顯示
const S2T: Record<string, string> = {
  劫财: "劫財", 伤官: "傷官", 偏财: "偏財", 正财: "正財", 七杀: "七殺",
  长生: "長生", 冠带: "冠帶", 临官: "臨官", 绝: "絕", 养: "養",
};
const CHAR_S2T: Record<string, string> = {
  炉: "爐", 剑: "劍", 锋: "鋒", 头: "頭", 涧: "澗", 蜡: "蠟", 杨: "楊", 雳: "靂", 长: "長", 灯: "燈", 驿: "驛", 钗: "釵", 钏: "釧",
  闰: "閏", 腊: "臘", 廿: "廿",
};
export const t = (s: string) => S2T[s] ?? s.split("").map((c) => CHAR_S2T[c] ?? c).join("");

/** 以日主為基準，計算任一天干的十神 */
export function shiShenOf(dayGan: string, other: string): string {
  const me = GAN_ELEMENT[dayGan];
  const ot = GAN_ELEMENT[other];
  const same = GAN_YANG[dayGan] === GAN_YANG[other];
  if (ot === me) return same ? "比肩" : "劫財";
  if (GENERATES[me] === ot) return same ? "食神" : "傷官";
  if (CONTROLS[me] === ot) return same ? "偏財" : "正財";
  if (CONTROLS[ot] === me) return same ? "七殺" : "正官";
  return same ? "偏印" : "正印"; // GENERATES[ot] === me
}

export const SHISHEN_GROUP: Record<string, string> = {
  比肩: "比劫", 劫財: "比劫", 食神: "食傷", 傷官: "食傷", 偏財: "財星", 正財: "財星",
  七殺: "官殺", 正官: "官殺", 偏印: "印星", 正印: "印星",
};

// ---------- 主程式 ----------
export function computeChart(input: BirthInput, now = new Date()): Chart {
  const hourKnown = input.hour !== null;
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, hourKnown ? input.hour! : 12, hourKnown ? input.minute : 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(1); // 子初換日：23:00 起算隔日日柱

  const dayGan: string = ec.getDayGan();
  const raw = [
    { label: "年柱", gan: ec.getYearGan(), zhi: ec.getYearZhi(), diShi: ec.getYearDiShi(), naYin: ec.getYearNaYin() },
    { label: "月柱", gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), diShi: ec.getMonthDiShi(), naYin: ec.getMonthNaYin() },
    { label: "日柱", gan: ec.getDayGan(), zhi: ec.getDayZhi(), diShi: ec.getDayDiShi(), naYin: ec.getDayNaYin() },
    { label: "時柱", gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), diShi: ec.getTimeDiShi(), naYin: ec.getTimeNaYin() },
  ].slice(0, hourKnown ? 4 : 3);

  const pillars: Pillar[] = raw.map((p) => ({
    label: p.label as Pillar["label"],
    gan: p.gan,
    zhi: p.zhi,
    ganElement: GAN_ELEMENT[p.gan],
    zhiElement: ZHI_ELEMENT[p.zhi],
    ganShiShen: p.label === "日柱" ? "日主" : shiShenOf(dayGan, p.gan),
    hideGan: HIDE_GAN[p.zhi].map((g) => ({ gan: g, element: GAN_ELEMENT[g], shiShen: shiShenOf(dayGan, g) })),
    diShi: t(p.diShi),
    naYin: t(p.naYin),
  }));

  // 五行加權：天干 1；月支本氣 3（得令）、其他地支本氣 1.2；中氣 0.5；餘氣 0.3
  const scores: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const shiShenCounts: Record<string, number> = { 比劫: 0, 食傷: 0, 財星: 0, 官殺: 0, 印星: 0 };
  pillars.forEach((p) => {
    scores[p.ganElement] += 1;
    if (p.label !== "日柱") shiShenCounts[SHISHEN_GROUP[p.ganShiShen]] += 1;
    p.hideGan.forEach((h, i) => {
      const w = i === 0 ? (p.label === "月柱" ? 3 : 1.2) : i === 1 ? 0.5 : 0.3;
      scores[h.element] += w;
      shiShenCounts[SHISHEN_GROUP[h.shiShen]] += w;
    });
  });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const elementScores = Object.fromEntries(
    ELEMENTS.map((e) => [e, Math.round((scores[e] / total) * 1000) / 10]),
  ) as Record<Element, number>;
  Object.keys(shiShenCounts).forEach((k) => (shiShenCounts[k] = Math.round(shiShenCounts[k] * 10) / 10));

  // 身強弱（簡化扶抑）：同類（比劫）+ 生我（印）佔比；日主天干本身不計
  const me = GAN_ELEMENT[dayGan];
  const resource = ELEMENTS.find((e) => GENERATES[e] === me)!;
  const support = scores[me] - 1 + scores[resource];
  const ratio = support / (total - 1);
  const level = ratio >= 0.5 ? "身強" : ratio <= 0.38 ? "身弱" : "中和";
  const output = GENERATES[me];
  const wealth = CONTROLS[me];
  const officer = ELEMENTS.find((e) => CONTROLS[e] === me)!;
  let favorable: Element[];
  let unfavorable: Element[];
  if (level === "身強") {
    favorable = [output, wealth, officer];
    unfavorable = [me, resource];
  } else if (level === "身弱") {
    favorable = [resource, me];
    unfavorable = [officer, wealth, output];
  } else {
    // 中和：補最弱的五行，避開最旺的
    const sorted = [...ELEMENTS].sort((a, b) => scores[a] - scores[b]);
    favorable = sorted.slice(0, 2);
    unfavorable = sorted.slice(-1);
  }

  // 大運（男陽女陰順行，lunar-javascript 依性別處理；1 = 男，0 = 女）
  const yun = ec.getYun(input.gender === "male" ? 1 : 0);
  const daYun: DaYun[] = yun
    .getDaYun()
    .slice(1, 9)
    .map((d: any) => {
      const gz: string = d.getGanZhi();
      return {
        ganZhi: gz,
        startAge: d.getStartAge(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        ganShiShen: shiShenOf(dayGan, gz[0]),
        zhiShiShen: shiShenOf(dayGan, HIDE_GAN[gz[1]][0]),
      };
    });

  const thisYear = now.getFullYear();
  // 流年以立春為界；取當年 6 月 1 日的年柱避開跨年問題
  const ly = Solar.fromYmd(thisYear, 6, 1).getLunar().getEightChar();
  const lyGz = ly.getYearGan() + ly.getYearZhi();

  return {
    input,
    lunarText: t(lunar.toString()),
    zodiac: ZODIAC[ec.getYearZhi()],
    pillars,
    dayMaster: { gan: dayGan, element: me, yinYang: GAN_YANG[dayGan] ? "陽" : "陰" },
    elementScores,
    strength: { score: Math.round(ratio * 100), level },
    favorable,
    unfavorable,
    shiShenCounts,
    daYun,
    yunStart: { years: yun.getStartYear(), months: yun.getStartMonth(), days: yun.getStartDay() },
    currentYear: {
      year: thisYear,
      ganZhi: lyGz,
      ganShiShen: shiShenOf(dayGan, lyGz[0]),
      zhiShiShen: shiShenOf(dayGan, HIDE_GAN[lyGz[1]][0]),
    },
    currentDaYun: daYun.find((d) => thisYear >= d.startYear && thisYear <= d.endYear) ?? null,
    hourKnown,
  };
}

/** 驗證並正規化使用者輸入 */
export function parseInput(body: any): BirthInput | string {
  const name = String(body?.name ?? "").trim().slice(0, 20);
  const gender = body?.gender === "female" ? "female" : body?.gender === "male" ? "male" : null;
  const year = Number(body?.year), month = Number(body?.month), day = Number(body?.day);
  const hourRaw = body?.hour;
  const hour = hourRaw === "" || hourRaw === null || hourRaw === undefined || hourRaw === "unknown" ? null : Number(hourRaw);
  const minute = Number(body?.minute ?? 0) || 0;
  if (!name) return "請填寫姓名或暱稱";
  if (!gender) return "請選擇性別";
  if (!Number.isInteger(year) || year < 1901 || year > 2099) return "出生年份需介於 1901–2099";
  if (!Number.isInteger(month) || month < 1 || month > 12) return "出生月份不正確";
  const dim = new Date(year, month, 0).getDate();
  if (!Number.isInteger(day) || day < 1 || day > dim) return "出生日期不正確";
  if (hour !== null && (!Number.isInteger(hour) || hour < 0 || hour > 23)) return "出生時間不正確";
  if (minute < 0 || minute > 59) return "出生分鐘不正確";
  return { name, gender, year, month, day, hour, minute };
}
